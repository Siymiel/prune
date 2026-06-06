'use client';

import { useState, useRef } from 'react';
import {
  Search, ChevronDown, ChevronRight,
  Download, Upload, Cpu, LayoutGrid, GitBranch, Settings2,
  MenuIcon,
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
  const Icon = tooltip.def.icon;
  return (
    <div
      className="fixed z-[200] bg-card border rounded-lg shadow-xl p-3 w-52 pointer-events-none"
      style={{ top: tooltip.top - 32, left: left + 2 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-md border bg-muted/50 flex items-center justify-center shrink-0">
          {tooltip.def.integrationId
            ? renderIntegrationIcon(tooltip.def.integrationId, 14)
            : <Icon className={cn('h-3.5 w-3.5', tooltip.def.iconClass)} />}
        </div>
        <span className="text-xs font-semibold">{tooltip.def.label}</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{tooltip.def.description}</p>
      <span className={cn('mt-2 inline-flex text-[10px] px-1.5 py-0.5 rounded-full', tooltip.def.badgeClass)}>
        {tooltip.def.badge}
      </span>
    </div>
  );
}

function NodeItem({
  def,
  onHover,
  onLeave,
}: {
  def: NodeDef;
  onHover: (def: NodeDef, e: React.MouseEvent) => void;
  onLeave: () => void;
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
      className="flex items-center gap-2.5 mx-2 mb-1 px-2 py-1 rounded-md border bg-background hover:bg-muted/30 cursor-grab active:cursor-grabbing select-none transition-colors"
    >
      <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0 font-[450] text-[#1D1D1D]">
        {def.integrationId
          ? renderIntegrationIcon(def.integrationId, 13, '#1D1D1D')
          : <Icon className={cn('h-4 w-4 text-[#1D1D1D]', def.iconClass)} />}
      </div>
      <span className="text-[15px] font-[450] flex-1 truncate">{def.label}</span>
      <MenuIcon className="h-4 w-4 shrink-0" />
    </div>
  );
}

// ↓ Now accepts `expanded` — single DOM, labels conditionally shown
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
        // ↓ fixed: h-9 px-2 in BOTH states — icon never moves
        onClick={() => expanded && setOpen(o => !o)}
        className="w-full h-9 flex items-center gap-2.5 px-2 rounded-md hover:bg-prune-lightGray transition-colors"
      >
        <CatIcon className="h-5 w-5 text-foreground shrink-0" />
        {/* Only the label + chevron hide — the icon stays put */}
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

export function EditorSidebar() {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleMouseEnter() {
    clearTimeout(collapseTimer.current);
    setExpanded(true);
  }

  function handleMouseLeave() {
    setTooltip(null);
    collapseTimer.current = setTimeout(() => setExpanded(false), 180);
  }

  function handleItemHover(def: NodeDef, e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({ def, top: rect.top + rect.height / 2 });
  }

  function clearTooltip() {
    setTooltip(null);
  }

  const sidebarWidthPx = expanded ? 270 : 52;

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
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ width: sidebarWidthPx }}
        className="absolute left-0 top-0 bottom-0 border-r bg-background flex flex-col overflow-hidden transition-[width] duration-200 ease-in-out z-50 font-sans"
      >
        {/* ↓ Search — always present, always the same height. No more DOM swap. */}
        <div className="px-2 pt-3 pb-2.5 border-b shrink-0">
          <div className={cn(
            'h-8 flex items-center rounded-md border bg-muted/40 transition-all duration-200',
            expanded ? 'px-2.5 gap-2' : 'justify-center',
          )}>
            <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            {/* Input collapses to zero-width instead of unmounting */}
            <input
              autoFocus={false}
              tabIndex={expanded ? 0 : -1}
              className={cn(
                'text-xs bg-transparent outline-none placeholder:text-muted-foreground/40 transition-all duration-200',
                expanded ? 'w-full' : 'w-0 p-0 pointer-events-none',
              )}
              placeholder="Search nodes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ↓ Content — always the same DOM. CategorySection handles its own collapsed look. */}
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
                expanded={expanded}   // ← pass expanded down
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