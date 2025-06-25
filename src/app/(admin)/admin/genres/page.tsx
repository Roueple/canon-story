// src/app/(admin)/admin/genres/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GenreManagementPage() {
  const [genres, setGenres] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280',
    iconUrl: ''
  });

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const res = await fetch('/api/admin/genres');
      const data = await res.json();
      setGenres(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch genres');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingGenre 
        ? `/api/admin/genres/${editingGenre.id}`
        : '/api/admin/genres';
      
      const res = await fetch(url, {
        method: editingGenre ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save genre');

      toast.success(editingGenre ? 'Genre updated' : 'Genre created');
      fetchGenres();
      resetForm();
    } catch (error) {
      toast.error('Failed to save genre');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this genre?')) return;

    try {
      const res = await fetch(`/api/admin/genres/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete genre');

      toast.success('Genre deleted');
      fetchGenres();
    } catch (error) {
      toast.error('Failed to delete genre');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#6B7280',
      iconUrl: ''
    });
    setEditingGenre(null);
    setIsCreateOpen(false);
  };

  const openEdit = (genre: any) => {
    setEditingGenre(genre);
    setFormData({
      name: genre.name,
      description: genre.description || '',
      color: genre.color,
      iconUrl: genre.iconUrl || ''
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Genre Management</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Genre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGenre ? 'Edit' : 'Create'} Genre</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-20"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="iconUrl">Icon URL (optional)</Label>
                <Input
                  id="iconUrl"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, iconUrl: e.target.value }))}
                  placeholder="https://example.com/icon.png"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGenre ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Novels</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {genres.map(genre => (
            <TableRow key={genre.id}>
              <TableCell className="font-medium">{genre.name}</TableCell>
              <TableCell className="max-w-xs truncate">{genre.description}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded" 
                    style={{ backgroundColor: genre.color }}
                  />
                  <span className="text-sm">{genre.color}</span>
                </div>
              </TableCell>
              <TableCell>{genre._count?.novels || 0}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs ${
                  genre.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {genre.isActive ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(genre)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(genre.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}