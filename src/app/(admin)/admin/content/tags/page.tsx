// FILE: src/app/(admin)/admin/content/tags/page.tsx
// src/app/(admin)/admin/content/tags/page.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/shared/ui'; // FIX: Changed to use the barrel file import
import { API_PATHS } from '@/lib/api/paths';

interface Tag {
  id: string;
  name: string;
  type: string;
  color: string;
  usageCount: number;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_PATHS.admin.tags);
      const data = await res.json();
      if (data.success) {
        setTags(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch tags');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Tags</h1>
          <p className="text-gray-400 mt-1">Create, edit, and organize content tags.</p>
        </div>
        <Link href="/admin/content/tags/create">
          <Button variant="primary" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Tag
          </Button>
        </Link>
      </div>

      {error && <div className="text-red-400">{error}</div>}

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Tag</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usage</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
            ) : tags.length > 0 ? (
              tags.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2">
                      <Tag className="h-4 w-4" style={{ color: tag.color }} />
                      <span className="font-medium text-foreground">{tag.name}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground capitalize">{tag.type}</td>
                  <td className="px-6 py-4 text-foreground">{tag.usageCount}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/content/tags/${tag.id}`}>
                      <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No tags found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}