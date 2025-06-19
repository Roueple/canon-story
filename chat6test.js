// test-chat6-implementation.js
// Comprehensive testing script for Chat 6: DOCX Import System

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createTestDocx() {
  section('Creating Test DOCX Files');
  
  const testDocsDir = path.join(process.cwd(), 'test-documents');
  
  try {
    await fs.mkdir(testDocsDir, { recursive: true });
    log('✅ Created test-documents directory', 'green');
  } catch (error) {
    log('❌ Error creating test directory: ' + error.message, 'red');
  }

  // Create a simple HTML file that mimics DOCX structure for testing
  const testContent = `
<!DOCTYPE html>
<html>
<head><title>Test Novel Import</title></head>
<body>
  <h1>Chapter 1: The Beginning</h1>
  <p>This is the first paragraph of our test chapter. It contains <strong>bold text</strong> and <em>italic text</em>.</p>
  <p>Here's another paragraph with more content to test word counting and reading time estimation.</p>
  
  <h1>Chapter 2: The Journey</h1>
  <p>The second chapter begins here. We'll test multiple chapters in a single document.</p>
  <p>This chapter has different content to ensure our chapter splitting logic works correctly.</p>
  
  <h1>Chapter 3: The Conclusion</h1>
  <p>The final chapter of our test document. This will help us verify that all chapters are imported correctly.</p>
  <p>We can also test special characters: "quotes", 'apostrophes', and — dashes.</p>
</body>
</html>
`;

  const testHtmlPath = path.join(testDocsDir, 'test-import.html');
  await fs.writeFile(testHtmlPath, testContent);
  log(`✅ Created test HTML file: ${testHtmlPath}`, 'green');
  
  // Create instructions for DOCX creation
  const instructions = `
DOCX Test File Instructions
===========================

Since we need actual DOCX files for testing, please create test documents with the following content:

1. Simple Test Document (test-simple.docx):
   - Title: "Test Novel Import"
   - Chapter 1: The Beginning
     * Include some bold and italic text
     * Add 2-3 paragraphs
   - Chapter 2: The Journey
     * Different content
     * Include a list (bullet points)
   - Chapter 3: The Conclusion
     * Final chapter content
     * Include special characters

2. Document with Images (test-with-images.docx):
   - Chapter 1: Visual Content
     * Include 1-2 images
     * Add captions for images
   - Chapter 2: Mixed Media
     * Text and images combined
     * Different image sizes

3. Complex Document (test-complex.docx):
   - Multiple chapters (5+)
   - Various formatting (headings, lists, tables)
   - Images throughout
   - Different chapter numbering (Chapter 0, Chapter 1.5, etc.)

Save these files in: ${testDocsDir}
`;

  const instructionsPath = path.join(testDocsDir, 'CREATE_TEST_DOCS.txt');
  await fs.writeFile(instructionsPath, instructions);
  log(`📝 Created DOCX creation instructions: ${instructionsPath}`, 'cyan');
}

async function testDatabaseSetup() {
  section('Testing Database Setup');
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    log('✅ Database connection successful', 'green');
    
    // Check if DocumentImport table exists
    const importCount = await prisma.documentImport.count();
    log(`✅ DocumentImport table exists (${importCount} records)`, 'green');
    
    // Check if MediaFile table exists
    const mediaCount = await prisma.mediaFile.count();
    log(`✅ MediaFile table exists (${mediaCount} records)`, 'green');
    
    await prisma.$disconnect();
  } catch (error) {
    log('❌ Database error: ' + error.message, 'red');
    log('   Make sure you have run: npx prisma db push', 'yellow');
    return false;
  }
  
  return true;
}

async function testAPIEndpoints() {
  section('Testing API Endpoints');
  
  log('\n📍 Testing Upload Signature Endpoint', 'cyan');
  log('POST /api/admin/media/signature', 'blue');
  log('Expected: Returns timestamp and signature for Cloudinary uploads', 'yellow');
  
  log('\n📍 Testing Import Upload Endpoint', 'cyan');
  log('POST /api/admin/import/upload', 'blue');
  log('Expected: Accepts DOCX file and creates import record', 'yellow');
  
  log('\n📍 Testing Import Status Endpoint', 'cyan');
  log('GET /api/admin/import/status/[importId]', 'blue');
  log('Expected: Returns current import status and progress', 'yellow');
  
  log('\n📍 Testing Media Library Endpoints', 'cyan');
  log('GET /api/admin/media - List all media files', 'blue');
  log('PUT /api/admin/media - Save uploaded media metadata', 'blue');
  log('DELETE /api/admin/media/[id] - Soft delete media', 'blue');
}

