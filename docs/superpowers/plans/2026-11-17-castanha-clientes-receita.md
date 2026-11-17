# Castanha — Clientes, contratos, receita e painel do mês — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar clientes e contratos (recorrente × único) ao ganhar vendas, registrar toda mudança de
etapa dos funis de venda, mostrar o painel do mês e a aba Clientes, mensagem do WhatsApp editável e
textos corrigidos.

**Architecture:** Toda a matemática (dinheiro, meses, receita, contagens, modelo de mensagem) é pura em
`src/lib/castanha/` com `bun test`. O Apps Script exclusivo ganha abas `Clientes`, `Contratos`,
`Movimentos`, `Config` e ações novas; ele é testado em Node com uma planilha falsa em memória. Funções
de servidor com `requireAdmin` fazem a ponte. A UI ganha modais (contrato, motivo, saída de Ganho),
painel na Visão Geral e aba Clientes; os dados vêm de uma query `['castanha-dados']`.

**Tech Stack:** o mesmo da entrega anterior (TanStack Start, React 19, Tailwind 4, zod 4, React Query,
sonner, bun test, Playwright para conferência visual).

**Spec:** `docs/superpowers/specs/2026-11-17-castanha-clientes-receita-design.md`

## Global Constraints

- Dinheiro sempre em **centavos inteiros**; exibição `R$ 1.200,00` (`pt-BR`, BRL).
- Mês sempre `YYYY-MM`; "hoje" no fuso `America/Fortaleza` (`hojeISO` existente).
- Funis de venda: `Facebook Lead Ads` (ganho = `Ganho`) e `Leads` antigo (ganho = `Fechado`; perdido = `Perdido`).
- `MOTIVOS_PERDA` existente é a lista de motivos nos dois funis.
- Nada é escrito em `Página1`; nada novo é escrito no script antigo.
- Toda função de servidor nova começa com `requireAdmin()`; o token nunca vai ao navegador.
- Abas novas com colunas exatamente como no spec §5; tudo como texto (`setNumberFormat('@')` em A:Z).
- Modelos padrão do WhatsApp (exatos): prospecção `Oi, {nome}! Aqui é {admin}, da Cajuna Studio 🧡 Vi que você pediu um orçamento[ de {precisa}]. Posso te fazer umas perguntinhas rápidas?`; clientes `Oi, {nome}! Aqui é {admin}, da Cajuna Studio 🧡 Tudo bem por aí?`
- Botão de WhatsApp em **todos os funis** e na aba Clientes.
- Texto em português, plurais pela função `plural()`.
- Push direto em `main` ao final (autorizado).

## Review Focus

1. **Contrato com valor/meses estranhos** (valor 0, meses 0, "1.200,50", "R$ 1.200", vazio) → recorrente só existe com valor > 0 e meses ≥ 1; único só com valor > 0; contrato sem nenhum dos dois é recusado com mensagem. Testes em Task 1 (`parseCentavos`) e Task 2 (`validarContrato`).
2. **Contrato encerrado no próprio mês de início ou antes** → zero receita em todos os meses, sem números negativos. Teste em Task 2.
3. **Card movido várias vezes no mesmo mês** (Ganho → Negociação → Ganho) → conta 1 ganho; card que saiu de Ganho não conta. Teste em Task 2.
4. **Mudança de etapa para a mesma etapa / clique sem mover** → não grava movimento. Teste em Task 3 (script) e verificação manual em Task 5.
5. **Modelo de mensagem com variável vazia ou texto do lead de teste** (`<test lead: ...>`) → colchetes somem, nunca aparece `{precisa}` nem `<test lead`. Teste em Task 1.

---

### Task 1: Utilitários puros — dinheiro, meses, plural, mensagem

**Files:** Create `src/lib/castanha/util.ts`, `tests/castanha/util.test.ts`; Modify `src/lib/castanha/fb-leads.ts` (`whatsappLink`).

