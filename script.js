// Save as: test-setup.js
// Run with: node test-setup.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${filePath}`);
  return exists;
}

function checkDbExport() {
  const dbPath = path.join(__dirname, 'src/lib/db.ts');
  if (fs.existsSync(dbPath)) {
    const content = fs.readFileSync(dbPath, 'utf8');
    if (content.includes('export const prisma')) {
      console.log('📦 Your database export is: prisma');
      console.log('   Use: import { prisma } from "@/lib/db"');
    } else if (content.includes('export const db')) {
      console.log('📦 Your database export is: db');
      console.log('   Use: import { prisma } from "@/lib/db"');
    } else {
      console.log('📦 Could not determine database export name');
      console.log('   Check src/lib/db.ts manually');
    }
  }
}

console.log('🔍 Checking your setup...\n');

console.log('API Routes:');
checkFile('src/app/api/public/novels/[novelId]/chapters/route.ts');
checkFile('src/app/api/public/novels/[novelId]/chapters/[chapterId]/route.ts');
checkFile('src/app/api/public/novels/[novelId]/chapters/[chapterId]/content/route.ts');

console.log('\nComponents:');
checkFile('src/components/reader/InfiniteScrollReader.tsx');
checkFile('src/components/reader/ChapterContent.tsx');
checkFile('src/components/reader/ReadingControls.tsx');

console.log('\nHooks:');
checkFile('src/hooks/useIntersectionObserver.ts');
checkFile('src/hooks/useReadingProgress.ts');

console.log('\nDatabase Export:');
checkDbExport();

console.log('\n📝 Next Steps:');
console.log('1. Create any missing files marked with ❌');
console.log('2. Use the correct database import based on the export above');
console.log('3. Run npm run dev and test');