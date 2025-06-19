// test-docx-import.js
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
    
    console.log(`✅ Extracted ${chapters.length} chapters:`);
    chapters.forEach((chapter, index) => {
      console.log(`   Chapter ${index + 1}: ${chapter.title}`);
      console.log(`   - Words: ${chapter.wordCount}`);
      console.log(`   - Images: ${chapter.images.length}`);
    });
    
    // Test 2: Create import record
    console.log('\n📝 Creating import record...');
    const importId = await documentImportService.createImportRecord(
      'test-simple.docx',
      buffer.length,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'test-user-id',
      'test-novel-id',
      'https://cloudinary-test-url',
      { chapterNumberStart: 1, importAsPublished: true }
    );
    
    console.log(`✅ Created import with ID: ${importId}`);
    
    // Test 3: Check import status
    console.log('\n📊 Checking import status...');
    const status = await documentImportService.getImportStatus(importId);
    console.log('Import status:', status);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImport();
