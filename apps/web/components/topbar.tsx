import { Search, Bell, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 px-7 py-3 border-b bg-background/85 backdrop-blur-md flex items-center gap-3">
      <button className="flex items-center gap-2 flex-1 max-w-[420px] px-3 py-1.5 rounded-md bg-muted border hover:border-foreground/20 transition-colors text-sm text-muted-foreground">
        <Search className="h-3.5 w-3.5" />
        <span>Search templates, contacts, workflows…</span>
        <kbd className="ml-auto font-mono text-[10px] px-1.5 py-0.5 bg-background border rounded text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Bell className="h-4 w-4" />
        </button>
        <Button variant="outline" size="sm">
          <Download className="h-3 w-3" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="h-3 w-3" strokeWidth={2.5} />
          New workflow
        </Button>
      </div>
    </header>
  );
}
