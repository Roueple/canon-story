// fix.mjs
import fs from 'fs/promises';
import path from 'path';

// --- Helper Functions ---
async function writeFile(filePath, content) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content.trim(), 'utf-8');
        console.log(`✅ Wrote: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error writing file ${filePath}:`, error);
    }
}

// --- File Content Definitions ---

const baseServiceContent = `
// src/services/baseService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { Prisma } from '@prisma/client';

// This is the definitive, type-safe way to get model names
type ModelName = Uncapitalize<Prisma.ModelName>;

// --- CORRECTED & SIMPLIFIED GENERIC FUNCTIONS ---

/**
 * Finds a single record by its ID, with optional additional 'where' clauses.
 * Uses 'findFirst' for flexibility.
 */
export async function findByIdGeneric<T>(
  modelName: ModelName,
  id: string,
  options: {
    include?: any;
    where?: any; // Allows for additional filters like { isDeleted: false }
  } = {}
): Promise<T | null> {
  const model = (prisma as any)[modelName];
  // CORRECTED: Use findFirst for flexible where clauses
  const result = await model.findFirst({
    where: {
      id,
      ...options.where,
    },
    include: options.include,
  });
  return serializeForJSON(result) as T | null;
}

// This function was already correct and doesn't need changes.
export async function findAllGeneric<T>(
    modelName: ModelName,
    options: {
      where?: any;
      include?: any;
      orderBy?: any;
      skip?: number;
      take?: number;
    } = {}
  ): Promise<{ data: T[]; total: number }> {
    const model = (prisma as any)[modelName];
    const [data, total] = await prisma.$transaction([
      model.findMany(options),
      model.count({ where: options.where }),
    ]);
    return { data: serializeForJSON(data) as T[], total };
}


export async function deleteGeneric(modelName: ModelName, id: string): Promise<void> {
  const model = (prisma as any)[modelName];
  await model.delete({ where: { id } });
}

// --- AUDITED SOFT DELETE (Unchanged) ---
export async function auditedSoftDelete<T extends { id: string }>(
  modelName: ModelName,
  id: string,
  deletedBy: string | null,
  reason?: string
): Promise<T> {
  const model = (prisma as any)[modelName];

  const [updatedRecord] = await prisma.$transaction(async (tx) => {
    const transactionModel = (tx as any)[modelName];
    const recordToLog = await transactionModel.findUnique({ where: { id } });
    if (!recordToLog) {
      throw new Error(\`Record with ID \${id} not found in model \${modelName}.\`);
    }

    const dataToUpdate: any = {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: deletedBy,
    };
    
    if (recordToLog.hasOwnProperty('isPublished')) {
      dataToUpdate.isPublished = false;
    }

    const result = await transactionModel.update({
      where: { id },
      data: dataToUpdate,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 

    await tx.deletionLog.create({
      data: {
        userId: deletedBy,
        modelName: modelName,
        recordId: id,
        recordData: serializeForJSON(recordToLog),
        reason: reason,
        expiresAt: expiresAt,
      },
    });

    await tx.auditLog.create({
        data: {
            userId: deletedBy,
            action: 'soft-delete',
            modelName: modelName,
            recordId: id,
            oldData: serializeForJSON(recordToLog),
            newData: serializeForJSON(result),
        }
    })

    return [result];
  });

  return serializeForJSON(updatedRecord) as T;
}
`;

const chapterServiceContent = `
// src/services/chapterService.ts
import { prisma } from '@/lib/db';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { serializeForJSON } from '@/lib/serialization';
import { Chapter, Prisma } from '@prisma/client';
import { auditedSoftDelete, findByIdGeneric } from './baseService';

export interface ChapterCreateData {
  novelId: string;
  title: string;
  content: string;
  chapterNumber: number;
  displayOrder?: number;
  status?: string;
  isPublished?: boolean;
  isPremium?: boolean;
}

export type ChapterUpdateData = Partial<Omit<ChapterCreateData, 'novelId'>>;

export const chapterService = {
  /**
   * Finds a single chapter by its ID.
   * REFACTORED: Uses the generic findById function.
   */
  async findById(id: string, includeNovel = false): Promise<Chapter | null> {
    const include = includeNovel ? { novel: true } : undefined;
    // -- CORRECTED: Pass 'include' inside the options object.
    return findByIdGeneric<Chapter>('chapter', id, { include });
  },

  /**
   * Finds all chapters for a given novel with pagination.
   */
  async findByNovelId(novelId: string, options: { page?: number; limit?: number; includeUnpublished?: boolean }) {
    const { page = 1, limit = 100, includeUnpublished = false } = options;
    const where: Prisma.ChapterWhereInput = {
      novelId,
      isDeleted: false,
    };
    if (!includeUnpublished) {
      where.isPublished = true;
    }

    const [chapters, total] = await prisma.$transaction([
      prisma.chapter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.chapter.count({ where }),
    ]);

    return { chapters: serializeForJSON(chapters), total };
  },
  
  /**
   * Finds a specific chapter by its slug and number.
   */
  async findBySlugAndChapterNumber(novelSlug: string, chapterNumber: number): Promise<Chapter | null> {
    const chapter = await prisma.chapter.findFirst({
      where: {
        novel: { slug: novelSlug },
        chapterNumber: chapterNumber,
        isPublished: true,
        isDeleted: false
      },
      include: {
        novel: { select: { id: true, title: true, slug: true, authorId: true } },
      }
    });
    return serializeForJSON(chapter);
  },

  /**
   * Creates a new chapter. Retains custom logic.
   */
  async create(data: ChapterCreateData): Promise<Chapter> {
    const { novelId, title, content, chapterNumber, ...rest } = data;
    
    const wordCount = content.split(/\\s+/).length;
    const estimatedReadTime = calculateReadingTime(wordCount);
    
    const lastChapter = await prisma.chapter.findFirst({
      where: { novelId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    });
    
    const displayOrder = lastChapter?.displayOrder 
      ? Number(lastChapter.displayOrder) + 1 
      : data.displayOrder ?? chapterNumber;

    const newChapter = await prisma.chapter.create({
      data: {
        ...rest,
        novel: { connect: { id: novelId } },
        title,
        content,
        slug: generateSlug(title),
        chapterNumber: chapterNumber,
        displayOrder: displayOrder,
        wordCount,
        estimatedReadTime,
      }
    });
    return serializeForJSON(newChapter);
  },

  /**
   * Updates an existing chapter. Retains custom logic.
   */
  async update(id: string, data: ChapterUpdateData): Promise<Chapter> {
    const updateData: Prisma.ChapterUpdateInput = { ...data };
    
    if (data.title) {
      updateData.slug = generateSlug(data.title);
    }
    if (data.content) {
      updateData.wordCount = data.content.split(/\\s+/).length;
      updateData.estimatedReadTime = calculateReadingTime(updateData.wordCount);
    }
    if (data.chapterNumber !== undefined) {
      updateData.chapterNumber = data.chapterNumber;
    }
    if (data.displayOrder !== undefined) {
      updateData.displayOrder = data.displayOrder;
    }

    const updatedChapter = await prisma.chapter.update({ where: { id }, data: updateData });
    return serializeForJSON(updatedChapter);
  },

  /**
   * Soft-deletes a chapter and creates audit logs.
   * REFACTORED: Uses the generic auditedSoftDelete function.
   */
  async softDelete(id: string, deletedBy: string | null, reason?: string): Promise<Chapter> {
    return auditedSoftDelete<Chapter>('chapter', id, deletedBy, reason);
  },
};
`;

