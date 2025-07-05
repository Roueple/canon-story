import { notFound } from 'next/navigation';
import { novelService } from '@/services/novelService';
import type { Metadata } from 'next';

interface LayoutProps {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const novel = await novelService.findById(params.id, false);
  const title = novel ? `Edit "${novel.title}"` : 'Novel Not Found';
  return {
    title: `${title} | Admin`,
  };
}

export default async function NovelIdLayout({ params, children }: LayoutProps) {
  if (typeof params.id !== 'string') {
    notFound();
  }

  return (
    <>
      {children}
    </>
  );
}
