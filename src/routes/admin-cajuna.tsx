import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Eye, EyeOff, LogOut } from 'lucide-react';
import { LeadsBoard } from '@/components/LeadsBoard';

export const Route = createFileRoute('/admin-cajuna')({
  head: () => ({
    meta: [
      { title: 'Admin — Cajuna Studio' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AdminCajuna,
});

// Mesmo Apps Script da Área do Cliente (aba Usuarios). O acesso admin usa a
// mesma ação de login (action=login), só que exige tipo === 'admin'.
const API_URL =
  'https://script.google.com/macros/s/AKfycbxWj5evgdS-hU7GDfwdGLHDxpvcxL47_H32V-Z7km2eSb3PWuxJVX6HPoNjPi-6GTfU/exec';

interface AdminUser {
  nome: string;
  codigo_contrato: string;
  tipo: string;
}

function AdminCajuna() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        // text/plain evita o preflight CORS (Apps Script não responde OPTIONS)
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
      <header
        className="border-b-2 border-[#1A1A1A]"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
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

      <main>
        <LeadsBoard userName={adminUser?.nome ?? 'Admin'} />
      </main>
    </div>
  );
}
