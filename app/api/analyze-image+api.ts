import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the schema for the task extraction
const TaskSchema = z.object({
  title: z.string().describe('A concise task description (e.g., "Vacuum carpet", "Clean mirror", "Organize books")'),
  location: z.string().optional().describe('The room or area where this task should be done (e.g., "Living Room", "Kitchen", "Bedroom"). Leave empty if unclear from the image.'),
  confidence: z.number().min(0).max(1).describe('Confidence level (0-1) that this is a valid household task'),
});

interface TaskAnalysisResult {
  success: boolean;
  task?: {
    title: string;
    location?: string;
  };
  error?: string;
}

// Create OpenAI provider instance
function createOpenAIProvider() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('🔧 API: Creating OpenAI provider with API key present:', !!apiKey);

  if (!apiKey) {
    throw new Error('No OpenAI API key found in server environment');
  }

  return createOpenAI({
    apiKey: apiKey,
    name: 'openai-server',
  });
}

export async function POST(request: Request): Promise<Response> {
  console.log('🔍 API: Starting image analysis request...');

  try {
    const body = await request.json();
    const { base64Image } = body;

    if (!base64Image) {
      return Response.json({
        success: false,
        error: 'No image data provided',
      }, { status: 400 });
    }

    console.log('📊 API: Image data length:', base64Image.length);

    // Check if we have an API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ API: No OpenAI API key found');
      return Response.json({
        success: false,
        error: 'OpenAI API key not configured on server',
      }, { status: 500 });
    }

    if (!apiKey.startsWith('sk-')) {
      console.error('❌ API: Invalid OpenAI API key format');
      return Response.json({
        success: false,
        error: 'Invalid OpenAI API key format on server',
      }, { status: 500 });
    }

    console.log('📝 API: Preparing OpenAI request...');

    // Clean the base64 data - remove any data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    console.log('🧹 API: Cleaned base64 length:', cleanBase64.length);

    // Create OpenAI provider
    console.log('🔧 API: Creating OpenAI provider...');
    const provider = createOpenAIProvider();
    const model = provider.chat('gpt-4.1-nano');
    console.log('🤖 API: OpenAI model initialized');

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
              image: cleanBase64,
            },
          ],
        },
      ],
    });

    console.log('✅ API: OpenAI response received');
    console.log('📋 API: Raw result:', JSON.stringify(result.object, null, 2));

    // Check confidence threshold
    if (result.object.confidence < 0.1) {
      console.log(`⚠️ API: Low confidence: ${result.object.confidence}`);
      return Response.json({
        success: false,
        error: 'Could not identify a clear household task in this image. Try capturing an area that needs cleaning or organizing.',
      });
    }

    console.log(`✅ API: High confidence task identified: "${result.object.title}" (${result.object.confidence})`);

    return Response.json({
      success: true,
      task: {
        title: result.object.title,
        location: result.object.location,
      },
    });

  } catch (error) {
    console.error('❌ API: Analysis Error:', error);

    if (error instanceof Error) {
      console.error('API Error name:', error.name);
      console.error('API Error message:', error.message);

      // Check for specific error types
      if (error.message.includes('API key') || error.message.includes('401')) {
        return Response.json({
          success: false,
          error: 'OpenAI API key is invalid or not configured properly',
        }, { status: 401 });
      }

      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return Response.json({
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again',
        }, { status: 429 });
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        return Response.json({
          success: false,
          error: 'Network error occurred while processing the image',
        }, { status: 503 });
      }
    }

    return Response.json({
      success: false,
      error: 'Failed to analyze image. Please try again',
    }, { status: 500 });
  }
}