// chat9-fix-serialization.mjs
import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();

async function createFile(filePath, content) {
  const fullPath = path.join(projectRoot, filePath);
  const dir = path.dirname(fullPath);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content.trim(), 'utf-8');
    console.log(`✅ Created/Updated: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating/updating ${filePath}:`, error.message);
  }
}

async function modifyFile(filePath, modifications) {
  const fullPath = path.join(projectRoot, filePath);
  try {
    let content = await fs.readFile(fullPath, 'utf-8');
    for (const mod of modifications) {
      if (mod.type === 'prepend' && !content.includes(mod.code)) {
        content = `${mod.code}\n${content}`;
      } else if (mod.type === 'replace') {
        content = content.replace(mod.find, mod.replaceWith);
      } else if (mod.type === 'append_to_function_return') {
        // This is a bit more complex and might need careful regex
        // For simplicity, this example targets specific known structures
        // A more robust solution might involve AST parsing
        const funcRegex = new RegExp(`async (\\w+)\\s*\\([^)]*\\)\\s*(:\\s*\\w+<[^>]+>)?\\s*\\{`, 'g');
        content = content.replace(funcRegex, (match, funcName) => {
          if (mod.functionNames.includes(funcName)) {
            // Find the return statements and wrap them
            // This is a simplified replacement logic
            // It assumes return statements are relatively simple
            const returnRegex = /return\s+(.+?);/g;
            let newFuncBody = match;
            // This part is tricky without proper parsing. We'll target common patterns.
            // A better approach for complex cases is manual editing or AST.
          }
          return match; // Fallback if not matching
        });
        // Simpler approach: find `return novel;` or `return chapters;` etc.
        // This is highly dependent on the exact code structure.
      }
    }
    // Manual replacements for service files based on known patterns:
    if (filePath.endsWith('novelService.ts')) {
        if(!content.includes("import { serializePrismaData } from '@/lib/serialization';")) {
            content = `import { serializePrismaData } from '@/lib/serialization';\n${content}`;
        }
        content = content.replace(/return novel;/g, 'return serializePrismaData(novel);');
        content = content.replace(/return serializedNovels;/g, 'return serializePrismaData(serializedNovels);'); // For findAll
        content = content.replace( // For findById, findBySlug
          /return\s+\{\s*\.\.\.novel,\s*averageRating:\s*Number\(novel\.averageRating\),\s*totalViews:\s*(String|Number)\(novel\.totalViews\)(?:,\s*chapters:\s*novel\.chapters\.map\(chapter\s*=>\s*\(\{\s*\.\.\.chapter,\s*chapterNumber:\s*Number\(chapter\.chapterNumber\)(?:,\s*displayOrder:\s*Number\(chapter\.displayOrder\))?\s*\}\)\))?\s*\};/gm,
          'return serializePrismaData(novel);'
        );
         content = content.replace( // For create and update within transactions
          /return\s+await\s+tx\.novel\.update\(\{(.|\n)*?\}\);/gm,
          (match) => `const updatedNovel = await tx.novel.update({${match.split('{')[1].split('}')[0]}}); return serializePrismaData(updatedNovel);`
        );
         content = content.replace( // For create (standalone)
          /\s+const\s+novel\s*=\s*await\s+prisma\.novel\.create\(\{((?:.|\n)*?)\}\);((?:.|\n)*?)return\s+\{\s*\.\.\.novel,\s*averageRating:\s*Number\(novel\.averageRating\),\s*totalViews:\s*Number\(novel\.totalViews\)\s*\};/gm,
          ` const novelData = await prisma.novel.create({$1});\n return serializePrismaData(novelData);`
        );
    }
    if (filePath.endsWith('chapterService.ts')) {
        if(!content.includes("import { serializePrismaData } from '@/lib/serialization';")) {
            content = `import { serializePrismaData } from '@/lib/serialization';\n${content}`;
        }
        content = content.replace(/return\s+\{ chapters, total \};/g, 'return { chapters: serializePrismaData(chapters), total };');
        content = content.replace(/return prisma\.chapter\.findFirst\(((.|\n)*?)\);/g, 'const chapter = await prisma.chapter.findFirst($1);\n    return serializePrismaData(chapter);');
        content = content.replace(/return prisma\.chapter\.create\(((.|\n)*?)\);/g, 'const chapter = await prisma.chapter.create($1);\n    return serializePrismaData(chapter);');
        content = content.replace(/return prisma\.chapter\.update\(((.|\n)*?)\);/g, 'const chapter = await prisma.chapter.update($1);\n    return serializePrismaData(chapter);');
         content = content.replace( // For softDelete
          /return prisma\.chapter\.update\(\{\s*where: \{ id \},\s*data: \{((?:.|\n)*?)\}\s*\}\);/gm,
          `const chapter = await prisma.chapter.update({\n where: { id },\n data: {$1}\n });\n return serializePrismaData(chapter);`
        );

    }
    if (filePath.endsWith('mediaService.ts')) {
        if(!content.includes("import { serializePrismaData } from '@/lib/serialization';")) {
            content = `import { serializePrismaData } from '@/lib/serialization';\n${content}`;
        }
        content = content.replace(/return prisma\.mediaFile\.create\(((.|\n)*?)\);/g, 'const mediaFile = await prisma.mediaFile.create($1);\n    return serializePrismaData(mediaFile);');
        content = content.replace(/return \{ mediaFiles, total \};/g, 'return { mediaFiles: serializePrismaData(mediaFiles), total };');
         content = content.replace( // For delete
          /await prisma\.mediaFile\.update\(\{(.|\n)*?data: \{ isDeleted: true, deletedAt: new Date\(\) \}\s*\}\);\s*return \{ message: 'Media file marked as deleted\.' \};/gm,
          "const deletedMedia = await prisma.mediaFile.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });\n    return serializePrismaData({ message: 'Media file marked as deleted.', media: deletedMedia });"
        );
    }
    if (filePath.endsWith('documentImportService.ts')) {
        if(!content.includes("import { serializePrismaData } from '@/lib/serialization';")) {
            content = `import { serializePrismaData } from '@/lib/serialization';\n${content}`;
        }
        // For createImportPreview
        content = content.replace(
            /(async createImportPreview\((.|\n)*?\)\s*(:\s*Promise<ExtractedChapterInfo>)?\s*\{)((.|\n)*?)(return chapterInfo;)/m,
            '$1$5return serializePrismaData(chapterInfo);'
        );
    }


    await fs.writeFile(fullPath, content, 'utf-8');
    console.log(`✅ Modified: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error modifying ${filePath}:`, error.message);
  }
}


const serializationUtilContent = `
// src/lib/serialization.ts
import { Prisma } from '@prisma/client';

// Type guard for Prisma.Decimal (or any Decimal.js like object)
function isDecimal(value: any): value is Prisma.Decimal {
  // Check if it's an object, not null, and has a toFixed method (characteristic of Decimal)
  // Also check constructor name if available, as Prisma.Decimal instances have it.
  return value !== null && typeof value === 'object' && typeof value.toFixed === 'function' && value.constructor?.name === 'Decimal';
}

export function serializePrismaData<T>(data: T): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'bigint') {
    return data.toString(); // Convert BigInt to string
  }

  if (isDecimal(data)) {
    return Number(data); // Convert Prisma.Decimal to number
  }

  if (data instanceof Date) {
    return data.toISOString(); // Ensure dates are ISO strings for consistency
  }

  if (Array.isArray(data)) {
    return data.map(item => serializePrismaData(item));
  }

  if (typeof data === 'object') {
    const result: { [key: string]: any } = {};
    for (const key in data) {
      // Check if the property belongs to the object itself, not its prototype
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializePrismaData((data as any)[key]);
      }
    }
    return result;
  }

  return data;
}
`;

async function main() {
  console.log('🚀 Applying serialization fixes...');

  // 1. Create serialization utility
  await createFile('src/lib/serialization.ts', serializationUtilContent);

  // 2. Modify service files
  // For novelService.ts
  await modifyFile('src/services/novelService.ts', []); // Modifications are now hardcoded in modifyFile

  // For chapterService.ts
  await modifyFile('src/services/chapterService.ts', []); // Modifications are now hardcoded in modifyFile
  
  // For mediaService.ts
  await modifyFile('src/services/mediaService.ts', []); // Modifications are now hardcoded in modifyFile

  // For documentImportService.ts
  await modifyFile('src/services/documentImportService.ts', []); // Modifications are now hardcoded

  console.log('\n✅ Script finished. Review changes and perform manual updates as listed below.');
  console.log('Next Steps:');
  console.log('1. Manually update src/app/api/public/chapters/[id]/details/route.ts (see instructions).');
  console.log('2. Manually review affected Server Components to remove redundant conversions (e.g., in getNovel, getChapter).');
  console.log('3. Test the application thoroughly, especially pages displaying novel/chapter data.');
}

main().catch(console.error);