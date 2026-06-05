"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import {
  Bold, Italic, Heading1, Heading2,
  List, ListOrdered, Quote, Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Chip node view ───────────────────────────────────────────────────────────

function ChipNodeView({ node }: NodeViewProps) {
  const id = node.attrs.id as string;
  const label = node.attrs.label as string;
  const isVar = /^(sys|user|vars)\./.test(id);

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        contentEditable={false}
        className={cn(
          "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-mono mx-0.5 select-none cursor-default",
          isVar
            ? "bg-amber-100 border border-amber-200 text-amber-700"
            : "bg-violet-100 border border-violet-200 text-violet-700",
        )}
      >
        {label}
      </span>
    </NodeViewWrapper>
  );
}

// ─── Serialisation helpers ────────────────────────────────────────────────────

type TiptapNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string }>;
};

function nodeToMarkdown(node: TiptapNode): string {
  if (node.type === "mention") {
    return `{{${node.attrs?.id ?? ""}}}`;
  }
  if (node.type === "text") {
    let t = node.text ?? "";
    const marks = node.marks ?? [];
    if (marks.some((m) => m.type === "bold")) t = `**${t}**`;
    if (marks.some((m) => m.type === "italic")) t = `*${t}*`;
    if (marks.some((m) => m.type === "code")) t = `\`${t}\``;
    return t;
  }
  if (node.type === "hardBreak") return "\n";

  const children = (node.content ?? []).map(nodeToMarkdown).join("");

  switch (node.type) {
    case "paragraph":   return children + "\n";
    case "heading": {
      const level = (node.attrs?.level as number) ?? 1;
      return "#".repeat(level) + " " + children.trimEnd() + "\n";
    }
    case "bulletList":  return children;
    case "orderedList": return children;
    case "listItem":    return "- " + children.trimEnd() + "\n";
    case "blockquote":  return "> " + children.trimEnd() + "\n";
    case "codeBlock":   return "```\n" + children + "```\n";
    case "doc":         return children.replace(/\n+$/, "");
    default:            return children;
  }
}

export function serializeEditorToTemplate(doc: Record<string, unknown>): string {
  return nodeToMarkdown(doc as TiptapNode);
}

// ─── Deserialisation ──────────────────────────────────────────────────────────

export interface ChipDescriptor {
  id: string;
  label: string;
}

function templateToDoc(
  template: string,
  resolveLabel: (id: string) => string,
): Record<string, unknown> {
  const paragraphs: unknown[] = [];
  const lines = template.split("\n");

  for (const line of lines) {
    const inlineNodes: unknown[] = [];
    const parts = line.split(/(\{\{[^}]+\}\})/g);

    for (const part of parts) {
      const match = part.match(/^\{\{([^}]+)\}\}$/);
      if (match) {
        const id = match[1];
        inlineNodes.push({
          type: "mention",
          attrs: { id, label: resolveLabel(id) },
        });
      } else if (part) {
        inlineNodes.push({ type: "text", text: part });
      }
    }

    paragraphs.push({ type: "paragraph", content: inlineNodes });
  }

  return { type: "doc", content: paragraphs.length ? paragraphs : [{ type: "paragraph", content: [] }] };
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

