import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { logger } from './logger';

// Define the schema for the task extraction
const TaskSchema = z.object({
  title: z.string().describe('A concise task description (e.g., "Vacuum carpet", "Clean mirror", "Organize books")'),
  location: z.string().optional().describe('The room or area where this task should be done (e.g., "Living Room", "Kitchen", "Bedroom"). Leave empty if unclear from the image.'),
  confidence: z.number().min(0).max(1).describe('Confidence level (0-1) that this is a valid household task'),
});

export interface TaskAnalysisResult {
  success: boolean;
  task?: {
    title: string;
    location?: string;
  };
  error?: string;
}

// Create OpenAI provider instance with explicit API key configuration
function createOpenAIProvider() {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  logger.debug('AIAnalysis', '🔧 Creating OpenAI provider with API key present:', !!apiKey);
  logger.debug('AIAnalysis', '🔧 API key length:', apiKey?.length || 0);
  logger.debug('AIAnalysis', '🔧 API key prefix:', apiKey?.substring(0, 7) || 'none');

  if (!apiKey) {
    throw new Error('No OpenAI API key found');
  }

  // Use createOpenAI with explicit configuration
  // For React Native, we need to be very explicit about the API key
  return createOpenAI({
    apiKey: apiKey,
    name: 'openai-explicit',
  });
}

export async function analyzeImageForTask(base64Image: string): Promise<TaskAnalysisResult> {
  logger.info('AIAnalysis', '🔍 Starting AI image analysis...');
  logger.debug('AIAnalysis', '📊 Image data length:', base64Image.length);

  // Check if we have an API key
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  logger.debug('AIAnalysis', '🔑 API Key present:', !!apiKey);
  logger.debug('AIAnalysis', '🔑 API Key length:', apiKey?.length || 0);
  logger.debug('AIAnalysis', '🔑 API Key starts with sk-:', apiKey?.startsWith('sk-') || false);

  if (!apiKey) {
    logger.error('AIAnalysis', '❌ No OpenAI API key found');
    return {
      success: false,
      error: 'OpenAI API key not configured. Please check your environment variables.',
    };
  }

  if (!apiKey.startsWith('sk-')) {
    logger.error('AIAnalysis', '❌ Invalid OpenAI API key format (should start with sk-)');
    return {
      success: false,
      error: 'Invalid OpenAI API key format. Please check your API key.',
    };
  }

  if (!base64Image || base64Image.length === 0) {
    logger.error('AIAnalysis', '❌ Empty or invalid base64 image');
    return {
      success: false,
      error: 'Invalid image data provided.',
    };
  }

  try {
    logger.debug('AIAnalysis', '📝 Preparing OpenAI request...');

    // Clean the base64 data - remove any data URL prefix if present
    // According to AI SDK docs, we should pass base64 string directly
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    logger.debug('AIAnalysis', '🧹 Cleaned base64 length:', cleanBase64.length);

    // Create OpenAI provider with explicit API key
    logger.debug('AIAnalysis', '🔧 Creating OpenAI provider...');
    const provider = createOpenAIProvider();
    const model = provider.chat('gpt-4.1-nano');
    logger.debug('AIAnalysis', '🤖 OpenAI model initialized with provider');
    logger.debug('AIAnalysis', '🔍 About to call generateObject...');

    const result = await generateObject({
      model,
      schema: TaskSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image of a household area and identify what household task or chore needs to be done.

Rules:
- Look for areas that need cleaning, organizing, maintenance, or attention
- Focus on actionable household tasks like "vacuum carpet", "clean mirror", "organize closet", "wash dishes", etc.
- If you can identify the room or area, include it in the location field
- Only suggest tasks that are clearly visible and needed in the image
- Be specific but concise with task descriptions
- If no clear household task is visible, set confidence to 0

Examples of good tasks:
- "Vacuum carpet" in "Living Room"
- "Clean mirror" in "Bathroom"
- "Organize books" in "Study"
- "Wash dishes" in "Kitchen"
- "Make bed" in "Bedroom"
- "Sweep floor" in "Kitchen"`,
            },
            {
              type: 'image',
              // Pass the cleaned base64 string directly, not as data URL
              image: cleanBase64,
            },
          ],
        },
      ],
    });

    logger.info('AIAnalysis', '✅ OpenAI response received');
    logger.debug('AIAnalysis', '📋 Raw result:', JSON.stringify(result.object, null, 2));

    // Check confidence threshold
    if (result.object.confidence < 0.7) {
      logger.warn('AIAnalysis', `⚠️ Low confidence: ${result.object.confidence}`);
      return {
        success: false,
        error: 'Could not identify a clear household task in this image. Try capturing an area that needs cleaning or organizing.',
      };
    }

    logger.info('AIAnalysis', `✅ High confidence task identified: "${result.object.title}" (${result.object.confidence})`);

    return {
      success: true,
      task: {
        title: result.object.title,
        location: result.object.location,
      },
    };
  } catch (error) {
    logger.error('AIAnalysis', '❌ AI Analysis Error:', error);

    // Log more details about the error
    if (error instanceof Error) {
      logger.error('AIAnalysis', 'Error name:', error.name);
      logger.error('AIAnalysis', 'Error message:', error.message);
      logger.error('AIAnalysis', 'Error stack:', error.stack);

      // Check for specific error types
      if (error.message.includes('API key') || error.message.includes('401')) {
        logger.error('AIAnalysis', '🔑 API key related error');
        logger.error('AIAnalysis', '🔍 Double-checking API key at error time:');
        logger.error('AIAnalysis', '🔑 API Key present at error:', !!apiKey);
        logger.error('AIAnalysis', '🔑 API Key length at error:', apiKey?.length || 0);
        return {
          success: false,
          error: 'OpenAI API key is invalid or not configured properly.',
        };
      }

      if (error.message.includes('rate limit') || error.message.includes('429')) {
        logger.error('AIAnalysis', '⏰ Rate limit error');
        return {
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.',
        };
      }

      if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('download')) {
        logger.error('AIAnalysis', '🌐 Network error');
        return {
          success: false,
          error: 'Network error. This might be due to React Native environment. Please check your internet connection.',
        };
      }

      // If it's a download error, it might be an issue with the AI SDK in React Native
      if (error.name === 'AI_DownloadError') {
        logger.error('AIAnalysis', '📱 AI SDK download error - might be React Native compatibility issue');
        return {
          success: false,
          error: 'AI SDK compatibility issue with React Native. This feature may need alternative implementation.',
        };
      }
    }

    return {
      success: false,
      error: 'Failed to analyze image. Please try again.',
    };
  }
}