**Interfaces — Produces:**
- `parseCentavos(txt: string): number | null` — aceita `1200`, `1.200`, `1.200,50`, `R$ 1.200,50`, `1200.5`(→ 120050); vazio/inválido/≤0 → `null`.
- `formatBRL(centavos: number): string` → `R$ 1.200,00`.
- `mesISO(ms: number): string` (`YYYY-MM` no fuso Fortaleza); `somarMeses(mes: string, n: number): string`; `diffMeses(a: string, b: string): number` (b − a); `nomeMes(mes: string): string` → `nov/26`.
- `plural(n: number, um: string, varios: string): string` → `1 cartão`, `0 cartões`, `2 cartões`.
- `MENSAGEM_PADRAO` e `MENSAGEM_PADRAO_CLIENTES` (os modelos exatos); `montarMensagem(modelo: string, vars: { nome: string; admin: string; precisa: string; negocio: string }): string` — variável vazia ou começando com `<test lead` conta como vazia; trecho `[...]` some se alguma variável dentro dele estiver vazia; colchetes nunca aparecem no resultado; `{nome}` recebe só o primeiro nome com inicial maiúscula (`MIRTES MELO` → `Mirtes`); espaços duplos colapsados.
- `whatsappLink(raw: string, mensagem?: string): string | null` — com mensagem acrescenta `?text=` + `encodeURIComponent`.

- [ ] **Step 1: testes** — `parseCentavos('1.200,50') === 120050`, `('R$ 1.200') === 120000`, `('1200') === 120000`, `('0') === null`, `('abc') === null`, `('') === null`; `formatBRL(120050) === 'R$ 1.200,50'` (normalizar NBSP para espaço no teste); `somarMeses('2026-11', 3) === '2027-02'`, `somarMeses('2026-01', -1) === '2025-12'`; `diffMeses('2026-11','2027-02') === 3`; `nomeMes('2026-11') === 'nov/26'`; `plural(1,'cartão','cartões') === '1 cartão'`, `plural(2, …) === '2 cartões'`, `plural(0, …) === '0 cartões'`; `montarMensagem(MENSAGEM_PADRAO, {nome:'MIRTES MELO', admin:'Bia', precisa:'identidade visual', negocio:''})` === `'Oi, Mirtes! Aqui é Bia, da Cajuna Studio 🧡 Vi que você pediu um orçamento de identidade visual. Posso te fazer umas perguntinhas rápidas?'`; com `precisa:''` → `'...pediu um orçamento. Posso...'`; com `precisa:'<test lead: dummy>'` → igual ao vazio; `whatsappLink('+5568999852899','Oi, a&b')` === `'https://wa.me/5568999852899?text=Oi%2C%20a%26b'`.
- [ ] **Step 2:** `bun test tests/castanha/util.test.ts` → FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** `bun test tests` → tudo pass.
- [ ] **Step 5:** commit `castanha: utilitários de dinheiro, meses, plural e mensagem`.

---

### Task 2: Cálculos do painel e da receita (puro)

**Files:** Create `src/lib/castanha/negocio.ts`, `tests/castanha/negocio.test.ts`.

**Interfaces — Consumes:** Task 1. **Produces:**
- Tipos (campos = colunas do spec §5 em camelCase; valores em centavos como `number`):
  `Cliente { clienteId, nome, whatsapp, negocio, origem: 'Facebook Lead Ads'|'Leads'|'Manual', cardId, funil, criadoEm, criadoPor, obs }`,
  `Contrato { contratoId, clienteId, servico, valorMensal: number, meses: number, inicio: string, valorUnico: number, mesValorUnico: string, encerradoEm: string, criadoEm, criadoPor, obs }`,
  `Movimento { movimentoId, cardId, funil, deEtapa, paraEtapa, quando, por, motivo, valor: number }`,
  `DadosCastanha { clientes: Cliente[]; contratos: Contrato[]; movimentos: Movimento[] }`.
