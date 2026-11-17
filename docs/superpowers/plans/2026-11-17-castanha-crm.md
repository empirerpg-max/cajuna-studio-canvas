# /castanha — CRM Facebook Lead Ads + PWA — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir `/admin-cajuna` por `/castanha`, com login de servidor persistente, um funil novo
"Facebook Lead Ads" alimentado pela planilha do Meta (via Apps Script exclusivo) e instalável como PWA.

**Architecture:** Lógica pura (sessão HMAC, regras dos leads) em `src/lib/castanha/*.ts`, testada com
`bun test`. Funções de servidor (`createServerFn`) fazem login, guardam sessão em cookie HttpOnly e
falam com o Apps Script de leads usando o token secreto. A UI reaproveita a página atual do admin; o
funil novo tem componentes próprios em `src/components/castanha/`. PWA = manifest + service worker
estáticos em `public/`, linkados só no `head` de `/castanha`.

**Tech Stack:** TanStack Start/Router 1.16x, React 19, Tailwind 4, zod 4, lucide-react, sonner (toasts),
Web Crypto (HMAC), `bun test` (já disponível; sem dependência nova), Playwright (só para gerar ícones).

**Spec:** `docs/superpowers/specs/2026-11-17-castanha-crm-design.md`

## Global Constraints

- Ler `process.env` **dentro** dos handlers, nunca no topo do módulo (Cloudflare Workers).
- Segredos: `FB_LEADS_TOKEN`, `CASTANHA_SESSION_SECRET` (obrigatórios); `FB_LEADS_SCRIPT_URL` (fallback no
  código: `https://script.google.com/macros/s/AKfycbzwWG1VY3sZk_FG6RayJ1FV4vWjdC-fBZ1pl8DzVJhTv270GdWAsVl4qpUKo58RGjtn/exec`).
  O token nunca vai ao navegador nem ao repositório.
- Script antigo (login/deals): `https://script.google.com/macros/s/AKfycbxWj5evgdS-hU7GDfwdGLHDxpvcxL47_H32V-Z7km2eSb3PWuxJVX6HPoNjPi-6GTfU/exec`.
- Chamadas ao Apps Script: `POST`, `Content-Type: text/plain;charset=utf-8`, body JSON, `redirect: 'follow'`.
- Nada escreve na aba `Página1`.
- Etapas (ordem exata): `Novo, Tentando contato, Em conversa, Reunião agendada, Proposta enviada, Negociação, Ganho, Perdido`.
- Motivos de perda (ordem exata): `Sem resposta, Sem orçamento, Só curiosidade, Fechou com outro, Fora do perfil, Outro`.
- Cookie: nome `castanha_session`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `maxAge` 30 dias.
- Revogação: lista de `getAdmins` em cache por 10 min.
- Cores: laranja `#E97933`, azul `#2D5F8A`, preto `#1A1A1A`, fundo de coluna `#F0EAE3`; seguir o estilo de `PipelineBoard.tsx`.
- Texto da UI em português. `head` de `/castanha`: `robots: noindex, nofollow`.
- Commits pequenos por tarefa; push só no fim, direto em `main` (autorizado pela dona do projeto).

## Review Focus

