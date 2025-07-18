import { openai } from '@ai-sdk/openai';
import { experimental_transcribe as transcribe, generateObject } from 'ai';
import { z } from 'zod';
import { logger } from '../../utils/logger';

// Polyfill File for Node.js environment
if (typeof File === 'undefined') {
  global.File = class File extends Blob {
    constructor(chunks: any[], name: string, options?: any) {
      super(chunks, options);
      this.name = name;
      this.lastModified = options?.lastModified || Date.now();
    }
    name: string;
    lastModified: number;
  } as any;
}

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

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Step 1: Transcribe the audio using Whisper
    const transcript = await transcribe({
      model: openai.transcription('whisper-1'),
      audio: audioBuffer,
    });

    logger.info('API', '✅ API: Transcription received:', transcript.text);

    // Step 2: Extract tasks from the transcription using GPT
    const { object: transcriptionResult } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: TranscriptionResponseSchema,
      prompt: `You are a helpful assistant that extracts household tasks from transcribed voice input.

Extract tasks from this transcription and return them in a structured format. Each task should have:
- title: A clear, actionable task description
- location: Where the task should be done (if mentioned)
- dueDate: When the task should be done (if mentioned, convert to ISO date string)

If multiple tasks are mentioned, extract all of them. If no clear tasks are found, return an empty array with no tasks.

Transcription: "${transcript.text}"

Examples:
- "Clean the kitchen tomorrow" -> { title: "Clean the kitchen", location: "Kitchen", dueDate: "2024-01-21T00:00:00Z" }
- "Take out the trash" -> { title: "Take out the trash" }
- "Vacuum the living room and do laundry next week" -> [
    { title: "Vacuum the living room", location: "Living room", dueDate: "2024-01-27T00:00:00Z" },
    { title: "Do laundry", dueDate: "2024-01-27T00:00:00Z" }
  ]`,
    });

    logger.info('API', '✅ API: Tasks extracted:', transcriptionResult);

    return Response.json(transcriptionResult);
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