- `ETAPA_GANHO: Record<string,string> = { 'Facebook Lead Ads': 'Ganho', Leads: 'Fechado' }`; `ETAPA_PERDIDO = 'Perdido'`.
- `validarContrato(c: Pick<Contrato,'servico'|'valorMensal'|'meses'|'inicio'|'valorUnico'|'mesValorUnico'>): string | null` — mensagens: `'Informe o serviço.'`, `'Informe um valor mensal ou um valor único.'`, `'Meses precisa ser de 1 a 60.'`, `'Escolha o primeiro mês.'`, `'Escolha o mês do valor único.'`.
- `recorrenteNoMes(c: Contrato, mes: string): number`; `receitaDoMes(cs: Contrato[], mes): { recorrente: number; unico: number; total: number }`; `garantidoDepois(cs, mes): number`; `serieReceita(cs, mesCentral): { mes: string; recorrente: number; unico: number }[]` (6 antes, central, 5 depois = 12).
- `contratoAtivo(c: Contrato, mesHoje: string): boolean` (recorrente ainda vai ter mês ≥ hoje, ou único ≥ hoje); `terminaEm(c): string` (último mês com receita); `contratosDoCard(d: DadosCastanha, cardId): Contrato[]`.
- `resumoMes(args: { mes: string; leadsFb: FbLead[]; dealsLeads: Deal[]; movimentos: Movimento[] }): { entraram: number; ganhos: number; perdidos: number; conversao: number | null; porMotivo: { motivo: string; qtd: number; valor: number }[]; porEtapa: { etapa: string; qtd: number }[]; alertaOutro: boolean; desde: string | null }` — regra do spec §6.3: por card, pega o **último** movimento do card (qualquer mês); conta como ganho/perdido de M se esse último movimento é para a etapa de ganho/perdido do funil e `quando` está em M. `porMotivo` ordenado por qtd desc. `alertaOutro` = Outro > 20% dos perdidos (com ≥ 5 perdidos). `desde` = mês/dia do movimento mais antigo (`dd/mm/aaaa`) ou `null`.
  `entraram` = leadsFb não-teste com `chegouEm` em M + dealsLeads (`funil` vazio ou `Leads`) com `createdAt` em M.

- [ ] **Step 1: testes** (valores exatos):
  - contrato 120000 × 4 desde `2026-12`: `receitaDoMes(..,'2026-12').recorrente === 120000`, `'2027-03'` → 120000, `'2027-04'` → 0, `'2026-11'` → 0; `garantidoDepois([c],'2026-11') === 480000`.
  - único 350000 em `2026-11`: só aparece em `2026-11`.
  - `encerradoEm:'2027-02'` → `'2027-02'` 0, `'2027-01'` 120000; `encerradoEm` = `inicio` → 0 em todos; `encerradoEm` antes do início → 0 (sem negativo).
  - `serieReceita([], '2026-11').length === 12` e `[6].mes === '2026-11'`.
  - `validarContrato` cobre as 5 mensagens e `null` para contrato válido só-único e só-recorrente.
  - `resumoMes`: card A Ganho→Negociação→Ganho em nov → ganhos 1; card B Ganho em nov e depois Negociação em nov → ganhos 0; perdido com motivo `Sem orçamento` valor 500000 e etapa `Proposta Enviada` → `porMotivo[0]` `{motivo:'Sem orçamento', qtd:1, valor:500000}`, `porEtapa[0].etapa === 'Proposta Enviada'`; perdido em out não conta em nov; conversão 1 ganho + 1 perdido = 0.5; sem fechados = null; 5 perdidos com 2 "Outro" → `alertaOutro` true; leads de teste fora de `entraram`.
- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar. **Step 4:** `bun test tests` pass.
- [ ] **Step 5:** commit `castanha: cálculos de receita e do painel do mês`.

---

### Task 3: Apps Script — abas novas e ações

