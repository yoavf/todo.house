import { analyzeImageForTask } from './aiAnalysis';

// Test function to verify environment and API setup
export async function testEnvironment(): Promise<void> {
  console.log('🧪 Testing environment setup...');

  // Check environment variables
  console.log('🔍 Checking environment variables...');
  const expoPubKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const nodeEnvKey = process.env.OPENAI_API_KEY;

  console.log('EXPO_PUBLIC_OPENAI_API_KEY present:', !!expoPubKey);
  console.log('EXPO_PUBLIC_OPENAI_API_KEY length:', expoPubKey?.length || 0);
  console.log('OPENAI_API_KEY present:', !!nodeEnvKey);
  console.log('OPENAI_API_KEY length:', nodeEnvKey?.length || 0);

  // Check which one we're actually using
  const apiKey = expoPubKey || nodeEnvKey;
  console.log('Using API key:', !!apiKey);

  if (!apiKey) {
    console.error('❌ No API key found in environment');
    return;
  }

  // Check if it looks like a valid OpenAI key
  if (!apiKey.startsWith('sk-')) {
    console.error('❌ API key does not look like valid OpenAI key (should start with sk-)');
    return;
  }

  console.log('✅ Environment looks good');
}

// Simple test function to verify AI integration
export async function testAIIntegration(): Promise<void> {
  console.log('🤖 Testing AI integration...');

  await testEnvironment();

  try {
    // Use a minimal PNG test image (1x1 transparent pixel)
    // This should at least test the API connection without expecting a meaningful result
    const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=';
    console.log('🖼️ Testing with minimal test image...');
    console.log('📊 Test image length:', testBase64.length);

    const result = await analyzeImageForTask(testBase64);
    console.log('📊 Test result:', result);

    if (result.success) {
      console.log('✅ AI integration test passed! Task identified:', result.task);
    } else if (result.error?.includes('confidence') || result.error?.includes('clear household task')) {
      console.log('✅ AI connection works! Low confidence expected for test image.');
    } else {
      console.log('⚠️ AI integration test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ AI integration test error:', error);
  }
}

// Helper function to log current environment
export function logEnvironmentInfo(): void {
  console.log('📱 Environment Info:');
  console.log('Platform:', process.env.EXPO_PLATFORM || 'unknown');
  console.log('Environment:', process.env.NODE_ENV || 'unknown');

  // List all env vars that might be relevant (without showing sensitive values)
  const envKeys = Object.keys(process.env).filter(key =>
    key.includes('OPENAI') ||
    key.includes('API') ||
    key.includes('EXPO')
  );

  console.log('Relevant env vars found:', envKeys);
}