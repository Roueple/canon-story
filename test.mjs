// test-bigint-fix.mjs
// Simple script to test if the BigInt fix is working

console.log('🧪 Testing BigInt serialization fix...\n');

// Test the serialization function
function serializeBigInt(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === 'object') {
    const serialized = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value);
    }
    return serialized;
  }
  return obj;
}

// Test data with BigInt
const testData = {
  id: 'test-123',
  title: 'Test Chapter',
  wordCount: 1500,
  totalViews: BigInt(1000000), // This would cause the error
  novel: {
    id: 'novel-456',
    title: 'Test Novel',
    totalRevenue: BigInt(50000),
    stats: {
      views: BigInt(2000000),
      likes: 500
    }
  },
  createdAt: new Date(),
  numbers: [BigInt(100), BigInt(200), BigInt(300)]
};

console.log('Original data (with BigInt):');
console.log('totalViews type:', typeof testData.totalViews);
console.log('totalRevenue type:', typeof testData.novel.totalRevenue);

try {
  // This would fail
  JSON.stringify(testData);
  console.log('\n❌ UNEXPECTED: JSON.stringify should have failed with BigInt');
} catch (error) {
  console.log('\n✅ Expected error with BigInt:', error.message);
}

// Now test with serialization
const serialized = serializeBigInt(testData);

console.log('\n📦 Serialized data:');
console.log('totalViews:', serialized.totalViews, 'type:', typeof serialized.totalViews);
console.log('totalRevenue:', serialized.novel.totalRevenue, 'type:', typeof serialized.novel.totalRevenue);

try {
  const json = JSON.stringify(serialized);
  console.log('\n✅ JSON.stringify works after serialization!');
  console.log('JSON length:', json.length, 'characters');
  
  // Parse it back
  const parsed = JSON.parse(json);
  console.log('\n✅ Can parse back successfully');
  console.log('Parsed totalViews:', parsed.totalViews);
} catch (error) {
  console.log('\n❌ Error after serialization:', error.message);
}

// Test API endpoint if server is running
async function testAPI() {
  try {
    console.log('\n🌐 Testing actual API endpoint...');
    
    // You'll need to replace these IDs with actual ones from your database
    const response = await fetch('http://localhost:3000/api/test-api');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API test endpoint works');
      console.log('Stats:', data.stats);
    } else {
      console.log('⚠️  API returned:', response.status);
    }
  } catch (error) {
    console.log('ℹ️  Server not running or endpoint not available');
  }
}

console.log('\n📋 Summary:');
console.log('The serializeBigInt function correctly converts BigInt values to strings');
console.log('This prevents the "Do not know how to serialize a BigInt" error');

// Run API test
testAPI();