'use client'
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GenreForm } from '@/components/admin/forms/GenreForm';
import { LoadingSpinner, Button } from '@/components/shared/ui';
import { DeleteConfirmation } from '@/components/shared/ui/DeleteConfirmation';

export default function EditGenrePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [genre, setGenre] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/admin/content/genres/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setGenre(data.data);
          else setError('Genre not found.');
        });
    }
  }, [id]);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/content/genres/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to update genre.');
      router.push('/admin/content/genres');
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
      const response = await fetch(`/api/admin/content/genres/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to delete genre.');
      router.push('/admin/content/genres');
    } catch (err: any) {
      setError(err.message);
      setShowDelete(false); // Hide modal but show error
    } finally {
      setIsLoading(false);
    }
  }

  if (!genre && !error) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;
  if (error && !genre) return <div className="text-red-400">{error}</div>;

  return (
    <div>
      <Link href="/admin/content/genres" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Genres
      </Link>
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Edit Genre</h1>
        <GenreForm onSubmit={handleSubmit} isLoading={isLoading} error={error} initialData={genre} />
        
        <div className="mt-8 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-medium text-red-400">Danger Zone</h3>
            <p className="text-sm text-gray-400 mb-4">Deleting a genre is permanent and can only be done if no novels are assigned to it.</p>
            <Button variant="danger" onClick={() => setShowDelete(true)} disabled={isLoading}>
                Delete Genre
            </Button>
        </div>
      </div>
      {showDelete && (
          <DeleteConfirmation
              title="Delete Genre"
              message={`Are you sure you want to delete the genre "${genre.name}"? This action cannot be undone.`}
              onConfirm={handleDelete}
              onCancel={() => setShowDelete(false)}
              confirmText="DELETE"
          />
      )}
    </div>
  );
}