// src/app/(admin)/admin/novels/[id]/page.tsx

import { EditNovelServerPage } from './_components/EditNovelServerPage';

interface PageProps {
  params: {
    id: string;
  };
}

export default function Page({ params }: PageProps) {
  return <EditNovelServerPage id={params.id} />;
}
