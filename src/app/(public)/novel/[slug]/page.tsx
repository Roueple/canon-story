
import { getNovelBySlug } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { BookOpen, Star, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

type NovelPageProps = {
  params: {
    slug: string;
  };
};

// Generate metadata for SEO
export async function generateMetadata({ params }: NovelPageProps) {
  const novel = await getNovelBySlug(params.slug);
  if (!novel) {
    return {
      title: 'Novel Not Found',
    };
  }
  return {
    title: novel.title,
    description: novel.description,
  };
}

export default async function NovelPage({ params }: NovelPageProps) {
  const novel = await getNovelBySlug(params.slug);

  if (!novel) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="grid md:grid-cols-12 gap-8">
        {/* Left Column: Cover Image and Meta */}
        <div className="md:col-span-3">
          <div className="sticky top-24">
            <Image
              src={novel.coverImage || '/placeholder-cover.jpg'}
              alt={`Cover for ${novel.title}`}
              width={300}
              height={450}
              className="rounded-lg shadow-lg w-full"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {novel.genres.map(({ genre }) => (
                <Badge key={genre.id} variant="secondary">{genre.name}</Badge>
              ))}
            </div>
             <div className="mt-2 flex flex-wrap gap-2">
                {novel.tags.map(({ tag }) => (
                    <Badge key={tag.id} variant="outline">#{tag.name}</Badge>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column: Novel Details */}
        <div className="md:col-span-9">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">{novel.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{novel.author.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>{novel.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Updated {new Date(novel.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <p className="text-lg leading-relaxed mb-6">{novel.description}</p>
          
          <Separator className="my-8" />

          {/* Chapters List */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Chapters</h2>
            <div className="border rounded-lg">
                {novel.chapters.length > 0 ? (
                    <ul className="divide-y">
                        {novel.chapters.map((chapter) => (
                            <li key={chapter.id}>
                                <Link href={`/novel/${novel.slug}/${chapter.chapterNumber}`}
                                      className="block p-4 hover:bg-muted/50 transition-colors">
                                    <h3 className="font-medium">Chapter {chapter.chapterNumber}: {chapter.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Published on {new Date(chapter.createdAt).toLocaleDateString()}
                                    </p>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-4 text-muted-foreground">No chapters have been published yet.</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
