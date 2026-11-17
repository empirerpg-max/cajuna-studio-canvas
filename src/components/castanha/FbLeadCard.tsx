import { AlertTriangle, Facebook, Instagram, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  novoAtrasado,
  proximoPassoVencido,
  tempoDesde,
  whatsappLink,
  type FbLead,
} from '@/lib/castanha/fb-leads';

export function PlataformaIcon({ plataforma, size = 14 }: { plataforma: string; size?: number }) {
  const p = plataforma.toLowerCase();
  if (p === 'fb' || p === 'facebook') return <Facebook size={size} aria-label="Facebook" className="text-[#1877F2]" />;
  if (p === 'ig' || p === 'instagram') return <Instagram size={size} aria-label="Instagram" className="text-[#C13584]" />;
  return null;
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor) return null;
  return (
    <p className="mt-1 text-xs leading-snug text-[#1A1A1A]/70">
      <span className="font-black text-[#1A1A1A]/45">{rotulo}</span> {valor}
    </p>
  );
}

export function FbLeadCard({
  lead,
  now,
  hoje,
  onOpen,
}: {
  lead: FbLead;
  now: number;
  hoje: string;
  onOpen: (lead: FbLead) => void;
}) {
  const atrasadoNovo = novoAtrasado(lead, now);
  const vencido = proximoPassoVencido(lead, hoje);
  const wa = whatsappLink(lead.whatsapp);

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', lead.id)}
      onClick={() => onOpen(lead)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(lead);
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        'cursor-pointer rounded-2xl border-2 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E97933]',
        vencido ? 'border-[#E97933]' : 'border-[#1A1A1A]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-black text-sm text-[#1A1A1A] leading-tight break-words">{lead.nome || 'Sem nome'}</h4>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={cn('text-[11px] font-bold', atrasadoNovo ? 'text-[#D93025]' : 'text-[#1A1A1A]/45')}>
            {tempoDesde(lead.chegouEm, now)}
          </span>
          <PlataformaIcon plataforma={lead.plataforma} />
        </div>
      </div>

      <Linha rotulo="Negócio:" valor={lead.negocio} />
      <Linha rotulo="Precisa:" valor={lead.oQuePrecisa} />
      <Linha rotulo="Fase:" valor={lead.faseDoNegocio} />

      {(lead.campanha || lead.teste || vencido) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {vencido && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0E6] px-2 py-0.5 text-[10px] font-black uppercase text-[#B5540E]">
              <AlertTriangle size={10} /> Atrasado
            </span>
          )}
          {lead.teste && (
            <span className="rounded-full bg-[#F1F1F1] px-2 py-0.5 text-[10px] font-black uppercase text-[#5A5A5A]">
              Teste
            </span>
          )}
          {lead.campanha && (
            <span className="max-w-full truncate rounded-full bg-[#EAF1F8] px-2 py-0.5 text-[10px] font-bold text-[#1E4266]">
              {lead.campanha}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#1ebe5b]"
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
        ) : (
          <span />
        )}
        {lead.responsavel && (
          <span className="inline-flex items-center gap-1 truncate text-[11px] font-bold text-[#1A1A1A]/50">
            <User size={11} /> {lead.responsavel}
          </span>
        )}
      </div>
    </div>
  );
}