**Files:** Modify `docs/apps-script/facebook-leads.gs`; Create `tests/castanha/gs/fake-sheets.ts`, `tests/castanha/apps-script-gs.test.ts`.

**Interfaces — Produces (ações do `doPost`, todas exigem token):**
- `dados` → `{ ok, clientes[], contratos[], movimentos[] }` (camelCase, valores em centavos como número).
- `registrarGanho {cliente, contrato|null, movimento}` → cria cliente (ou reaproveita o de mesmo `cardId`), cria contrato se vier, grava movimento — sob um lock; devolve `{ cliente, contrato, movimento }`.
- `salvarCliente {cliente}` / `salvarContrato {contrato}` → cria (sem id) ou atualiza (com id) → devolve o registro.
- `cancelarContrato {contratoId}` → `encerradoEm = inicio` (ou `mesValorUnico` se só único) e `obs` ganha "Cancelado em dd/mm/aaaa".
- `mudarValorContrato {contratoId, aPartirDe, valorMensal}` → encerra o antigo em `aPartirDe` e cria novo com o restante dos meses (`inicio + meses − aPartirDe`) e o valor novo; sem único.
- `registrarMovimento {movimento}` → ignora se `deEtapa === paraEtapa`.
- `config` → `{ ok, config: { [chave]: valor } }`; `salvarConfig {chave, valor}` (chaves permitidas: `mensagem_whatsapp`, `mensagem_whatsapp_clientes`; valor ≤ 1000 chars).
- `atualizar` existente: quando `campos.etapa` muda em relação à aba `Funil`, grava movimento (`funil: 'Facebook Lead Ads'`, `motivo` = motivoPerda se Perdido).
- `configurar()` cria as 4 abas com cabeçalhos do spec (+ `Config: chave, valor`) e formata A:Z como texto.

- [ ] **Step 1: planilha falsa** `fake-sheets.ts`: implementa só o que o script usa (`SpreadsheetApp.getActiveSpreadsheet().getSheetByName/insertSheet`, `getDataRange().getValues()`, `getRange(r,c,nr,nc).setValues/setNumberFormat/setFontWeight`, `getRange('A:I'/'A:Z')`, `appendRow`, `getLastRow`, `getMaxRows`, `setFrozenRows`), `PropertiesService`, `LockService`, `Utilities.getUuid`, `ContentService` (devolve o texto), `Logger`. Carregar o `.gs` com `new Function(...)` passando os fakes e expondo `doPost`, `configurar`.
- [ ] **Step 2: testes** chamando `doPost({postData:{contents: JSON.stringify({...})}})`:
  - sem token → `nao_autorizado`.
  - `registrarGanho` com contrato 120000×4 → `dados` devolve 1 cliente, 1 contrato (`valorMensal === 120000`, `meses === 4`), 1 movimento; segundo `registrarGanho` com mesmo `cardId` e `contrato:null` → ainda 1 cliente.
  - `atualizar` de etapa Novo→Em conversa grava movimento `deEtapa:'Novo'`; `atualizar` só de anotações não grava.
  - `registrarMovimento` com de = para → nenhum movimento.
  - `mudarValorContrato` em `2027-02` sobre 4 meses desde `2026-12` → antigo `encerradoEm:'2027-02'`, novo `inicio:'2027-02'`, `meses:2`.
  - `cancelarContrato` → `encerradoEm === inicio`.
  - `salvarConfig` com chave desconhecida → erro; `config` devolve o valor salvo.
  - texto começando com `=` vira `'=` na célula (anti-fórmula).
- [ ] **Step 3:** rodar → FAIL. **Step 4:** implementar no `.gs`. **Step 5:** `bun test tests` pass.
- [ ] **Step 6:** commit `castanha: script com clientes, contratos, movimentos e config`.

---

### Task 4: Funções de servidor

