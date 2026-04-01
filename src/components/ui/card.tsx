import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-5 shadow-[var(--shadow)]',
        className
      )}
      {...props}
    />
  );
}
