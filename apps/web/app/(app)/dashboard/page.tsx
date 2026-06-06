"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Grid3X3,
  List,
  ChevronDown,
  FolderOpen,
  Folder,
  Archive,
  MoreHorizontal,
  Cpu,
  Workflow,
  Loader2,
  FolderPlus,
  Clock,
  Pencil,
  Trash2,
  ExternalLink,
  Pin,
  Copy,
  LayoutTemplate,
  Lock,
  FolderInput,
  Upload,
  Download,
  SlidersHorizontal,
  Grid2X2,
  Rows3Icon,
  Settings2Icon,
  Boxes,
  Group,
  EllipsisVertical,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IntegrationLogo } from "@/components/templates/integration-logo";
import { getNodeDef, type CanvasNode } from "@/lib/editor-nodes";
import type { IntegrationId } from "@/lib/types";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { WorkflowOut } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { GoalDialog } from "@/components/goals/goal-dialog";

interface ProjectFolder {
  id: string;
  name: string;
}

function extractIntegrations(graph: Record<string, unknown>): IntegrationId[] {
  const nodes = (graph?.nodes as CanvasNode[] | undefined) ?? [];
  const ids = new Set<IntegrationId>();
  for (const node of nodes) {
    const def = getNodeDef(node.kind);
    if (def?.integrationId) ids.add(def.integrationId);
    if (node.kind === "ai-agent") ids.add("anthropic");
  }
  return [...ids];
}

