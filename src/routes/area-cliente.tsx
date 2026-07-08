import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { SiteShell } from '@/components/SiteShell';
import {
  Home,
  User,
  FileText,
  Edit3,
  Folder,
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  Circle,
  ArrowRight,
} from 'lucide-react';

export const Route = createFileRoute('/area-cliente')({
  head: () => ({
    meta: [
      { title: 'Área do Cliente — Cajuna Studio' },
      { name: 'description', content: 'Acesso exclusivo para clientes Cajuna Studio.' },
    ],
  }),
  component: AreaCliente,
});

const API_URL =
  'https://script.google.com/macros/s/AKfycbxWj5evgdS-hU7GDfwdGLHDxpvcxL47_H32V-Z7km2eSb3PWuxJVX6HPoNjPi-6GTfU/exec';

type View = 'inicio' | 'perfil' | 'contratos' | 'briefing' | 'arquivos';

interface User {
  nome: string;
  codigo_contrato: string;
  tipo: string;
}

interface ClienteData {
  nome?: string;
  empresa?: string;
  servico?: string;
  status_projeto?: string;
  etapa_atual?: string;
  progresso?: string | number;
  status_contrato?: string;
  data_contrato?: string;
  proxima_reuniao?: string;
  mensagem_equipe?: string;
  briefing_status?: string;
  arquivos_links?: string;
  prazo_etapa?: string;
  email_contato?: string;
  briefing_json?: string;
  _prazo_info?: {
    atrasado: boolean;
    diasRestantes: number;
  } | null;
}

interface BriefingForm {
  marca: string;
  segmento: string;
  publico: string;
  palavras: string;
  referencias: string;
  cores: string;
  expectativa: string;
}

const navItems: { id: View; label: string }[] = [
  { id: 'inicio', label: 'Início' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'contratos', label: 'Contratos' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'arquivos', label: 'Arquivos' },
];

const ETAPAS = ['Briefing', 'Criação', 'Revisão', 'Entrega', 'Concluído'];

