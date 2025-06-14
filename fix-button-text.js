// fix-button-text.js
// This script fixes the invisible button text by explicitly setting a
// text color for the "outline" button variant.
// Run with: node fix-button-text.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateFile(filePath, search, replace) {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    const originalContent = await fs.readFile(fullPath, 'utf-8');
    
    if (!originalContent.includes(search)) {
      console.warn(`⚠️  Could not find the target style in ${filePath}. It might have been updated already. Skipping.`);
      return;
    }

    const newContent = originalContent.replace(search, replace);
    await fs.writeFile(fullPath, newContent, 'utf-8');
    console.log(`✅ Fixed Button Text Color in: ${filePath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`❌ Error: File not found at ${filePath}.`);
    } else {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
  }
}

async function main() {
  console.log("🚀 Applying final fix for button text visibility...");
  console.log('======================================================\n');

  const searchString = "outline: 'border border-border bg-transparent hover:bg-muted'";
  const replaceString = "outline: 'border border-border bg-transparent hover:bg-muted text-foreground'";

  await updateFile('src/components/shared/ui/Button.tsx', searchString, replaceString);

  console.log('\n✅ Button text color fix has been applied!');
  console.log('\nPlease restart your development server. This should be the final fix for this issue.');
  console.log('1. Press Ctrl+C in your terminal.');
  console.log('2. Run: npm run dev');
}

main().catch(console.error);