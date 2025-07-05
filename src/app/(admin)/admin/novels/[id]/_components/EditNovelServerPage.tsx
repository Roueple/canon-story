// src/app/(admin)/admin/novels/[id]/_components/EditNovelServerPage.tsx
import { notFound } from 'next/navigation';
import { serializeForJSON } from '@/lib/serialization';
import { novelService } from '@/services/novelService';
import { tagService } from '@/services/tagService';
import { genreService } from '@/services/genreService'; // Assuming genreService exists or will be created
import { EditNovelPageClient } from './EditNovelPageClient'; // This will be the renamed client component
import type { MultiSelectOption } from '@/components/shared/ui/MultiSelect';
import type { NovelForForm } from '@/components/admin/forms/NovelForm';

interface EditNovelServerPageProps {
  id: string;
}

type FetchedSelectData = {
  id: string;
  name: string;
};

export async function EditNovelServerPage({ id }: EditNovelServerPageProps) {
  const fetchedNovel = await novelService.findById(id, true);
  if (!fetchedNovel) {
    notFound();
  }

  const genres = await genreService.findAll({ isActive: true }); // Fetch genres using genreService
  const genreOptions: MultiSelectOption[] = serializeForJSON(genres).map((genre: FetchedSelectData) => ({
    value: genre.id,
    label: genre.name,
  }));

  const tags = await tagService.findAll({ isActive: true });
  const tagOptions: MultiSelectOption[] = tags.map((tag: FetchedSelectData) => ({
    value: tag.id,
    label: tag.name,
  }));

  return (
    <EditNovelPageClient
      novel={serializeForJSON(fetchedNovel) as NovelForForm}
      genreOptions={genreOptions}
      tagOptions={tagOptions}
    />
  );
}
