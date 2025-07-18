import { POST } from '../../app/api/extract-tasks+api'

// Mock the environment variable
process.env.OPENAI_API_KEY = 'test-api-key'

// Mock the AI SDK
jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(() => 'mocked-model'),
}))

jest.mock('ai', () => ({
  generateObject: jest.fn(),
}))

const { generateObject } = require('ai')

describe('extract-tasks API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should extract tasks from text successfully', async () => {
    const mockTasks = {
      tasks: [
        {
          title: 'Clean the kitchen',
          location: 'Kitchen',
          dueDate: '2025-07-19T00:00:00Z',
        },
      ],
    }

    generateObject.mockResolvedValueOnce({
      object: mockTasks,
    })

    const request = new Request('http://localhost/api/extract-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Clean the kitchen tomorrow' }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result).toEqual(mockTasks)
    expect(generateObject).toHaveBeenCalledWith({
      model: 'mocked-model',
      schema: expect.any(Object),
      prompt: expect.stringContaining('Clean the kitchen tomorrow'),
    })
  })

  it('should handle empty text', async () => {
    const request = new Request('http://localhost/api/extract-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: '' }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result).toEqual({ error: 'No text provided' })
  })

  it('should handle missing API key', async () => {
    const originalKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    const request = new Request('http://localhost/api/extract-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Some task' }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result).toEqual({ error: 'OpenAI API key not configured' })

    process.env.OPENAI_API_KEY = originalKey
  })

  it('should extract multiple tasks', async () => {
    const mockTasks = {
      tasks: [
        {
          title: 'Vacuum the living room',
          location: 'Living room',
        },
        {
          title: 'Do laundry',
        },
      ],
    }

    generateObject.mockResolvedValueOnce({
      object: mockTasks,
    })

    const request = new Request('http://localhost/api/extract-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Vacuum the living room and do laundry' }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.tasks).toHaveLength(2)
    expect(result).toEqual(mockTasks)
  })

  it('should return empty array when no tasks found', async () => {
    const mockTasks = {
      tasks: [],
    }

    generateObject.mockResolvedValueOnce({
      object: mockTasks,
    })

    const request = new Request('http://localhost/api/extract-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Just some random text' }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.tasks).toHaveLength(0)
  })
})
