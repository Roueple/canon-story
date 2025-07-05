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

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Color</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Novels</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : genres.length > 0 ? (
              genres.map((genre) => (
                <tr key={genre.id}>
                  <td className="px-6 py-4">
                    <span className="h-6 w-6 rounded-full inline-block border border-border" style={{ backgroundColor: genre.color }}></span>
                  </td>
                  <td className="px-6 py-4 text-foreground font-medium">{genre.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{genre.slug}</td>
                  <td className="px-6 py-4 text-foreground">{genre._count.novels}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/content/genres/${genre.id}`}>
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No genres found.</td></tr>
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