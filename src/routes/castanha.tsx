import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, LogOut } from 'lucide-react';
import { PipelineBoard } from '@/components/PipelineBoard';
import { Overview } from '@/components/Overview';
import { PainelMes } from '@/components/castanha/PainelMes';
import { ClientesTab } from '@/components/castanha/ClientesTab';
import { InstallAppButton } from '@/components/castanha/InstallAppButton';
import { FB_LEADS_QUERY_KEY, FbLeadsBoard } from '@/components/castanha/FbLeadsBoard';
import { useQuery } from '@tanstack/react-query';
import { listarLeadsFb } from '@/lib/castanha/leads.functions';
import { resumoFb } from '@/lib/castanha/fb-leads';
import { FUNIS, type AdminOption, type Deal } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
import { OLD_SCRIPT_URL } from '@/lib/castanha/config';
import { castanhaLogin, castanhaLogout, castanhaSession } from '@/lib/castanha/auth.functions';
import { toast } from 'sonner';
import { RegistrarContratoModal } from '@/components/castanha/RegistrarContratoModal';
import { MotivoPerdaModal } from '@/components/castanha/MotivoPerdaModal';
import { ContratoSaiModal } from '@/components/castanha/ContratoSaiModal';
import { contratoAtivoDoCard, useDados, useRecarregarDados } from '@/components/castanha/useDados';
import { cancelarContrato, registrarGanho, registrarMovimento } from '@/lib/castanha/dados.functions';
import type { Contrato } from '@/lib/castanha/negocio';
import { montarMensagem, parseCentavos } from '@/lib/castanha/util';
import { MensagemWhatsappModal } from '@/components/castanha/MensagemWhatsappModal';
import { useMensagens } from '@/components/castanha/useMensagens';

