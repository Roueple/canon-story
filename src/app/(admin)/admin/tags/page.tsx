// src/app/(admin)/admin/tags/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Modal, Badge } from '@/components/shared/ui';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';

const TAG_TYPES = [
  { value: 'theme', label: 'Theme' },
  { value: 'warning', label: 'Content Warning' },
  { value: 'demographic', label: 'Demographic' }
];

interface TagData {
  id: string;
  name: string;
  type: string;
  color: string;
  isActive: boolean;
  usageCount: number;
  _count?: {
    novels: number;
  };
}

export default function TagManagementPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'theme',
    color: '#9CA3AF'
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/admin/tags');
      const data = await res.json();
      if (data.success) {
        setTags(data.data || []);
      } else {
        setError('Failed to fetch tags');
      }
    } catch (error) {
      setError('Failed to fetch tags');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const url = editingTag 
        ? `/api/admin/tags/${editingTag.id}`
        : '/api/admin/tags';
      
      const res = await fetch(url, {
        method: editingTag ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save tag');
      }

      fetchTags();
      resetForm();
      alert(editingTag ? 'Tag updated successfully' : 'Tag created successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to save tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete tag');
      }

      alert('Tag deleted successfully');
      fetchTags();
    } catch (error: any) {
      alert(error.message || 'Failed to delete tag');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'theme',
      color: '#9CA3AF'
    });
    setEditingTag(null);
    setIsCreateOpen(false);
    setError('');
  };

  const openEdit = (tag: TagData) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      type: tag.type,
      color: tag.color
    });
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tag Management</h1>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {/* Tag List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Color
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {tags.map(tag => (
              <tr key={tag.id} className="hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" style={{ color: tag.color }} />
                    <span className="font-medium">{tag.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  {tag.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded" 
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm">{tag.color}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tag.usageCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={tag.isActive ? 'success' : 'secondary'}>
                    {tag.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(tag)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={editingTag ? 'Edit Tag' : 'Create Tag'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md"
            >
              {TAG_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-20 h-10 bg-gray-700 border border-gray-600 rounded cursor-pointer"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                pattern="^#[0-9A-Fa-f]{6}$"
                placeholder="#9CA3AF"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading}>
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}