import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'dark';

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  asChild?: boolean;
};

/**
 * Retro pill button.
 * primary  → orange fill, black text, black border
 * outline  → white/cream fill, black text, black border
 * dark     → black fill, white text
 */
export function RetroButton({
  children,
  variant = 'primary',
  className,
  onClick,
  type = 'button',
  disabled,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-[#1A1A1A] font-bold text-sm transition-transform active:scale-95 disabled:opacity-50 cursor-pointer',
        variant === 'primary' && 'bg-[#E97933] text-[#1A1A1A] hover:bg-[#d4692a]',
        variant === 'outline' && 'bg-white text-[#1A1A1A] hover:bg-[#FFF8F2]',
        variant === 'dark' && 'bg-[#1A1A1A] text-white hover:bg-[#2d2d2d]',
        className,
      )}
    >
      {children}
    </button>
  );
}
