import fs from 'fs/promises';
import path from 'path';

async function main() {
    console.log('🎨 Creating Content Management Hub page...');
    const pagePath = path.join(process.cwd(), 'src/app/(admin)/admin/content/page.tsx');
    const content = `
// src/app/(admin)/admin/content/page.tsx
import Link from 'next/link';
import { Card, CardHeader } from '@/components/shared/ui';
import { ImageIcon, FolderKanban, Tags } from 'lucide-react';

const contentSections = [
    {
        title: 'Media Library',
        description: 'Upload and manage all site images.',
        href: '/admin/content/media',
        icon: ImageIcon,
    },
    {
        title: 'Genres',
        description: 'Manage novel categories.',
        href: '/admin/content/genres',
        icon: FolderKanban,
    },
    {
        title: 'Tags',
        description: 'Manage content tags and warnings.',
        href: '/admin/content/tags',
        icon: Tags,
    },
];

export default function ContentHubPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Content Management</h1>
                <p className="text-gray-400 mt-1">
                    Manage your site's media, genres, tags, and other content assets.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contentSections.map((section) => (
                    <Link key={section.href} href={section.href} className="group">
                        <Card className="h-full bg-gray-800 border-gray-700 hover:border-primary transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <section.icon className="h-8 w-8 text-primary" />
                                    <div>
                                        <h2 className="text-xl font-semibold text-white group-hover:text-primary transition-colors">
                                            {section.title}
                                        </h2>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {section.description}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
`;

    try {
        const dir = path.dirname(pagePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(pagePath, content.trim(), 'utf-8');
        console.log('✅ Created /admin/content/page.tsx successfully.');
        console.log('You can now click the "Content" link in the admin sidebar.');
    } catch (error) {
        console.error(`❌ Error creating content hub page:`, error.message);
    }
}

main().catch(console.error);