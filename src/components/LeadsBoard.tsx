import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, X, Trash2, Phone, Tag as TagIcon, Loader2 } from 'lucide-react';

const API_URL =
  'https://script.google.com/macros/s/AKfycbxWj5evgdS-hU7GDfwdGLHDxpvcxL47_H32V-Z7km2eSb3PWuxJVX6HPoNjPi-6GTfU/exec';

const COLUNAS = [
  'Novo Lead',
  'Contato Feito',
  'Proposta Enviada',
  'Negociando',
  'Fechado',
  'Perdido',
] as const;

const PRIORIDADES = ['Baixa', 'Média', 'Alta'] as const;

const PRIORIDADE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Alta: { bg: '#FFF0E6', color: '#B5540E', border: '#E97933' },
  Média: { bg: '#EAF1F8', color: '#1E4266', border: '#2D5F8A' },
  Baixa: { bg: '#F1F1F1', color: '#5A5A5A', border: '#C9CCD1' },
};

interface Deal {
  id: string;
  cliente: string;
  servico: string;
  valor: string;
  responsavel: string;
  prioridade: string;
  coluna: string;
  ultimoContato: string;
  contato: string;
  tags: string[];
  obs: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

const emptyForm = {
  cliente: '',
  servico: '',
  valor: '',
  responsavel: '',
  prioridade: 'Média' as string,
  coluna: COLUNAS[0] as string,
  ultimoContato: '',
  contato: '',
  tags: '',
  obs: '',
};

export function LeadsBoard({ userName }: { userName: string }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadDeals();
  }, []);

  async function loadDeals() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}?action=getDeals`);
      const json = await res.json();
      if (json.ok) {
        setDeals(
          (json.deals ?? []).map((d: Deal) => ({
            ...d,
            tags: Array.isArray(d.tags) ? d.tags : [],
          }))
        );
      } else {
        setError(json.error || 'Não foi possível carregar os leads.');
      }
    } catch {
      setError('Erro de conexão ao carregar os leads.');
    } finally {
      setLoading(false);
    }
  }

  async function persist(nextDeals: Deal[]) {
    setDeals(nextDeals);
    setSaving(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        // text/plain evita o preflight CORS (Apps Script não responde OPTIONS)
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveDeals', deals: nextDeals, user: userName }),
      });
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function openNewModal(coluna: string) {
    setEditingId(null);
    setForm({ ...emptyForm, coluna });
    setModalOpen(true);
  }

  function openEditModal(deal: Deal) {
    setEditingId(deal.id);
    setForm({
      cliente: deal.cliente ?? '',
      servico: deal.servico ?? '',
      valor: deal.valor ?? '',
      responsavel: deal.responsavel ?? '',
      prioridade: deal.prioridade || 'Média',
      coluna: deal.coluna || COLUNAS[0],
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
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente.trim()) return;

    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingId) {
      const next = deals.map((d) =>
        d.id === editingId
          ? { ...d, ...form, tags, updatedBy: userName, updatedAt: new Date().toISOString() }
          : d
      );
      await persist(next);
    } else {
      const newDeal: Deal = {
        id: `deal_${Date.now()}`,
        ...form,
        tags,
        createdBy: userName,
        createdAt: new Date().toISOString(),
        updatedBy: userName,
        updatedAt: new Date().toISOString(),
      };
      await persist([...deals, newDeal]);
    }
    closeModal();
  }

  async function handleDelete() {
    if (!editingId) return;
    const next = deals.filter((d) => d.id !== editingId);
    setDeals(next);
    setSaving(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteDeal', id: editingId }),
      });
    } catch {
      setError('Não foi possível excluir. Tente novamente.');
    } finally {
      setSaving(false);
    }
    closeModal();
  }

  function handleDrop(coluna: string, dealId: string) {
    const next = deals.map((d) =>
      d.id === dealId ? { ...d, coluna, updatedBy: userName, updatedAt: new Date().toISOString() } : d
    );
    void persist(next);
  }

  const grouped = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    COLUNAS.forEach((c) => (map[c] = []));
    deals.forEach((d) => {
      const col = COLUNAS.includes(d.coluna as (typeof COLUNAS)[number]) ? d.coluna : COLUNAS[0];
      map[col].push(d);
    });
    return map;
  }, [deals]);

  return (
    <div className="px-5 py-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-black text-[#1A1A1A]">Leads</h2>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">
              {deals.length} lead{deals.length === 1 ? '' : 's'} no funil
              {saving && <span className="ml-2 text-[#E97933]">salvando...</span>}
            </p>
          </div>
          <button
            onClick={() => openNewModal(COLUNAS[0])}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1A1A1A] bg-[#E97933] px-5 py-2.5 font-black text-[#1A1A1A] transition hover:bg-[#d4692a]"
          >
            <Plus size={17} /> Novo Lead
          </button>
        </div>

        {error && (
          <p className="mb-4 text-sm font-bold" style={{ color: '#e77f89' }}>{error}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-[#1A1A1A]/40">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUNAS.map((coluna) => (
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
                  <h3 className="text-sm font-black text-[#1A1A1A]">{coluna}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#1A1A1A]/50">
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
                {editingId ? 'Editar Lead' : 'Novo Lead'}
              </h3>
              <button onClick={closeModal} className="rounded-full p-1.5 hover:bg-[#F0EAE3]">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-3">
              <FormField label="Cliente *" value={form.cliente} onChange={(v) => setForm((f) => ({ ...f, cliente: v }))} required />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Serviço" value={form.servico} onChange={(v) => setForm((f) => ({ ...f, servico: v }))} />
                <FormField label="Valor" value={form.valor} onChange={(v) => setForm((f) => ({ ...f, valor: v }))} placeholder="R$ 0,00" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Responsável" value={form.responsavel} onChange={(v) => setForm((f) => ({ ...f, responsavel: v }))} />
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
                  {COLUNAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <FormField label="Contato (telefone/e-mail)" value={form.contato} onChange={(v) => setForm((f) => ({ ...f, contato: v }))} />
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
                  {editingId ? 'Salvar' : 'Criar Lead'}
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