const editChapterPageContent = `
// src/app/(admin)/admin/novels/[id]/chapters/[chapterId]/edit/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ChapterForm } from '@/components/admin/forms/ChapterForm';
import { DeleteConfirmation, Button, LoadingSpinner } from '@/components/shared/ui';

// ++ Define an interface for the chapter data to ensure type safety
interface ChapterData {
    id: string;
    novelId: string;
    title: string;
    // Add other fields that are used by ChapterForm
    content: string;
    chapterNumber: number;
    status: string;
    isPublished: boolean;
}

export default function EditChapterPage() {
    const router = useRouter();
    const params = useParams();
    const novelId = params.id as string;
    const chapterId = params.chapterId as string;

    // ++ Initialize state with the correct type annotation
    const [chapter, setChapter] = useState<ChapterData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (chapterId) {
            setIsLoading(true); // Set loading while fetching
            fetch(\`/api/admin/chapters/\${chapterId}\`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setChapter(data.data);
                    else setError('Chapter not found.');
                })
                .finally(() => setIsLoading(false)); // Stop loading
        }
    }, [chapterId]);
    
    const handleSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(\`/api/admin/chapters/\${chapterId}\`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error((await response.json()).error);
            router.push(\`/admin/novels/\${novelId}/chapters\`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(\`/api/admin/chapters/\${chapterId}\`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).error);
            router.push(\`/admin/novels/\${novelId}/chapters\`);
        } catch (err: any) {
            setError(err.message);
            setShowDelete(false);
        } finally {
            setIsLoading(false);
        }
    };

    // ++ Improved loading and error states
    if (isLoading && !chapter) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
    if (error) return <div className="text-red-400 p-6">{error}</div>;
    if (!chapter) return null; // Or a "not found" message

    return (
        <div>
          <Link href={\`/admin/novels/\${novelId}/chapters\`} className="inline-flex items-center text-gray-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chapters
          </Link>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Edit Chapter</h1>
            <ChapterForm
                novelId={novelId}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
                initialData={chapter}
            />
             <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-lg font-medium text-red-400">Danger Zone</h3>
                <p className="text-sm text-gray-400 mb-4">Deleting a chapter will soft-delete it, making it invisible to the public but recoverable.</p>
                <Button variant="danger" onClick={() => setShowDelete(true)} disabled={isLoading}>
                    Delete Chapter
                </Button>
            </div>
          </div>
          {showDelete && (
              <DeleteConfirmation
                  title="Delete Chapter"
                  // -- Use optional chaining for safety
                  message={\`Are you sure you want to delete "\${chapter?.title}"?\`}
                  onConfirm={handleDelete}
                  onCancel={() => setShowDelete(false)}
                  confirmText="DELETE"
              />
          )}
        </div>
    );
}
`;

async function main() {
    console.log('🚀 Applying definitive fixes for TypeScript errors...');

    await writeFile('src/services/baseService.ts', baseServiceContent);
    await writeFile('src/services/chapterService.ts', chapterServiceContent);
    await writeFile('src/app/(admin)/admin/novels/[id]/chapters/[chapterId]/edit/page.tsx', editChapterPageContent);
    
    console.log('\n✅ Patches applied successfully.');
    console.log('Summary of fixes:');
    console.log('  - Corrected `baseService.ts` to use `findFirst` for flexible queries.');
    console.log('  - Fixed the `findByIdGeneric` call signature in `chapterService.ts`.');
    console.log('  - Patched `edit/page.tsx` to handle state typing correctly, resolving the `type never` error.');
    console.log('\nAll reported errors should now be resolved. You can proceed with the final part of Step 4.');
}

main().catch(console.error);