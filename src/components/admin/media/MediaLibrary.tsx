// src/components/admin/media/MediaLibrary.tsx
'use client'
import { useState, useEffect, useMemo } from 'react';
import { Search, Grid, List, Check, Loader2, Trash2 } from 'lucide-react';
import { Button, Input, Badge } from '@/components/shared/ui';
import { formatNumber, formatDate } from '@/lib/utils';
import Image from 'next/image';

interface MediaFile {
    id: string;
    originalName: string;
    thumbnailUrl: string;
    url: string;
    fileSize: string; // Prisma BigInt is serialized as string
    width: number | null;
    height: number | null;
    usageCount: number;
    createdAt: string;
}

interface MediaLibraryProps {
    onSelect?: (media: MediaFile) => void;
    selectable?: boolean;
    refreshKey?: number;
    novelId?: string; // New: Optional novel ID to filter media
}

export function MediaLibrary({ onSelect, selectable = false, refreshKey = 0, novelId }: MediaLibraryProps) {
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
    const [categories, setCategories] = useState<string[]>([]); // New state for categories
    const [selectedCategory, setSelectedCategory] = useState<string>(''); // New state for selected category

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '12',
                ...(search && { search }),
                ...(novelId && { novelId }), // Add novelId to params
                ...(selectedCategory && { category: selectedCategory }), // Add selectedCategory to params
            });
            const response = await fetch(`/api/admin/media?${params}`);
            const result = await response.json();
            if (result.success) {
                setMedia(result.data);
                setTotal(result.pagination.total);
            }
        } catch (error) { console.error('Error fetching media:', error); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchMedia();
    }, [page, search, refreshKey, novelId, selectedCategory]); // Add novelId and selectedCategory to dependencies

    useEffect(() => {
        if (novelId) {
            const fetchCategories = async () => {
                try {
                    const response = await fetch(`/api/admin/media/categories?novelId=${novelId}`);
                    const result = await response.json();
                    if (result.success) {
                        setCategories(result.data);
                    }
                } catch (error) {
                    console.error('Error fetching categories:', error);
                }
            };
            fetchCategories();
        }
    }, [novelId]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this image?')) return;
        try {
            const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete');
            fetchMedia(); // Refresh library
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to delete image.');
        }
    };

    const handleSelect = (file: MediaFile) => {
        if (selectable && onSelect) {
            setSelectedMedia(file);
            onSelect(file);
        }
    };
    
    const memoizedMediaGrid = useMemo(() => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {media.map((file) => (
            <div key={file.id} onClick={() => handleSelect(file)} className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedMedia?.id === file.id ? 'border-primary' : 'border-border hover:border-primary'}`}>
              <div className="aspect-square relative bg-card">
                <Image src={file.thumbnailUrl} alt={file.originalName} fill className="object-cover" />
                {selectedMedia?.id === file.id && <div className="absolute inset-0 bg-primary/30 flex items-center justify-center"><Check className="h-8 w-8 text-white" /></div>}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="ghost" onClick={(e) => handleDelete(e, file.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
    ), [media, selectedMedia, onSelect]);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Input type="search" placeholder="Search images..." value={search} onChange={handleSearchChange} className="bg-card border-border"/>
                {novelId && categories.length > 0 && (
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="block w-auto rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                )}
                {selectedCategory && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedCategory('')}>Clear Filter</Button>
                )}
                <Button variant={view === 'grid' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('grid')}><Grid className="h-4 w-4" /></Button>
                <Button variant={view === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
            </div>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-foreground" /></div>
            : media.length === 0 ? <div className="text-center py-12 text-muted-foreground">No images found.</div>
            : view === 'grid' ? memoizedMediaGrid : (
                <div className="space-y-2">
                    {/* List view can be implemented here if needed */}
                    <p className="text-center text-muted-foreground">List view not yet implemented. Please use Grid view.</p>
                </div>
            )}
            {total > 12 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 12)}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 12)}>Next</Button>
                </div>
            )}
        </div>
    );
}