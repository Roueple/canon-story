// src/app/(public)/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';
import { NovelCard } from '@/components/shared/NovelCard';
import { Button } from '@/components/shared/ui';
import { LoadingSpinner } from '@/components/shared/ui';
import { Search, Book, MessageSquare, Star, Shield, Tv, Users, CheckCircle, BookOpen } from 'lucide-react';
import { TrendingSlideshow } from '@/components/discovery/TrendingSlideshow';

const novelCardInclude = {
  author: { select: { displayName: true, username: true } },
  genres: { include: { genre: true } },
  tags: { include: { tag: true } },
  _count: { select: { chapters: { where: { isPublished: true, isDeleted: false } } } }
};

async function getStats() {
  try {
    const [novels, users] = await Promise.all([
      prisma.novel.count({ where: { isPublished: true, isDeleted: false } }),
      prisma.user.count({ where: { isDeleted: false } })
    ]);
    return { novels, users };
  } catch {
    return { novels: 0, users: 0 };
  }
}

async function getTrendingNovels(limit = 6) {
  const novels = await prisma.novel.findMany({
    where: { isPublished: true, isDeleted: false },
    include: novelCardInclude,
    orderBy: { totalViews: 'desc' },
    take: limit
  });
  return serializeForJSON(novels);
}

// --- CORRECTED FUNCTION ---
async function getHottestInFantasy(limit = 6) {
  const fantasyGenre = await prisma.genre.findUnique({
    where: { slug: 'fantasy' },
    select: { id: true }
  });
  
  // If the 'fantasy' genre doesn't exist, return an empty array instead of crashing.
  if (!fantasyGenre) {
    return [];
  }

  const novels = await prisma.novel.findMany({
    where: {
      isPublished: true,
      isDeleted: false,
      genres: { some: { genreId: fantasyGenre.id } }
    },
    include: novelCardInclude,
    orderBy: { totalViews: 'desc' },
    take: limit
  });
  return serializeForJSON(novels);
}

async function getNewlyAdded(limit = 6) {
  const novels = await prisma.novel.findMany({
    where: { isPublished: true, isDeleted: false },
    include: novelCardInclude,
    orderBy: { publishedAt: 'desc' },
    take: limit
  });
  return serializeForJSON(novels);
}

async function SlideshowSection() {
  const trendingNovels = await getTrendingNovels(10); // Fetch 10 novels for the slideshow
  return (
    <section className="relative mb-8 sm:mb-12">
      <div className="container mx-auto px-4 pt-8">
        <TrendingSlideshow novels={trendingNovels} />
      </div>
    </section>
  );
}

async function BookShowcaseSection() {
  const [fantasy, newlyAdded] = await Promise.all([
    getHottestInFantasy(6),
    getNewlyAdded(6)
  ]);

  const showcases = [
    { title: "Hottest in Fantasy", novels: fantasy },
    { title: "Newly Added", novels: newlyAdded }
  ];

  return (
    <section className="py-16 sm:py-24 bg-muted/50">
      <div className="container mx-auto px-4 space-y-12">
        {showcases.map(showcase => (
          showcase.novels.length > 0 && (
            <div key={showcase.title}>
              <h2 className="text-3xl font-bold text-foreground mb-6">{showcase.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {showcase.novels.map((novel: any) => <NovelCard key={novel.id} novel={novel} />)}
              </div>
            </div>
          )
        ))}
        <div className="text-center pt-8">
          <Link href="/genres">
            <Button variant="outline" size="lg">Browse All Genres</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    { icon: Search, title: "Discover", description: "Find your next obsession. Explore our vast library using powerful search, curated collections, and personalized recommendations." },
    { icon: Book, title: "Read", description: "A superior reading experience. Immerse yourself with a customizable reader, including dark mode, font adjustments, and progress tracking on any device." },
    { icon: MessageSquare, title: "Engage", description: "Join the community. Leave comments, review your favorite novels, and connect directly with authors and fellow fans." }
  ];
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-12 text-center">
          {features.map(feature => (
            <div key={feature.title}>
              <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { quote: "I used to struggle to find good LitRPG, but this site is a goldmine! The community is amazing.", name: "Alex R.", role: "LitRPG Fan" },
    { quote: "The reader interface is so clean. I can finally read on my phone without annoying pop-ups. I'm hooked!", name: "Maria S.", role: "Romance Reader" }
  ];
  return (
    <section className="py-16 sm:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">What Our Readers Are Saying</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {testimonials.map(t => (
            <figure key={t.name} className="bg-card p-6 rounded-lg shadow-sm">
              <blockquote className="text-secondary italic">“{t.quote}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div>
                <div>
                  <div className="font-semibold text-card-foreground">{t.name}</div>
                  <div className="text-sm text-secondary">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUsSection() {
  const differentiators = [
    { icon: Book, title: "Vast & Curated Library", description: "From indie gems to exclusive originals, every story is worth your time." },
    { icon: Shield, title: "Support The Creators", description: "Your reading and premium subscription directly supports the authors who write the stories you love." },
    { icon: Tv, title: "Uninterrupted Reading", description: "Enjoy an ad-free experience and focus on what matters: the story." },
    { icon: Star, title: "Read Anywhere, Anytime", description: "Sync your progress across web, tablet, and mobile. Never lose your place." }
  ];
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">More Than Just a Library</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {differentiators.map(d => (
            <div key={d.title}>
              <d.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{d.title}</h3>
              <p className="text-sm text-secondary">{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section className="py-16 sm:py-24 bg-muted/50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Read Your Way</h2>
        <p className="text-lg text-secondary max-w-2xl mx-auto mb-12">Enjoy a selection of free novels, or unlock our entire library with Premium.</p>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-card p-8 rounded-lg border border-border text-left">
            <h3 className="text-2xl font-semibold text-card-foreground mb-4">Free Reader</h3>
            <ul className="space-y-3 text-secondary mb-8">
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /> Access to a selection of free-to-read novels</li>
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /> Community Access</li>
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /> Basic Reading Features</li>
            </ul>
            <Link href="/browse" className="w-full"><Button variant="outline" className="w-full">Start Reading Now</Button></Link>
          </div>
          <div className="bg-card p-8 rounded-lg border-2 border-primary text-left relative">
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">Best Value</div>
            <h3 className="text-2xl font-semibold text-card-foreground mb-4">Premium</h3>
            <ul className="space-y-3 text-secondary mb-8">
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /> <span className="font-semibold text-card-foreground">Everything in Free, plus:</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /> Unlimited access to our entire library</li>
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /> Ad-Free Reading Experience</li>
              <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-success" /> Early access to new chapters</li>
            </ul>
            <Link href="/subscription/plans" className="w-full"><Button variant="primary" className="w-full">Go Premium</Button></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-foreground mb-4">Ready to Begin Your Next Adventure?</h2>
        <p className="text-lg text-secondary max-w-xl mx-auto mb-8">Thousands of worlds are waiting to be discovered.</p>
        <Link href="/browse">
          <Button size="lg" className="gap-2">
            <BookOpen className="h-5 w-5" />
            Start Reading for Free
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="bg-background text-foreground">
      <Suspense fallback={
        <div className="h-[400px] md:h-[500px] w-full flex items-center justify-center bg-muted">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <SlideshowSection />
      </Suspense>
      <Suspense fallback={
        <div className="py-24 flex justify-center"><LoadingSpinner size="lg" /></div>
      }>
        <BookShowcaseSection />
      </Suspense>
      <FeaturesSection />
      <TestimonialsSection />
      <WhyUsSection />
      <PricingSection />
      <FinalCtaSection />
    </div>
  );
}