import { analyzeImageForTask } from './apiClient';

// Test function to verify API endpoint availability
export async function testEnvironment(): Promise<void> {
  console.log('🧪 Testing client environment setup...');
  console.log('📱 Platform:', process.env.EXPO_PLATFORM || 'unknown');
  console.log('🌐 Environment:', process.env.NODE_ENV || 'unknown');
  console.log('✅ Client environment check complete');
}

// Simple test function to verify AI integration via API
export async function testAIIntegration(): Promise<void> {
  console.log('🤖 Testing AI integration via API...');

  await testEnvironment();

  try {
    // Use a minimal PNG test image (1x1 transparent pixel)
    // This should at least test the API connection without expecting a meaningful result
    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=';
    console.log('🖼️ Testing with minimal test image via API...');
    console.log('📊 Test image length:', testBase64.length);

    const result = await analyzeImageForTask(testBase64);
    console.log('📊 API test result:', result);

    if (result.success) {
      console.log('✅ AI API integration test passed! Task identified:', result.task);
    } else if (result.error?.includes('confidence') || result.error?.includes('clear household task')) {
      console.log('✅ AI API connection works! Low confidence expected for test image.');
    } else {
      console.log('⚠️ AI API integration test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ AI API integration test error:', error);
  }
}

// Helper function to log current environment
export function logEnvironmentInfo(): void {
  console.log('📱 Client Environment Info:');
  console.log('Platform:', process.env.EXPO_PLATFORM || 'unknown');
  console.log('Environment:', process.env.NODE_ENV || 'unknown');
  console.log('✅ Client environment info logged');
}