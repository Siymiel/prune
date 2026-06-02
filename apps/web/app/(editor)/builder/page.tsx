import { Suspense } from 'react';
import { BuilderEditor } from '@/components/builder/builder-editor';

interface PageProps {
  searchParams: Promise<{ template?: string; workflowId?: string }>;
}

export default async function BuilderPage({ searchParams }: PageProps) {
  const { template: slug, workflowId } = await searchParams;
  return (
    <Suspense>
      <BuilderEditor templateSlug={slug ?? null} workflowId={workflowId ?? null} />
    </Suspense>
  );
}
