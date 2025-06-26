import { notFound } from 'next/navigation';
import { getChapterByNumber } from '@/lib/data';
import { ChapterReader } from '@/components/reader/ChapterReader';

export const dynamic = 'force-dynamic';

export default async function ChapterPage({
  params,
}: {
  params: { 
    slug: string;
    chapterNumber: string;
  };
}) {
  const chapter = await getChapterByNumber(params.slug, params.chapterNumber);

  if (!chapter) {
    notFound();
  }

  return <ChapterReader chapter={chapter} />;
}
