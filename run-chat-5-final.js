import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to create or overwrite a file
async function createFile(filePath, content) {
    try {
        const fullPath = path.join(process.cwd(), filePath);
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, content.trim(), 'utf-8');
        console.log(`✅ Created/Updated: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error creating ${filePath}:`, error.message);
    }
}

// Helper function to update an existing file
async function updateFile(filePath, updateFunction) {
    try {
        const fullPath = path.join(process.cwd(), filePath);
        const originalContent = await fs.readFile(fullPath, 'utf-8');
        const newContent = updateFunction(originalContent);
        if (originalContent.trim() !== newContent.trim()) {
            await fs.writeFile(fullPath, newContent.trim(), 'utf-8');
            console.log(`✅ Updated: ${filePath}`);
        } else {
            console.log(`… No changes needed for: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
}


// --- Main implementation logic ---

async function main() {
    console.log('🚀 Starting FINAL Chat 5: Merged Media Management System Implementation...');
    console.log('========================================================================\n');

    // 1. Update package.json with necessary dependencies
    await updateFile('package.json', (content) => {
        const pkg = JSON.parse(content);
        pkg.dependencies['cloudinary'] = '^2.2.0';
        pkg.dependencies['react-dropzone'] = '^14.2.3';
        // We do NOT need multer or sharp for this architecture
        delete pkg.dependencies['multer'];
        delete pkg.dependencies['sharp'];
        return JSON.stringify(pkg, null, 2);
    });

    // 2. Add all required Cloudinary environment variables
    await updateFile('.env.local.example', (content) => {
        if (content.includes('CLOUDINARY_API_SECRET')) return content;
        return content + `

# Cloudinary (Media Management)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your_api_key
`;
    });

    // 3. Update Prisma Schema (if not already done)
    await updateFile('prisma/schema.prisma', (content) => {
        if (content.includes('model MediaFile')) {
            console.log('… Media models already exist in schema.prisma. Skipping.');
            return content;
        }

        const chapterMediaRelation = `chapterMedia     ChapterMedia[]`;
        const userMediaRelation = `uploadedMedia   MediaFile[]`;

        let newContent = content.replace(userMediaRelation, 'uploadedMedia   MediaFile[] @relation("UploaderToMedia")');

        const mediaModels = `
model MediaFile {
  id           String    @id @default(uuid())
  filename     String
  originalName String
  mimeType     String
  fileSize     BigInt
  width        Int?
  height       Int?
  url          String
  cdnUrl       String?
  thumbnailUrl String?
  altText      String?
  caption      String?
  usageCount   Int       @default(0)
  lastUsedAt   DateTime?
  isDeleted    Boolean   @default(false)
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  uploadedBy   String?
  uploader     User?     @relation("UploaderToMedia", fields: [uploadedBy], references: [id], onDelete: SetNull)
  chapterMedia ChapterMedia[]

  @@index([mimeType, isDeleted])
  @@index([uploadedBy])
}

model ChapterMedia {
  id          String   @id @default(uuid())
  chapterId   String
  mediaId     String
  position    Int
  createdAt   DateTime @default(now())
  chapter     Chapter  @relation(fields: [chapterId], references: [id], onDelete: Restrict)
  media       MediaFile @relation(fields: [mediaId], references: [id], onDelete: Restrict)
  @@unique([chapterId, mediaId, position])
}`;
        newContent = newContent.replace('model DocumentImport {', `${mediaModels}\n\nmodel DocumentImport {`);
        newContent = newContent.replace(chapterMediaRelation, `chapterMedia     ChapterMedia[]`);
        return newContent;
    });

    // 4. Create Media Service for the Direct Upload architecture
    await createFile('src/services/mediaService.ts', `
// src/services/mediaService.ts
import { prisma } from '@/lib/db';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export const mediaService = {
  getUploadSignature() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: 'canon-story' },
      process.env.CLOUDINARY_API_SECRET!
    );
    return { timestamp, signature };
  },

  async saveUploadedMedia(data: {
    publicId: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
    url: string;
    thumbnailUrl: string;
    uploadedBy: string;
  }) {
    return prisma.mediaFile.create({
      data: {
        filename: data.publicId,
        originalName: data.originalName,
        mimeType: data.mimeType,
        fileSize: BigInt(data.fileSize),
        width: data.width,
        height: data.height,
        url: data.url,
        cdnUrl: data.url,
        thumbnailUrl: data.thumbnailUrl,
        uploadedBy: data.uploadedBy,
      }
    });
  },

  async findAll(options: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 12, search } = options;
    const skip = (page - 1) * limit;

    const where = {
      isDeleted: false,
      ...(search && { originalName: { contains: search, mode: 'insensitive' } }),
    };

    const [mediaFiles, total] = await Promise.all([
      prisma.mediaFile.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.mediaFile.count({ where })
    ]);

    return { mediaFiles, total };
  },

  async delete(id: string) {
    const usageCount = await prisma.chapterMedia.count({ where: { mediaId: id } });
    if (usageCount > 0) throw new Error(\`Cannot delete: media is used in \${usageCount} chapter(s).\`);

    await prisma.mediaFile.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() }
    });
    return { message: 'Media file marked as deleted.' };
  }
};
    `);

    // 5. Create the simplified API endpoints for this architecture
    await createFile('src/app/api/admin/media/route.ts', `
// src/app/api/admin/media/route.ts
import { NextRequest } from 'next/server';
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, handleApiError, paginatedResponse, getPaginationParams } from '@/lib/api/utils';
import { mediaService } from '@/services/mediaService';

// GET: List all media files
export const GET = createAdminRoute(async (req) => {
    try {
        const { page, limit } = getPaginationParams(req.nextUrl.searchParams);
        const search = req.nextUrl.searchParams.get('search') || undefined;
        const { mediaFiles, total } = await mediaService.findAll({ page, limit, search });
        return paginatedResponse(mediaFiles, page, limit, total);
    } catch (error) {
        return handleApiError(error);
    }
});

// PUT: Save media metadata after a client-side upload
export const PUT = createAdminRoute(async (req, { user }) => {
    try {
        const body = await req.json();
        const mediaFile = await mediaService.saveUploadedMedia({ ...body, uploadedBy: user.id });
        return successResponse(mediaFile, 201);
    } catch (error) {
        return handleApiError(error);
    }
});
    `);
    
    await createFile('src/app/api/admin/media/signature/route.ts', `
// src/app/api/admin/media/signature/route.ts
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, handleApiError } from '@/lib/api/utils';
import { mediaService } from '@/services/mediaService';

// POST: Get a signature for direct client-side uploads
export const POST = createAdminRoute(async () => {
    try {
        const signatureData = mediaService.getUploadSignature();
        return successResponse(signatureData);
    } catch (error) {
        return handleApiError(error);
    }
});
    `);

    await createFile('src/app/api/admin/media/[id]/route.ts', `
// src/app/api/admin/media/[id]/route.ts
import { createAdminRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse, handleApiError } from '@/lib/api/utils';
import { mediaService } from '@/services/mediaService';

// DELETE: Soft-delete a media file
export const DELETE = createAdminRoute(async (req, { params }) => {
    try {
        const { id } = params;
        if (!id) return errorResponse('Media ID is required', 400);
        const result = await mediaService.delete(id);
        return successResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
});
    `);

    // 6. Create the advanced UI components
    await createFile('src/components/admin/media/ImageUploader.tsx', `
// src/components/admin/media/ImageUploader.tsx
'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, AlertCircle } from 'lucide-react'
import { ProgressBar } from '@/components/shared/ui'

interface ImageUploaderProps {
  onUploadSuccess: (media: any) => void
}

export function ImageUploader({ onUploadSuccess }: ImageUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setError(null);
    const filename = file.name;

    try {
      // 1. Get signature
      const sigResponse = await fetch('/api/admin/media/signature', { method: 'POST' });
      const { data: signatureData } = await sigResponse.json();

      // 2. Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
      formData.append('signature', signatureData.signature);
      formData.append('timestamp', signatureData.timestamp);
      formData.append('folder', 'canon-story');

      // 3. Upload directly to Cloudinary via XHR for progress tracking
      const xhr = new XMLHttpRequest();
      const cloudinaryUrl = \`https://api.cloudinary.com/v1_1/\${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload\`;
      xhr.open('POST', cloudinaryUrl);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [filename]: progress }));
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const cloudinaryResponse = JSON.parse(xhr.responseText);
          const thumbnailUrl = \`https://res.cloudinary.com/\${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/\${cloudinaryResponse.public_id}\`;
          
          // 4. Save metadata to our DB
          const dbResponse = await fetch('/api/admin/media', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              publicId: cloudinaryResponse.public_id,
              originalName: filename,
              mimeType: file.type,
              fileSize: file.size,
              width: cloudinaryResponse.width,
              height: cloudinaryResponse.height,
              url: cloudinaryResponse.secure_url,
              thumbnailUrl,
            })
          });
          const newMediaFile = await dbResponse.json();
          onUploadSuccess(newMediaFile.data);
          setUploadProgress(prev => { const copy = {...prev}; delete copy[filename]; return copy; });
        } else {
          setError(\`Upload failed for \${filename}. Please try again.\`);
        }
      };
      xhr.send(formData);
    } catch (err) {
      setError('Could not prepare upload. Check server connection.');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(uploadFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.png', '.gif', '.webp'] },
    multiple: true,
  });

  return (
    <div>
      <div {...getRootProps()} className={\`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors \${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-600 hover:border-primary'}\`}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center">
          <UploadCloud className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-semibold text-gray-300">Drag & drop images here, or click to select</p>
          <p className="text-sm text-gray-500">Multiple files are accepted.</p>
        </div>
      </div>
      {error && <p className="mt-2 text-error flex items-center gap-2"><AlertCircle size={16}/> {error}</p>}
      <div className="mt-4 space-y-2">
        {Object.entries(uploadProgress).map(([name, progress]) => (
          <div key={name}>
            <p className="text-sm text-gray-400 mb-1">{name}</p>
            <ProgressBar value={progress} showLabel />
          </div>
        ))}
      </div>
    </div>
  );
}
    `);

    await createFile('src/components/admin/media/MediaLibrary.tsx', `
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
}

export function MediaLibrary({ onSelect, selectable = false, refreshKey = 0 }: MediaLibraryProps) {
    const [media, setMedia] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

    const fetchMedia = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '12', ...(search && { search }) });
            const response = await fetch(\`/api/admin/media?\${params}\`);
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
    }, [page, search, refreshKey]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this image?')) return;
        try {
            const res = await fetch(\`/api/admin/media/\${id}\`, { method: 'DELETE' });
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
            <div key={file.id} onClick={() => handleSelect(file)} className={\`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all \${selectedMedia?.id === file.id ? 'border-primary' : 'border-gray-700 hover:border-gray-500'}\`}>
              <div className="aspect-square relative bg-gray-800">
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
                <Input type="search" placeholder="Search images..." value={search} onChange={handleSearchChange} className="bg-gray-700 border-gray-600"/>
                <Button variant={view === 'grid' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('grid')}><Grid className="h-4 w-4" /></Button>
                <Button variant={view === 'list' ? 'primary' : 'ghost'} size="sm" onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
            </div>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
            : media.length === 0 ? <div className="text-center py-12 text-gray-400">No images found.</div>
            : view === 'grid' ? memoizedMediaGrid : (
                <div className="space-y-2">
                    {/* List view can be implemented here if needed */}
                    <p className="text-center text-gray-400">List view not yet implemented. Please use Grid view.</p>
                </div>
            )}
            {total > 12 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <span className="text-sm text-gray-400">Page {page} of {Math.ceil(total / 12)}</span>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 12)}>Next</Button>
                </div>
            )}
        </div>
    );
}
    `);

    await createFile('src/components/admin/media/MediaModal.tsx', `
// src/components/admin/media/MediaModal.tsx
'use client'
import { useState } from 'react';
import { Modal } from '@/components/shared/ui';
import { ImageUploader } from './ImageUploader';
import { MediaLibrary } from './MediaLibrary';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: any) => void;
}

export function MediaModal({ isOpen, onClose, onSelect }: MediaModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = (media: any) => {
    // Automatically select the new image and close
    onSelect(media);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select or Upload Image" size="xl">
      <div className="space-y-4">
        <div className="flex gap-4 border-b border-gray-700">
          <button onClick={() => setActiveTab('library')} className={\`pb-2 px-1 text-sm font-medium \${activeTab === 'library' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}\`}>Media Library</button>
          <button onClick={() => setActiveTab('upload')} className={\`pb-2 px-1 text-sm font-medium \${activeTab === 'upload' ? 'text-white border-b-2 border-primary' : 'text-gray-400 hover:text-white'}\`}>Upload New</button>
        </div>
        <div className="min-h-[400px]">
          {activeTab === 'library' && <MediaLibrary onSelect={onSelect} selectable refreshKey={refreshKey}/>}
          {activeTab === 'upload' && <ImageUploader onUploadSuccess={() => { setRefreshKey(k => k + 1); setActiveTab('library'); }} />}
        </div>
      </div>
    </Modal>
  );
}
    `);

    // 7. Create/Update Admin Page & Editor
    await createFile('src/app/(admin)/admin/content/media/page.tsx', `
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
    `);

    await updateFile('src/components/admin/RichTextEditor.tsx', (content) => {
        let newContent = `
// src/components/admin/RichTextEditor.tsx
'use client'
import { useRef, useState, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Quote, Heading2, Heading3, Link, Image as ImageIcon, Upload } from 'lucide-react';
import { MediaModal } from '@/components/admin/media/MediaModal';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isMediaModalOpen, setMediaModalOpen] = useState(false);

  useEffect(() => {
      if (editorRef.current && value !== editorRef.current.innerHTML) {
          editorRef.current.innerHTML = value;
      }
  }, [value]);

  const handleCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      onChange(editorRef.current?.innerHTML || '');
  };

  const handleImageSelect = (media: any) => {
      const imgTag = \`<img src="\${media.url}" alt="\${media.altText || ''}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0;" />\`;
      handleCommand('insertHTML', imgTag);
      setMediaModalOpen(false);
  };

  const handleInput = () => onChange(editorRef.current?.innerHTML || '');

  return (
    <div className="border border-gray-600 rounded-md bg-gray-800 overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b border-gray-600 flex-wrap bg-gray-700">
          <button type="button" onClick={() => handleCommand('bold')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Bold"><Bold className="h-4 w-4" /></button>
          <button type="button" onClick={() => handleCommand('italic')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Italic"><Italic className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button type="button" onClick={() => handleCommand('formatBlock', 'h2')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Heading 2"><Heading2 className="h-4 w-4" /></button>
          <button type="button" onClick={() => handleCommand('formatBlock', 'h3')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Heading 3"><Heading3 className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button type="button" onClick={() => handleCommand('insertUnorderedList')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Bullet List"><List className="h-4 w-4" /></button>
          <button type="button" onClick={() => handleCommand('insertOrderedList')} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Numbered List"><ListOrdered className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-gray-600 mx-1" />
          <button type="button" onClick={() => setMediaModalOpen(true)} className="p-2 text-gray-300 hover:text-white hover:bg-gray-600 rounded" title="Insert Image"><ImageIcon className="h-4 w-4" /></button>
      </div>
      <div ref={editorRef} contentEditable onInput={handleInput} className="min-h-[400px] p-4 focus:outline-none prose prose-invert max-w-none" style={{caretColor: '#F3F4F6'}} suppressContentEditableWarning data-placeholder={placeholder} />
      <MediaModal isOpen={isMediaModalOpen} onClose={() => setMediaModalOpen(false)} onSelect={handleImageSelect} />
    </div>
  );
}`;
        return newContent;
    });

    console.log('\n✅ Chat 5 Final Implementation script finished.');
    console.log('====================================================\n');
    console.log('Next Steps:');
    console.log('1. Install dependencies:');
    console.log('   -> npm install');
    console.log('\n2. Add your Cloudinary credentials to `.env.local`.');
    console.log('\n3. Apply database schema changes:');
    console.log('   -> npx prisma db push');
    console.log('\n4. Restart your development server:');
    console.log('   -> npm run dev');
    console.log('\n5. Go to "/admin/content/media" to test the Media Library!');
    console.log('6. Go to a chapter editor and test the new "Insert Image" button.');
}

main().catch(console.error);