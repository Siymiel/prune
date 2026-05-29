import * as React from "react";
import { cn } from "@/lib/utils";

type InputVariant =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl";

interface InputProps
  extends React.ComponentProps<"input"> {
  inputSize?: InputVariant;
}

const sizeStyles: Record<InputVariant, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      className,
      type,
      inputSize = "sm",
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          `
          flex
          h-10
          w-full
          rounded-md
          border
          border-input
          bg-background
          px-3
          py-2

          ring-offset-background

          file:border-0
          file:bg-transparent
          file:text-sm
          file:font-medium
          file:text-foreground

          placeholder:text-muted-foreground

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-prune-commonGray/50
          focus-visible:ring-offset-2

          disabled:cursor-not-allowed
          disabled:opacity-50
        `,
          sizeStyles[inputSize],
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };