import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL, formatPhoneBR } from '@/lib/masks';
import type { AdminOption, Deal } from '@/lib/crm-types';
import { Plus, X, Trash2, Phone, Tag as TagIcon, Loader2 } from 'lucide-react';

const PRIORIDADES = ['Baixa', 'Média', 'Alta'] as const;

const PRIORIDADE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Alta: { bg: '#FFF0E6', color: '#B5540E', border: '#E97933' },
  Média: { bg: '#EAF1F8', color: '#1E4266', border: '#2D5F8A' },
  Baixa: { bg: '#F1F1F1', color: '#5A5A5A', border: '#C9CCD1' },
};

function emptyForm(coluna: string, responsavel: string) {
  return {
    cliente: '',
    servico: '',
    valor: '',
    responsavel,
    prioridade: 'Média' as string,
    coluna,
    ultimoContato: '',
    contato: '',
    tags: '',
    obs: '',
  };
}

export function PipelineBoard({
  funil,
  columns,
  deals,
  admins,
  userName,
  loading,
  saving,
  onSave,
  onDelete,
}: {
  funil: string;
  columns: readonly string[];
  deals: Deal[];
  admins: AdminOption[];
  userName: string;
  loading: boolean;
  saving: boolean;
  onSave: (deal: Deal) => void;
  onDelete: (id: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm(columns[0], ''));
  const defaultResponsavel = admins[0]?.nome ?? '';

  function openNewModal(coluna: string) {
    setEditingId(null);
    setForm(emptyForm(coluna, defaultResponsavel));
    setModalOpen(true);
  }

  function openEditModal(deal: Deal) {
    setEditingId(deal.id);
    setForm({
      cliente: deal.cliente ?? '',
      servico: deal.servico ?? '',
      valor: deal.valor ?? '',
      responsavel: deal.responsavel ?? defaultResponsavel,
      prioridade: deal.prioridade || 'Média',
      coluna: deal.coluna || columns[0],
      ultimoContato: deal.ultimoContato ?? '',
      contato: deal.contato ?? '',
      tags: (deal.tags ?? []).join(', '),
      obs: deal.obs ?? '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente.trim()) return;

    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
    const now = new Date().toISOString();

    if (editingId) {
      const existing = deals.find((d) => d.id === editingId);
      onSave({
        ...(existing as Deal),
        ...form,
        tags,
        funil,
        updatedBy: userName,
        updatedAt: now,
      });
    } else {
      onSave({
        id: `deal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        funil,
        ...form,
        tags,
        createdBy: userName,
        createdAt: now,
        updatedBy: userName,
        updatedAt: now,
      });
    }
    closeModal();
  }

  function handleDelete() {
    if (!editingId) return;
    onDelete(editingId);
    closeModal();
  }

  function handleDrop(coluna: string, dealId: string) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    onSave({ ...deal, coluna, updatedBy: userName, updatedAt: new Date().toISOString() });
  }

  const grouped = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    columns.forEach((c) => (map[c] = []));
    deals.forEach((d) => {
      const col = columns.includes(d.coluna) ? d.coluna : columns[0];
      map[col].push(d);
    });
    return map;
  }, [deals, columns]);

  return (
    <div className="px-5 py-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#1A1A1A]">{funil}</h2>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">
              {deals.length} cartão{deals.length === 1 ? '' : 'ões'} neste funil
              {saving && <span className="ml-2 text-[#E97933]">salvando...</span>}
            </p>
          </div>
          <button
            onClick={() => openNewModal(columns[0])}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A1A] bg-[#E97933] px-5 py-2.5 font-black text-[#1A1A1A] transition hover:bg-[#d4692a]"
          >
            <Plus size={17} /> Novo
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#1A1A1A]/40">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((coluna) => (
              <div
                key={coluna}
                className="w-72 shrink-0 rounded-2xl border-2 border-[#1A1A1A]/10 bg-[#F0EAE3] p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const dealId = e.dataTransfer.getData('text/plain');
                  if (dealId) handleDrop(coluna, dealId);
                }}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-[#1A1A1A] leading-tight">{coluna}</h3>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#1A1A1A]/50">
                    {grouped[coluna]?.length ?? 0}
                  </span>
                </div>
                <div className="flex flex-col gap-3 min-h-[60px]">
                  {(grouped[coluna] ?? []).map((deal) => {
                    const pStyle = PRIORIDADE_STYLE[deal.prioridade] ?? PRIORIDADE_STYLE.Baixa;
                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', deal.id)}
                        onClick={() => openEditModal(deal)}
                        className="cursor-pointer rounded-2xl border-2 border-[#1A1A1A] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-black text-sm text-[#1A1A1A] leading-tight">{deal.cliente}</h4>
                          <span
                            className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase"
                            style={{ background: pStyle.bg, color: pStyle.color, borderColor: pStyle.border }}
                          >
                            {deal.prioridade || 'Baixa'}
                          </span>
                        </div>
                        {deal.servico && (
                          <p className="mt-1 text-xs font-bold text-[#E97933]">{deal.servico}</p>
                        )}
                        {deal.valor && (
                          <p className="mt-1 text-sm font-black text-[#1A1A1A]">{deal.valor}</p>
                        )}
                        {deal.contato && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#1A1A1A]/50 font-medium">
                            <Phone size={12} /> {deal.contato}
                          </p>
                        )}
                        {deal.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {deal.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-full bg-[#FFF3EB] px-2 py-0.5 text-[10px] font-bold text-[#E97933]"
                              >
                                <TagIcon size={9} /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {deal.responsavel && (
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#1A1A1A]/30">
                            {deal.responsavel}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => openNewModal(coluna)}
                    className="rounded-2xl border-2 border-dashed border-[#1A1A1A]/15 py-3 text-xs font-bold text-[#1A1A1A]/30 transition hover:border-[#E97933]/50 hover:text-[#E97933]"
                  >
                    + adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1A1A1A]/70 p-4 md:p-10"
          onClick={closeModal}
        >
          <div
            className="mt-6 w-full max-w-lg rounded-3xl border-2 border-[#1A1A1A] bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-black text-[#1A1A1A]">
                {editingId ? 'Editar' : 'Novo'} — {funil}
              </h3>
              <button onClick={closeModal} className="rounded-full p-1.5 hover:bg-[#F0EAE3]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-3">
              <FormField label="Cliente *" value={form.cliente} onChange={(v) => setForm((f) => ({ ...f, cliente: v }))} required />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Serviço / Pacote" value={form.servico} onChange={(v) => setForm((f) => ({ ...f, servico: v }))} />
                <FormField
                  label="Valor"
                  value={form.valor}
                  onChange={(v) => setForm((f) => ({ ...f, valor: formatCurrencyBRL(v) }))}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wide text-[#1A1A1A]/50">Responsável</span>
                  {admins.length > 0 ? (
                    <select
                      value={form.responsavel}
                      onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
                      className="w-full rounded-xl border-2 border-[#e3e7f7] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#E97933]"
                    >
                      <option value="">Selecione...</option>
                      {admins.map((a) => (
                        <option key={a.codigo} value={a.nome}>{a.nome}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.responsavel}
                      onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
                      className="w-full rounded-xl border-2 border-[#e3e7f7] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#E97933]"
                    />
                  )}
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-wide text-[#1A1A1A]/50">Prioridade</span>
                  <select
                    value={form.prioridade}
                    onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value }))}
                    className="w-full rounded-xl border-2 border-[#e3e7f7] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#E97933]"
                  >
                    {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-[#1A1A1A]/50">Etapa</span>
                <select
                  value={form.coluna}
                  onChange={(e) => setForm((f) => ({ ...f, coluna: e.target.value }))}
                  className="w-full rounded-xl border-2 border-[#e3e7f7] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#E97933]"
                >
                  {columns.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <FormField
                label="Telefone"
                value={form.contato}
                onChange={(v) => setForm((f) => ({ ...f, contato: formatPhoneBR(v) }))}
                placeholder="(84) 9 9999-9999"
              />
              <FormField label="Tags (separadas por vírgula)" value={form.tags} onChange={(v) => setForm((f) => ({ ...f, tags: v }))} placeholder="instagram, indicação" />
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-wide text-[#1A1A1A]/50">Observações</span>
                <textarea
                  value={form.obs}
                  onChange={(e) => setForm((f) => ({ ...f, obs: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border-2 border-[#e3e7f7] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#E97933] resize-none"
                />
              </label>

              <div className="mt-2 flex items-center justify-between gap-3">
                {editingId ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#e77f89]/40 px-4 py-2.5 text-sm font-bold text-[#e77f89] transition hover:bg-[#e77f89]/10"
                  >
                    <Trash2 size={15} /> Excluir
                  </button>
                ) : <span />}
                <button
                  type="submit"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A1A] bg-[#E97933] px-6 py-2.5 font-black text-[#1A1A1A] transition hover:bg-[#d4692a]'
                  )}
                >
                  {editingId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label, value, onChange, placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-black uppercase tracking-wide text-[#1A1A1A]/50">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border-2 border-[#e3e7f7] bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-[#E97933]"
      />
    </label>
  );
}
