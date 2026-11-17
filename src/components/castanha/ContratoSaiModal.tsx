import type { Contrato } from '@/lib/castanha/negocio';
import { resumoContrato } from './RegistrarContratoModal';
import { Botao, Modal } from './ui';

/** Card saindo de Ganho/Fechado com contrato ativo: o contrato continua valendo? */
export function ContratoSaiModal({
  nome,
  contrato,
  salvando,
  onManter,
  onCancelarContrato,
  onVoltar,
}: {
  nome: string;
  contrato: Contrato;
  salvando: boolean;
  onManter: () => void;
  onCancelarContrato: () => void;
  onVoltar: () => void;
}) {
  return (
    <Modal
      largura="sm"
      titulo="O contrato continua valendo?"
      subtitulo={nome}
      onClose={onVoltar}
      rodape={
        <>
          <Botao tipo="perigo" onClick={onCancelarContrato} carregando={salvando}>
            Cancelar contrato
          </Botao>
          <Botao onClick={onManter} disabled={salvando}>
            Manter contrato
          </Botao>
        </>
      }
    >
      <div className="grid gap-3">
        <p className="text-[15px] text-[#1A1A1A]/75">
          Este card tem um contrato ativo. Se ele saiu de Ganho por engano, mantenha. Se a venda não aconteceu,
          cancele: o contrato deixa de contar na receita.
        </p>
        <div className="rounded-2xl bg-[#FFF8F2] px-4 py-3">
          <p className="font-black">{contrato.servico}</p>
          <p className="text-sm text-[#1A1A1A]/60">{resumoContrato(contrato)}</p>
        </div>
      </div>
    </Modal>
  );
}