1. **Apps Script responde HTML ou `{ok:false}`** (token errado, segredo ausente, implantação sem acesso público) → a aba mostra mensagem clara ("Não foi possível carregar os leads: <motivo>") e botão "Tentar de novo", nunca quadro vazio silencioso. Teste em Task 3 (`chamarScript` rejeita resposta não-JSON).
2. **WhatsApp em formatos variados** (`+55 (85) 99999-0000`, `85999990000`, `5585999990000`, texto de lead de teste) → link `https://wa.me/55…` só com 10–13 dígitos; 10–11 dígitos ganham prefixo `55`; senão sem botão. Teste em Task 2.
3. **`created_time` vazio ou inválido** → "—", nunca "NaN" ou "há NaN". Teste em Task 2.
4. **Cookie adulterado, expirado ou `CASTANHA_SESSION_SECRET` ausente** → tratado como deslogado; login sem segredo configurado devolve erro "Servidor sem CASTANHA_SESSION_SECRET". Testes em Task 1 e Task 3.
5. **Salvar falha ao mover card** → card volta à coluna anterior e aparece toast de erro. Teste da função pura `aplicarCampos` em Task 2; comportamento verificado manualmente em Task 5.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/castanha/session.ts` | assinar/verificar token de sessão (puro) |
| `src/lib/castanha/fb-leads.ts` | tipos, constantes e regras dos leads (puro) |
| `src/lib/castanha/apps-script.server.ts` | `fetch` para os dois Apps Scripts |
| `src/lib/castanha/auth.server.ts` | `requireAdmin()` + cache de admins |
| `src/lib/castanha/auth.functions.ts` | `castanhaLogin`, `castanhaSession`, `castanhaLogout` |
| `src/lib/castanha/leads.functions.ts` | `listarLeadsFb`, `atualizarLeadFb` |
| `src/components/castanha/FbLeadCard.tsx` | card da coluna |
| `src/components/castanha/FbLeadDetail.tsx` | modal de detalhes/edição |
| `src/components/castanha/FbLeadsBoard.tsx` | quadro, filtros, polling |
| `src/components/castanha/InstallAppButton.tsx` | botão instalar / dica iPhone |
| `src/routes/castanha.tsx` | página (ex-`admin-cajuna.tsx`) |
| `src/components/Overview.tsx` | + bloco Facebook Lead Ads |
| `public/castanha.webmanifest`, `public/castanha-sw.js`, `public/castanha-icons/*` | PWA |
| `scripts/gerar-icones-castanha.mjs` | gera PNGs a partir do SVG |
| `tests/castanha/*.test.ts` | testes `bun test` |

---

### Task 1: Sessão assinada (puro)

**Files:**
- Create: `src/lib/castanha/session.ts`
- Create: `tests/castanha/session.test.ts`
- Modify: `package.json` (script `"test": "bun test tests"`)

**Interfaces:**
- Produces:
  - `type SessionPayload = { nome: string; codigo: string; exp: number }` (`exp` em ms epoch)
  - `signSession(p: SessionPayload, secret: string): Promise<string>` → `"<base64url(json)>.<base64url(hmac-sha256)>"`
  - `verifySession(token: string | undefined, secret: string, now?: number): Promise<SessionPayload | null>`
  - `SESSION_MAX_AGE_S = 60 * 60 * 24 * 30`

- [ ] **Step 1: Escrever os testes**

```ts
import { test, expect } from 'bun:test';
import { signSession, verifySession } from '@/lib/castanha/session';
const p = { nome: 'Ana', codigo: 'ADM1', exp: Date.now() + 60_000 };
test('ida e volta', async () => expect(await verifySession(await signSession(p, 's1'), 's1')).toEqual(p));
test('segredo errado', async () => expect(await verifySession(await signSession(p, 's1'), 's2')).toBeNull());
test('payload adulterado', async () => {
  const [, sig] = (await signSession(p, 's1')).split('.');
  const fake = Buffer.from(JSON.stringify({ ...p, codigo: 'X' })).toString('base64url');
  expect(await verifySession(`${fake}.${sig}`, 's1')).toBeNull();
});
test('expirado', async () => expect(await verifySession(await signSession({ ...p, exp: 1 }, 's1'), 's1')).toBeNull());
test('lixo / vazio / sem segredo', async () => {
  expect(await verifySession(undefined, 's1')).toBeNull();
  expect(await verifySession('abc', 's1')).toBeNull();
  expect(await verifySession(await signSession(p, 's1'), '')).toBeNull();
});
```

- [ ] **Step 2: Rodar e ver falhar** — `bun test tests/castanha/session.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3: Implementar** com `crypto.subtle` (HMAC SHA-256, `importKey` raw); comparar assinatura com `crypto.subtle.verify` (tempo constante). Sem `Buffer` no código de produção (usar `btoa`/`atob` + troca `+/=` para base64url). Qualquer exceção → `null`.
- [ ] **Step 4: Rodar** — `bun test tests/castanha/session.test.ts` → 5 pass.
- [ ] **Step 5: Commit** — `git commit -m "castanha: sessão assinada com HMAC"`

---

### Task 2: Regras dos leads (puro)

**Files:**
- Create: `src/lib/castanha/fb-leads.ts`
- Create: `tests/castanha/fb-leads.test.ts`

**Interfaces:**
- Produces:
  - `ETAPAS_FB` e `MOTIVOS_PERDA` (as listas das Global Constraints, `as const`); `type EtapaFb`.
  - `interface FbLead { id; chegouEm; anuncioId; anuncio; publicoId; publico; campanhaId; campanha; formularioId; formulario; organico; plataforma; oQuePrecisa; faseDoNegocio; negocio; nome; whatsapp; statusMeta; etapa; responsavel; proximoPasso; dataProximoPasso; motivoPerda; anotacoes; atualizadoEm; atualizadoPor: string; teste: boolean; outras: Record<string,string> }` — exatamente os campos que o script devolve (`docs/apps-script/facebook-leads.gs`).
  - `type CamposEditaveis = Partial<Pick<FbLead, 'etapa'|'responsavel'|'proximoPasso'|'dataProximoPasso'|'motivoPerda'|'anotacoes'>>`
  - `normalizarLead(raw: unknown): FbLead` — tudo vira string (`''` se ausente), `teste` boolean, `outras` objeto, etapa inválida → `'Novo'`.
  - `whatsappLink(raw: string): string | null`
  - `tempoDesde(iso: string, now: number): string` — `'—'` se inválido/vazio; `<1 min` → `'agora'`; `< 60 min` → `'há N min'`; `< 24 h` → `'há Nh'`; senão `'há N dia(s)'`.
  - `formatarData(iso: string): string` — `dd/mm/aaaa hh:mm` em `America/Fortaleza`, `'—'` se inválido.
  - `novoAtrasado(l: FbLead, now: number): boolean` — etapa `Novo` e chegou há > 1 h.
  - `proximoPassoVencido(l: FbLead, hojeISO: string): boolean` — `dataProximoPasso` não vazia e `< hojeISO` (`YYYY-MM-DD`), etapa não é Ganho/Perdido.
  - `validarCampos(atual: FbLead, campos: CamposEditaveis): string | null` — erro `'Informe o motivo da perda.'` se etapa resultante for `Perdido` sem motivo.
  - `aplicarCampos(l: FbLead, campos: CamposEditaveis): { lead: FbLead; enviar: CamposEditaveis }` — mescla; se a etapa resultante ≠ `Perdido`, zera `motivoPerda` (e inclui `motivoPerda: ''` em `enviar` quando havia valor).
  - `type FiltrosFb = { busca: string; campanha: string; responsavel: string; mostrarTeste: boolean; verTodosFechados: boolean }`
  - `filtrarLeads(leads: FbLead[], f: FiltrosFb, now: number): FbLead[]` — busca em nome + dígitos do WhatsApp (sem acento, minúsculas); Ganho/Perdido com `atualizadoEm` (ou `chegouEm` se vazio) há > 30 dias somem salvo `verTodosFechados`.
  - `resumoFb(leads: FbLead[], now: number): { novos7d: number; porEtapa: Record<EtapaFb, number>; novosAtrasados: number; taxaGanho: number | null }` — ignora `teste`; `taxaGanho = ganho/(ganho+perdido)` ou `null`.

- [ ] **Step 1: Escrever os testes** (um `test` por item; valores exatos):
  - `whatsappLink('+55 (85) 99999-0000')` → `'https://wa.me/5585999990000'`; `('85999990000')` → `'https://wa.me/5585999990000'`; `('8533330000')` → `'https://wa.me/558533330000'`; `('<test lead: dummy data for whatsapp_number>')` → `null`; `('123')` → `null`.
  - `tempoDesde('', now)` e `tempoDesde('xx', now)` → `'—'`; `now - 30s` → `'agora'`; `now - 5min` → `'há 5 min'`; `now - 2h` → `'há 2h'`; `now - 3 dias` → `'há 3 dias'`; `now - 1 dia` → `'há 1 dia'`.
  - `novoAtrasado`: Novo há 61 min → true; Novo há 59 min → false; Em conversa há 3h → false.
  - `proximoPassoVencido`: data `2026-11-16`, hoje `2026-11-17` → true; mesma data → false; vazio → false; etapa Ganho → false.
  - `validarCampos(lead Novo, {etapa:'Perdido'})` → `'Informe o motivo da perda.'`; com `motivoPerda:'Sem resposta'` → `null`.
  - `aplicarCampos(lead Perdido c/ motivo, {etapa:'Em conversa'})` → `lead.motivoPerda === ''` e `enviar` igual a `{etapa:'Em conversa', motivoPerda:''}`.
  - `normalizarLead({id: 1, etapa: 'xyz', teste: 'true'})` → `id '1'`, `etapa 'Novo'`, `teste false` (só `true` booleano vale), `outras {}`.
  - `filtrarLeads`: teste escondido por padrão; busca `'maria'` acha `'Maria Souza'`; busca `'9999'` acha pelo WhatsApp; Ganho de 40 dias some, aparece com `verTodosFechados`.
  - `resumoFb`: ignora teste; `taxaGanho` `null` sem fechados, `0.5` com 1 Ganho + 1 Perdido.
- [ ] **Step 2: Rodar e ver falhar** — `bun test tests/castanha/fb-leads.test.ts` → FAIL.
- [ ] **Step 3: Implementar** `src/lib/castanha/fb-leads.ts` com as assinaturas acima.
- [ ] **Step 4: Rodar** — `bun test tests` → tudo pass.
- [ ] **Step 5: Commit** — `git commit -m "castanha: regras e tipos dos leads do Facebook"`

---

### Task 3: Funções de servidor (login, sessão, leads)

**Files:**
- Create: `src/lib/castanha/apps-script.server.ts`, `src/lib/castanha/auth.server.ts`, `src/lib/castanha/auth.functions.ts`, `src/lib/castanha/leads.functions.ts`
- Create: `tests/castanha/apps-script.test.ts`

**Interfaces:**
- Consumes: Task 1 (`signSession`, `verifySession`, `SESSION_MAX_AGE_S`), Task 2 (`normalizarLead`, `ETAPAS_FB`, `MOTIVOS_PERDA`, `FbLead`, `CamposEditaveis`).
- Produces:
  - `apps-script.server.ts`: `OLD_SCRIPT_URL` (const), `chamarScript(url: string, body: object, fetchImpl?: typeof fetch): Promise<any>` — lança `Error('Resposta inválida do Apps Script')` se o corpo não for JSON; `chamarScriptLeads(body)` (usa `FB_LEADS_SCRIPT_URL`/fallback + injeta `token: process.env.FB_LEADS_TOKEN`; lança `Error('Servidor sem FB_LEADS_TOKEN')` se ausente; lança `Error(json.erro)` se `ok:false`).
  - `auth.server.ts`: `requireAdmin(): Promise<SessionPayload>` — lê cookie `castanha_session`, `verifySession` com `CASTANHA_SESSION_SECRET`; confere `codigo` na lista de `getAdmins` (script antigo, campo `codigo`), cache em variável de módulo por 10 min; se `getAdmins` falhar usa a última lista conhecida; sem lista nenhuma → lança `Error('Não foi possível verificar o acesso. Tente de novo.')`. Falha de sessão → lança `Error('NAO_AUTENTICADO')`.
  - `auth.functions.ts`:
    - `castanhaLogin` — `createServerFn({method:'POST'})`, input `{usuario: string; senha: string}` (zod, 1–200 chars); chama script antigo `{action:'login', codigo_contrato, codigo_unico}`; só aceita `ok && tipo.toLowerCase()==='admin'`; grava cookie; retorna `{ ok: true, nome: string } | { ok: false, erro: string }` (`'Acesso restrito a administradores.'`, `json.error || 'Usuário ou senha incorretos.'`, `'Servidor sem CASTANHA_SESSION_SECRET'`).
    - `castanhaSession` — `createServerFn({method:'GET'})` → `{ nome: string; codigo: string } | null` (usa `verifySession`, sem checar lista).
    - `castanhaLogout` — apaga o cookie.
  - `leads.functions.ts`:
    - `listarLeadsFb` — `createServerFn({method:'POST'})`, `requireAdmin()`, retorna `{ leads: FbLead[] }` via `normalizarLead`.
    - `atualizarLeadFb` — input `{ id: string; campos: CamposEditaveis }` (zod: `etapa` ∈ `ETAPAS_FB`; `motivoPerda` ∈ `MOTIVOS_PERDA` ou `''`; `dataProximoPasso` regex `^\d{4}-\d{2}-\d{2}$` ou `''`; textos ≤ 5000); `usuario` = `nome` da sessão; retorna `{ lead: Partial<FbLead> }`.
  - Cookies via `getCookie`/`setCookie`/`deleteCookie` de `@tanstack/react-start/server`.

- [ ] **Step 1: Teste de `chamarScript`** com `fetchImpl` falso:
  - corpo `'<html>…'` → rejeita com `'Resposta inválida do Apps Script'`;
  - corpo `'{"ok":true,"x":1}'` → resolve `{ok:true,x:1}`;
  - verifica que a chamada usou `method:'POST'`, header `text/plain;charset=utf-8` e `redirect:'follow'`.
- [ ] **Step 2: Rodar e ver falhar** — `bun test tests/castanha/apps-script.test.ts` → FAIL.
- [ ] **Step 3: Implementar** os quatro arquivos com as interfaces acima.
- [ ] **Step 4: Verificar** — `bun test tests` pass; `npx tsc --noEmit` sem erros; `npx vite build` conclui.
- [ ] **Step 5: Commit** — `git commit -m "castanha: login com cookie e funções de servidor dos leads"`

---

### Task 4: Rota `/castanha` (migração do admin)

**Files:**
- Create: `src/routes/castanha.tsx` (a partir de `src/routes/admin-cajuna.tsx`)
- Delete: `src/routes/admin-cajuna.tsx`
- Modify: `src/routeTree.gen.ts` (regenerado pelo build)

**Interfaces:**
- Consumes: Task 3 (`castanhaLogin`, `castanhaSession`, `castanhaLogout`).
- Produces: aba `'Facebook Lead Ads'` em `TABS` (posição 2, logo após `'Visão Geral'`), renderizando `<FbLeadsBoard userName admins />` (Task 5) — nesta tarefa, um placeholder "Em construção".

- [ ] **Step 1:** `git mv src/routes/admin-cajuna.tsx src/routes/castanha.tsx`; trocar `createFileRoute('/castanha')`, título `'Castanha — Cajuna Studio'`, manter `noindex, nofollow`.
- [ ] **Step 2:** Login passa a usar `castanhaLogin` (mesmos campos Usuário/Senha, mesmas mensagens). Ao montar, `castanhaSession()` restaura o admin (mostra loader enquanto checa, para não piscar a tela de login). "Sair" chama `castanhaLogout`. Remover a chamada direta `action:'login'` do navegador. Deals/admins continuam usando o script antigo direto (como hoje), importando `OLD_SCRIPT_URL` de um módulo sem `.server` — mover a constante para `src/lib/castanha/config.ts` e reexportá-la em `apps-script.server.ts`.
- [ ] **Step 3:** Inserir a aba `Facebook Lead Ads` com placeholder.
- [ ] **Step 4: Verificar** — `npx vite build` (regenera `routeTree.gen.ts`; `/admin-cajuna` some dele); `npx tsc --noEmit`; `npx vite dev` e abrir `http://localhost:<porta>/castanha` → tela de login; `/admin-cajuna` → 404.
- [ ] **Step 5: Commit** — `git commit -m "castanha: move a área admin para /castanha com sessão persistente"`

---

### Task 5: Quadro "Facebook Lead Ads"

**Files:**
- Create: `src/components/castanha/FbLeadCard.tsx`, `FbLeadDetail.tsx`, `FbLeadsBoard.tsx`
- Modify: `src/routes/castanha.tsx` (trocar placeholder)

**Interfaces:**
- Consumes: Task 2 (todas as funções puras), Task 3 (`listarLeadsFb`, `atualizarLeadFb`), `AdminOption` de `@/lib/crm-types`.
- Produces: `FbLeadsBoard({ userName: string; admins: AdminOption[]; onLeadsChange?: (l: FbLead[]) => void })`.

- [ ] **Step 1: `FbLeadCard({ lead, now, onOpen })`** — conteúdo e rótulos exatos da tabela do spec §6.5 (Nome; "Negócio:", "Precisa:", "Fase:" — omitir linha vazia; etiqueta da campanha; ícone por `plataforma`: `fb` → Facebook, `ig` → Instagram, outro → nada; `tempoDesde` em vermelho se `novoAtrasado`; borda/selo "Atrasado" se `proximoPassoVencido`; botão WhatsApp com `whatsappLink` abrindo em nova aba e com `stopPropagation`; "Resp.: X" se houver). `draggable`, `dataTransfer` = `lead.id`.
- [ ] **Step 2: `FbLeadDetail({ lead, admins, onSave, onClose, exigirMotivo })`** — modal no estilo do modal de `PipelineBoard`. Seções: Contato (Nome, WhatsApp + botão), Respostas (O que precisa, Negócio, Fase do negócio, e "Outras respostas" se `outras` tiver chaves), Origem (Campanha, Público, Anúncio, Formulário, Plataforma, Origem Pago/Orgânico a partir de `organico === 'true'`, Chegou em via `formatarData`, Status no Meta), Andamento editável (Etapa, Responsável, Próximo passo, Data do próximo passo `type=date`, Motivo de perda só quando etapa = Perdido, Anotações), "Atualizado por X em Y", e `<details>` "Dados técnicos" com os 5 IDs. Salvar usa `validarCampos` e mostra o erro inline.
- [ ] **Step 3: `FbLeadsBoard`** — React Query `useQuery(['fb-leads'], listarLeadsFb, { refetchInterval: 60_000, refetchIntervalInBackground: false, refetchOnWindowFocus: true })`; topo com contagem, "atualizado há X", botão "Atualizar", filtros (busca, campanha, responsável, "Mostrar leads de teste", "Ver fechados antigos") via `filtrarLeads`. Colunas = `ETAPAS_FB`, contagem no cabeçalho; container `flex overflow-x-auto snap-x snap-mandatory`, colunas `snap-start w-[85vw] sm:w-72 shrink-0`. Drop numa coluna: se `Perdido` → abre o detalhe com etapa pré-selecionada e `exigirMotivo`; senão salva. Salvar: `aplicarCampos` → atualização otimista no cache (`setQueryData`) → `atualizarLeadFb({id, campos: enviar})`; erro → restaurar o lead anterior + `toast.error('Não foi possível salvar: <msg>')`. Erro de carregamento → caixa com a mensagem e "Tentar de novo"; erro `NAO_AUTENTICADO` → volta para a tela de login.
- [ ] **Step 4: Verificar** — `npx tsc --noEmit`; `npx vite build`. Em `npx vite dev` com segredos fictícios, a aba mostra a caixa de erro (o Apps Script não é alcançável desta máquina) — confirma o Review Focus 1. Screenshot a 390×844 e 1440×900 com Playwright para conferir layout (usar dados falsos temporários via `queryClient.setQueryData` no console, não commitados).
- [ ] **Step 5: Commit** — `git commit -m "castanha: quadro do funil Facebook Lead Ads"`

---

### Task 6: Visão Geral com Facebook Lead Ads

**Files:**
- Modify: `src/components/Overview.tsx`, `src/routes/castanha.tsx`

**Interfaces:**
- Consumes: Task 2 `resumoFb`; Task 5 `onLeadsChange` (ou ler o cache `['fb-leads']` com `useQuery` — o builder escolhe).
- Produces: `Overview({ deals, funis, fbResumo?: ReturnType<typeof resumoFb> | null })`.

- [ ] **Step 1:** Bloco "Facebook Lead Ads" no topo da Visão Geral: 4 números — "Novos (7 dias)", "Novos sem contato há +1h", "Taxa de ganho" (`—` se `null`, senão `%` inteiro), e mini-lista "por etapa". Sem o bloco se `fbResumo` for `null`.
- [ ] **Step 2: Verificar** — `npx tsc --noEmit`; `npx vite build`.
- [ ] **Step 3: Commit** — `git commit -m "castanha: resumo dos leads na Visão Geral"`

---

### Task 7: PWA

**Files:**
- Create: `scripts/gerar-icones-castanha.mjs`, `public/castanha-icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` (180)
- Create: `public/castanha.webmanifest`, `public/castanha-sw.js`
- Create: `src/components/castanha/InstallAppButton.tsx`
- Modify: `src/routes/castanha.tsx`

**Interfaces:**
- Produces: `InstallAppButton()` (sem props).

- [ ] **Step 1: Ícones** — script Node com `require('playwright')` que renderiza `public/logocajuna111.svg` centralizado em fundo `#E97933` (maskable: logo em 60% da área) e salva os 4 PNGs. Rodar: `node scripts/gerar-icones-castanha.mjs`; conferir os PNGs abrindo-os.
- [ ] **Step 2: Manifest** — `name: "Castanha — Cajuna Studio"`, `short_name: "Castanha"`, `id: "/castanha"`, `start_url: "/castanha"`, `scope: "/castanha"`, `display: "standalone"`, `background_color: "#1A1A1A"`, `theme_color: "#E97933"`, `lang: "pt-BR"`, ícones (o maskable com `purpose: "maskable"`).
- [ ] **Step 3: Service worker** `public/castanha-sw.js` — registrado com `navigator.serviceWorker.register('/castanha-sw.js', { scope: '/castanha' })` (arquivo na raiz → escopo máximo `/`, então `/castanha` é permitido sem header extra). Cache `castanha-v1`: `install` guarda `/castanha-icons/*` e o manifest; `fetch`: navegações (`mode === 'navigate'`) → rede, e se falhar devolve uma página HTML embutida "Sem conexão — abra de novo quando tiver internet"; requisições GET same-origin de `/assets/`, fontes e ícones → rede primeiro, cópia em cache; **qualquer outra requisição (funções de servidor `/_serverFn`, POST, script.google.com) passa direto sem cache**. `activate` apaga caches de outras versões.
- [ ] **Step 4: `head` de `/castanha`** — `links`: `manifest` → `/castanha.webmanifest`, `apple-touch-icon` → `/castanha-icons/apple-touch-icon.png`; `meta`: `theme-color #E97933`, `apple-mobile-web-app-capable yes`, `apple-mobile-web-app-title Castanha`, `apple-mobile-web-app-status-bar-style black-translucent`. Registrar o SW num `useEffect` da página (só no navegador, se `'serviceWorker' in navigator`).
- [ ] **Step 5: `InstallAppButton`** — escuta `beforeinstallprompt` e mostra "Instalar app"; no iOS Safari fora do modo standalone (`navigator.standalone !== true`) mostra dica "Compartilhar → Adicionar à Tela de Início" (dispensável, lembrada em `localStorage` com try/catch). Colocar no cabeçalho do painel e na tela de login.
- [ ] **Step 6: Verificar** — `npx vite build && npx vite preview`; Playwright: abrir `/castanha`, conferir `navigator.serviceWorker.getRegistration('/castanha')` com `scope` terminando em `/castanha`, manifest carregado (`fetch('/castanha.webmanifest')` 200 e JSON válido); abrir `/` e confirmar que **não** há `<link rel="manifest">` nem SW registrado para `/`.
- [ ] **Step 7: Commit** — `git commit -m "castanha: PWA instalável"`

---

### Task 8: Fechamento

- [ ] **Step 1:** `bun test tests`, `npx tsc --noEmit`, `npx eslint src/lib/castanha src/components/castanha src/routes/castanha.tsx`, `npx vite build` — tudo limpo.
- [ ] **Step 2:** Revisão final do branch (code review).
- [ ] **Step 3:** Merge em `main` e push (`git push origin main`), mais push do branch de trabalho.
- [ ] **Step 4:** Passar à dona do projeto o checklist: cadastrar `FB_LEADS_TOKEN` e `CASTANHA_SESSION_SECRET` (e opcionalmente `FB_LEADS_SCRIPT_URL`) nos segredos da Lovable; colar a versão nova do script (com `outras`) e publicar nova versão; publicar na Lovable; testar no celular os itens do spec §8.