**Files:** Create `src/lib/castanha/dados.functions.ts`; Modify `src/lib/castanha/apps-script.server.ts` (nada além de reaproveitar `chamarScriptLeads`); Modify fake de teste local `…/scratchpad/fake-script.cjs` (não commitado) para as ações novas.

**Interfaces — Consumes:** Task 2 tipos, Task 3 ações. **Produces** (todas `createServerFn({method:'POST'})` + `requireAdmin`, `por`/`criadoPor` = nome da sessão):
`listarDados(): Promise<DadosCastanha>` · `registrarGanho({cliente, contrato|null, movimento})` · `salvarCliente(cliente)` · `salvarContrato(contrato)` (valida com `validarContrato`, erro → `throw new Error(msg)`) · `cancelarContrato({contratoId})` · `mudarValorContrato({contratoId, aPartirDe, valorMensal})` · `registrarMovimento(movimento)` · `lerConfig(): Promise<Record<string,string>>` · `salvarConfig({chave:'mensagem_whatsapp'|'mensagem_whatsapp_clientes', valor})`.
zod: centavos `z.number().int().min(0).max(1e10)`, meses `int 0–60`, mês `regex ^\d{4}-\d{2}$ | ''`, textos ≤ 2000.

- [ ] **Step 1:** implementar. **Step 2:** `npx tsc --noEmit`; `npx vite build`; `grep -rl FB_LEADS_TOKEN .output/public` vazio.
- [ ] **Step 3:** commit `castanha: funções de servidor de clientes, contratos e movimentos`.

---

### Task 5: Ganhar, perder e sair de Ganho (modais + ligação nos dois funis)

**Files:** Create `src/components/castanha/RegistrarContratoModal.tsx`, `MotivoPerdaModal.tsx`, `ContratoSaiModal.tsx`, `src/components/castanha/useDados.ts`; Modify `FbLeadsBoard.tsx`, `FbLeadDetail.tsx`, `FbLeadCard.tsx` (selo "sem contrato"), `src/routes/castanha.tsx`, `src/components/PipelineBoard.tsx`.

**Interfaces — Produces:**
- `useDados()` → React Query `['castanha-dados']` com `listarDados`, `staleTime 60s`.
- `RegistrarContratoModal({ clienteInicial: Partial<Cliente>; contratoExistente?: Contrato; onRegistrar(cliente, contrato|null): Promise<void>; onAgoraNao(): void })` — campos e padrões do spec §7.1 (meses 4; primeiro mês = mês seguinte; mês do único = mês atual); toggles "Recorrente" e "Único" (ambos podem estar ligados); prévia `R$ 1.200,00/mês de dez/26 a mar/27 · total R$ 4.800,00`; erros de `validarContrato` inline; com `contratoExistente`: opções "Manter este contrato" (padrão) / "Registrar outro contrato".
- `MotivoPerdaModal({ titulo; onConfirmar(motivo) ; onCancelar })` — select de `MOTIVOS_PERDA`, obrigatório.
- `ContratoSaiModal({ cliente; contrato; onManter; onCancelarContrato })`.
- Ligação:
  - Facebook: mover para Ganho (drop ou salvar no detalhe) → salva etapa (o movimento é gravado pelo `atualizar` do script) → abre `RegistrarContratoModal` → `registrarGanho` com `movimento: null` (o script aceita null). Sair de Ganho tendo contrato ativo → `ContratoSaiModal` antes de salvar.
  - Funil antigo `Leads`: em `castanha.tsx`, envolver `handleSaveDeal`: se `funil === 'Leads'` e a coluna mudou → se `Perdido`, pedir motivo (`MotivoPerdaModal`; cancelar = não salva); se saiu de `Fechado` com contrato ativo → `ContratoSaiModal`; salvar deal como hoje; `registrarMovimento({cardId: deal.id, funil:'Leads', deEtapa, paraEtapa, motivo, valor: parseCentavos(deal.valor) ?? 0})`; se `Fechado` → `RegistrarContratoModal` com cliente `{nome: deal.cliente, whatsapp: deal.contato, origem:'Leads', cardId: deal.id, funil:'Leads'}` e `servico: deal.servico`. Deal novo criado já numa coluna ≠ primeira conta como movimento com `deEtapa: ''`.
  - Card do Facebook em Ganho sem contrato: selo "sem contrato" + botão "Registrar contrato" no detalhe.
