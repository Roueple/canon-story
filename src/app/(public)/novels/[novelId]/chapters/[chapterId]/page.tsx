// src/app/(public)/novels/[novelId]/chapters/[chapterId]/page.tsx
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Home, Book } from 'lucide-react';
import { Button } from '@/components/shared/ui/Button';
import { Breadcrumbs } from '@/components/shared/layout/Breadcrumbs';

async function getChapterData(novelId: string, chapterId: string) {
    const chapter = await prisma.chapter.findFirst({
        where: {
            id: chapterId,
            novelId: novelId,
            isPublished: true,
            isDeleted: false,
        },
        include: {
            novel: {
                select: { title: true, id: true }
            }
        }
    });

    if (!chapter) {
        notFound();
    }

    const [prevChapter, nextChapter] = await Promise.all([
        prisma.chapter.findFirst({
            where: {
                novelId: novelId,
                isPublished: true,
                isDeleted: false,
                chapterNumber: { lt: chapter.chapterNumber }
            },
            orderBy: { chapterNumber: 'desc' },
            select: { id: true }
        }),
        prisma.chapter.findFirst({
            where: {
                novelId: novelId,
                isPublished: true,
                isDeleted: false,
                chapterNumber: { gt: chapter.chapterNumber }
            },
            orderBy: { chapterNumber: 'asc' },
            select: { id: true }
        })
    ]);

    return { chapter, prevChapter, nextChapter };
}

export default async function ChapterReadingPage({ params }: { params: { novelId: string, chapterId: string } }) {
    const { chapter, prevChapter, nextChapter } = await getChapterData(params.novelId, params.chapterId);

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Novels', href: '/novels' },
        { label: chapter.novel.title, href: `/novels/${chapter.novel.id}` },
        { label: `Chapter ${String(chapter.chapterNumber)}` }
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
            <Breadcrumbs items={breadcrumbItems} className="mb-6" />

            <article>
                <header className="mb-8 text-center">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
                        {chapter.title}
                    </h1>
                    <p className="text-lg text-secondary">
                        Chapter {String(chapter.chapterNumber)}
                    </p>
                </header>

                <div
                    className="prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                />
            </article>

            {/* Navigation Buttons */}
            <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
                 {prevChapter ? (
                     <Button asChild variant="outline">
                        <Link href={`/novels/${params.novelId}/chapters/${prevChapter.id}`}>
                           <ArrowLeft className="h-4 w-4 mr-2" />
                           Previous
                        </Link>
                     </Button>
                ) : <div />}

                <Button asChild variant="ghost">
                    <Link href={`/novels/${params.novelId}`}>
                        <Book className="h-4 w-4 mr-2" />
                        All Chapters
                    </Link>
                </Button>

                {nextChapter ? (
                    <Button asChild variant="outline">
                       <Link href={`/novels/${params.novelId}/chapters/${nextChapter.id}`}>
                           Next
                           <ArrowRight className="h-4 w-4 ml-2" />
                       </Link>
                    </Button>
                ) : <div />}
            </div>
        </div>
    );
}