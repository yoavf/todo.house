import { analyzeImageForTask } from '../../utils/apiClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('analyzeImageForTask', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();
  });

  it('returns error for empty image', async () => {
    const result = await analyzeImageForTask('');
    
    expect(result).toEqual({
      success: false,
      error: 'Invalid image data provided.',
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('successfully analyzes image', async () => {
    const mockResponse = {
      success: true,
      tasks: [
        { title: 'Clean dishes', confidence: 0.9 },
        { title: 'Wipe counter', confidence: 0.8 },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await analyzeImageForTask('base64-image-data');

    expect(global.fetch).toHaveBeenCalledWith('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Image: 'base64-image-data',
      }),
    });

    expect(result).toEqual(mockResponse);
  });

  it('handles server error response', async () => {
    const errorResponse = { error: 'Invalid API key' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => errorResponse,
    });

    const result = await analyzeImageForTask('base64-image-data');

    expect(result).toEqual({
      success: false,
      error: 'Invalid API key',
    });
  });

  it('handles server error without message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await analyzeImageForTask('base64-image-data');

    expect(result).toEqual({
      success: false,
      error: 'Server error: 500',
    });
  });

  it('handles network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to fetch')
    );

    const result = await analyzeImageForTask('base64-image-data');

    expect(result).toEqual({
      success: false,
      error: 'Network error. Please check your internet connection and try again.',
    });
  });

  it('handles timeout error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Request timeout')
    );

    const result = await analyzeImageForTask('base64-image-data');

    expect(result).toEqual({
      success: false,
      error: 'Request timeout. Please try again.',
    });
  });

  it('handles generic error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Unknown error')
    );

    const result = await analyzeImageForTask('base64-image-data');

    expect(result).toEqual({
      success: false,
      error: 'Failed to analyze image. Please try again.',
    });
  });

  it('handles non-Error object thrown', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('String error');

    const result = await analyzeImageForTask('base64-image-data');

    expect(result).toEqual({
      success: false,
      error: 'Failed to analyze image. Please try again.',
    });
  });
});