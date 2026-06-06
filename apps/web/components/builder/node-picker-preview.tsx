'use client';

const PREVIEW_W = 540;
const PREVIEW_H = 356;
const OFFSET_X = 24;
const OFFSET_Y = 16;

interface NodePickerPreviewProps {
  screenX: number;
  screenY: number;
}

export function NodePickerPreview({ screenX, screenY }: NodePickerPreviewProps) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  let left = screenX + OFFSET_X;
  let top = screenY + OFFSET_Y;
  if (left + PREVIEW_W > vw - 16) left = screenX - PREVIEW_W - OFFSET_X;
  if (top + PREVIEW_H > vh - 16) top = screenY - PREVIEW_H - OFFSET_Y;
  left = Math.max(16, left);
  top = Math.max(16, top);

  return (
    <div
      className="fixed z-50 pointer-events-none animate-fade-in"
      style={{ left, top, width: PREVIEW_W }}
    >
      <div
        className="flex bg-background border rounded-2xl shadow-xl overflow-hidden font-inter"
        style={{ height: PREVIEW_H }}
      >
        {/* Icon sidebar skeleton */}
        <div className="w-12 border-r bg-muted flex flex-col items-center py-3 gap-2 shrink-0">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-lg bg-muted-foreground/10 animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="flex-1 flex flex-col min-w-0 px-3 pt-3 pb-2 gap-2.5">
          {/* Search bar */}
          <div className="h-9 rounded-xl bg-muted/40 border animate-pulse shrink-0" />

          {/* Section label */}
          <div className="h-2.5 w-24 rounded-full bg-muted-foreground/10 animate-pulse shrink-0 mt-0.5" />

          {/* Node rows */}
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-border/40 shrink-0"
            >
              <div className="h-7 w-7 rounded-lg bg-muted/60 shrink-0 animate-pulse" style={{ animationDelay: `${i * 40}ms` }} />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div
                  className="h-3 rounded-full bg-muted-foreground/15 animate-pulse"
                  style={{ width: `${55 + (i * 13) % 35}%`, animationDelay: `${i * 40 + 20}ms` }}
                />
                <div
                  className="h-2 rounded-full bg-muted-foreground/10 animate-pulse"
                  style={{ width: `${35 + (i * 11) % 25}%`, animationDelay: `${i * 40 + 40}ms` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
