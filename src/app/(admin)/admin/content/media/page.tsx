// src/app/(admin)/admin/content/media/page.tsx
'use client'
import { useState } from 'react';
import { MediaLibrary } from '@/components/admin/media/MediaLibrary';
import { ImageUploader } from '@/components/admin/media/ImageUploader';
import { Card, CardHeader, CardContent } from '@/components/shared/ui';

export default function MediaManagementPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Media Library</h1>
                <p className="text-gray-400 mt-2">Upload and manage all site images.</p>
            </div>
            <Card className="border-gray-700 bg-gray-800">
                <CardHeader className="border-gray-700"><h2 className="text-xl font-semibold text-white">Upload New Images</h2></CardHeader>
                <CardContent><ImageUploader onUploadSuccess={() => setRefreshKey(k => k + 1)} /></CardContent>
            </Card>
            <Card className="border-gray-700 bg-gray-800">
                <CardHeader className="border-gray-700"><h2 className="text-xl font-semibold text-white">Image Library</h2></CardHeader>
                <CardContent><MediaLibrary refreshKey={refreshKey} /></CardContent>
            </Card>
        </div>
    );
}