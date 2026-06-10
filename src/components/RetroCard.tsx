import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  children: ReactNode;
  className?: string;
  highlighted?: boolean; /* orange fill variant */
  dark?: boolean;        /* navy fill variant */
};

/**
 * Retro-style card: thick black border, rounded corners, flat color.
 * No shadows, no gradients — pure retro.
 */
export function RetroCard({ children, className, highlighted = false, dark = false }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border-2 border-[#1A1A1A] p-6 md:p-8 relative',
        highlighted && 'bg-[#E97933] text-white',
        dark && 'bg-[#2D5F8A] text-white',
        !highlighted && !dark && 'bg-white text-[#1A1A1A]',
        className,
      )}
    >
      {children}
    </div>
  );
}