- [ ] **Step 1:** implementar. **Step 2:** `npx tsc --noEmit`; `bun test tests`.
- [ ] **Step 3: Verificar no navegador** com o script falso (Playwright): ganhar lead → modal → registrar → `dados` tem cliente/contrato; arrastar Ganho → Em conversa → modal "continua valendo?" → Manter; deal antigo para Perdido sem motivo não muda; com motivo grava movimento; deal antigo para Fechado abre modal com nome do cliente; soltar card na mesma coluna não grava movimento (Review Focus 4).
- [ ] **Step 4:** commit `castanha: registrar contrato ao ganhar e motivo de perda nos dois funis`.

---

### Task 6: WhatsApp em todos os funis + mensagem editável

**Files:** Create `src/components/castanha/MensagemWhatsappModal.tsx`, `src/components/castanha/BotaoWhatsapp.tsx`; Modify `FbLeadsBoard.tsx`, `FbLeadCard.tsx`, `FbLeadDetail.tsx`, `PipelineBoard.tsx` (card e modal de edição), `castanha.tsx` (passar `adminNome`).

**Interfaces — Consumes:** Task 1 `montarMensagem`, `MENSAGEM_PADRAO`, `whatsappLink(raw, msg)`; Task 4 `lerConfig`/`salvarConfig` (query `['castanha-config']`).
- `BotaoWhatsapp({ numero; mensagem?; tamanho: 'card'|'grande' })` — o mesmo botão verde em todo lugar; some se `whatsappLink` der null; `stopPropagation` no card.
- `PipelineBoard` (todos os funis antigos): botão no card e no modal, número = `deal.contato`; funil `Leads` usa o modelo de prospecção (`precisa` = `deal.servico`), os outros o modelo de clientes. Aba Clientes (Task 8) usa o de clientes.
- Botão "Mensagem do WhatsApp" no cabeçalho de **todos** os funis → modal com abas Prospecção / Clientes, textarea (≤ 1000), lista das variáveis clicáveis (inserem no cursor), prévia com lead de exemplo `{nome:'Mirtes Melo', precisa:'identidade visual', negocio:'Confeitaria'}` e o admin logado, "Voltar ao padrão", "Salvar".
- Card e detalhe usam `whatsappLink(lead.whatsapp, montarMensagem(modelo, {nome: lead.nome, admin: adminNome, precisa: lead.oQuePrecisa, negocio: lead.negocio}))`; sem config carregada usa `MENSAGEM_PADRAO`.
- [ ] **Step 1:** implementar. **Step 2:** tsc; Playwright: card de deal em Identidade Visual com contato `(68) 99985-2899` tem link `https://wa.me/5568999852899?text=Oi%2C%20`…`Tudo%20bem`; link do card do Facebook de `+5568999852899` começa com `https://wa.me/5568999852899?text=Oi%2C%20` e contém o nome; editar modelo e salvar muda o link.
- [ ] **Step 3:** commit `castanha: mensagem do WhatsApp editável`.

---

### Task 7: Painel do mês (Visão Geral)

**Files:** Create `src/components/castanha/PainelMes.tsx`, `src/components/castanha/GraficoReceita.tsx`; Modify `src/components/Overview.tsx`, `src/routes/castanha.tsx`.

