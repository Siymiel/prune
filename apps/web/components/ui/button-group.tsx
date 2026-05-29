'use client';

import { cn } from '@/lib/utils';

interface ButtonGroupOption<T extends string> {
  value: T;
  label: string;
}

interface ButtonGroupProps<T extends string> {
  options: ButtonGroupOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'xs';
  stretch?: boolean;
}

export function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'xs',
  stretch = false,
}: ButtonGroupProps<T>) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 font-medium bg-gray-200 rounded-md p-0.5',
        size === 'xs' ? 'text-[13px]' : 'text-xs',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-[5px] transition-colors',
            size === 'xs' ? 'px-2.5 py-1' : 'px-3 py-1.5',
            stretch && 'flex-1',
            value === opt.value
              ? 'bg-white text-foreground shadow-sm'
              : 'text-gray-400 hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
