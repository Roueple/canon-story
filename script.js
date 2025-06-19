#!/usr/bin/env node
// fix-slugify-error.js
// Fixes the slugify function error by adding the export to utils.ts

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixSlugifyError() {
  console.log('🔧 Fixing slugify function error...\n');

  // Fix 1: Add slugify export to utils.ts
  const utilsPath = path.join(process.cwd(), 'src/lib/utils.ts');
  
  try {
    let utilsContent = await fs.readFile(utilsPath, 'utf-8');
    
    // Check if slugify is already exported
    if (!utilsContent.includes('export function slugify') && !utilsContent.includes('export { generateSlug as slugify }')) {
      // Add slugify as an alias to generateSlug
      const exportLine = '\n// Alias for backward compatibility\nexport const slugify = generateSlug;\n';
      
      // Find a good place to add it (after generateSlug function)
      const generateSlugEndIndex = utilsContent.indexOf('}\n\n// Format a number');
      
      if (generateSlugEndIndex !== -1) {
        utilsContent = 
          utilsContent.slice(0, generateSlugEndIndex + 1) + 
          exportLine + 
          utilsContent.slice(generateSlugEndIndex + 1);
      } else {
        // If we can't find the exact spot, add it at the end
        utilsContent += exportLine;
      }
      
      await fs.writeFile(utilsPath, utilsContent);
      console.log('✅ Added slugify export to utils.ts');
    } else {
      console.log('ℹ️  slugify is already exported in utils.ts');
    }
    
  } catch (error) {
    console.error('❌ Error updating utils.ts:', error.message);
    return false;
  }

  // Verify the services are using it correctly
  console.log('\n📋 Checking service files...');
  
  const servicesToCheck = [
    'src/services/novelService.ts',
    'src/services/chapterService.ts'
  ];
  
  for (const servicePath of servicesToCheck) {
    try {
      const fullPath = path.join(process.cwd(), servicePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      if (content.includes('import { slugify }') || content.includes('import { generateSlug, slugify }')) {
        console.log(`✅ ${servicePath} - imports slugify correctly`);
      } else if (content.includes('import { generateSlug }')) {
        console.log(`⚠️  ${servicePath} - uses generateSlug instead of slugify`);
      }
    } catch (error) {
      console.log(`⚠️  ${servicePath} - file not found`);
    }
  }

  console.log('\n✨ Fix completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your development server (Ctrl+C then npm run dev)');
  console.log('2. Try creating a novel again - the error should be resolved');
  console.log('\nNote: Both "slugify" and "generateSlug" will now work for backward compatibility.');
  
  return true;
}

// Run the fix
fixSlugifyError().catch(console.error);