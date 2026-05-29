import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaSize = "xs" | "sm" | "md" | "lg" | "xl";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  size?: TextareaSize;
}

const sizeStyles: Record<TextareaSize, string> = {
  xs: "min-h-[24px] text-[14px] font-medium text-foreground/80 px-2 py-1.5",
  sm: "min-h-[60px] text-[14px] font-medium text-foreground/80 px-2.5 py-2",
  md: "min-h-[100px] text-[14px] font-medium text-foreground/80 px-3 py-2.5",
  lg: "min-h-[160px] text-[14px] font-medium text-foreground/80 px-3.5 py-3",
  xl: "min-h-[240px] text-[15px] font-medium text-foreground/80 px-4 py-3.5 leading-7",
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, size = "xs", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          `
          flex
          w-full
          rounded-md
          border-2
          border-input
          bg-background
          ring-offset-background
          placeholder:text-muted-foreground
          transition-colors
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-prune-commonGray/40
          focus-visible:ring-offset-0
          disabled:cursor-not-allowed
          disabled:opacity-50
          resize-none
        `,
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
