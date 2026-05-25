import { Inbox as InboxIcon } from 'lucide-react';

export default function InboxPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground text-sm mt-1.5">
          Live conversations across all your channels. Watch the AI handle them —
          step in when you need to.
        </p>
      </header>

      <div className="min-h-[500px] flex flex-col items-center justify-center gap-4 rounded-lg bg-muted/40 border p-10">
        <InboxIcon className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
        <div className="text-center max-w-md">
          <div className="text-sm font-medium mb-1">
            Inbox UI coming next
          </div>
          <p className="text-sm text-muted-foreground">
            The fully-functional inbox is in{' '}
            <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">preview.html</code>{' '}
            — with conversation list, M-Pesa receipts, and human handoff banner.
          </p>
        </div>
      </div>
    </>
  );
}
