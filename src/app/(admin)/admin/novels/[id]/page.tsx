// src/app/admin/novels/[id]/page.tsx

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { novelService } from '@/services/novelService';
import { tagService } from '@/services/tagService';

import { NovelForm, type NovelForForm } from '@/components/admin/forms/NovelForm';
import type { MultiSelectOption } from '@/components/shared/ui/MultiSelect';
import type { Metadata } from 'next';

// =================================================================================
// TYPE DEFINITIONS
// =================================================================================

interface PageProps {
  params: { id: string };
}

type FetchedSelectData = {
  id: string;
  name: string;
};

// =================================================================================
// METADATA
// Best Practice: Use generateMetadata for dynamic pages to provide unique titles.
// =================================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Fetch only the title to keep this request lightweight.
  const novel = await prisma.novel.findUnique({
    where: { id: params.id, isDeleted: false },
    select: { title: true },
  });

  const title = novel ? `Edit "${novel.title}"` : 'Novel Not Found';
  return {
    title: `${title} | Admin`,
  };
}

// =================================================================================
// DATA FETCHING & TRANSFORMATION
// =================================================================================

/**
 * Fetches the full novel data required for the form.
 * The return type must match the `NovelForForm` type expected by the component.
 */
async function getNovel(id: string): Promise<NovelForForm> {
  // Assuming novelService.findById returns data that matches NovelForForm.
  // The `true` parameter likely indicates including relations like genres and tags.
  const novelData = await novelService.findById(id, true);

  if (!novelData) {
    notFound(); // Triggers the 404 page
  }
  
  // The service should ideally return a type-safe object. If not, you might
  // need to cast or validate it here. We assume it's correct.
  return novelData as NovelForForm;
}

/**
 * Fetches active genres and maps them to the MultiSelectOption format.
 */
async function getGenreOptions(): Promise<MultiSelectOption[]> {
  const genres: FetchedSelectData[] = await prisma.genre.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  });

  return serializeForJSON(genres).map((genre: FetchedSelectData) => ({
    value: genre.id,
    label: genre.name,
  }));
}

/**
 * Fetches active tags and maps them to the MultiSelectOption format.
 */
async function getTagOptions(): Promise<MultiSelectOption[]> {
  const tags: FetchedSelectData[] = await tagService.findAll({ isActive: true });

  return tags.map((tag: FetchedSelectData) => ({
    value: tag.id,
    label: tag.name,
  }));
}

// =================================================================================
// PAGE COMPONENT
// =================================================================================

export default async function EditNovelPage({ params }: PageProps) {
  // Fetch all necessary data concurrently.
  const [novel, genreOptions, tagOptions] = await Promise.all([
    getNovel(params.id),
    getGenreOptions(),
    getTagOptions(),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <Link
        href="/admin/novels"
        className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Novels
      </Link>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">
          Edit Novel
        </h1>

        {/* 
          Pass the novel object and the pre-formatted options to the form.
          The NovelForm component is now being used for both "create" and "edit"
          scenarios without any change to its own code.
        */}
        <NovelForm novel={novel} genres={genreOptions} tags={tagOptions} />
      </div>
    </div>
  );
}