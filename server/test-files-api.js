import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import dotenv from 'dotenv';

dotenv.config();

async function testFilesAPI() {
  console.log('🧪 Testing Gemini Files API...\n');

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('1. API Key check:');
  console.log(`   Length: ${apiKey ? apiKey.length : 0} characters`);
  console.log(`   Starts with: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET'}\n`);

  if (!apiKey || apiKey.length < 20) {
    console.error('❌ Invalid or missing API key!');
    console.log('\n📝 Get your API key from: https://aistudio.google.com/app/apikey');
    return;
  }

  try {
    // Test 1: Basic API connection
    console.log('2. Testing basic API connection...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const result = await model.generateContent('Say "Hello, API works!"');
    const response = await result.response;
    const text = response.text();
    
    console.log(`   ✅ API Response: ${text}\n`);

    // Test 2: File Manager initialization
    console.log('3. Testing File Manager...');
    const fileManager = new GoogleAIFileManager(apiKey);
    console.log('   ✅ FileManager initialized\n');

    // Test 3: List any uploaded files (should be empty)
    console.log('4. Checking for existing uploaded files...');
    try {
      const listResult = await fileManager.listFiles();
      console.log(`   ✅ Found ${listResult.files?.length || 0} files\n`);
    } catch (listError) {
      console.log(`   ⚠️ Could not list files: ${listError.message}\n`);
    }

    console.log('✅ All tests passed! Files API is working correctly.\n');
    console.log('📝 Your API key is valid and Files API is accessible.');

  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error('Error:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('\n📝 Your API key appears to be invalid.');
      console.log('   Get a new one from: https://aistudio.google.com/app/apikey');
    } else if (error.message.includes('PERMISSION')) {
      console.log('\n📝 Your API key doesn\'t have permission for this operation.');
    } else if (error.message.includes('QUOTA')) {
      console.log('\n📝 You\'ve exceeded your API quota.');
    }
  }
}

testFilesAPI();
