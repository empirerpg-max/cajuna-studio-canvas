import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, LogOut } from 'lucide-react';
import { PipelineBoard } from '@/components/PipelineBoard';
import { Overview } from '@/components/Overview';
import { FUNIS, type AdminOption, type Deal } from '@/lib/crm-types';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/admin-cajuna')({
  head: () => ({
    meta: [
      { title: 'Admin — Cajuna Studio' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminCajuna,
});

// Mesmo Apps Script da Área do Cliente (aba Usuarios / Deals). O acesso
// admin usa a mesma ação de login (action=login), só que exige tipo === 'admin'.
const API_URL =
  'https://script.google.com/macros/s/AKfycbxWj5evgdS-hU7GDfwdGLHDxpvcxL47_H32V-Z7km2eSb3PWuxJVX6HPoNjPi-6GTfU/exec';

interface AdminUser {
  nome: string;
  codigo_contrato: string;
  tipo: string;
}

const TABS = ['Visão Geral', ...FUNIS.map((f) => f.key)] as const;

function AdminCajuna() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Visão Geral');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    void loadDeals();
    void loadAdmins();
  }, [loggedIn]);

  async function loadDeals() {
    setDealsLoading(true);
    try {
      const res = await fetch(`${API_URL}?action=getDeals`);
      const json = await res.json();
      if (json.ok) {
        setDeals(
          (json.deals ?? []).map((d: Deal) => ({
            ...d,
            funil: d.funil || 'Leads',
            tags: Array.isArray(d.tags) ? d.tags : [],
          }))
        );
      }
    } catch {
      // silently fail — a UI mostra 0 cartões
    } finally {
      setDealsLoading(false);
    }
  }

  async function loadAdmins() {
    try {
      const res = await fetch(`${API_URL}?action=getAdmins`);
      const json = await res.json();
      if (json.ok) setAdmins(json.admins ?? []);
    } catch {
      // fallback: campo de responsável vira texto livre
    }
  }

  async function persistDeals(next: Deal[]) {
    setDeals(next);
    setSaving(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        // text/plain evita o preflight CORS (Apps Script não responde OPTIONS)
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveDeals', deals: next, user: adminUser?.nome }),
      });
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  function handleSaveDeal(deal: Deal) {
    const exists = deals.some((d) => d.id === deal.id);
    const next = exists ? deals.map((d) => (d.id === deal.id ? deal : d)) : [...deals, deal];
    void persistDeals(next);
  }

  async function handleDeleteDeal(id: string) {
    const next = deals.filter((d) => d.id !== id);
    setDeals(next);
    setSaving(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteDeal', id }),
      });
    } catch {
      setError('Não foi possível excluir. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const u = usuario.trim();
    const s = senha.trim();
    if (!u || !s) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', codigo_contrato: u, codigo_unico: s }),
      });
      const json = await res.json();
      if (json.ok && String(json.tipo).toLowerCase() === 'admin') {
        setAdminUser({ nome: json.nome, codigo_contrato: json.codigo_contrato, tipo: json.tipo });
        setLoggedIn(true);
      } else if (json.ok) {
        setError('Acesso restrito a administradores.');
      } else {
        setError(json.error || 'Usuário ou senha incorretos.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setLoggedIn(false);
    setAdminUser(null);
    setUsuario('');
    setSenha('');
  }

  if (!loggedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🛠️</div>
            <h1 className="text-3xl font-black text-white">Painel Admin</h1>
            <p className="mt-2 text-white/50">Acesso restrito à equipe Cajuna Studio.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Usuário"
              autoComplete="off"
              className="w-full rounded-2xl border-2 bg-white px-5 py-4 text-base font-medium text-[#1A1A1A] outline-none transition focus:border-[#E97933]"
              style={{ borderColor: error ? '#e77f89' : 'transparent' }}
            />
            <div className="relative">
              <input
                type={showSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha"
                autoComplete="off"
                className="w-full rounded-2xl border-2 bg-white px-5 py-4 pr-12 text-base font-medium text-[#1A1A1A] outline-none transition focus:border-[#E97933]"
                style={{ borderColor: error ? '#e77f89' : 'transparent' }}
              />
              <button
                type="button"
                onClick={() => setShowSenha((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 transition"
                aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p className="text-sm font-bold text-center" style={{ color: '#ff8a95' }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-4 font-black text-[#1A1A1A] shadow transition hover:opacity-90 disabled:opacity-60"
              style={{ background: '#E97933' }}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8F2' }}>
      <header className="border-b-2 border-[#1A1A1A]" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="mx-auto max-w-[1500px] px-5 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-white font-black">Painel Admin</h1>
            <p className="text-white/40 text-xs font-medium">Olá, {adminUser?.nome}</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-[#E97933]/60 hover:text-white"
          >
            <LogOut size={15} /> Sair
          </button>
        </div>
      </header>

      <nav className="border-b-2 border-[#1A1A1A]/10 bg-white overflow-x-auto">
        <div className="mx-auto flex max-w-[1500px] gap-1 px-5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'whitespace-nowrap px-4 py-3 text-sm font-bold border-b-2 transition',
                activeTab === tab
                  ? 'border-[#E97933] text-[#E97933]'
                  : 'border-transparent text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {error && (
        <p className="px-5 pt-4 text-sm font-bold" style={{ color: '#e77f89' }}>{error}</p>
      )}

      <main>
        {activeTab === 'Visão Geral' ? (
          <Overview deals={deals} funis={FUNIS} />
        ) : (
          (() => {
            const funil = FUNIS.find((f) => f.key === activeTab)!;
            return (
              <PipelineBoard
                funil={funil.key}
                columns={funil.columns}
                deals={deals.filter((d) => (d.funil || 'Leads') === funil.key)}
                admins={admins}
                userName={adminUser?.nome ?? 'Admin'}
                loading={dealsLoading}
                saving={saving}
                onSave={handleSaveDeal}
                onDelete={handleDeleteDeal}
              />
            );
          })()
        )}
      </main>
    </div>
  );
}
