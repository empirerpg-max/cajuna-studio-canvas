import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SiteShell } from '@/components/SiteShell';
import { BriefingWizard, type ClienteUser } from '@/components/BriefingWizard';
import { cn } from '@/lib/utils';
import {
  LogOut,
  Eye,
  EyeOff,
  CheckCircle,
  CheckCircle2,
  UserCircle,
  Download,
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
  _prazo_info?: { atrasado: boolean; diasRestantes: number } | null;
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
  const [clienteUser, setClienteUser] = useState<ClienteUser | null>(null);
  const [clienteData, setClienteData] = useState<ClienteData | null>(null);
  const [view, setView] = useState<View>('inicio');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [codigo, setCodigo] = useState('');
  const [showCodigo, setShowCodigo] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [briefingStatus, setBriefingStatus] = useState('pendente');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    setLoadingLogin(true);
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}?action=login&codigo=${encodeURIComponent(codigo.trim())}`);
      const json = await res.json();
      if (json.success && json.cliente) {
        setClienteUser(json.cliente);
        setLoggedIn(true);
        fetchClienteData(json.cliente.codigo_contrato);
        setBriefingStatus(json.cliente.briefing_status ?? 'pendente');
      } else {
        setLoginError('Código não encontrado. Verifique e tente novamente.');
      }
    } catch {
      setLoginError('Erro de conexão. Tente novamente.');
    } finally {
      setLoadingLogin(false);
    }
  }

  async function fetchClienteData(codigoContrato: string) {
    setLoadingData(true);
    try {
      const res = await fetch(`${API_URL}?action=cliente&codigo=${encodeURIComponent(codigoContrato)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setClienteData(json.data);
        setBriefingStatus(json.data.briefing_status ?? 'pendente');
      }
    } catch {
      // silently fail
    } finally {
      setLoadingData(false);
    }
  }

  function handleLogout() {
    setLoggedIn(false);
    setClienteUser(null);
    setClienteData(null);
    setCodigo('');
    setView('inicio');
    setBriefingStatus('pendente');
  }

  if (!loggedIn) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-md px-5 py-24">
          <div className="text-center mb-10">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-3xl font-black text-[#1A1A1A]">Área do Cliente</h1>
            <p className="mt-2 text-[#1A1A1A]/60">Digite seu código de contrato para acessar.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showCodigo ? 'text' : 'password'}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Código do contrato"
                className="w-full rounded-2xl border-2 bg-white px-5 py-4 pr-12 text-base font-medium text-[#1A1A1A] outline-none transition focus:border-[#E97933]"
                style={{ borderColor: loginError ? '#e77f89' : '#e3e7f7' }}
              />
              <button
                type="button"
                onClick={() => setShowCodigo((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 transition"
              >
                {showCodigo ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {loginError && <p className="text-sm font-bold text-[#e77f89]">{loginError}</p>}
            <button
              type="submit"
              disabled={loadingLogin}
              className="w-full rounded-2xl py-4 font-black text-white shadow transition hover:opacity-90 disabled:opacity-60"
              style={{ background: '#E97933' }}
            >
              {loadingLogin ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </section>
      </SiteShell>
    );
  }

  const etapaIndex = ETAPAS.indexOf(clienteData?.etapa_atual ?? 'Briefing');
  const progresso = typeof clienteData?.progresso === 'number'
    ? clienteData.progresso
    : parseInt(String(clienteData?.progresso ?? '0'), 10) || 0;

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">
              Olá, {clienteUser?.nome?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-[#1A1A1A]/50 font-medium">
              Contrato: {clienteUser?.codigo_contrato}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold text-[#1A1A1A]/60 transition hover:border-[#E97933]/40"
            style={{ borderColor: '#e3e7f7' }}
          >
            <LogOut size={15} /> Sair
          </button>
        </div>

        <nav className="mb-8 flex gap-1 overflow-x-auto rounded-2xl border p-1" style={{ borderColor: '#e3e7f7' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                'flex-1 min-w-fit rounded-xl px-4 py-2 text-sm font-bold transition whitespace-nowrap',
                view === item.id
                  ? 'bg-[#E97933] text-white shadow'
                  : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'inicio' && (
              <div className="space-y-4">
                {loadingData ? (
                  <div className="rounded-2xl border p-8 text-center text-[#1A1A1A]/40 font-medium" style={{ borderColor: '#e3e7f7' }}>
                    Carregando seus dados...
                  </div>
                ) : (
                  <>
                    <div className="rounded-2xl border p-6" style={{ borderColor: '#e3e7f7' }}>
                      <h2 className="font-black text-[#1A1A1A] mb-4">Status do Projeto</h2>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl font-black" style={{ color: '#E97933' }}>
                          {clienteData?.etapa_atual ?? 'Briefing'}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: '#FFF3EB', color: '#E97933' }}>
                          {clienteData?.status_projeto ?? 'Em andamento'}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${progresso}%`, background: '#E97933' }}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs font-bold text-[#1A1A1A]/40">{progresso}%</p>
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                        {ETAPAS.map((etapa, i) => (
                          <div key={etapa} className="flex min-w-fit flex-col items-center gap-1">
                            <div
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-black',
                                i < etapaIndex
                                  ? 'bg-[#E97933] text-white'
                                  : i === etapaIndex
                                  ? 'border-2 border-[#E97933] text-[#E97933]'
                                  : 'bg-[#f0f0f0] text-[#1A1A1A]/30'
                              )}
                            >
                              {i < etapaIndex ? <CheckCircle size={14} /> : i + 1}
                            </div>
                            <span className="text-[10px] font-bold text-[#1A1A1A]/50">{etapa}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {clienteData?.mensagem_equipe && (
                      <div className="rounded-2xl border p-5" style={{ borderColor: '#e3e7f7', background: '#FFFAF6' }}>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#E97933] mb-1">Mensagem da equipe</p>
                        <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">{clienteData.mensagem_equipe}</p>
                      </div>
                    )}
                    {clienteData?.proxima_reuniao && (
                      <div className="rounded-2xl border p-5" style={{ borderColor: '#e3e7f7' }}>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#1A1A1A]/40 mb-1">Próxima reunião</p>
                        <p className="font-black text-[#1A1A1A]">{clienteData.proxima_reuniao}</p>
                      </div>
                    )}
                    {clienteData?.prazo_etapa && (
                      <div
                        className="rounded-2xl border p-5"
                        style={{
                          borderColor: clienteData._prazo_info?.atrasado ? '#e77f89' : '#e3e7f7',
                          background: clienteData._prazo_info?.atrasado ? '#FFF5F5' : undefined,
                        }}
                      >
                        <p className="text-xs font-bold uppercase tracking-wide text-[#1A1A1A]/40 mb-1">Prazo da etapa</p>
                        <p className="font-black text-[#1A1A1A]">{clienteData.prazo_etapa}</p>
                        {clienteData._prazo_info && (
                          <p className={cn('text-xs font-bold mt-1', clienteData._prazo_info.atrasado ? 'text-[#e77f89]' : 'text-[#E97933]')}>
                            {clienteData._prazo_info.atrasado
                              ? `⚠️ ${Math.abs(clienteData._prazo_info.diasRestantes)} dias de atraso`
                              : `${clienteData._prazo_info.diasRestantes} dias restantes`}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {view === 'perfil' && (
              <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: '#e3e7f7' }}>
                <h2 className="font-black text-[#1A1A1A]">Seu Perfil</h2>
                {[
                  { label: 'Nome', value: clienteUser?.nome },
                  { label: 'Empresa', value: clienteData?.empresa ?? '—' },
                  { label: 'Serviço contratado', value: clienteData?.servico ?? clienteUser?.tipo },
                  { label: 'E-mail', value: clienteData?.email_contato ?? '—' },
                  { label: 'Código do contrato', value: clienteUser?.codigo_contrato },
                ].map(({ label, value }) => (
                  <div key={label} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: '#f0f0f0' }}>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#1A1A1A]/40">{label}</p>
                    <p className="mt-0.5 font-bold text-[#1A1A1A]">{value ?? '—'}</p>
                  </div>
                ))}
              </div>
            )}

            {view === 'contratos' && (
              <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: '#e3e7f7' }}>
                <h2 className="font-black text-[#1A1A1A]">Contrato</h2>
                {[
                  { label: 'Status', value: clienteData?.status_contrato ?? 'Ativo' },
                  { label: 'Data de início', value: clienteData?.data_contrato ?? '—' },
                  { label: 'Serviço', value: clienteData?.servico ?? clienteUser?.tipo },
                ].map(({ label, value }) => (
                  <div key={label} className="border-b pb-3 last:border-0 last:pb-0" style={{ borderColor: '#f0f0f0' }}>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#1A1A1A]/40">{label}</p>
                    <p className="mt-0.5 font-bold text-[#1A1A1A]">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {view === 'briefing' && clienteUser && (
              <>
                {briefingStatus === 'enviado' ? (
                  <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#e3e7f7' }}>
                    <CheckCircle2 size={40} className="mx-auto mb-4" style={{ color: '#E97933' }} />
                    <h2 className="text-xl font-black text-[#1A1A1A]">Briefing já enviado ✅</h2>
                    <p className="mt-2 text-[#1A1A1A]/60">Recebemos seu briefing. Nossa equipe está analisando tudo com carinho.</p>
                  </div>
                ) : (
                  <BriefingWizard
                    clienteUser={clienteUser}
                    onStatusChange={(status) => setBriefingStatus(status)}
                  />
                )}
              </>
            )}

            {view === 'arquivos' && (
              <div className="rounded-2xl border p-6" style={{ borderColor: '#e3e7f7' }}>
                <h2 className="font-black text-[#1A1A1A] mb-4">Arquivos do Projeto</h2>
                {clienteData?.arquivos_links ? (
                  <div className="space-y-2">
                    {clienteData.arquivos_links.split('\n').filter(Boolean).map((link, i) => (
                      <a
                        key={i}
                        href={link.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border p-4 text-sm font-bold transition hover:border-[#E97933]/40"
                        style={{ borderColor: '#e3e7f7', color: '#E97933' }}
                      >
                        <Download size={16} />
                        {link.trim()}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#1A1A1A]/40 font-medium text-sm">Nenhum arquivo disponível ainda. Assim que os entregáveis estiverem prontos, aparecerão aqui.</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </SiteShell>
  );
}
