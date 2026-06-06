# PruneAI — Project Memory for Claude

## Design System Rules

### Icons
- **Size**: Always use `h-4 w-4` for standard icons. Use `h-3.5 w-3.5` only for dense/inline contexts (e.g. inside small buttons).
- **Color**: Default icon color in the editor sidebar is `#1D1D1D` (near-black). Pass `iconColor` prop to `NodeItem` to override elsewhere.

### Backgrounds
- **Standard light background**: `bg-prune-lightGray` (defined in `tailwind.config.ts`). Use this for input fields, tab strips, hover states, and card surfaces. Do NOT use `bg-muted` or `bg-gray-100` as a replacement.

### Typography
- Font weight `font-[450]` is the standard "medium" weight for node labels, sidebar items, and panel text.
- Section headings use `text-[13px] font-semibold` or `text-[15px] font-[450]`.
- Use `text-[13px]` for most UI text (breadcrumbs, labels, inputs). Use `text-[11px]` for secondary/status text.

### Tailwind Custom Tokens
Defined in `apps/web/tailwind.config.ts`:
- `prune-lightGray` — light background surface
- `prune-borderGray` — subtle border color
- `prune-purple` — brand accent

---

## Architecture

### Editor Layout (`apps/web/app/(editor)/layout.tsx`)
- Root container: `h-screen w-screen overflow-hidden bg-background flex`
- Children: a single `BuilderEditor` component that fills the space

### BuilderEditor (`apps/web/components/builder/builder-editor.tsx`)
- Outer: `flex flex-1 overflow-hidden relative` (horizontal row)
- Left: `EditorSidebar` (pinned = in-flow at 270px; unpinned = absolute overlay at 52px collapsed / 270px on hover)
- Right column: `flex flex-col flex-1 min-w-0 overflow-hidden`
  - `EditorTopbar` (h-12, shrink-0)
  - Content area below topbar

### EditorSidebar (`apps/web/components/builder/editor-sidebar.tsx`)
- When **pinned**: `relative shrink-0 h-full` — in layout flow, pushes right column
- When **unpinned**: `absolute left-0 top-0 bottom-0 z-50` — overlays content
- Collapsed width: 52px (icons only). Expanded width: 270px.
- Header row: `h-12 border-b` with `Hop` logo icon + "PruneAI" brand + `PanelLeftClose`/`PanelRightClose` pin toggle
- Pin state lives in `BuilderEditor` as `sidebarPinned` state, passed as prop

### EditorTopbar (`apps/web/components/builder/editor-topbar.tsx`)
- Left: Workspace breadcrumb — `FolderOpen` icon + workspace name (links to /dashboard) + `/` + inline-editable project name
- Center: Tabs absolutely centered (`position: absolute; left: 50%; transform: translateX(-50%)`)
- Right: save state indicator + Examples + Share + Run + Deploy buttons (unchanged)
- `sidebarPinned` prop: when `false`, applies `pl-[56px]` to clear the 52px collapsed sidebar overlay

### Node Cards (`apps/web/components/builder/node-card.tsx`)
- Sticky notes: no `min-h` — height auto-sizes to content
- Sticky note toolbar includes a "Clear formatting" button (uses `removeFormat` + `formatBlock: div` to strip both inline styles and block-level headings)

---

## Key Files

| File | Role |
|------|------|
| `apps/web/components/builder/builder-editor.tsx` | Main editor orchestrator, layout, state |
| `apps/web/components/builder/editor-sidebar.tsx` | Node picker sidebar with pin/hover expand |
| `apps/web/components/builder/editor-topbar.tsx` | Topbar with breadcrumb + centered tabs |
| `apps/web/components/builder/node-card.tsx` | Canvas node cards including sticky notes |
| `apps/web/components/builder/panels/action-panel.tsx` | Action/app node config panel |
| `apps/web/components/builder/panels/node-detail-panel.tsx` | Right-side detail panel routing |
| `apps/web/components/builder/panels/model-picker.tsx` | AI model picker dialog |
| `apps/web/lib/editor-nodes.ts` | Node definitions, categories, types |
| `apps/web/lib/tool-schemas.ts` | Input/output schemas per tool |
| `apps/web/app/(editor)/layout.tsx` | Editor layout shell |

---

## Pending / Next Steps

### Action Panel wiring
1. **"Add connection" button** — currently just closes dropdown. Should navigate to `Settings → Connections` or open a `ConnectionCreatorDialog`.
2. **`INTEGRATION_TO_PROVIDER` coverage** — add entries for `whatsapp`, `mpesa`, `google-maps`.
3. **`gcal` tools** — `PROVIDER_TOOLS` has no `gcal` entry. Add Create/List/Update/Delete Event groups.
4. **Run Action button** — has no handler. Should POST `config.inputValues` to `/api/runs/test-action` and show result inline.
5. **Output values as handles** — Outputs section should produce real canvas handles for downstream nodes.
6. **`TypeBadge` type switching** — `onTypeChange` callback not threaded through yet.
7. **`TOOL_SCHEMAS` coverage** — fill in for Slack, Gmail, GCal, GDrive.

### General
8. **Backend node runners** — `apps/api/src/prune_api/nodes/` needs runners for each provider action.

---

## Architectural Constraints

- `ActionConfig` is JSON-serialised into `node.inputValue`. New fields must be added to the `ActionConfig` type and handled in `parseActionConfig` / `saveConfig`.
- App nodes: `def.category === "apps"` + `def.integrationId` set. Action nodes: `def.kind === "action"`. Panel routing in `node-detail-panel.tsx` checks `kind` first, then `category` — do NOT reorder.
- `initialProviderId` on `ActionCategoryPicker` locks the provider as display-only — intentional for app nodes.
- `PROVIDER_TOOLS` keys must exactly match `ActionProviderDef.id` in `ACTION_PROVIDERS`. `INTEGRATION_TO_PROVIDER` bridges cases where `def.integrationId` differs from the provider key.
