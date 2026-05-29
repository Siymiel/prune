"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function InlineEditableTextInput({
  value,
  onCommit,
  textSize = "text-[18px]",
  editOnDoubleClick = false,
}: {
  value: string;
  onCommit: (value: string) => void;
  textSize?: string;
  editOnDoubleClick?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(0);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    setInputWidth(measureRef.current.offsetWidth + 4);
  }, [draft]);

  useEffect(() => {
    if (isEditing) {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }, [isEditing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onCommit(trimmed);
    } else {
      setDraft(value);
    }
    if (editOnDoubleClick) setIsEditing(false);
  }

  const readOnly = editOnDoubleClick && !isEditing;

  return (
    <div className="relative inline-flex">
      {/* measure ghost for dynamic width */}
      <span
        ref={measureRef}
        className={cn(
          "absolute invisible whitespace-pre font-medium px-1.5 py-0.5",
          textSize,
        )}
      >
        {draft || " "}
      </span>

      {/* animated background layer — only this scales, not the text */}
      {isEditing && (
        <span className="absolute inset-0 rounded-md bg-white border border-gray-300 shadow-sm animate-zoom-out pointer-events-none" />
      )}

      <Input
        ref={inputRef}
        inputSize="xl"
        readOnly={readOnly}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
        onBlur={commit}
        onDoubleClick={
          editOnDoubleClick
            ? (e) => {
                e.stopPropagation();
                setIsEditing(true);
              }
            : undefined
        }
        onKeyDown={(e) => {
          if (readOnly) return;
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setDraft(value);
            if (editOnDoubleClick) {
              setIsEditing(false);
            } else {
              e.currentTarget.blur();
            }
          }
        }}
        style={{
          width: inputWidth,
          maxWidth: "100%",
        }}
        className={cn(
          "relative z-10 h-auto border border-transparent bg-transparent px-1.5 py-0.5 font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
          textSize,
          isEditing
            ? "cursor-text"
            : "hover:bg-prune-lightGray hover:border-transparent cursor-pointer transition-colors select-none",
        )}
      />
    </div>
  );
}
