'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link' | 'primary' | 'prune';
type Size = 'sm' | 'default' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variants: Record<Variant, string> = {
  default:
    'bg-primary text-primary-foreground hover:bg-primary/90',
  primary:
    'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost:
    'hover:bg-accent hover:text-accent-foreground',
  outline:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  link:
    'text-primary underline-offset-4 hover:underline',
  prune:
    'border border-input bg-background text-foreground hover:bg-prune-lightGray',
};

const sizes: Record<Size, string> = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs rounded-md',
  lg: 'h-10 px-8 text-sm',
  icon: 'h-9 w-9 p-0 justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'default', size = 'default', asChild = false, className, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref as never}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
