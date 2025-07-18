import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { logger } from '../../utils/logger';

const TaskSchema = z.object({
  title: z.string(),
  location: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

const TasksResponseSchema = z.object({
  tasks: z.array(TaskSchema),
});

export async function POST(request: Request): Promise<Response> {
  logger.info('API', '📝 API: Starting task extraction from text...');

  try {
    if (!process.env.OPENAI_API_KEY) {
      logger.error('API', '❌ API: No OpenAI API key found');
      return Response.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return Response.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    logger.debug('API', '📊 API: Text length:', text.length);

    // Extract tasks from the text using GPT
    const { object: result } = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: TasksResponseSchema,
      prompt: `You are a helpful assistant that extracts household tasks from user input.

Extract tasks from this text and return them in a structured format. Each task should have:
- title: A clear, actionable task description (required)
- location: Where the task should be done (optional - only include if mentioned or clearly inferred, otherwise omit the field)
- dueDate: When the task should be done (optional - only include if a date/time is mentioned, convert to ISO date string, otherwise omit the field)

IMPORTANT: For optional fields (location and dueDate), completely omit them from the response if not applicable. Do not set them to null or empty string.

If multiple tasks are mentioned, extract all of them. If no clear tasks are found, return {"tasks": []}.

Text: "${text}"

Examples:
- "Clean the kitchen tomorrow" -> { "tasks": [{ "title": "Clean the kitchen", "location": "Kitchen", "dueDate": "2025-07-19T00:00:00Z" }] }
- "Take out the trash" -> { "tasks": [{ "title": "Take out the trash" }] }
- "Mow the lawn" -> { "tasks": [{ "title": "Mow the lawn", "location": "Garden" }] }
- "Vacuum the living room and do laundry next week" -> { "tasks": [
    { "title": "Vacuum the living room", "location": "Living room", "dueDate": "2025-07-25T00:00:00Z" },
    { "title": "Do laundry", "dueDate": "2025-07-25T00:00:00Z" }
  ] }`,
    });

    logger.info('API', '✅ API: Tasks extracted:', result);

    return Response.json(result);
  } catch (error) {
    logger.error('API', '❌ API: Task extraction error:', error);

    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Invalid response format', details: error.errors },
        { status: 500 }
      );
    }

    return Response.json(
      { error: 'Failed to extract tasks' },
      { status: 500 }
    );
  }
}