import { useState, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';
import { BotaoWhatsapp } from './BotaoWhatsapp';
import type { AdminOption } from '@/lib/crm-types';
import {
  ETAPAS_FB,
  MOTIVOS_PERDA,
  formatarData,
  validarCampos,
  whatsappLink,
  type CamposEditaveis,
  type FbLead,
} from '@/lib/castanha/fb-leads';
import { PlataformaIcon } from './FbLeadCard';

const inputCls =
  'w-full rounded-xl border-2 border-[#e3e7f7] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#E97933]';

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-[#FFF8F2] p-4">
      <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-[#E97933]">{titulo}</h4>
      <dl className="grid gap-2">{children}</dl>
    </section>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  if (valor === '' || valor === null || valor === undefined) return null;
  return (
    <div>
      <dt className="text-[11px] font-black uppercase tracking-wide text-[#1A1A1A]/45">{rotulo}</dt>
      <dd className="text-sm font-medium text-[#1A1A1A] break-words">{valor}</dd>
    </div>
  );
}

function Rotulo({ texto, children }: { texto: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-[#1A1A1A]/50">{texto}</span>
      {children}
    </label>
  );
}

function plataformaNome(p: string) {
  const v = p.toLowerCase();
  if (v === 'fb' || v === 'facebook') return 'Facebook';
  if (v === 'ig' || v === 'instagram') return 'Instagram';
  return p;
}

export function FbLeadDetail({
  lead,
  admins,
  etapaInicial,
  saving,
  onSave,
  onClose,
  onRegistrarContrato,
  mensagem,
}: {
  lead: FbLead;
  admins: AdminOption[];
  /** Etapa pré-selecionada (ex.: ao soltar o card em "Perdido"). */
  etapaInicial?: string;
  saving: boolean;
  onSave: (campos: CamposEditaveis) => void;
  onClose: () => void;
  /** Quando o lead está em Ganho sem contrato. */
  onRegistrarContrato?: () => void;
  mensagem?: string;
}) {
  const [form, setForm] = useState({
    etapa: etapaInicial ?? lead.etapa,
    responsavel: lead.responsavel,
    proximoPasso: lead.proximoPasso,
    dataProximoPasso: lead.dataProximoPasso,
    motivoPerda: lead.motivoPerda,
    anotacoes: lead.anotacoes,
  });
  const [erro, setErro] = useState('');
  const wa = whatsappLink(lead.whatsapp);
  const outras = Object.entries(lead.outras);
  const set = (campo: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [campo]: v }));

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    const campos: CamposEditaveis = {};
    (Object.keys(form) as (keyof typeof form)[]).forEach((k) => {
      if (form[k] !== lead[k]) campos[k] = form[k];
    });
    const msg = validarCampos(lead, campos);
    if (msg) {
      setErro(msg);
      return;
    }
    if (Object.keys(campos).length === 0) {
      onClose();
      return;
    }
    onSave(campos);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1A1A1A]/70 p-3 md:p-10"
      onClick={onClose}
    >
      <div
        className="mt-4 w-full max-w-2xl rounded-3xl border-2 border-[#1A1A1A] bg-white p-5 md:p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Lead ${lead.nome}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-[#1A1A1A] break-words">{lead.nome || 'Sem nome'}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A]/50">
              <PlataformaIcon plataforma={lead.plataforma} /> Chegou em {formatarData(lead.chegouEm)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[#F0EAE3]" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {wa && (
          <BotaoWhatsapp numero={lead.whatsapp} mensagem={mensagem} tamanho="grande" rotulo={`Chamar no WhatsApp · ${lead.whatsapp}`} className="mb-4" />
        )}

        {onRegistrarContrato && (
          <button
            onClick={onRegistrarContrato}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1E8E3E] py-3 font-black text-[#1E8E3E] transition hover:bg-[#E3F4E8]"
          >
            Registrar contrato desta venda
          </button>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <Secao titulo="Respostas do formulário">
            <Campo rotulo="O que precisa" valor={lead.oQuePrecisa} />
            <Campo rotulo="Negócio" valor={lead.negocio} />
            <Campo rotulo="Fase do negócio" valor={lead.faseDoNegocio} />
            {!wa && <Campo rotulo="WhatsApp" valor={lead.whatsapp} />}
          </Secao>
          <Secao titulo="Origem">
            <Campo rotulo="Campanha" valor={lead.campanha} />
            <Campo rotulo="Público" valor={lead.publico} />
            <Campo rotulo="Anúncio" valor={lead.anuncio} />
            <Campo rotulo="Formulário" valor={lead.formulario} />
            <Campo rotulo="Plataforma" valor={plataformaNome(lead.plataforma)} />
            <Campo rotulo="Origem" valor={lead.organico ? (lead.organico === 'true' ? 'Orgânico' : 'Pago') : ''} />
            <Campo rotulo="Status no Meta" valor={lead.statusMeta} />
          </Secao>
        </div>

        {outras.length > 0 && (
          <div className="mt-3">
            <Secao titulo="Outras respostas">
              {outras.map(([pergunta, resposta]) => (
                <Campo key={pergunta} rotulo={pergunta.replace(/_/g, ' ')} valor={resposta} />
              ))}
            </Secao>
          </div>
        )}

        <form onSubmit={salvar} className="mt-4 grid gap-3 rounded-2xl border-2 border-[#1A1A1A]/10 p-4">
          <h4 className="text-xs font-black uppercase tracking-wide text-[#E97933]">Andamento</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Rotulo texto="Etapa">
              <select value={form.etapa} onChange={(e) => set('etapa')(e.target.value)} className={inputCls}>
                {ETAPAS_FB.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </Rotulo>
            <Rotulo texto="Responsável">
              {admins.length > 0 ? (
                <select value={form.responsavel} onChange={(e) => set('responsavel')(e.target.value)} className={inputCls}>
                  <option value="">Ninguém ainda</option>
                  {admins.map((a) => (
                    <option key={a.codigo} value={a.nome}>
                      {a.nome}
                    </option>
                  ))}
                  {form.responsavel && !admins.some((a) => a.nome === form.responsavel) && (
                    <option value={form.responsavel}>{form.responsavel}</option>
                  )}
                </select>
              ) : (
                <input value={form.responsavel} onChange={(e) => set('responsavel')(e.target.value)} className={inputCls} />
              )}
            </Rotulo>
          </div>

          {form.etapa === 'Perdido' && (
            <Rotulo texto="Motivo da perda *">
              <select
                value={form.motivoPerda}
                onChange={(e) => {
                  set('motivoPerda')(e.target.value);
                  setErro('');
                }}
                className={inputCls}
                autoFocus
              >
                <option value="">Selecione…</option>
                {MOTIVOS_PERDA.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Rotulo>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
            <Rotulo texto="Próximo passo">
              <input
                value={form.proximoPasso}
                onChange={(e) => set('proximoPasso')(e.target.value)}
                placeholder="Ex.: mandar proposta"
                maxLength={5000}
                className={inputCls}
              />
            </Rotulo>
            <Rotulo texto="Quando">
              <input
                type="date"
                value={form.dataProximoPasso}
                onChange={(e) => set('dataProximoPasso')(e.target.value)}
                className={inputCls}
              />
            </Rotulo>
          </div>

          <Rotulo texto="Anotações">
            <textarea
              value={form.anotacoes}
              onChange={(e) => set('anotacoes')(e.target.value)}
              rows={4}
              maxLength={5000}
              className={`${inputCls} resize-y`}
            />
          </Rotulo>

          {lead.atualizadoPor && (
            <p className="text-[11px] font-medium text-[#1A1A1A]/45">
              Atualizado por {lead.atualizadoPor} em {formatarData(lead.atualizadoEm)}
            </p>
          )}
          {erro && <p className="text-sm font-bold text-[#D93025]">{erro}</p>}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#1A1A1A] bg-[#E97933] px-5 py-2.5 font-black text-[#1A1A1A] transition hover:bg-[#d4692a] disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />} Salvar
          </button>
        </form>

        <details className="mt-4 text-xs text-[#1A1A1A]/50">
          <summary className="cursor-pointer font-bold">Dados técnicos</summary>
          <dl className="mt-2 grid gap-1 font-mono break-all">
            <div>Lead: {lead.id}</div>
            <div>Anúncio: {lead.anuncioId || '—'}</div>
            <div>Público: {lead.publicoId || '—'}</div>
            <div>Campanha: {lead.campanhaId || '—'}</div>
            <div>Formulário: {lead.formularioId || '—'}</div>
          </dl>
        </details>
      </div>
    </div>
  );
}
