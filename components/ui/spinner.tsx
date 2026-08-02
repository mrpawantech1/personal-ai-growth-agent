'use client';

import { cn } from '@/lib/utils/helpers';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantMap = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  white: 'text-white',
};

export function Spinner({
  size = 'md',
  variant = 'default',
  className,
  label,
}: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Loader2
        className={cn(
          'animate-spin',
          sizeMap[size],
          variantMap[variant],
          className
        )}
      />
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}

// Full-page loader
export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <Spinner size="xl" variant="primary" label="Loading..." />
    </div>
  );
}

// Button loader (inline)
export function ButtonLoader() {
  return <Spinner size="sm" variant="default" />;
}
