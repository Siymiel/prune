'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { Search, Home, ArrowLeftRight, Zap, PlaySquare, AppWindow, Workflow } from 'lucide-react';
import { NODE_DEFS, type NodeKind, type NodeDef } from '@/lib/editor-nodes';
import { renderIntegrationIcon } from '@/components/templates/integration-logo';
import { cn } from '@/lib/utils';

const POPULAR_NODES: NodeKind[] = ['text-input', 'ai-agent', 'output', 'knowledge-base', 'code', 'files'];
const POPULAR_APPS: NodeKind[]  = ['gmail-app', 'whatsapp', 'slack-app', 'google-calendar-app', 'google-drive-app', 'google-maps-app'];

type CategoryKey = 'home' | 'io' | 'triggers' | 'actions' | 'apps' | 'logic';

const SIDEBAR_ITEMS: { key: CategoryKey; label: string; icon: React.ElementType }[] = [
  { key: 'home',     label: 'Home',          icon: Home           },
  { key: 'io',       label: 'Input & Output', icon: ArrowLeftRight },
  { key: 'triggers', label: 'Triggers',       icon: Zap            },
  { key: 'actions',  label: 'Actions',        icon: PlaySquare     },
  { key: 'apps',     label: 'Apps',           icon: AppWindow      },
  { key: 'logic',    label: 'Logic & Utils',  icon: Workflow       },
];

interface SidebarItem { key: CategoryKey; label: string; icon: React.ElementType }

interface NodePickerModalProps {
  screenX: number;
  screenY: number;
  popupWidth?: number;
  onSelect: (kind: NodeKind) => void;
  onClose: () => void;
}

