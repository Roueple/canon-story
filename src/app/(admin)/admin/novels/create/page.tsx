// src/app/admin/novels/create/page.tsx

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { tagService } from '@/services/tagService';

import { NovelForm } from '@/components/admin/forms/NovelForm';
import type { MultiSelectOption } from '@/components/shared/ui/MultiSelect';
import type { Metadata } from 'next';

// =================================================================================
// METADATA
// =================================================================================

export const metadata: Metadata = {
  title: 'Create New Novel | Admin',
  description: 'Create a new novel entry.',
};

// =================================================================================
// DATA FETCHING & TRANSFORMATION
//
// Best Practice: These functions are responsible for both fetching the raw data
// and transforming it into the shape required by the presentational components.
// =================================================================================

/**
 * A helper type to define the shape of the raw data we fetch for genres and tags.
 * Using a type alias makes the code cleaner and avoids repetition.
 */
type FetchedSelectData = {
  id: string;
  name: string;
};

/**
 * Fetches active genres and maps them to the MultiSelectOption format.
 */
async function getGenreOptions(): Promise<MultiSelectOption[]> {
  const genres: FetchedSelectData[] = await prisma.genre.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  });

  // The page is responsible for this transformation, not the form component.
  // FIX: We explicitly type `genre` to resolve the `noImplicitAny` error.
  return serializeForJSON(genres).map((genre: FetchedSelectData) => ({
    value: genre.id,
    label: genre.name,
  }));
}

/**
 * Fetches active tags and maps them to the MultiSelectOption format.
 */
async function getTagOptions(): Promise<MultiSelectOption[]> {
  // Assuming tagService returns an array of { id: string, name: string }
  const tags: FetchedSelectData[] = await tagService.findAll({ isActive: true });

  // FIX: We explicitly type `tag` to resolve the `noImplicitAny` error.
  return tags.map((tag: FetchedSelectData) => ({
    value: tag.id,
    label: tag.name,
  }));
}

// =================================================================================
// PAGE COMPONENT
// This is a "smart" component that orchestrates data fetching and layout.
// =================================================================================

export default async function CreateNovelPage() {
  // Fetch all necessary data concurrently. The data is already in the correct shape.
  const [genreOptions, tagOptions] = await Promise.all([
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
          Create New Novel
        </h1>

        {/* 
          Pass the perfectly shaped props to the "dumb" form component.
          The NovelForm component doesn't need to know anything about Prisma or your services.
        */}
        <NovelForm genres={genreOptions} tags={tagOptions} />
      </div>
    </div>
  );
}