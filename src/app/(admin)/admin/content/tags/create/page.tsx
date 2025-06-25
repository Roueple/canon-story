
// src/app/(admin)/admin/content/tags/create/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TagForm } from '@/components/admin/forms/TagForm';

export default function CreateTagPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to create tag.');
      router.push('/admin/content/tags');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Link href="/admin/content/tags" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Tags
      </Link>
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Tag</h1>
        <TagForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