type ToolbarItem =
  | {
      kind: "button";
      Icon: React.ComponentType<{ className?: string }>;
      title: string;
      iconClass?: string;
      active: (e: Editor) => boolean;
      action: (e: Editor) => void;
    }
  | { kind: "sep" };

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { kind: "button", Icon: Bold,         title: "Bold",         active: (e) => e.isActive("bold"),                        action: (e) => e.chain().focus().toggleBold().run() },
  { kind: "button", Icon: Italic,       title: "Italic",       active: (e) => e.isActive("italic"),                      action: (e) => e.chain().focus().toggleItalic().run() },
  { kind: "sep" },
  { kind: "button", Icon: Heading1,     title: "Heading 1",    iconClass: "h-4 w-4", active: (e) => e.isActive("heading", { level: 1 }), action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { kind: "button", Icon: Heading2,     title: "Heading 2",    iconClass: "h-4 w-4", active: (e) => e.isActive("heading", { level: 2 }), action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { kind: "sep" },
  { kind: "button", Icon: List,         title: "Bullet list",  active: (e) => e.isActive("bulletList"),                  action: (e) => e.chain().focus().toggleBulletList().run() },
  { kind: "button", Icon: ListOrdered,  title: "Ordered list", active: (e) => e.isActive("orderedList"),                 action: (e) => e.chain().focus().toggleOrderedList().run() },
  { kind: "button", Icon: Quote,        title: "Blockquote",   active: (e) => e.isActive("blockquote"),                  action: (e) => e.chain().focus().toggleBlockquote().run() },
  { kind: "button", Icon: Code2,        title: "Code block",   active: (e) => e.isActive("codeBlock"),                   action: (e) => e.chain().focus().toggleCodeBlock().run() },
];

// ─── Main component ───────────────────────────────────────────────────────────

export interface TemplateEditorProps {
  value: string;
  doc: Record<string, unknown> | null;
  resolveLabel: (id: string) => string;
  onChange: (template: string, doc: Record<string, unknown>) => void;
  placeholder?: string;
}

export function TemplateEditor({
  value,
  doc,
  resolveLabel,
  onChange,
}: TemplateEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const MentionExtension = Mention.extend({
    addNodeView() {
      return ReactNodeViewRenderer(ChipNodeView);
    },
  }).configure({
    HTMLAttributes: {},
    renderLabel: ({ node }) => node.attrs.label as string,
    suggestion: {
      char: "",
      items: () => [],
      render: () => ({ onStart: () => {}, onUpdate: () => {}, onKeyDown: () => false, onExit: () => {} }),
    },
  });

  const editor = useEditor({
    extensions: [StarterKit, MentionExtension],
    content: doc ?? templateToDoc(value, resolveLabel),
    onUpdate({ editor: e }) {
      const json = e.getJSON() as Record<string, unknown>;
      const template = serializeEditorToTemplate(json);
      onChangeRef.current(template, json);
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] px-4 py-3 text-[14px] leading-relaxed focus:outline-none prose prose-sm max-w-none",
      },
    },
  });

  const lastDocRef = useRef<Record<string, unknown> | null>(null);
  useEffect(() => {
    if (!editor || !doc) return;
    if (JSON.stringify(doc) === JSON.stringify(lastDocRef.current)) return;
    lastDocRef.current = doc;
    editor.commands.setContent(doc as Parameters<typeof editor.commands.setContent>[0], { emitUpdate: false });
  }, [editor, doc]);

  const insertChip = useCallback(
    (id: string, label: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent({ type: "mention", attrs: { id, label } }).run();
    },
    [editor],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    (containerRef.current as HTMLDivElement & { __insertChip?: typeof insertChip }).__insertChip = insertChip;
  }, [insertChip]);

  return (
    <div ref={containerRef} data-template-editor>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-2 border-b border-prune-borderGray bg-prune-lightGray">
        {TOOLBAR_ITEMS.map((item, i) =>
          item.kind === "sep" ? (
            <div key={`sep-${i}`} className="h-4 w-px bg-border mx-1 shrink-0" />
          ) : (
            <button
              key={item.title}
              title={item.title}
              onMouseDown={(e) => {
                e.preventDefault();
                if (editor) item.action(editor);
              }}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded transition-colors",
                (editor ? item.active(editor) : false)
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <item.Icon className={cn("h-3.5 w-3.5", item.iconClass)} />
            </button>
          ),
        )}
      </div>

      {/* Editor area */}
      <div className="bg-background">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

// ─── Helper: insert chip into an editor mounted in the DOM ────────────────────

export function insertChipIntoEditor(
  containerEl: HTMLElement | null,
  id: string,
  label: string,
) {
  if (!containerEl) return;
  const el = containerEl.querySelector("[data-template-editor]") as
    | (HTMLElement & { __insertChip?: (id: string, label: string) => void })
    | null;
  el?.__insertChip?.(id, label);
}