export function NodePickerModal({ screenX, screenY, popupWidth, onSelect, onClose }: NodePickerModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('home');
  const ref = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<{ item: SidebarItem; x: number; y: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Prevent wheel events from bubbling to the canvas's native zoom handler
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stop);
    return () => el.removeEventListener('wheel', stop);
  }, []);

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  // When opened from the toolbar Add button, match the toolbar's exact width and align to its left edge.
  // Otherwise use the default adaptive width and offset to the right of the anchor point.
  const POPUP_W = popupWidth ?? Math.min(420, vw - 32);
  const POPUP_H = Math.min(460, vh - 48);
  const left = popupWidth != null
    ? Math.max(16, Math.min(screenX, vw - POPUP_W - 16))
    : Math.max(16, Math.min(screenX + 16, vw - POPUP_W - 16));
  // 56 = toolbar height (~36px) + bottom-4 offset (16px) + 4px gap
  const top  = Math.max(16, Math.min(screenY - 20, vh - POPUP_H - 26));

  const popularNodes = POPULAR_NODES.map(k => NODE_DEFS.find(d => d.kind === k)).filter(Boolean) as NodeDef[];
  const popularApps  = POPULAR_APPS.map(k => NODE_DEFS.find(d => d.kind === k)).filter(Boolean) as NodeDef[];

  const categoryDefs = useMemo(() => {
    switch (activeCategory) {
      case 'triggers': return NODE_DEFS.filter(d => d.kind.includes('trigger') || d.kind.includes('webhook'));
      case 'actions':  return NODE_DEFS.filter(d => d.badge === 'Action');
      case 'apps':     return NODE_DEFS.filter(d => !!d.integrationId);
      case 'logic':    return NODE_DEFS.filter(d => d.category === 'logic' || d.category === 'utils');
      default:         return [];
    }
  }, [activeCategory]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    return NODE_DEFS.filter(d => d.label.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <>
      {/* Backdrop — catches any click outside the modal panel */}
      <div
        className="fixed inset-0 z-40"
        onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
      />

      {/* Outer wrapper: fixed z-50, no overflow-hidden so tooltip can extend left */}
      <div
        ref={ref}
        className="fixed z-50"
        style={{ left, top, width: POPUP_W }}
        onMouseDown={(e) => e.stopPropagation()}
      >
      {/* Tooltip — fixed position so it never affects layout */}
      {tooltip && (
        <div
          className="fixed z-[60] pointer-events-none whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium shadow-lg"
          style={{ top: tooltip.y, left: tooltip.x - 8, transform: 'translate(-100%, -50%)' }}
        >
          <tooltip.item.icon className="h-3.5 w-3.5 shrink-0" />
          <span>{tooltip.item.label}</span>
        </div>
      )}

      {/* Inner panel */}
      <div
        ref={panelRef}
        className="flex bg-background border rounded-2xl shadow-xl overflow-hidden w-full"
        style={{ maxHeight: POPUP_H }}
      >
        {/* Icon sidebar */}
        <div className="w-12 border-r bg-muted flex flex-col items-center py-3 gap-2 shrink-0">
          {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }, idx) => (
            <button
              key={key}
              onClick={() => { setActiveCategory(key); setQuery(''); }}
              onMouseEnter={(e) => {
                const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setTooltip({ item: SIDEBAR_ITEMS[idx], x: btnRect.left, y: btnRect.top + btnRect.height / 2 });
              }}
              onMouseLeave={() => setTooltip(null)}
              className={cn(
                'h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                activeCategory === key && !query
                  ? 'bg-background border shadow-sm text-foreground'
                  : 'text-prune-darkGray hover:bg-background/60 hover:text-foreground',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search nodes and apps…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto pb-3 px-1">
            {searchResults ? (
              <div>
                <SectionLabel>Results</SectionLabel>
                {searchResults.map(def => <PickerRow key={def.kind} def={def} onSelect={onSelect} />)}
                {searchResults.length === 0 && (
                  <p className="text-xs text-muted-foreground px-3 py-4 text-center">No matching nodes</p>
                )}
              </div>
            ) : activeCategory === 'home' ? (
              <div className="grid grid-cols-2 gap-x-1">
                <div>
                  <SectionLabel>Popular nodes</SectionLabel>
                  {popularNodes.map(def => <PickerRow key={def.kind} def={def} onSelect={onSelect} />)}
                </div>
                <div>
                  <SectionLabel>Popular apps</SectionLabel>
                  {popularApps.map(def => <PickerRow key={def.kind} def={def} onSelect={onSelect} />)}
                </div>
              </div>
            ) : activeCategory === 'io' ? (
              <div className="grid grid-cols-2 gap-x-1">
                <div>
                  <SectionLabel>Inputs</SectionLabel>
                  {NODE_DEFS.filter(d => d.category === 'inputs').map(def => (
                    <PickerRow key={def.kind} def={def} onSelect={onSelect} />
                  ))}
                </div>
                <div>
                  <SectionLabel>Outputs</SectionLabel>
                  {NODE_DEFS.filter(d => d.category === 'outputs').map(def => (
                    <PickerRow key={def.kind} def={def} onSelect={onSelect} />
                  ))}
                </div>
              </div>
            ) : activeCategory === 'logic' ? (
              <div>
                <SectionLabel>Logic</SectionLabel>
                {NODE_DEFS.filter(d => d.category === 'logic').map(def => (
                  <PickerRow key={def.kind} def={def} onSelect={onSelect} />
                ))}
                <SectionLabel>Utils</SectionLabel>
                {NODE_DEFS.filter(d => d.category === 'utils').map(def => (
                  <PickerRow key={def.kind} def={def} onSelect={onSelect} />
                ))}
              </div>
            ) : (
              <div>
                <SectionLabel>{SIDEBAR_ITEMS.find(s => s.key === activeCategory)?.label}</SectionLabel>
                {categoryDefs.map(def => <PickerRow key={def.kind} def={def} onSelect={onSelect} />)}
                {categoryDefs.length === 0 && (
                  <p className="text-xs text-muted-foreground px-3 py-4 text-center">No nodes in this category</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-semibold uppercase tracking-wider text-foreground/50 px-2 pt-1.5 pb-1">
      {children}
    </p>
  );
}

function PickerRow({ def, onSelect }: { def: NodeDef; onSelect: (kind: NodeKind) => void }) {
  const Icon = def.icon;
  return (
    <button
      onClick={() => onSelect(def.kind)}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-white border border-border/40 hover:border-border hover:bg-prune-lightGray transition-colors text-left mb-1"
    >
      <div className="h-7 w-7 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
        {def.integrationId
          ? renderIntegrationIcon(def.integrationId, 14)
          : <Icon className={cn('h-3.5 w-3.5', def.iconClass)} />
        }
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground leading-tight">{def.label}</div>
        <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">{def.description}</div>
      </div>
    </button>
  );
}