function WorkflowCard({
  wf,
  viewMode,
  onClick,
  onRename,
  onDelete,
  onDuplicate,
}: {
  wf: WorkflowOut;
  viewMode: "grid" | "list";
  onClick: () => void;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const integrations = extractIntegrations(
    wf.graph as unknown as Record<string, unknown>,
  );
  const nodeCount = ((wf.graph?.nodes as CanvasNode[] | undefined) ?? [])
    .length;
  const updatedDate = new Date(wf.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0",
            viewMode === "grid" ? "h-6 w-6 -mr-1" : "h-7 w-7",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <EllipsisVertical
            className={viewMode === "grid" ? "h-3.5 w-3.5" : "h-4 w-4"}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 text-[13px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onRename}>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Pin className="h-3.5 w-3.5 text-muted-foreground" />
          Pin to top
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer"
          onClick={onDuplicate}
        >
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
          Save as Template
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          Lock
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <FolderInput className="h-3.5 w-3.5 text-muted-foreground" />
          Move to
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onClick}>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
          Export
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Archive className="h-3.5 w-3.5 text-muted-foreground" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (viewMode === "list") {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 cursor-pointer hover:bg-prune-lightGray transition-colors group"
      >
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Workflow className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-medium truncate">{wf.name}</p>
          {wf.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {wf.description}
            </p>
          )}
        </div>
        {integrations.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {integrations.slice(0, 4).map((id) => (
              <IntegrationLogo key={id} id={id} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {wf.is_published ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
              Live
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
              Draft
            </span>
          )}
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {updatedDate}
          </span>
          {menu}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-prune-borderGray bg-white cursor-pointer hover:bg-white hover:border-gray-400 transition-colors group flex flex-col shadow-lg"
    >
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Workflow className="h-[15px] w-[15px] text-muted-foreground" />
          </div>
          <h3 className="font-medium text-[15px] leading-snug truncate">
            {wf.name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {wf.is_published ? (
            <span className="text-[12px] px-2 py-1.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
              Live
            </span>
          ) : (
            <span className="text-[12px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
              Draft
            </span>
          )}
          {menu}
        </div>
      </div>

      <div className="h-px bg-border/70 mx-4" />

      <div className="px-4 py-4 flex flex-col flex-1 gap-3">
        {/* {wf.description || "No description"} */}
        <p
          className={cn(
            "text-sm leading-relaxed line-clamp-2",
            wf.description
              ? "text-muted-foreground"
              : "text-muted-foreground/40 italic",
          )}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>

        <div className="flex items-center gap-2 flex-wrap mt-3">
          {integrations.slice(0, 5).map((id) => (
            <IntegrationLogo key={id} id={id} />
          ))}
          {integrations.length > 5 && (
            <span className="text-[10px] text-muted-foreground">
              +{integrations.length - 5}
            </span>
          )}
          {nodeCount > 0 && (
            <span className="flex items-center gap-2 text-[12px] font-[460] text-muted-foreground">
              <Group className="h-4 w-4" />
              {nodeCount} Node{nodeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-auto pt-2">
          <span className="ml-auto text-[12px] text-muted-foreground font-medium flex items-center gap-0.5">
            <Clock className="h-4 w-4" />
            {updatedDate}
          </span>
        </div>
      </div>
    </div>
  );
}

function QuickStartIllustration() {
  return (
    <div className="w-full max-w-[210px] rounded-lg bg-background shadow border p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-6 w-6 rounded bg-[#10a37f] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="white" className="h-3.5 w-3.5">
            <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zM13.26 22.51a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.79.79 0 0 0 .4-.68V11.6l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.5 4.5z" />
          </svg>
        </div>
        <span className="text-[11px] font-medium">AI Assistant</span>
      </div>
      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
        According to the documents provided, in Q4 2024 ACME Inc. had $500
        Million in Gross Revenue.
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
          <path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07z" />
        </svg>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-px w-10 bg-muted-foreground/30" />
        <div className="h-px w-10 bg-muted-foreground/30" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-9 w-9 rounded-lg bg-[#0078d4] shadow-sm flex items-center justify-center text-white text-[11px] font-bold">
          S
        </div>
        <div className="h-9 w-9 rounded-lg bg-[#217346] shadow-sm flex items-center justify-center text-white text-[11px] font-bold">
          G
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [folders, setFolders] = useState<ProjectFolder[]>([
    { id: "general", name: "General" },
  ]);
  const [workflows, setWorkflows] = useState<WorkflowOut[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("general");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [folderSearch, setFolderSearch] = useState("");

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const [renameTarget, setRenameTarget] = useState<WorkflowOut | null>(null);
  const [renameName, setRenameName] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<WorkflowOut | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [goalOpen, setGoalOpen] = useState(false);

  const displayName = user?.email?.split("@")[0] ?? "My Workspace";
  const orgTitle = `${displayName.charAt(0).toUpperCase() + displayName.slice(1)}'s Workspace`;
  const activeFolder = folders.find((f) => f.id === selectedFolder);

  const loadWorkflows = useCallback(async () => {
    try {
      const list = await api.workflows.list();
      setWorkflows(list);
    } catch {
      // silently fail
    } finally {
      setLoadingWorkflows(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const filteredFolders = folders.filter(
    (f) =>
      !folderSearch ||
      f.name.toLowerCase().includes(folderSearch.toLowerCase()),
  );

  const filteredWorkflows = workflows.filter(
    (w) =>
      !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const id = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    setFolders((prev) => [...prev, { id, name }]);
    setNewFolderName("");
    setNewFolderOpen(false);
  }

  async function handleCreateWorkflow() {
    const name = newProjectName.trim() || "Untitled Workflow";
    if (creating) return;
    setCreating(true);
    setNewProjectOpen(false);
    setNewProjectName("");
    try {
      const wf = await api.workflows.create({ name });
      router.push(`/builder?workflowId=${wf.id}`);
    } catch {
      router.push("/builder");
    } finally {
      setCreating(false);
    }
  }

  async function handleDuplicateWorkflow(wf: WorkflowOut) {
    try {
      const dup = await api.workflows.create({ name: `${wf.name} (Copy)` });
      setWorkflows((prev) => [...prev, dup]);
    } catch {
      // silently fail
    }
  }

  async function handleRenameWorkflow() {
    if (!renameTarget || !renameName.trim()) return;
    try {
      const updated = await api.workflows.update(renameTarget.id, {
        name: renameName.trim(),
      });
      setWorkflows((prev) =>
        prev.map((w) => (w.id === updated.id ? updated : w)),
      );
    } catch {
      // silently fail
    } finally {
      setRenameTarget(null);
      setRenameName("");
    }
  }

  async function handleDeleteWorkflow() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.workflows.delete(deleteTarget.id);
      setWorkflows((prev) => prev.filter((w) => w.id !== deleteTarget.id));
    } catch {
      // silently fail
    } finally {
      setDeleteTarget(null);
      setDeleting(false);
    }
  }

  function handleQuickStart() {
    router.push("/templates");
  }
  function handleOpenWorkflow(id: string) {
    router.push(`/builder?workflowId=${id}`);
  }

  return (
    <TooltipProvider>
      <GoalDialog
        open={goalOpen}
        onOpenChange={setGoalOpen}
        onCreated={(workflowId) => {
          api.workflows.get(workflowId).then((wf) => {
            setWorkflows((prev) => [wf, ...prev]);
          }).catch(() => {});
        }}
      />

      {/* New Folder dialog */}
      <Dialog
        open={newFolderOpen}
        onOpenChange={(open) => {
          setNewFolderOpen(open);
          if (!open) setNewFolderName("");
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>
              Give your folder a name to organize your workflows.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 py-4">
            <Input
              autoFocus
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Project dialog */}
      <Dialog
        open={newProjectOpen}
        onOpenChange={(open) => {
          setNewProjectOpen(open);
          if (!open) setNewProjectName("");
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Name your project to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 py-4">
            <Input
              autoFocus
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateWorkflow();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNewProjectOpen(false);
                setNewProjectName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkflow}
              disabled={creating || !newProjectName.trim()}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameName("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Workflow</DialogTitle>
            <DialogDescription>
              Enter a new name for &ldquo;{renameTarget?.name}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="px-4 py-4">
            <Input
              autoFocus
              placeholder="Workflow name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameWorkflow();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameTarget(null);
                setRenameName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameWorkflow} disabled={!renameName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkflow}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page layout: sidebar + content column */}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Folder sidebar */}
        <aside className="w-64 shrink-0 border-r flex flex-col bg-muted/20">
         <div>
          <div className="py-3.5 border-b">
            <p className="font-medium text-foreground ml-4">Folders</p>
          </div>

           <div className="p-2.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setNewFolderOpen(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 border rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <FolderPlus className="h-5 w-5 shrink-0 text-foreground" />
                  <span className="font-medium text-[14px] text-foreground">New Folder</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>Create a new folder</TooltipContent>
            </Tooltip>
          </div>
         </div>

          <div className="p-2.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search folders"
                className="pl-8 py-4 rounded-xl text-[14px] font-medium bg-background"
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
                    "w-full flex items-center gap-2 px-2 py-2 rounded-xl text-[13px] transition-colors text-left",
                    active
                      ? "bg-prune-lightGray text-primary font-[450]"
                      : "text-muted-foreground hover:bg-prune-lightGray hover:text-foreground",
                  )}
                >
                  {active ? (
                    <FolderOpen className="h-4 w-4 shrink-0" />
                  ) : (
                    <Folder className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate text-[15px]">{folder.name}</span>
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                  <Archive className="h-3.5 w-3.5 shrink-0" />
                  Archives
                </button>
              </TooltipTrigger>
              <TooltipContent>View archived projects</TooltipContent>
            </Tooltip>
          </div>
        </aside>

        {/* Content column */}
        <div className="flex flex-col flex-1 overflow-hidden bg-[#FBFBFB]">
          {/* Title row */}
          <div className="flex items-center justify-between px-5 py-2.5 shrink-0 bg-white">
            <h1 className="text-[15px] font-semibold">
              {orgTitle}
              {activeFolder && (
                <>
                  <span className="text-muted-foreground font-normal mx-1.5">
                    /
                  </span>
                  <span className="text-muted-foreground font-normal">
                    {activeFolder.name}
                  </span>
                </>
              )}
            </h1>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export projects</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8 border-dashed"
                    onClick={() => setGoalOpen(true)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    From Goal
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Describe a goal — Prune AI builds the workflow</TooltipContent>
              </Tooltip>
              <Button
                size="sm"
                className="gap-1.5 h-8"
                onClick={() => {
                  setNewProjectName("");
                  setNewProjectOpen(true);
                }}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                New Project
              </Button>
            </div>
          </div>

          {/* Search + filters row */}
          <div className="flex items-center gap-2 px-5 pb-2.5 shrink-0 border-t bg-[#FBFBFB]">
            <div className="relative flex-1 mt-4">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search projects"
                className="pl-8 h-10 text-sm w-full rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-1 rounded-xl overflow-hidden shrink-0 mt-4 bg-prune-lightGray">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2.5 transition-colors rounded-xl",
                      viewMode === "grid"
                        ? "bg-white border border-prune-borderGray"
                        : "hover:bg-prune-lightGray bg-prune-lightGray text-prune-commonGray",
                    )}
                  >
                    <Grid2X2 className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-2.5 transition-colors rounded-xl",
                      viewMode === "list"
                        ? "bg-white border border-prune-borderGray"
                        : "hover:bg-prune-lightGray bg-prune-lightGray text-prune-commonGray",
                    )}
                  >
                    <Rows3Icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="py-5 rounded-xl font-sans font-[450] text-[15px] gap-4 px-3"
                  >
                    Last Viewed <ChevronDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sort projects</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="py-5 rounded-xl font-sans font-[450] text-[15px] gap-4 px-3"
                  >
                    All <ChevronDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filter by status</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="py-5 rounded-xl font-sans font-[450] text-[15px] gap-4 px-3"
                  >
                    <Settings2Icon className="h-4 w-4" />
                    Filters
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Advanced filters</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Workflow list / grid */}
          <div className="flex-1 overflow-y-auto">
            {loadingWorkflows ? (
              <div className="flex items-center justify-center pt-24">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="flex flex-col items-center pt-14 px-8">
                <h2 className="text-xl font-semibold mb-6">Get Started</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                    <div className="h-40 bg-muted/40 flex items-center justify-center p-6">
                      <QuickStartIllustration />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 w-fit mb-3">
                        <Cpu className="h-2.5 w-2.5" /> Basic
                      </span>
                      <h3 className="font-semibold mb-1.5">Quick Start</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">
                        Easily build an agent that reads from your company
                        knowledge base
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-fit"
                        onClick={handleQuickStart}
                      >
                        <Plus className="h-3.5 w-3.5" /> Create
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                    <div className="h-40 bg-muted/40 flex items-center justify-center p-6">
                      <WorkflowIllustration />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 w-fit mb-3">
                        <Workflow className="h-2.5 w-2.5" /> Powerful
                      </span>
                      <h3 className="font-semibold mb-1.5">Workflow Builder</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-1">
                        Craft an assistant from scratch with our powerful
                        workflow builder
                      </p>
                      <Button
                        size="sm"
                        className="gap-1.5 w-fit"
                        onClick={() => {
                          setNewProjectName("");
                          setNewProjectOpen(true);
                        }}
                        disabled={creating}
                      >
                        {creating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        Create
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "p-5 bg-[#FBFBFB]",
                  viewMode === "grid"
                    ? "grid gap-4 grid-cols-3"
                    : "flex flex-col gap-1.5",
                )}
              >
                {filteredWorkflows.map((wf) => (
                  <WorkflowCard
                    key={wf.id}
                    wf={wf}
                    viewMode={viewMode}
                    onClick={() => handleOpenWorkflow(wf.id)}
                    onRename={() => {
                      setRenameTarget(wf);
                      setRenameName(wf.name);
                    }}
                    onDelete={() => setDeleteTarget(wf)}
                    onDuplicate={() => handleDuplicateWorkflow(wf)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        {/* end content column */}
      </div>
      {/* end page layout */}
    </TooltipProvider>
  );
}
