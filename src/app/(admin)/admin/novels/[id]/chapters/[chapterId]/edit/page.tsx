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
            fetch(`/api/admin/chapters/${chapterId}`)
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
            const response = await fetch(`/api/admin/chapters/${chapterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error((await response.json()).error);
            router.push(`/admin/novels/${novelId}/chapters`);
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
            const response = await fetch(`/api/admin/chapters/${chapterId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error((await response.json()).error);
            router.push(`/admin/novels/${novelId}/chapters`);
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
          <Link href={`/admin/novels/${novelId}/chapters`} className="inline-flex items-center text-gray-400 hover:text-white mb-6">
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
                  message={`Are you sure you want to delete "${chapter?.title}"?`}
                  onConfirm={handleDelete}
                  onCancel={() => setShowDelete(false)}
                  confirmText="DELETE"
              />
          )}
        </div>
    );
}