async function testUIComponents() {
  section('Testing UI Components');
  
  const componentsToTest = [
    {
      path: 'src/components/admin/media/ImageUploader.tsx',
      description: 'Drag-and-drop image upload component'
    },
    {
      path: 'src/components/admin/media/MediaLibrary.tsx',
      description: 'Media library with search and management'
    },
    {
      path: 'src/components/admin/media/MediaModal.tsx',
      description: 'Modal for selecting/uploading images'
    },
    {
      path: 'src/app/(admin)/admin/content/media/page.tsx',
      description: 'Media management admin page'
    }
  ];
  
  for (const component of componentsToTest) {
    const exists = await checkFileExists(component.path);
    if (exists) {
      log(`✅ ${component.path}`, 'green');
      log(`   ${component.description}`, 'cyan');
    } else {
      log(`❌ Missing: ${component.path}`, 'red');
    }
  }
}

async function createImportTestScript() {
  section('Creating Import Test Script');
  
  const testScript = `// test-docx-import.js
// Manual test script for DOCX import functionality

import { documentImportService } from './src/services/documentImportService.js';
import fs from 'fs/promises';

async function testImport() {
  console.log('🧪 Testing DOCX Import Service...');
  
  try {
    // Test 1: Parse a DOCX file
    const docxPath = './test-documents/test-simple.docx';
    const buffer = await fs.readFile(docxPath);
    
    console.log('📄 Parsing DOCX file...');
    const chapters = await documentImportService.parseDocx(buffer);
    
    console.log(\`✅ Extracted \${chapters.length} chapters:\`);
    chapters.forEach((chapter, index) => {
      console.log(\`   Chapter \${index + 1}: \${chapter.title}\`);
      console.log(\`   - Words: \${chapter.wordCount}\`);
      console.log(\`   - Images: \${chapter.images.length}\`);
    });
    
    // Test 2: Create import record
    console.log('\\n📝 Creating import record...');
    const importId = await documentImportService.createImportRecord(
      'test-simple.docx',
      buffer.length,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'test-user-id',
      'test-novel-id',
      'https://cloudinary-test-url',
      { chapterNumberStart: 1, importAsPublished: true }
    );
    
    console.log(\`✅ Created import with ID: \${importId}\`);
    
    // Test 3: Check import status
    console.log('\\n📊 Checking import status...');
    const status = await documentImportService.getImportStatus(importId);
    console.log('Import status:', status);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImport();
`;

  await fs.writeFile('test-docx-import.js', testScript);
  log('✅ Created test-docx-import.js', 'green');
}

async function showTestingSteps() {
  section('Manual Testing Steps');
  
  console.log(`
${colors.bright}1. Test Media Library:${colors.reset}
   ${colors.cyan}a) Navigate to: /admin/content/media${colors.reset}
   b) Test image upload with drag-and-drop
   c) Test image search functionality
   d) Test image deletion (with usage protection)
   e) Verify images appear in the library

${colors.bright}2. Test DOCX Import:${colors.reset}
   ${colors.cyan}a) Navigate to: /admin/novels/[id]/chapters${colors.reset}
   b) Look for "Import from DOCX" button
   c) Upload a test DOCX file
   d) Monitor import progress
   e) Verify chapters are created correctly
   f) Check that images are extracted and uploaded

${colors.bright}3. Test Rich Text Editor:${colors.reset}
   ${colors.cyan}a) Create or edit a chapter${colors.reset}
   b) Click the image icon in the editor toolbar
   c) Select an image from the media library
   d) Verify image is inserted into content
   e) Save and preview the chapter

${colors.bright}4. Test Bulk Import:${colors.reset}
   ${colors.cyan}a) Prepare multiple DOCX files (up to 50)${colors.reset}
   b) Use bulk upload interface
   c) Monitor queue progress
   d) Verify all files are processed
   e) Check error handling for invalid files

${colors.bright}5. Test Import History:${colors.reset}
   ${colors.cyan}a) Check import history table${colors.reset}
   b) Verify status updates (pending → processing → completed)
   c) Review any error messages
   d) Check imported content quality
`);
}

