'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Grid3X3, List, ChevronDown,
  FolderOpen, Folder, Archive, MoreHorizontal,
  Cpu, Workflow,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

interface ProjectFolder {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  type: 'quick-start' | 'workflow';
  folderId: string;
  updatedAt: Date;
}

const DEFAULT_FOLDERS: ProjectFolder[] = [
  { id: 'general', name: 'General' },
];

function QuickStartIllustration() {
  return (
    <div className="w-full max-w-[210px] rounded-lg bg-background shadow border p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded bg-[#10a37f] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="white" className="h-3.5 w-3.5">
            <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zM13.26 22.51a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.79.79 0 0 0 .4-.68V11.6l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.5 4.5z"/>
          </svg>
        </div>
        <span className="text-[11px] font-medium">AI Assistant</span>
      </div>
      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
        According to the documents provided, in Q4 2024 ACME Inc. had $500 Million in Gross Revenue.
      </p>
      <div className="flex gap-1">
        <div className="h-4 w-4 rounded bg-blue-500/20" />
        <div className="h-4 w-4 rounded bg-red-500/20" />
        <div className="h-4 w-4 rounded bg-green-500/20" />
      </div>
    </div>
  );
}

function WorkflowIllustration() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-11 w-11 rounded-xl bg-[#10a37f] flex items-center justify-center shadow-sm shrink-0">
        <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
          <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07z"/>
        </svg>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-px w-10 bg-muted-foreground/30" />
        <div className="h-px w-10 bg-muted-foreground/30" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-9 w-9 rounded-lg bg-[#0078d4] shadow-sm flex items-center justify-center text-white text-[11px] font-bold">S</div>
        <div className="h-9 w-9 rounded-lg bg-[#217346] shadow-sm flex items-center justify-center text-white text-[11px] font-bold">G</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [folders, setFolders] = useState<ProjectFolder[]>(DEFAULT_FOLDERS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedFolder, setSelectedFolder] = useState('general');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderSearch, setFolderSearch] = useState('');

  const displayName = user?.email?.split('@')[0] ?? 'My Workspace';
  const orgTitle = `${displayName.charAt(0).toUpperCase() + displayName.slice(1)}'s Workspace`;

  const filteredFolders = folders.filter(
    (f) => !folderSearch || f.name.toLowerCase().includes(folderSearch.toLowerCase()),
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.folderId === selectedFolder &&
      (!searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  function handleNewFolder() {
    const name = prompt('Folder name:');
    if (name?.trim()) {
      const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      setFolders((prev) => [...prev, { id, name: name.trim() }]);
    }
  }

  function handleCreateWorkflow() {
    router.push('/builder');
  }

  function handleQuickStart() {
    router.push('/templates');
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Folders sidebar */}
      <aside className="w-56 shrink-0 border-r flex flex-col bg-muted/20">
        <div className="p-3 border-b">
          <button
            onClick={handleNewFolder}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            New Folder
          </button>
        </div>

        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search folders"
              className="pl-7 h-7 text-xs bg-background"
              value={folderSearch}
              onChange={(e) => setFolderSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {filteredFolders.map((folder) => {
            const active = selectedFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left',
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {active ? (
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="truncate">{folder.name}</span>
              </button>
            );
          })}
        </div>

        <div className="p-2 border-t">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Archive className="h-3.5 w-3.5 shrink-0" />
            Archives
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 border-b flex items-center justify-between px-4 shrink-0 gap-3">
          <h1 className="text-sm font-medium truncate shrink-0">{orgTitle}</h1>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search projects"
                className="pl-8 h-7 text-xs w-44"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2.5 hidden md:flex">
              Last Viewed
              <ChevronDown className="h-3 w-3" />
            </Button>

            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2.5 hidden md:flex">
              All
              <ChevronDown className="h-3 w-3" />
            </Button>

            <div className="flex border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 transition-colors',
                  viewMode === 'grid' ? 'bg-muted' : 'hover:bg-muted/50',
                )}
                title="Grid view"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 border-l transition-colors',
                  viewMode === 'list' ? 'bg-muted' : 'hover:bg-muted/50',
                )}
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            <Button size="sm" className="h-7 text-xs gap-1.5 px-3" onClick={handleCreateWorkflow}>
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center pt-16 px-8">
              <h2 className="text-2xl font-semibold mb-8">Get Started</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                {/* Quick Start card */}
                <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="h-44 bg-muted/40 flex items-center justify-center p-6">
                    <QuickStartIllustration />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 w-fit mb-3">
                      <Cpu className="h-2.5 w-2.5" />
                      Basic
                    </span>
                    <h3 className="font-semibold mb-1.5">Quick Start</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Easily build an agent that reads from your company knowledge base
                    </p>
                    <Button variant="outline" size="sm" className="gap-1.5 w-fit" onClick={handleQuickStart}>
                      <Plus className="h-3.5 w-3.5" />
                      Create
                    </Button>
                  </div>
                </div>

                {/* Workflow Builder card */}
                <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="h-44 bg-muted/40 flex items-center justify-center p-6">
                    <WorkflowIllustration />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 w-fit mb-3">
                      <Workflow className="h-2.5 w-2.5" />
                      Powerful
                    </span>
                    <h3 className="font-semibold mb-1.5">Workflow Builder</h3>
                    <p className="text-sm text-muted-foreground mb-4 flex-1">
                      Craft an assistant from scratch with our powerful workflow builder
                    </p>
                    <Button size="sm" className="gap-1.5 w-fit" onClick={handleCreateWorkflow}>
                      <Plus className="h-3.5 w-3.5" />
                      Create
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Projects grid / list */
            <div className={cn(
              'p-6',
              viewMode === 'grid'
                ? 'grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]'
                : 'flex flex-col gap-2',
            )}>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={handleCreateWorkflow}
                  className="rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm">{project.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 -mr-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                      project.type === 'workflow'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700',
                    )}>
                      {project.type === 'workflow' ? 'Workflow' : 'Quick Start'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {project.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
