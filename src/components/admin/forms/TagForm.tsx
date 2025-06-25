
// src/components/admin/forms/TagForm.tsx
'use client'
import { useState } from 'react';
import { Button, Input } from '@/components/shared/ui';
import { ColorPicker } from '@/components/shared/ui/ColorPicker';

interface TagFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  error?: string;
  initialData?: {
    name: string;
    type: string;
    color: string;
  };
}

const TAG_TYPES = [
  { value: 'theme', label: 'Theme' },
  { value: 'warning', label: 'Content Warning' },
  { value: 'demographic', label: 'Demographic' },
];

const colorOptions = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'
];

export function TagForm({ onSubmit, isLoading, error, initialData }: TagFormProps) {
  const defaultColor = initialData?.color || colorOptions[Math.floor(Math.random() * colorOptions.length)];

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'theme',
    color: defaultColor,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., System, LitRPG, Slow Burn"
          required
          className="bg-gray-700 border-gray-600 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
        <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
        <ColorPicker
          colors={colorOptions}
          value={formData.color}
          onChange={(color) => setFormData({ ...formData, color })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
        <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update Tag' : 'Create Tag'}
        </Button>
      </div>
    </form>
  );
}
