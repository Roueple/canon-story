import fs from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();

// --- UTILITY FUNCTIONS ---
async function writeFile(filePath, content) {
    const fullPath = path.join(projectRoot, filePath);
    try {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content.trim(), 'utf-8');
        console.log(`✅ Created/Updated ${filePath}`);
    } catch (error) {
        console.error(`❌ Error writing ${filePath}:`, error);
    }
}

async function deleteDirectory(dirPath) {
    const fullPath = path.join(projectRoot, dirPath);
    try {
        await fs.rm(fullPath, { recursive: true, force: true });
        console.log(`🗑️  Deleted incorrect directory: ${dirPath}`);
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore error if directory doesn't exist
            console.error(`❌ Error deleting directory ${dirPath}:`, error);
        } else {
            console.log(`-  Directory not found, skipping delete: ${dirPath}`);
        }
    }
}


async function main() {
    console.log('🚀 Fixing genre page routing conflict and re-implementing...');

    // 1. CLEANUP: Delete the incorrectly placed directory
    // This is the root of the problem.
    await deleteDirectory('src/app/admin');

    // 2. RE-CREATE PAGES IN THE CORRECT LOCATION
    // This ensures all genre pages are under the (admin) route group.
    
    // Main genres listing page (with bulk upload modal)
    await writeFile('src/app/(admin)/admin/content/genres/page.tsx', `
'use client'
// src/app/(admin)/admin/content/genres/page.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Upload, Loader2 } from 'lucide-react';
import { Button, Modal } from '@/components/shared/ui';
import { GenreBulkUpload } from '@/components/admin/forms/GenreBulkUpload';

interface Genre {
    id: string;
    name: string;
    slug: string;
    color: string;
    _count: {
        novels: number;
    }
}

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGenres = async () => {
    setIsLoading(true);
    try {
        const res = await fetch('/api/admin/content/genres');
        const data = await res.json();
        if (data.success) {
            setGenres(data.data);
        }
    } catch (error) {
        console.error("Failed to fetch genres", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleBulkUploadComplete = () => {
    fetchGenres(); // Refresh the list after bulk upload
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Genres</h1>
          <p className="text-gray-400 mt-1">Create, edit, and organize novel genres.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsModalOpen(true)}>
                <Upload className="h-4 w-4" />
                Bulk Upload
            </Button>
            <Link href="/admin/content/genres/create">
            <Button variant="primary" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Genre
            </Button>
            </Link>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Color</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Novels</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" /></td></tr>
            ) : genres.length > 0 ? (
              genres.map((genre) => (
                <tr key={genre.id}>
                  <td className="px-6 py-4">
                    <span className="h-6 w-6 rounded-full inline-block border border-gray-600" style={{ backgroundColor: genre.color }}></span>
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{genre.name}</td>
                  <td className="px-6 py-4 text-gray-400">{genre.slug}</td>
                  <td className="px-6 py-4 text-gray-300">{genre._count.novels}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={\`/admin/content/genres/\${genre.id}\`}>
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No genres found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Bulk Upload Genres">
        <GenreBulkUpload onComplete={handleBulkUploadComplete} />
      </Modal>
    </div>
  )
}
    `);
    
    // Create 'create' page
    await writeFile('src/app/(admin)/admin/content/genres/create/page.tsx', `
'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GenreForm } from '@/components/admin/forms/GenreForm';

export default function CreateGenrePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/content/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to create genre.');
      router.push('/admin/content/genres');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Link href="/admin/content/genres" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Genres
      </Link>
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Genre</h1>
        <GenreForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
    `);
    
    // Create 'edit' page
    await writeFile('src/app/(admin)/admin/content/genres/[id]/page.tsx', `
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
      fetch(\`/api/admin/content/genres/\${id}\`)
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
      const response = await fetch(\`/api/admin/content/genres/\${id}\`, {
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
      const response = await fetch(\`/api/admin/content/genres/\${id}\`, { method: 'DELETE' });
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
              message={\`Are you sure you want to delete the genre "\${genre.name}"? This action cannot be undone.\`}
              onConfirm={handleDelete}
              onCancel={() => setShowDelete(false)}
              confirmText="DELETE"
          />
      )}
    </div>
  );
}
    `);

    console.log('🎉 Routing conflict resolved and bulk upload feature is in place.');
    console.log('You can now restart your dev server. The build error should be gone.');

}

main();