**Interfaces — Consumes:** Task 2 (`resumoMes`, `receitaDoMes`, `garantidoDepois`, `serieReceita`), `useDados`, query de leads do Facebook, `deals`.
- `PainelMes({ deals: Deal[]; leadsFb: FbLead[] | null; dados: DadosCastanha | null })` no topo da Visão Geral, ordem do spec §7.3. Seletor `← nov/26 →` (padrão mês atual). 4 números com comparação (`↑ 2 vs out/26`). Receita: 3 números + `GraficoReceita` (SVG, barras empilhadas, eixo com passo "redondo" como no Raio-X, mês escolhido em destaque, clicar na barra troca o mês). Perdidos por motivo: barras horizontais com qtd e `formatBRL(valor)` quando > 0; por etapa: lista. Alerta "Outro". Nota `Ganhos e perdidos contados desde {desde}`. Estado vazio útil quando não há dados ("Os números aparecem quando o primeiro card mudar de etapa").
- Bloco Facebook existente e blocos antigos seguem abaixo.
- [ ] **Step 1:** implementar. **Step 2:** tsc; Playwright com script falso (contrato 1200×4 desde dez + único 3500 em nov): em nov "Receita R$ 3.500,00", "Já garantido R$ 4.800,00"; clicar em dez → "R$ 1.200,00"; screenshot 1280 e 390 sem rolagem horizontal.
- [ ] **Step 3:** commit `castanha: painel do mês com receita e perdas`.

---

### Task 8: Aba Clientes

**Files:** Create `src/components/castanha/ClientesTab.tsx`, `ClienteDetalhe.tsx`; Modify `src/routes/castanha.tsx` (aba `'Clientes'` depois de `'Facebook Lead Ads'`).

**Interfaces — Consumes:** `useDados`, Task 4 funções, Task 5 `RegistrarContratoModal`, Task 2 (`contratoAtivo`, `terminaEm`, `recorrenteNoMes`).
- Lista (tabela no desktop, cards no celular): Cliente, Origem, Serviços ativos, Mensal ativo (mês atual), Termina em, Total contratado; filtro Ativos/Encerrados/Todos (padrão Ativos); busca por nome; selo "termina em até 30 dias" quando `terminaEm` ≤ mês seguinte; contagem com `plural`.
- "Novo cliente" → `RegistrarContratoModal` com origem `Manual` (cliente: nome obrigatório, WhatsApp, negócio).
- Detalhe: dados do cliente (editar), WhatsApp (modelo de clientes), contratos com Editar / Mudar valor a partir de… / Encerrar em (mês) / Cancelar; "Novo contrato". Ações confirmadas dentro do próprio modal (sem `confirm()`).
- [ ] **Step 1:** implementar. **Step 2:** tsc; Playwright: cliente do ganho aparece; "Mudar valor a partir de fev/27" para 1500 → painel mostra 1.200 em jan e 1.500 em fev; encerrar → some dos ativos.
- [ ] **Step 3:** commit `castanha: aba Clientes`.

---

### Task 9: Textos e plurais

**Files:** Modify `src/components/PipelineBoard.tsx:145`, `src/components/Overview.tsx:96`, e todo texto visível em `src/routes/castanha.tsx`, `src/components/castanha/*`, `PipelineBoard.tsx`, `Overview.tsx`.
- [ ] **Step 1:** trocar as contagens por `plural()`; `grep -rn "'ões'\|'s'}" src/components src/routes/castanha.tsx` → nada de plural manual.
- [ ] **Step 2:** revisar todos os textos visíveis (acentos, crase, maiúsculas, "Painel Admin" → "Castanha" na tela de login); listar as mudanças no commit.
- [ ] **Step 3:** tsc + build; commit `castanha: corrige textos e plurais`.

---

### Task 10: Fechamento

- [ ] `bun test tests`, `npx tsc --noEmit`, `npx vite build`, `grep` de segredos no bundle.
- [ ] Revisão final do branch (revisor independente, modelo mais capaz).
- [ ] Merge em `main` + push; push do branch.
- [ ] Mensagem para a dona do projeto: colar o script novo, rodar `configurar`, publicar nova versão da implantação, publicar na Lovable, testar §9 do spec.
