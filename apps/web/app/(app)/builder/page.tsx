import { Network } from 'lucide-react';

export default function BuilderPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Templates power your workflows. Click into one to inspect the visual
          graph.
        </p>
      </header>

      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4 rounded-lg bg-muted/40 border p-10">
        <Network className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
        <div className="text-center max-w-md">
          <div className="text-sm font-medium mb-1">
            Visual workflow builder
          </div>
          <p className="text-sm text-muted-foreground">
            React Flow-based drag-and-drop canvas. Coming in the next milestone —
            for now, every template is fully editable as JSON via the API.
          </p>
        </div>
      </div>
    </>
  );
}
