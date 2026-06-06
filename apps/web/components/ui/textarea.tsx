import * as React from "react";
import { cn } from "@/lib/utils";

type TextareaSize = "xs" | "sm" | "md" | "lg" | "xl";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  size?: TextareaSize;
  fontSize?: number | string;
  expandable?: boolean; // auto-grows height; parent expands with it
}

const sizeStyles: Record<TextareaSize, string> = {
  xs: "min-h-[24px] font-[450] text-foreground/80 px-2 py-1.5",
  sm: "min-h-[60px] font-[450] text-foreground/80 px-2.5 py-2",
  md: "min-h-[100px] font-[450] text-foreground/80 px-3 py-2.5",
  lg: "min-h-[160px] font-[450] text-foreground/80 px-3.5 py-3",
  xl: "min-h-[240px] font-[450] text-foreground/80 px-4 py-3.5 leading-7",
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size = "xs",
      fontSize = 14,
      style,
      expandable = false,
      onChange,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);

    // Merge forwarded ref with our internal one
    const mergedRef = React.useCallback(
      (el: HTMLTextAreaElement | null) => {
        (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
        if (typeof ref === "function") {
          ref(el);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
        }
      },
      [ref],
    );

    const adjustHeight = React.useCallback(() => {
      const el = internalRef.current;
      if (!el || !expandable) return;
      el.style.height = "auto";          // collapse to min-h floor
      el.style.height = `${el.scrollHeight}px`; // expand to fit content
    }, [expandable]);

    // On mount + whenever controlled value changes
    React.useEffect(() => {
      adjustHeight();
    }, [adjustHeight, props.value]);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight();
        onChange?.(e);
      },
      [adjustHeight, onChange],
    );

    const fontSizeValue =
      typeof fontSize === "number" ? `${fontSize}px` : fontSize;

    return (
      <textarea
        ref={mergedRef}
        style={{ fontSize: fontSizeValue, ...style }}
        className={cn(
          `
          flex
          w-full
          rounded-md
          bg-prune-lightGray
          ring-offset-background
          placeholder:text-muted-foreground
          transition-colors
          focus-visible:outline-none
          focus-visible:ring-1
          focus-visible:ring-prune-commonGray/40
          focus-visible:ring-offset-0
          disabled:cursor-not-allowed
          disabled:opacity-50
          resize-none
          font-sans
        `,
         expandable ? "resize-none overflow-hidden" : "resize-y",
          sizeStyles[size],
          className,
        )}
        onChange={expandable ? handleChange : onChange}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };