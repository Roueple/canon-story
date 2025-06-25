
// src/app/(admin)/admin/content/tags/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TagForm } from '@/components/admin/forms/TagForm';
import { LoadingSpinner, Button, DeleteConfirmation } from '@/components/shared/ui';

export default function EditTagPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [tag, setTag] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/admin/tags/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setTag(data.data);
          else setError('Tag not found.');
        });
    }
  }, [id]);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to update tag.');
      router.push('/admin/content/tags');
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
      const response = await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete tag.');
      router.push('/admin/content/tags');
    } catch (err: any) {
      setError(err.message);
      setShowDelete(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!tag && !error) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  if (error && !tag) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <Link href="/admin/content/tags" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tags
      </Link>
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Tag</h1>
        <TagForm onSubmit={handleSubmit} isLoading={isLoading} error={error} initialData={tag} />
        
        <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-medium text-red-400">Danger Zone</h3>
            <p className="text-sm text-gray-400 mb-4">Deleting a tag is permanent and will remove it from all novels.</p>
            <Button variant="danger" onClick={() => setShowDelete(true)} disabled={isLoading}>
                Delete Tag
            </Button>
        </div>
      </div>
      {showDelete && (
          <DeleteConfirmation
              title="Delete Tag"
              message={`Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`}
              onConfirm={handleDelete}
              onCancel={() => setShowDelete(false)}
              confirmText="DELETE"
          />
      )}
    </div>
  );
}
