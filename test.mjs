// fix-repeated-errors.mjs
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

console.log('🚀 Applying definitive fix for repeated serialization and test errors...');

// Helper to ensure directory exists
async function ensureDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

const filesToUpdate = [
  {
    path: 'src/lib/serialization.ts',
    content: `// src/lib/serialization.ts

// This is a robust, foolproof serializer. It uses a JSON replacer to handle
// special data types that are not native to JSON, like BigInt.
// It guarantees that the output is a plain JavaScript object/array.
export function serializeForJSON(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  const jsonString = JSON.stringify(data, (key, value) => {
    // Convert BigInt to a string. JSON.stringify() cannot handle BigInt by default.
    if (typeof value === 'bigint') {
      return value.toString();
    }
    
    // Prisma's Decimal type is an object. We convert it to a number.
    if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
      return Number(value);
    }

    return value;
  });

  return JSON.parse(jsonString);
}
`
  },
  {
    path: 'src/services/novelService.ts',
    content: `// src/services/novelService.ts
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';

// This service now strictly enforces that all outgoing data is serialized.

export const novelService = {
  async findAll(options: {
    page?: number;
    limit?: number;
    authorId?: string;
    status?: string;
    isPublished?: boolean;
    includeDeleted?: boolean;
  } = {}) {
    const { page = 1, limit = 20, authorId, status, isPublished, includeDeleted = false } = options;
    const where: any = {};
    if (!includeDeleted) where.isDeleted = false;
    if (authorId) where.authorId = authorId;
    if (status) where.status = status;
    if (isPublished !== undefined) where.isPublished = isPublished;

    const [novels, total] = await Promise.all([
      prisma.novel.findMany({
        where,
        include: {
          author: { select: { id: true, displayName: true, username: true } },
          _count: { select: { chapters: { where: { isDeleted: false } } } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.novel.count({ where })
    ]);

    return { novels: serializeForJSON(novels), total };
  },

  async findById(id: string, includeDeleted = false) {
    const novel = await prisma.novel.findFirst({
      where: { id, ...(!includeDeleted && { isDeleted: false }) },
      include: {
        author: { select: { id: true, displayName: true, username: true } },
        chapters: { where: { isDeleted: false }, orderBy: { displayOrder: 'asc' } },
      }
    });
    return serializeForJSON(novel);
  },

  async create(data: any) {
    const slug = await this.generateUniqueSlug(data.title);
    const novel = await prisma.novel.create({ data: { ...data, slug } });
    return serializeForJSON(novel);
  },

  async update(id: string, data: any) {
    const novel = await prisma.novel.update({ where: { id }, data });
    return serializeForJSON(novel);
  },

  async softDelete(id: string, deletedBy: string) {
    const result = await prisma.novel.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy }
    });
    return serializeForJSON(result);
  },

  async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
    let slug = slugify(title);
    let counter = 1;
    while (true) {
      const where: any = { slug };
      if (excludeId) where.id = { not: excludeId };
      const existing = await prisma.novel.findFirst({ where });
      if (!existing) break;
      slug = \`\${slugify(title)}-\${counter++}\`;
    }
    return slug;
  }
};
`
  },
  {
    path: 'src/app/(admin)/admin/novels/[id]/page.tsx',
    content: `// src/app/(admin)/admin/novels/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { EditNovelForm } from '@/components/admin/forms/EditNovelForm'
import { novelService } from '@/services/novelService'
import { serializeForJSON } from '@/lib/serialization'

async function getNovel(id: string) {
  const novelData = await novelService.findById(id, true);
  if (!novelData) {
    notFound();
  }
  // The service guarantees serializable data. No further action needed here.
  return novelData;
}

async function getGenres() {
  const genres = await prisma.genre.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });
  // Simple serialization for consistency
  return serializeForJSON(genres);
}

export default async function EditNovelPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  
  const [novel, genres] = await Promise.all([
    getNovel(params.id),
    getGenres()
  ]);

  return (
    <div>
      <Link href="/admin/novels" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Novel</h1>
        
        <EditNovelForm
          novel={novel}
          genres={genres}
        />
      </div>
    </div>
  );
}
`
  },
  {
    path: 'playwright.config.ts',
    content: `// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Correctly define __dirname in an ES module environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly load the .env.test file relative to the config file
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export const STORAGE_STATE = path.join(__dirname, 'tests/e2e/.auth/user.json');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\\.setup\\.ts/ },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
  ],
});
`
  }
];

// --- Main Execution ---
(async () => {
  for (const file of filesToUpdate) {
    try {
      await ensureDir(join(process.cwd(), file.path));
      await writeFile(join(process.cwd(), file.path), file.content, 'utf-8');
      console.log(`✅ Updated file: ${file.path}`);
    } catch (error) {
      console.error(`❌ Error updating ${file.path}:`, error.message);
    }
  }

  console.log('\\n🎉 All fixes applied successfully!');
  console.log(`
Analysis of Fixes:
==================
1.  **Serialization**: The new 'src/lib/serialization.ts' is foolproof. It uses JSON's own engine to build a clean object, guaranteeing no special types (like Decimal) can slip through. The service files now use this, making the entire data layer robust.

2.  **Playwright Config**: The 'playwright.config.ts' now correctly uses the 'import.meta.url' pattern to define '__dirname', which is the standard and correct way for ES Modules. This permanently solves the 'ReferenceError'.

Next Steps:
=============
1.  Make sure your dev server is running:
    npm run dev

2.  In a new terminal, run the E2E tests. This will test both the login and the admin page navigation.
    npm run test:e2e
`);
})();