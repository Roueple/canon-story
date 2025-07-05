// src/app/(admin)/admin/novels/[id]/_components/EditNovelPageClient.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NovelForm, type NovelForForm } from '@/components/admin/forms/NovelForm';
import { MediaLibrary } from '@/components/admin/media/MediaLibrary';
import { ImageUploader } from '@/components/admin/media/ImageUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/Card';
import type { MultiSelectOption } from '@/components/shared/ui/MultiSelect';

interface EditNovelPageClientProps {
  novel: NovelForForm;
  genreOptions: MultiSelectOption[];
  tagOptions: MultiSelectOption[];
}

export function EditNovelPageClient({ novel, genreOptions, tagOptions }: EditNovelPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

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

        <NovelForm novel={novel} genres={genreOptions} tags={tagOptions} />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Novel Media Library</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader novelId={novel.id} onUploadSuccess={handleUploadSuccess} />
            <div className="mt-8">
              <MediaLibrary novelId={novel.id} refreshKey={refreshKey} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}