function AreaCliente() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clienteData, setClienteData] = useState<ClienteData>({});
  const [view, setView] = useState<View>('inicio');

  const [loginForm, setLoginForm] = useState({
    codigo_contrato: '',
    codigo_unico: '',
    showPwd: false,
  });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [briefingForm, setBriefingForm] = useState<BriefingForm>({
    marca: '',
    segmento: '',
    publico: '',
    palavras: '',
    referencias: '',
    cores: '',
    expectativa: '',
  });
  const [briefingSending, setBriefingSending] = useState(false);
  const [briefingMsg, setBriefingMsg] = useState('');

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadClienteData = useCallback(async (codigoContrato: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        API_URL + '?action=getClientePage&codigo=' + encodeURIComponent(codigoContrato),
      );
      const data = await res.json();
      if (data.ok) {
        setClienteData(data.cliente);
        if (data.cliente.briefing_json) {
          try {
            const bf = JSON.parse(data.cliente.briefing_json);
            setBriefingForm((prev) => ({ ...prev, ...bf }));
          } catch {}
        }
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem('cajuna_cliente_user');
    if (saved) {
      try {
        const user: User = JSON.parse(saved);
        setCurrentUser(user);
        setLoggedIn(true);
        loadClienteData(user.codigo_contrato);
      } catch {
        sessionStorage.removeItem('cajuna_cliente_user');
      }
    }
  }, [loadClienteData]);

  async function doLogin() {
    if (!loginForm.codigo_contrato || !loginForm.codigo_unico) {
      setLoginError('Preencha o Código de Contrato e o Código Único.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          codigo_contrato: loginForm.codigo_contrato,
          codigo_unico: loginForm.codigo_unico,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.tipo !== 'cliente') {
          setLoginError('Esta área é exclusiva para clientes.');
          setLoginLoading(false);
          return;
        }
        const user: User = {
          nome: data.nome,
          codigo_contrato: data.codigo_contrato,
          tipo: data.tipo,
        };
        sessionStorage.setItem('cajuna_cliente_user', JSON.stringify(user));
        setCurrentUser(user);
        setLoggedIn(true);
        await loadClienteData(data.codigo_contrato);
      } else {
        setLoginError(data.error || 'Credenciais inválidas.');
      }
    } catch {
      setLoginError('Erro de conexão. Tente novamente.');
    }
    setLoginLoading(false);
  }

  function doLogout() {
    sessionStorage.removeItem('cajuna_cliente_user');
    setLoggedIn(false);
    setCurrentUser(null);
    setClienteData({});
    setLoginForm({ codigo_contrato: '', codigo_unico: '', showPwd: false });
    setLoginError('');
    setView('inicio');
  }

  async function enviarBriefing() {
    if (!currentUser) return;
    setBriefingSending(true);
    setBriefingMsg('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveClientePage',
          codigo_contrato: currentUser.codigo_contrato,
          data: {
            briefing_json: JSON.stringify(briefingForm),
            briefing_status: 'Enviado',
            etapa_atual:
              clienteData.etapa_atual === 'Briefing' ? 'Criação' : clienteData.etapa_atual,
          },
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setBriefingMsg('Briefing enviado com sucesso! A equipe Cajuna já foi notificada.');
        setClienteData((prev) => ({
          ...prev,
          briefing_status: 'Enviado',
          etapa_atual: prev.etapa_atual === 'Briefing' ? 'Criação' : prev.etapa_atual,
        }));
      } else {
        setBriefingMsg('Erro ao enviar: ' + (d.error || 'tente novamente.'));
      }
    } catch {
      setBriefingMsg('Erro de conexão. Tente novamente.');
    }
    setBriefingSending(false);
  }

  // ── derived values ──
  const nomeExibido = clienteData.nome || currentUser?.nome || 'Cliente';
  const empresa = clienteData.empresa || '—';
  const servico = clienteData.servico || '—';
  const statusProjeto = clienteData.status_projeto || 'Em andamento';
  const etapaAtual = clienteData.etapa_atual || '—';
  const progresso = Number(clienteData.progresso) || 0;
  const statusContrato = clienteData.status_contrato || 'Pendente';
  const dataContrato = clienteData.data_contrato || '—';
  const proximaReuniao = clienteData.proxima_reuniao || 'A definir';
  const mensagemEquipe = clienteData.mensagem_equipe || '';
  const briefingStatus = clienteData.briefing_status || 'Pendente';
  const prazoInfo = clienteData._prazo_info || null;

  const arquivosLinks = (() => {
    const raw = clienteData.arquivos_links || '';
    if (!raw.trim()) return [];
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split('::');
        if (parts.length >= 2) {
          return { titulo: parts[0].trim(), url: parts.slice(1).join('::').trim() };
        }
        return { titulo: parts[0].trim(), url: parts[0].trim() };
      });
  })();

  const prazoLabel = (() => {
    if (!prazoInfo) return 'Sem prazo definido';
    if (prazoInfo.atrasado) return `Atrasado em ${Math.abs(prazoInfo.diasRestantes)} dia(s) útil(is)`;
    if (prazoInfo.diasRestantes === 0) return 'Vence hoje';
    return `${prazoInfo.diasRestantes} dia(s) útil(is) restante(s)`;
  })();

  const prazoDataFormatada = (() => {
    const raw = clienteData.prazo_etapa;
    if (!raw) return '';
    const d = new Date(String(raw).slice(0, 10) + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  })();

  const timelineSteps = ETAPAS.map((e, i) => {
    const ci = ETAPAS.indexOf(etapaAtual);
    return {
      label: e,
      state: i < ci ? 'done' : i === ci ? 'curr' : ('todo' as 'done' | 'curr' | 'todo'),
    };
  });

  const prazoBadge = (() => {
    if (!prazoInfo)
      return { cls: 'bg-[#f7f8fc] text-[#a0a6b5]', text: '—' };
    if (prazoInfo.atrasado)
      return { cls: 'bg-[#fde7ea] text-[#e77f89]', text: 'Atrasado' };
    if (prazoInfo.diasRestantes <= 1)
      return { cls: 'bg-[#fff3eb] text-[#E97933]', text: prazoInfo.diasRestantes === 0 ? 'Vence hoje' : 'Urgente' };
    return { cls: 'bg-[#d3e6ff] text-[#3a7ab5]', text: 'No prazo' };
  })();

  const contratoBadgeCls =
    statusContrato === 'Ativo'
      ? 'bg-[#e0fbf6] text-[#58c2a9]'
      : statusContrato === 'Encerrado'
        ? 'bg-[#fde7ea] text-[#e77f89]'
        : 'bg-[#fff3eb] text-[#E97933]';

  const briefingBadgeCls =
    briefingStatus === 'Validado'
      ? 'bg-[#e0fbf6] text-[#58c2a9]'
      : briefingStatus === 'Enviado'
        ? 'bg-[#d3e6ff] text-[#3a7ab5]'
        : 'bg-[#fff3eb] text-[#E97933]';

  const navIcon = (id: View, size = 15) => {
    const cls = `w-[${size}px] h-[${size}px] shrink-0`;
    if (id === 'inicio') return <Home size={size} className={cls} />;
    if (id === 'perfil') return <User size={size} className={cls} />;
    if (id === 'contratos') return <FileText size={size} className={cls} />;
    if (id === 'briefing') return <Edit3 size={size} className={cls} />;
    if (id === 'arquivos') return <Folder size={size} className={cls} />;
    return null;
  };

  // ══════════════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════════════
  if (!loggedIn) {
    return (
      <SiteShell>
        <section
          className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-16"
          style={{
            background:
              'linear-gradient(135deg, #1A1A1A 0%, #2D3748 40%, #1A1A1A 100%)',
          }}
        >
          <div
            className="w-full max-w-[380px] rounded-2xl p-9"
            style={{
              background: '#FFF8F2',
              border: '2px solid #1A1A1A',
              boxShadow: '6px 6px 0 #1A1A1A',
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-xl mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg,#c9611e,#E97933)', border: '2px solid #1A1A1A' }}
              >
                C
              </div>
              <h1 className="font-black text-xl text-[#1A1A1A]">Área do Cliente</h1>
              <p className="text-xs mt-1 text-[#1A1A1A]/50 font-medium">
                Cajuna Studio · Acesso Exclusivo
              </p>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/50 mb-1">
                  Código de Contrato
                </label>
                <input
                  value={loginForm.codigo_contrato}
                  onChange={(e) =>
                    setLoginForm((f) => ({
                      ...f,
                      codigo_contrato: e.target.value.toUpperCase(),
                    }))
                  }
                  onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                  type="text"
                  placeholder="Ex: CAJ-2026-001"
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#E97933] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/50 mb-1">
                  Código Único
                </label>
                <div className="relative">
                  <input
                    value={loginForm.codigo_unico}
                    onChange={(e) =>
                      setLoginForm((f) => ({ ...f, codigo_unico: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                    type={loginForm.showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm font-medium border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#E97933] transition-colors"
                  />
                  <button
                    onClick={() =>
                      setLoginForm((f) => ({ ...f, showPwd: !f.showPwd }))
                    }
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
                  >
                    {loginForm.showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="text-xs px-3 py-2 rounded-lg border-2 border-[#fbc9cd] bg-[#fde7ea] text-[#e77f89] font-medium">
                  {loginError}
                </div>
              )}

              <button
                onClick={doLogin}
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full font-black text-sm border-2 border-[#1A1A1A] bg-[#E97933] text-[#1A1A1A] hover:bg-[#d4692a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: '3px 3px 0 #1A1A1A' }}
              >
                {loginLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-[#1A1A1A]/30 border-t-[#1A1A1A] rounded-full animate-spin" />
                    Entrando…
                  </>
                ) : (
                  <>
                    Entrar <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-[11px] mt-6 text-[#1A1A1A]/35 font-medium">
              Área exclusiva para clientes Cajuna
            </p>
          </div>
        </section>
      </SiteShell>
    );
  }

  // ══════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════
  return (
    <SiteShell>
      <div className="min-h-[calc(100vh-128px)] flex" style={{ backgroundColor: '#FFF8F2' }}>

        {/* ── MOBILE overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          className={`fixed md:sticky top-0 md:top-16 z-40 md:z-auto h-screen md:h-[calc(100vh-64px)] flex flex-col shrink-0 transition-transform duration-200
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{
            width: 230,
            background: '#1A1A1A',
            borderRight: '2px solid #E97933',
          }}
        >
          {/* Logo area */}
          <div
            className="flex items-center gap-3 px-5 py-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#1A1A1A] font-black text-base shrink-0"
              style={{ background: '#E97933', border: '2px solid #E97933' }}
            >
              C
            </div>
            <div>
              <div className="text-[13px] font-black text-white">Cajuna Studio</div>
              <div className="text-[10px] text-white/40 font-medium">Área do Cliente</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold w-full text-left transition-all ${
                  view === item.id
                    ? 'bg-[#E97933] text-[#1A1A1A]'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {navIcon(item.id)}
                {item.label}
              </button>
            ))}
          </nav>

          {/* User chip */}
          <div
            className="px-3 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#1A1A1A] font-black text-xs shrink-0"
                style={{ background: '#E97933' }}
              >
                {nomeExibido[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-white truncate">
                  {nomeExibido}
                </div>
                <div className="text-[10px] text-white/40">
                  {currentUser?.codigo_contrato || 'Cliente'}
                </div>
              </div>
              <button
                onClick={doLogout}
                title="Sair"
                className="text-white/30 hover:text-[#e77f89] transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Mobile topbar */}
          <div
            className="md:hidden flex items-center gap-3 px-4 py-3 border-b-2 border-[#1A1A1A]"
            style={{ backgroundColor: '#1A1A1A' }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="text-white font-black text-sm">
              {navItems.find((n) => n.id === view)?.label}
            </span>
          </div>

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-[3px] border-[#E97933]/20 border-t-[#E97933] rounded-full animate-spin" />
                <p className="text-xs text-[#1A1A1A]/50 mt-3 font-medium">
                  Carregando seus dados…
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 md:p-8">

            {/* ── Page header ── */}
            <div className="mb-7">
              <h2 className="text-2xl font-black text-[#1A1A1A]">
                {navItems.find((n) => n.id === view)?.label}
              </h2>
              <div
                className="mt-1 h-1 w-10 rounded-full"
                style={{ background: '#E97933' }}
              />
            </div>

            {/* ════════════ INÍCIO ════════════ */}
            {view === 'inicio' && (
              <div className="space-y-6 max-w-3xl">

                {/* Mensagem da equipe */}
                {mensagemEquipe && (
                  <div
                    className="flex gap-3 items-start p-4 rounded-2xl"
                    style={{ background: '#fff8f2', border: '2px solid #ffd0b0' }}
                  >
                    <span className="text-xl shrink-0">📣</span>
                    <div>
                      <p className="text-[11px] font-black text-[#E97933] uppercase tracking-widest mb-1">
                        Recado da equipe Cajuna
                      </p>
                      <p className="text-sm text-[#1A1A1A]/80">{mensagemEquipe}</p>
                    </div>
                  </div>
                )}

                {/* Saudação */}
                <div>
                  <p className="text-lg font-black text-[#1A1A1A]">
                    Olá, {nomeExibido} 👋
                  </p>
                  <p className="text-sm text-[#1A1A1A]/50 mt-1 font-medium">
                    {empresa !== '—' ? empresa : 'Acompanhe o andamento do seu projeto aqui.'}
                  </p>
                </div>

                {/* Status cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Projeto', value: statusProjeto, bg: '#fff3eb', border: '#ffd0b0', color: '#E97933' },
                    { label: 'Etapa atual', value: etapaAtual, bg: '#e0fbf6', border: '#b0ede4', color: '#58c2a9' },
                    { label: 'Arquivos', value: String(arquivosLinks.length || '—'), bg: '#ece7fe', border: '#cfc0f9', color: '#8972f3' },
                    { label: 'Contrato', value: statusContrato, bg: '#d3e6ff', border: '#a8ccf5', color: '#3a7ab5' },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className="p-4 rounded-2xl"
                      style={{ background: c.bg, border: `2px solid ${c.border}` }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.color }}>
                        {c.label}
                      </p>
                      <p className="text-base font-black text-[#1A1A1A] mt-1">{c.value}</p>
                    </div>
                  ))}
                </div>

                {/* Prazo */}
                {prazoInfo && (
                  <div
                    className="p-4 rounded-2xl flex items-center justify-between gap-4"
                    style={{
                      background: prazoInfo.atrasado ? '#fde7ea' : prazoInfo.diasRestantes <= 1 ? '#fff8f2' : '#f0f6ff',
                      border: `2px solid ${prazoInfo.atrasado ? '#fbc9cd' : prazoInfo.diasRestantes <= 1 ? '#ffd0b0' : '#c5dafa'}`,
                    }}
                  >
                    <div>
                      <p
                        className="text-[11px] font-black uppercase tracking-widest mb-1"
                        style={{ color: prazoInfo.atrasado ? '#e77f89' : prazoInfo.diasRestantes <= 1 ? '#E97933' : '#3a7ab5' }}
                      >
                        {prazoInfo.atrasado ? '⚠️' : '📅'} Prazo da etapa {etapaAtual}
                      </p>
                      <p className="text-sm font-bold text-[#1A1A1A]">{prazoLabel}</p>
                      {prazoDataFormatada && (
                        <p className="text-[11px] text-[#1A1A1A]/40 mt-0.5">
                          Vencimento: {prazoDataFormatada}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-black px-3 py-1 rounded-full ${prazoBadge.cls}`}
                      style={{ border: '1.5px solid currentColor' }}
                    >
                      {prazoBadge.text}
                    </span>
                  </div>
                )}

                {/* Progresso */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-black text-[#1A1A1A]">Progresso do projeto</p>
                    <span className="text-sm font-black text-[#E97933]">{progresso}%</span>
                  </div>
                  <div className="h-2.5 bg-[#f0f0f0] rounded-full overflow-hidden border border-[#e3e7f7]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progresso}%`, background: '#E97933' }}
                    />
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-sm font-black text-[#1A1A1A] mb-4">Etapas do projeto</p>
                  <div
                    className="p-5 rounded-2xl space-y-4"
                    style={{ background: '#f5f8ff', border: '2px solid #e3e7f7' }}
                  >
                    {timelineSteps.map((step) => (
                      <div key={step.label} className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 ${
                            step.state === 'done'
                              ? 'bg-[#e0fbf6] text-[#58c2a9]'
                              : step.state === 'curr'
                                ? 'bg-[#E97933] text-[#1A1A1A]'
                                : 'bg-[#f7f8fc] text-[#a0a6b5]'
                          }`}
                          style={step.state === 'curr' ? { border: '2px solid #1A1A1A' } : {}}
                        >
                          {step.state === 'done' ? (
                            <CheckCircle size={14} />
                          ) : step.state === 'curr' ? (
                            '●'
                          ) : (
                            <Circle size={14} />
                          )}
                        </div>
                        <div>
                          <p
                            className="text-sm font-bold"
                            style={{
                              color:
                                step.state === 'done'
                                  ? '#1A1A1A'
                                  : step.state === 'curr'
                                    ? '#E97933'
                                    : '#a0a6b5',
                            }}
                          >
                            {step.label}
                          </p>
                          {step.state === 'curr' && (
                            <p className="text-[11px] text-[#1A1A1A]/40 font-medium">
                              Em andamento agora
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ════════════ PERFIL ════════════ */}
            {view === 'perfil' && (
              <div className="max-w-md space-y-5">
                <div
                  className="flex items-center gap-4 p-5 rounded-2xl"
                  style={{ background: '#f5f8ff', border: '2px solid #e3e7f7' }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-[#1A1A1A] font-black text-2xl shrink-0"
                    style={{ background: '#E97933', border: '2px solid #1A1A1A' }}
                  >
                    {nomeExibido[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-black text-[#1A1A1A]">{nomeExibido}</p>
                    <p className="text-xs text-[#1A1A1A]/40 font-medium">
                      {currentUser?.codigo_contrato}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#e0fbf6] text-[#58c2a9]">
                      Cliente Ativo
                    </span>
                  </div>
                </div>

                {[
                  { label: 'Nome', value: nomeExibido },
                  { label: 'Código de Contrato', value: currentUser?.codigo_contrato || '' },
                  ...(clienteData.email_contato
                    ? [{ label: 'E-mail de contato', value: clienteData.email_contato }]
                    : []),
                  ...(empresa !== '—' ? [{ label: 'Empresa', value: empresa }] : []),
                  ...(servico !== '—' ? [{ label: 'Serviço contratado', value: servico }] : []),
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 mb-1">
                      {f.label}
                    </label>
                    <input
                      value={f.value}
                      disabled
                      className="w-full rounded-xl px-4 py-3 text-sm font-medium border-2 border-[#e3e7f7] bg-[#f9fafb] text-[#1A1A1A]/60 cursor-not-allowed"
                    />
                  </div>
                ))}

                <p className="text-[11px] text-[#1A1A1A]/35 font-medium">
                  Para atualizar seus dados, entre em contato com a equipe Cajuna.
                </p>
              </div>
            )}

            {/* ════════════ CONTRATOS ════════════ */}
            {view === 'contratos' && (
              <div className="max-w-md space-y-4">
                {statusContrato !== 'Pendente' ? (
                  <div
                    className="p-5 rounded-2xl"
                    style={{
                      background: '#f5f8ff',
                      border: '2px solid #e3e7f7',
                      borderLeft: '4px solid #E97933',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-[#1A1A1A]">
                          Contrato · {servico !== '—' ? servico : 'Serviço Cajuna'}
                        </p>
                        <p className="text-xs text-[#1A1A1A]/40 font-medium mt-1">
                          {dataContrato !== '—'
                            ? `Assinado em ${dataContrato}`
                            : 'Data a confirmar'}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black px-3 py-1 rounded-full shrink-0 ${contratoBadgeCls}`}
                      >
                        {statusContrato}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-6 rounded-2xl text-center"
                    style={{ background: '#fafafa', border: '2px solid #e3e7f7' }}
                  >
                    <p className="text-sm text-[#1A1A1A]/40 font-medium">
                      ⏳ Contrato ainda não confirmado. A equipe entrará em contato em breve.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ════════════ BRIEFING ════════════ */}
            {view === 'briefing' && (
              <div className="max-w-xl space-y-5">
                {(briefingStatus === 'Enviado' || briefingStatus === 'Validado') && (
                  <div
                    className="flex gap-3 items-center p-4 rounded-2xl"
                    style={{ background: '#e0fbf6', border: '2px solid #b0ede4' }}
                  >
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-sm font-black text-[#58c2a9]">
                        Briefing {briefingStatus}!
                      </p>
                      <p className="text-xs text-[#5d8e84] font-medium mt-0.5">
                        A equipe Cajuna já recebeu suas informações.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className="flex gap-3 items-start p-4 rounded-2xl"
                  style={{ background: '#fff3eb', border: '2px solid #ffd0b0' }}
                >
                  <span className="text-lg shrink-0">ℹ️</span>
                  <div>
                    <p className="text-[12px] font-black text-[#E97933]">
                      Briefing de Identidade Visual
                    </p>
                    <p className="text-[11px] text-[#a07040] font-medium mt-0.5">
                      Responda com cuidado — essas informações guiam todo o processo criativo.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'marca', label: 'Nome da marca / empresa *', placeholder: 'Ex: Minha Marca LTDA', type: 'input' },
                    { key: 'segmento', label: 'Segmento / mercado *', placeholder: 'Ex: Moda, Tecnologia, Saúde…', type: 'input' },
                    { key: 'publico', label: 'Público-alvo', placeholder: 'Descreva o público que você quer atingir…', type: 'textarea' },
                    { key: 'palavras', label: 'Palavras que descrevem sua marca', placeholder: 'Ex: moderno, aconchegante, sofisticado…', type: 'input' },
                    { key: 'referencias', label: 'Referências visuais (links ou descrição)', placeholder: 'Cole links de referência ou descreva o estilo visual que admira…', type: 'textarea' },
                    { key: 'cores', label: 'Cores de preferência (se houver)', placeholder: 'Ex: azul e dourado, tons terrosos…', type: 'input' },
                    { key: 'expectativa', label: 'O que você espera da identidade visual?', placeholder: 'Objetivos, sentimentos, impressão que a marca deve causar…', type: 'textarea' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 mb-1">
                        {f.label}
                      </label>
                      {f.type === 'textarea' ? (
                        <textarea
                          value={briefingForm[f.key as keyof BriefingForm]}
                          onChange={(e) =>
                            setBriefingForm((prev) => ({
                              ...prev,
                              [f.key]: e.target.value,
                            }))
                          }
                          placeholder={f.placeholder}
                          rows={3}
                          className="w-full rounded-xl px-4 py-3 text-sm font-medium border-2 border-[#e3e7f7] bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#E97933] transition-colors resize-none"
                        />
                      ) : (
                        <input
                          value={briefingForm[f.key as keyof BriefingForm]}
                          onChange={(e) =>
                            setBriefingForm((prev) => ({
                              ...prev,
                              [f.key]: e.target.value,
                            }))
                          }
                          placeholder={f.placeholder}
                          className="w-full rounded-xl px-4 py-3 text-sm font-medium border-2 border-[#e3e7f7] bg-white text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#E97933] transition-colors"
                        />
                      )}
                    </div>
                  ))}

                  {briefingMsg && (
                    <div
                      className="text-xs px-3 py-2 rounded-xl font-medium"
                      style={
                        briefingMsg.includes('sucesso')
                          ? { background: '#e0fbf6', color: '#58c2a9', border: '1px solid #b0ede4' }
                          : { background: '#fde7ea', color: '#e77f89', border: '1px solid #fbc9cd' }
                      }
                    >
                      {briefingMsg}
                    </div>
                  )}

                  <button
                    onClick={enviarBriefing}
                    disabled={briefingSending}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full font-black text-sm border-2 border-[#1A1A1A] bg-[#E97933] text-[#1A1A1A] hover:bg-[#d4692a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '3px 3px 0 #1A1A1A' }}
                  >
                    {briefingSending ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-[#1A1A1A]/30 border-t-[#1A1A1A] rounded-full animate-spin" />
                        Enviando…
                      </>
                    ) : briefingStatus === 'Enviado' || briefingStatus === 'Validado' ? (
                      'Reenviar Briefing'
                    ) : (
                      <>
                        Enviar Briefing <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ════════════ ARQUIVOS ════════════ */}
            {view === 'arquivos' && (
              <div className="max-w-xl space-y-4">
                {arquivosLinks.length === 0 ? (
                  <div
                    className="p-10 rounded-2xl text-center"
                    style={{ background: '#f5f8ff', border: '2px dashed #c8cde8' }}
                  >
                    <p className="text-3xl mb-3">📂</p>
                    <p className="text-sm font-black text-[#1A1A1A]/60">
                      Nenhum arquivo entregue ainda
                    </p>
                    <p className="text-xs text-[#1A1A1A]/35 mt-1 font-medium">
                      A equipe Cajuna disponibilizará os arquivos aqui assim que prontos.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-black text-[#1A1A1A]">Arquivos disponíveis</p>
                    <div className="space-y-3">
                      {arquivosLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                          style={{ background: '#f5f8ff', border: '2px solid #e3e7f7', textDecoration: 'none' }}
                        >
                          <span className="text-2xl">📄</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-[#1A1A1A] truncate">
                              {link.titulo}
                            </p>
                            <p className="text-[11px] text-[#1A1A1A]/40 font-medium">
                              Clique para abrir
                            </p>
                          </div>
                          <ArrowRight size={15} className="text-[#E97933] shrink-0" />
                        </a>
                      ))}
                    </div>
                  </>
                )}
                <p className="text-xs text-[#1A1A1A]/30 font-medium">
                  Formatos: PDF, PNG, JPG, AI, SVG, ZIP
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT PANEL (desktop only) ── */}
        <aside
          className="hidden lg:flex flex-col shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto"
          style={{
            width: 260,
            borderLeft: '2px solid #e3e7f7',
            background: '#FFF8F2',
          }}
        >
          <div
            className="px-5 py-5 text-sm font-black text-[#1A1A1A]"
            style={{ borderBottom: '2px solid #e3e7f7' }}
          >
            Suporte &amp; Resumo
          </div>
          <div className="p-4 space-y-3 flex-1">

            {/* Próxima reunião */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: '#fff3eb', border: '2px solid #ffd0b0' }}
            >
              <p className="text-[11px] font-black text-[#E97933] uppercase tracking-widest mb-1">
                📅 Próxima reunião
              </p>
              <p className="text-sm font-bold text-[#1A1A1A]">{proximaReuniao}</p>
            </div>

            {/* Prazo */}
            {prazoInfo && (
              <div
                className="p-4 rounded-2xl"
                style={{
                  background: prazoInfo.atrasado ? '#fde7ea' : '#f0f6ff',
                  border: `2px solid ${prazoInfo.atrasado ? '#fbc9cd' : '#c5dafa'}`,
                }}
              >
                <p className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-widest mb-2">
                  Prazo da etapa
                </p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${prazoBadge.cls}`}>
                  {prazoLabel}
                </span>
                {prazoDataFormatada && (
                  <p className="text-[10px] text-[#1A1A1A]/40 font-medium mt-2">
                    {prazoDataFormatada}
                  </p>
                )}
              </div>
            )}

            {/* Status progresso */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: '#f5f8ff', border: '2px solid #e3e7f7' }}
            >
              <p className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-widest mb-2">
                Progresso
              </p>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-[#1A1A1A]/50">{etapaAtual}</span>
                <span className="text-[#E97933]">{progresso}%</span>
              </div>
              <div className="h-2 bg-[#e3e7f7] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progresso}%`, background: '#E97933' }}
                />
              </div>
            </div>

            {/* Briefing status */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: '#f5f8ff', border: '2px solid #e3e7f7' }}
            >
              <p className="text-[11px] font-black text-[#1A1A1A] uppercase tracking-widest mb-2">
                Briefing
              </p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${briefingBadgeCls}`}>
                {briefingStatus}
              </span>
            </div>

            {/* Suporte */}
            <div
              className="p-4 rounded-2xl"
              style={{ background: '#f5f8ff', border: '2px solid #e3e7f7' }}
            >
              <p className="text-[11px] font-black text-[#E97933] uppercase tracking-widest mb-1">
                Equipe Cajuna
              </p>
              <p className="text-[11px] text-[#1A1A1A]/50 font-medium mb-3">
                Dúvidas? Fale com a gente.
              </p>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-full border-2 border-[#1A1A1A] bg-[#E97933] text-[#1A1A1A] hover:bg-[#d4692a] transition-colors"
              >
                💬 WhatsApp
              </a>
            </div>

            {/* Logout */}
            <button
              onClick={doLogout}
              className="w-full p-3 rounded-2xl text-[12px] font-black text-[#e77f89] transition-all hover:bg-[#fff5f5]"
              style={{ border: '2px solid #e3e7f7', background: '#f5f8ff' }}
            >
              🚪 Sair da conta
            </button>
          </div>
        </aside>

      </div>
    </SiteShell>
  );
}