async function checkEnvironmentVariables() {
  section('Checking Environment Variables');
  
  const requiredVars = [
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string' },
    { name: 'CLOUDINARY_CLOUD_NAME', description: 'Cloudinary cloud name' },
    { name: 'CLOUDINARY_API_KEY', description: 'Cloudinary API key' },
    { name: 'CLOUDINARY_API_SECRET', description: 'Cloudinary API secret' },
    { name: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', description: 'Public Cloudinary cloud name' },
    { name: 'NEXT_PUBLIC_CLOUDINARY_API_KEY', description: 'Public Cloudinary API key' }
  ];
  
  let allSet = true;
  
  for (const envVar of requiredVars) {
    if (process.env[envVar.name]) {
      log(`✅ ${envVar.name} is set`, 'green');
    } else {
      log(`❌ ${envVar.name} is not set - ${envVar.description}`, 'red');
      allSet = false;
    }
  }
  
  if (!allSet) {
    log('\n⚠️  Some environment variables are missing!', 'yellow');
    log('   Update your .env.local file with the missing values', 'yellow');
  }
  
  return allSet;
}

async function createTestNovel() {
  section('Creating Test Novel for Import');
  
  const createNovelScript = `// create-test-novel.js
// Creates a test novel for DOCX import testing

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestNovel() {
  try {
    // First, ensure we have a test user
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          username: 'testuser',
          displayName: 'Test User',
          role: 'admin',
          isActive: true,
          emailVerified: true
        }
      });
      console.log('✅ Created test user');
    }
    
    // Create a test novel
    const novel = await prisma.novel.create({
      data: {
        title: 'Test Novel for DOCX Import',
        slug: 'test-novel-import',
        description: 'This novel is for testing DOCX import functionality',
        coverColor: '#3B82F6',
        authorId: testUser.id,
        status: 'ongoing',
        isPublished: true
      }
    });
    
    console.log('✅ Created test novel:', novel.id);
    console.log('\\nUse this novel ID for testing imports:', novel.id);
    console.log('Navigate to: /admin/novels/' + novel.id + '/chapters');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

createTestNovel();
`;

  await fs.writeFile('create-test-novel.js', createNovelScript);
  log('✅ Created create-test-novel.js', 'green');
  log('   Run: node create-test-novel.js', 'cyan');
}

async function main() {
  console.log('\n');
  log('🧪 CHAT 6 IMPLEMENTATION TEST SUITE', 'bright');
  log('DOCX Import System Testing', 'cyan');
  console.log('\n');

  // Check environment variables
  const envOk = await checkEnvironmentVariables();
  
  // Test database setup
  const dbOk = await testDatabaseSetup();
  
  // Create test files
  await createTestDocx();
  
  // Test UI components
  await testUIComponents();
  
  // Test API endpoints
  await testAPIEndpoints();
  
  // Create helper scripts
  await createImportTestScript();
  await createTestNovel();
  
  // Show manual testing steps
  await showTestingSteps();
  
  section('Test Summary');
  
  if (!envOk || !dbOk) {
    log('⚠️  Some prerequisites are not met!', 'yellow');
    log('   Please fix the issues above before testing', 'yellow');
  } else {
    log('✅ All prerequisites are met!', 'green');
    log('   You can now proceed with manual testing', 'green');
  }
  
  console.log(`
${colors.bright}Quick Start Testing:${colors.reset}
1. Run: ${colors.cyan}node create-test-novel.js${colors.reset} (creates a test novel)
2. Create DOCX files in ${colors.cyan}test-documents/${colors.reset} folder
3. Start dev server: ${colors.cyan}npm run dev${colors.reset}
4. Navigate to: ${colors.cyan}/admin/content/media${colors.reset}
5. Test image uploads and media library
6. Go to your test novel's chapter page to test DOCX import

${colors.bright}Need Help?${colors.reset}
- Check the console for errors
- Verify all files were created by Chat 6 script
- Ensure Cloudinary credentials are set
- Make sure database is properly configured
`);
}

main().catch(console.error);