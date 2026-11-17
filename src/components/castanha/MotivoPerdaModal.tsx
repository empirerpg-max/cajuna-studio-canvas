import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MOTIVOS_PERDA } from '@/lib/castanha/fb-leads';
import { Botao, Erro, Modal } from './ui';

/** Pede o motivo antes de mover um card para "Perdido". Cancelar não muda nada. */
export function MotivoPerdaModal({
  nome,
  onConfirmar,
  onCancelar,
}: {
  nome: string;
  onConfirmar: (motivo: string) => void;
  onCancelar: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  return (
    <Modal
      largura="sm"
      titulo="Por que perdemos?"
      subtitulo={nome}
      onClose={onCancelar}
      rodape={
        <>
          <Botao tipo="fantasma" onClick={onCancelar}>
            Cancelar
          </Botao>
          <Botao onClick={() => (motivo ? onConfirmar(motivo) : setErro('Escolha um motivo.'))}>Marcar como perdido</Botao>
        </>
      }
    >
      <div className="grid gap-2" role="radiogroup" aria-label="Motivo da perda">
        {MOTIVOS_PERDA.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={motivo === m}
            onClick={() => {
              setMotivo(m);
              setErro('');
            }}
            className={cn(
              'rounded-2xl border-2 px-4 py-3 text-left font-black transition',
              motivo === m ? 'border-[#1A1A1A] bg-[#FFF0E6]' : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40',
            )}
          >
            {m}
          </button>
        ))}
        <Erro>{erro}</Erro>
      </div>
    </Modal>
  );
}
