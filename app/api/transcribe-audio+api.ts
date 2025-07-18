import OpenAI from 'openai';
import { z } from 'zod';
import { logger } from '../../utils/logger';

const TaskSchema = z.object({
  title: z.string(),
  location: z.string().optional(),
  dueDate: z.string().optional(),
});

const TranscriptionResponseSchema = z.object({
  tasks: z.array(TaskSchema),
});

export async function POST(request: Request): Promise<Response> {
  logger.info('API', '🎤 API: Starting audio transcription...');

  try {
    if (!process.env.OPENAI_API_KEY) {
      logger.error('API', '❌ API: No OpenAI API key found');
      return Response.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { audioBase64, audioType = 'audio/m4a' } = body;

    if (!audioBase64) {
      return Response.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    logger.debug('API', '📊 API: Audio data length:', audioBase64.length);

    // Create OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    // Create a File-like object for OpenAI
    const audioFile = new File([audioBuffer], 'recording.m4a', { type: audioType });

    // Transcribe audio using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      prompt: 'The user is creating household tasks. Extract task titles, locations, and scheduling information.',
    });

    logger.info('API', '✅ API: Transcription received:', transcription.text);

    // Extract tasks from transcription using GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that extracts household tasks from transcribed voice input.
          
Extract tasks from the transcription and return them in a structured format. Each task should have:
- title: A clear, actionable task description
- location: Where the task should be done (if mentioned)
- dueDate: When the task should be done (if mentioned, convert to ISO date string)

If multiple tasks are mentioned, extract all of them. If no clear tasks are found, return an empty array.

Examples:
- "Clean the kitchen tomorrow" -> { title: "Clean the kitchen", location: "Kitchen", dueDate: "2024-01-21T00:00:00Z" }
- "Take out the trash" -> { title: "Take out the trash" }
- "Vacuum the living room and do laundry next week" -> [
    { title: "Vacuum the living room", location: "Living room", dueDate: "2024-01-27T00:00:00Z" },
    { title: "Do laundry", dueDate: "2024-01-27T00:00:00Z" }
  ]`
        },
        {
          role: 'user',
          content: `Extract tasks from this transcription: "${transcription.text}"`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from GPT-4');
    }

    const parsedResponse = JSON.parse(responseText);
    const validatedResponse = TranscriptionResponseSchema.parse(parsedResponse);

    logger.info('API', '✅ API: Tasks extracted:', validatedResponse);

    return Response.json(validatedResponse);
  } catch (error) {
    logger.error('API', '❌ API: Transcription error:', error);
    
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid response format', details: error.errors },
        { status: 500 }
      );
    }

    return Response.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    );
  }
}