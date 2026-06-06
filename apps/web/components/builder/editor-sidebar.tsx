'use client';

import { useState, useRef } from 'react';
import {
  Search, ChevronDown, ChevronRight,
  Download, Upload, Cpu, LayoutGrid, GitBranch, Settings2,
  MenuIcon, Hop, PanelLeftClose, PanelRightClose,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  NODE_DEFS, SIDEBAR_CATEGORIES, getNodesByCategory,
  type NodeDef, type NodeCategory,
} from '@/lib/editor-nodes';
import { renderIntegrationIcon } from '@/components/templates/integration-logo';

const CAT_ICONS: Record<NodeCategory, React.ComponentType<{ className?: string }>> = {
  inputs:  Download,
  outputs: Upload,
  core:    Cpu,
  apps:    LayoutGrid,
  logic:   GitBranch,
  utils:   Settings2,
};

interface TooltipState {
  def: NodeDef;
  top: number;
}

function NodeTooltip({ tooltip, left }: { tooltip: TooltipState; left: number }) {
  return (
    <div
      className="fixed z-[200] bg-card border rounded-lg shadow-xl p-3 w-54 font-sans font-[450] pointer-events-none"
      style={{ top: tooltip.top - 32, left: left + 2 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[16px] font-semibold">{tooltip.def.label}</span>
      </div>
      <p className="text-[14px] text-muted-foreground leading-relaxed">{tooltip.def.description}</p>
    </div>
  );
}

function NodeItem({
  def,
  onHover,
  onLeave,
  iconColor = '#1D1D1D',
}: {
  def: NodeDef;
  onHover: (def: NodeDef, e: React.MouseEvent) => void;
  onLeave: () => void;
  iconColor?: string;
}) {
  const Icon = def.icon;

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', def.kind);
    e.dataTransfer.effectAllowed = 'copy';
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={(e) => onHover(def, e)}
      onMouseLeave={onLeave}
      className="flex items-center gap-2.5 mx-2 mb-1 px-2 py-0.5 rounded-md shadow-sm border bg-background hover:bg-prune-lightGray cursor-grab active:cursor-grabbing select-none transition-colors"
    >
      <div className="h-6 w-6 rounded-md flex items-center shrink-0 font-[450]" style={{ color: iconColor }}>
        {def.integrationId
          ? renderIntegrationIcon(def.integrationId, 13, iconColor)
          : <Icon className={cn('h-4 w-4', def.iconClass)} style={{ color: iconColor }} />}
      </div>
      <span className="text-[15px] font-[450] flex-1 truncate -ml-2">{def.label}</span>
      <MenuIcon className="h-4 w-4 shrink-0 text-prune-midGray" />
    </div>
  );
}

function CategorySection({
  cat,
  expanded,
  onHover,
  onLeave,
}: {
  cat: typeof SIDEBAR_CATEGORIES[0];
  expanded: boolean;
  onHover: (def: NodeDef, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const nodes = getNodesByCategory(cat.id as NodeCategory);
  const CatIcon = CAT_ICONS[cat.id as NodeCategory];

  return (
    <div className="my-0.5">
      <button
        onClick={() => expanded && setOpen(o => !o)}
        className="w-full h-9 flex items-center gap-2.5 px-2 rounded-md hover:bg-prune-lightGray transition-colors"
      >
        <CatIcon className="h-5 w-5 text-foreground shrink-0" />
        {expanded && (
          <>
            <span className="text-[15px] font-[450] text-foreground flex-1 text-left">
              {cat.label}
            </span>
            {open
              ? <ChevronDown className="h-4 w-4 text-foreground/60 shrink-0" />
              : <ChevronRight className="h-4 w-4 text-foreground/60 shrink-0" />}
          </>
        )}
      </button>
      {expanded && open && (
        <div className="pb-2 pt-1 ml-4">
          {nodes.map(def => (
            <NodeItem key={def.kind} def={def} onHover={onHover} onLeave={onLeave} />
          ))}
        </div>
      )}
    </div>
  );
}

interface EditorSidebarProps {
  pinned?: boolean;
  onTogglePin?: () => void;
}

export function EditorSidebar({ pinned = false, onTogglePin }: EditorSidebarProps) {
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // When pinned, sidebar is always expanded; hover has no effect
  const expanded = pinned || hoverExpanded;
  const sidebarWidthPx = expanded ? 270 : 52;

  function handleMouseEnter() {
    if (pinned) return;
    clearTimeout(collapseTimer.current);
    setHoverExpanded(true);
  }

  function handleMouseLeave() {
    if (pinned) return;
    setTooltip(null);
    collapseTimer.current = setTimeout(() => setHoverExpanded(false), 180);
  }

  function handleItemHover(def: NodeDef, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ def, top: rect.top + rect.height / 2 });
  }

  function clearTooltip() {
    setTooltip(null);
  }

  const filtered = query.trim()
    ? NODE_DEFS.filter(
        d =>
          d.label.toLowerCase().includes(query.toLowerCase()) ||
          d.description.toLowerCase().includes(query.toLowerCase()),
      )
    : null;

  return (
    <>
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ width: sidebarWidthPx }}
        className={cn(
          'top-0 bottom-0 border-r bg-background flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out z-50 font-sans',
          pinned ? 'relative shrink-0 h-full' : 'absolute left-0',
        )}
      >
        {/* Header: logo + brand + pin toggle */}
        <div className="h-12 border-b shrink-0 flex items-center gap-2 px-2">
          <div className="h-7 w-7 shrink-0 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
            <Hop className="h-4 w-4" />
          </div>
          {expanded && (
            <>
              <span className="flex-1 text-[17px] font-[450] tracking-tight text-foreground truncate">
                PruneAI
              </span>
              <button
                onClick={onTogglePin}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title={pinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                {pinned
                  ? <PanelLeftClose className="h-4 w-4" />
                  : <PanelRightClose className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>

        {/* Search */}
        <div className="px-2 pt-3 pb-2.5 border-b shrink-0">
          <div className={cn(
            'h-8 flex items-center transition-all duration-200',
            expanded ? 'px-2.5 gap-2' : 'justify-center',
          )}>
            <Search className="h-4 w-4 text-muted-foreground/50 shrink-0" />
            <input
              autoFocus={false}
              tabIndex={expanded ? 0 : -1}
              className={cn(
                'text-[14px] rounded-lg px-2 py-1 bg-prune-lightGray outline-none placeholder:text-muted-foreground/70 transition-all duration-200',
                expanded ? 'w-full' : 'w-0 p-0 pointer-events-none',
              )}
              placeholder="Search nodes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto py-2 px-1.5">
          {expanded && filtered ? (
            filtered.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-10 px-4">
                No results for &ldquo;{query}&rdquo;
              </div>
            ) : (
              <div className="py-1">
                {filtered.map(def => (
                  <NodeItem key={def.kind} def={def} onHover={handleItemHover} onLeave={clearTooltip} />
                ))}
              </div>
            )
          ) : (
            SIDEBAR_CATEGORIES.map(cat => (
              <CategorySection
                key={cat.id}
                cat={cat}
                expanded={expanded}
                onHover={handleItemHover}
                onLeave={clearTooltip}
              />
            ))
          )}
        </div>
      </aside>

      {tooltip && expanded && (
        <NodeTooltip tooltip={tooltip} left={sidebarWidthPx} />
      )}
    </>
  );
}
