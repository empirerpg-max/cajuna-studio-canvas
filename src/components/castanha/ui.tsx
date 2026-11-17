// Peças visuais comuns do Castanha, no estilo retrô da Cajuna:
// borda preta de 2px, cores chapadas (caju, mar, areia), pílulas, sem sombras.
import { useEffect, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const inputCls =
  'w-full rounded-xl border-2 border-[#1A1A1A]/15 bg-white px-3 py-2.5 text-[15px] font-medium text-[#1A1A1A] outline-none transition focus:border-[#E97933] disabled:bg-[#F0EAE3]';

/** Janela: no celular sobe de baixo (gaveta); no computador fica centralizada. */
export function Modal({
  titulo,
  subtitulo,
  onClose,
  children,
  rodape,
  largura = 'md',
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  rodape?: ReactNode;
  largura?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#1A1A1A]/70 sm:items-start sm:overflow-y-auto sm:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'flex max-h-[92dvh] w-full flex-col rounded-t-3xl border-2 border-b-0 border-[#1A1A1A] bg-white sm:mt-6 sm:max-h-none sm:rounded-3xl sm:border-b-2',
          largura === 'sm' && 'sm:max-w-md',
          largura === 'md' && 'sm:max-w-xl',
          largura === 'lg' && 'sm:max-w-3xl',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b-2 border-[#1A1A1A]/10 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <h3 className="text-xl font-black leading-tight text-[#1A1A1A] break-words">{titulo}</h3>
            {subtitulo && <p className="mt-0.5 text-sm font-medium text-[#1A1A1A]/55">{subtitulo}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 rounded-full p-1.5 hover:bg-[#F0EAE3]" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {rodape && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t-2 border-[#1A1A1A]/10 px-5 py-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6">
            {rodape}
          </div>
        )}
      </div>
    </div>
  );
}

export function Botao({
  children,
  onClick,
  tipo = 'primario',
  type = 'button',
  disabled,
  carregando,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  tipo?: 'primario' | 'contorno' | 'fantasma' | 'perigo';
  type?: 'button' | 'submit';
  disabled?: boolean;
  carregando?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || carregando}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-black transition active:scale-[.97] disabled:opacity-50',
        tipo === 'primario' && 'border-2 border-[#1A1A1A] bg-[#E97933] text-[#1A1A1A] hover:bg-[#d4692a]',
        tipo === 'contorno' && 'border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-[#FFF8F2]',
        tipo === 'fantasma' && 'border-2 border-transparent text-[#1A1A1A]/60 hover:text-[#1A1A1A]',
        tipo === 'perigo' && 'border-2 border-[#B3261E] bg-white text-[#B3261E] hover:bg-[#FDECEA]',
        className,
      )}
    >
      {carregando && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Campo({ rotulo, dica, children, htmlFor }: { rotulo: string; dica?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1 block text-xs font-black text-[#1A1A1A]/55">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-[11px] font-medium text-[#1A1A1A]/45">{dica}</span>}
    </label>
  );
}

/** Seletor de mês (YYYY-MM) a partir de uma lista pronta. */
export function SelectMes({ id, value, onChange, meses, rotular }: { id?: string; value: string; onChange: (m: string) => void; meses: string[]; rotular: (m: string) => string }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {meses.map((m) => (
        <option key={m} value={m}>
          {rotular(m)}
        </option>
      ))}
    </select>
  );
}

export function Erro({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="rounded-xl bg-[#FDECEA] px-3 py-2 text-sm font-bold text-[#B3261E]">{children}</p>;
}
