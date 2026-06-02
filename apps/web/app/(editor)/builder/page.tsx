import { Suspense } from 'react';
import { BuilderEditor } from '@/components/builder/builder-editor';

interface PageProps {
  searchParams: Promise<{ template?: string }>;
}

export default async function BuilderPage({ searchParams }: PageProps) {
  const { template: slug } = await searchParams;
  return (
    <Suspense>
      <BuilderEditor templateSlug={slug ?? null} />
    </Suspense>
  );
}