export const Route = createFileRoute('/castanha')({
  head: () => ({
    meta: [
      { title: 'Castanha — Cajuna Studio' },
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'theme-color', content: '#E97933' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-title', content: 'Castanha' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    ],
    links: [
      { rel: 'manifest', href: '/castanha.webmanifest' },
      { rel: 'apple-touch-icon', href: '/castanha-icons/apple-touch-icon.png' },
    ],
  }),
  component: AdminCajuna,
});

// Deals e admins continuam no Apps Script antigo (aba Usuarios / Deals).
// O login agora passa pelo servidor do site (castanhaLogin), que grava um
// cookie de sessão — assim o app instalado não desloga ao fechar.
// VITE_CASTANHA_OLD_SCRIPT_URL só existe para testes locais com um script falso.
const API_URL = (import.meta.env.VITE_CASTANHA_OLD_SCRIPT_URL as string | undefined) || OLD_SCRIPT_URL;

const FB_TAB = 'Facebook Lead Ads';

interface AdminUser {
  nome: string;
  codigo_contrato: string;
  tipo: string;
}

const CLIENTES_TAB = 'Clientes';

const TABS = ['Visão Geral', FB_TAB, CLIENTES_TAB, ...FUNIS.map((f) => f.key)] as const;

function AdminCajuna() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
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
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/castanha-sw.js', { scope: '/castanha' }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    castanhaSession()
      .then((s) => {
        if (s) {
          setAdminUser({ nome: s.nome, codigo_contrato: s.codigo, tipo: 'admin' });
          setLoggedIn(true);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  const fbQuery = useQuery({
    queryKey: FB_LEADS_QUERY_KEY,
    queryFn: () => listarLeadsFb(),
    enabled: loggedIn,
    staleTime: 60_000,
    retry: 1,
  });
  const dados = useDados(loggedIn);
  const recarregarDados = useRecarregarDados();
  const [fluxoDeal, setFluxoDeal] = useState<
    | { tipo: 'perdido'; deal: Deal; prev?: Deal }
    | { tipo: 'sai'; deal: Deal; prev: Deal; contrato: Contrato }
    | { tipo: 'ganho'; deal: Deal }
    | null
  >(null);
  const [salvandoFluxo, setSalvandoFluxo] = useState(false);
  const mensagens = useMensagens(loggedIn);
  const [editandoMensagem, setEditandoMensagem] = useState(false);

  const fbResumo = useMemo(
    () => (fbQuery.data ? resumoFb(fbQuery.data.leads, Date.now()) : null),
    [fbQuery.data],
  );

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
        // Campos de texto podem voltar como número/data se alguém editar a
        // planilha na mão em vez de usar o formulário — normaliza pra string.
        const asText = (v: unknown) => (v === null || v === undefined ? '' : String(v));
        setDeals(
          (json.deals ?? []).map((d: Deal) => ({
            ...d,
            id: asText(d.id),
            funil: asText(d.funil) || 'Leads',
            cliente: asText(d.cliente),
            servico: asText(d.servico),
            valor: asText(d.valor),
            responsavel: asText(d.responsavel),
            prioridade: asText(d.prioridade),
            coluna: asText(d.coluna),
            ultimoContato: asText(d.ultimoContato),
            contato: asText(d.contato),
            obs: asText(d.obs),
            tags: Array.isArray(d.tags) ? d.tags.map(asText) : [],
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

  function gravarDeal(deal: Deal) {
    const exists = deals.some((d) => d.id === deal.id);
    const next = exists ? deals.map((d) => (d.id === deal.id ? deal : d)) : [...deals, deal];
    void persistDeals(next);
  }

  /** Grava o deal e, no funil Leads, registra a mudança de etapa (e abre o contrato se fechou). */
  function moverDeal(deal: Deal, prev: Deal | undefined, motivo = '') {
    gravarDeal(deal);
    const funil = deal.funil || 'Leads';
    const de = prev?.coluna ?? '';
    const primeiraColuna = FUNIS[0].columns[0];
    if (funil !== 'Leads' || de === deal.coluna || (!prev && deal.coluna === primeiraColuna)) return;
    registrarMovimento({
      data: { cardId: deal.id, funil: 'Leads', deEtapa: de, paraEtapa: deal.coluna, motivo, valor: parseCentavos(deal.valor) ?? 0 },
    })
      .then(() => recarregarDados())
      .catch((err) => toast.error(`A mudança de etapa não entrou no painel: ${err instanceof Error ? err.message : err}`));
    if (deal.coluna === 'Fechado') setFluxoDeal({ tipo: 'ganho', deal });
  }

  function handleSaveDeal(deal: Deal) {
    const prev = deals.find((d) => d.id === deal.id);
    const mudou = (prev?.coluna ?? '') !== deal.coluna;
    if ((deal.funil || 'Leads') === 'Leads' && mudou) {
      if (deal.coluna === 'Perdido') {
        setFluxoDeal({ tipo: 'perdido', deal, prev });
        return;
      }
      if (prev?.coluna === 'Fechado') {
        const contrato = contratoAtivoDoCard(dados.data, deal.id);
        if (contrato) {
          setFluxoDeal({ tipo: 'sai', deal, prev, contrato });
          return;
        }
      }
    }
    moverDeal(deal, prev);
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
      const res = await castanhaLogin({ data: { usuario: u, senha: s } });
      if (res.ok) {
        setAdminUser({ nome: res.nome, codigo_contrato: u, tipo: 'admin' });
        setLoggedIn(true);
        setSenha('');
      } else {
        setError(res.erro);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const handleSessaoExpirada = useCallback(() => {
    setLoggedIn(false);
    setAdminUser(null);
    setError('Sua sessão expirou. Entre de novo.');
  }, []);

  function handleLogout() {
    void castanhaLogout().catch(() => {});
    setLoggedIn(false);
    setAdminUser(null);
    setUsuario('');
    setSenha('');
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1A1A1A' }}>
        <Loader2 className="animate-spin text-[#E97933]" size={28} />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-5"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <img src="/castanha-icons/icon-192.png" alt="" width={88} height={88} className="mx-auto mb-4 rounded-3xl border-2 border-white/10" />
            <h1 className="text-3xl font-black text-white">Castanha</h1>
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
              {loading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
          <div className="mt-6 flex justify-center">
            <InstallAppButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8F2' }}>
      <header className="border-b-2 border-[#1A1A1A]" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="mx-auto max-w-[1500px] px-5 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-white font-black">Castanha</h1>
            <p className="text-white/40 text-xs font-medium">Olá, {adminUser?.nome}</p>
          </div>
          <div className="flex items-center gap-2">
          <InstallAppButton />
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-4 py-2 text-sm font-bold text-white/70 transition hover:border-[#E97933]/60 hover:text-white"
          >
            <LogOut size={15} /> Sair
          </button>
          </div>
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
          <Overview
            deals={deals}
            funis={FUNIS}
            fbResumo={fbResumo}
            painel={
              <PainelMes
                deals={deals}
                leadsFb={fbQuery.data?.leads ?? []}
                dados={dados.data}
                carregando={dados.isLoading || fbQuery.isLoading}
              />
            }
          />
        ) : activeTab === CLIENTES_TAB ? (
          <ClientesTab
            dados={dados.data}
            carregando={dados.isLoading}
            erro={dados.error ? (dados.error instanceof Error ? dados.error.message : String(dados.error)) : ''}
            adminNome={adminUser?.nome ?? ''}
            mensagemModelo={mensagens.clientes}
            onRecarregar={recarregarDados}
          />
        ) : activeTab === FB_TAB ? (
          <FbLeadsBoard
            admins={admins}
            onNaoAutenticado={handleSessaoExpirada}
            adminNome={adminUser?.nome ?? ''}
            mensagemModelo={mensagens.prospeccao}
            onEditarMensagem={() => setEditandoMensagem(true)}
          />
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
                onEditarMensagem={() => setEditandoMensagem(true)}
                mensagemWhatsapp={(d) =>
                  montarMensagem(funil.key === 'Leads' ? mensagens.prospeccao : mensagens.clientes, {
                    nome: d.cliente,
                    admin: adminUser?.nome ?? '',
                    precisa: d.servico,
                    negocio: '',
                  })
                }
              />
            );
          })()
        )}
      </main>

      {editandoMensagem && (
        <MensagemWhatsappModal mensagens={mensagens} adminNome={adminUser?.nome ?? ''} onClose={() => setEditandoMensagem(false)} />
      )}

      {fluxoDeal?.tipo === 'perdido' && (
        <MotivoPerdaModal
          nome={fluxoDeal.deal.cliente}
          onCancelar={() => setFluxoDeal(null)}
          onConfirmar={(motivo) => {
            const f = fluxoDeal;
            setFluxoDeal(null);
            moverDeal(f.deal, f.prev, motivo);
          }}
        />
      )}

      {fluxoDeal?.tipo === 'sai' && (
        <ContratoSaiModal
          nome={fluxoDeal.deal.cliente}
          contrato={fluxoDeal.contrato}
          salvando={salvandoFluxo}
          onVoltar={() => setFluxoDeal(null)}
          onManter={() => {
            const f = fluxoDeal;
            setFluxoDeal(null);
            moverDeal(f.deal, f.prev);
          }}
          onCancelarContrato={async () => {
            const f = fluxoDeal;
            setSalvandoFluxo(true);
            try {
              await cancelarContrato({ data: { contratoId: f.contrato.contratoId } });
              setFluxoDeal(null);
              moverDeal(f.deal, f.prev);
              toast.success('Contrato cancelado.');
            } catch (err) {
              toast.error(`Não foi possível cancelar: ${err instanceof Error ? err.message : err}`);
            } finally {
              setSalvandoFluxo(false);
            }
          }}
        />
      )}

      {fluxoDeal?.tipo === 'ganho' && (
        <RegistrarContratoModal
          modo="ganho"
          clienteInicial={{ nome: fluxoDeal.deal.cliente, whatsapp: fluxoDeal.deal.contato, negocio: '' }}
          contratoInicial={{ servico: fluxoDeal.deal.servico }}
          contratoExistente={contratoAtivoDoCard(dados.data, fluxoDeal.deal.id)}
          salvando={salvandoFluxo}
          onAgoraNao={() => setFluxoDeal(null)}
          onRegistrar={async (cliente, contrato) => {
            const deal = fluxoDeal.deal;
            setSalvandoFluxo(true);
            try {
              await registrarGanho({
                data: {
                  cliente: {
                    nome: cliente.nome || deal.cliente,
                    whatsapp: cliente.whatsapp ?? deal.contato,
                    negocio: cliente.negocio ?? '',
                    origem: 'Leads',
                    cardId: deal.id,
                    funil: 'Leads',
                    obs: '',
                  },
                  contrato: contrato ? { ...contrato, clienteId: '', obs: contrato.obs ?? '' } : null,
                  movimento: null,
                },
              });
              toast.success(contrato ? 'Contrato registrado.' : 'Cliente registrado.');
              setFluxoDeal(null);
              void recarregarDados();
            } catch (err) {
              toast.error(`Não foi possível registrar: ${err instanceof Error ? err.message : err}`);
            } finally {
              setSalvandoFluxo(false);
            }
          }}
        />
      )}
    </div>
  );
}
