# /castanha — Área do administrador com CRM de Facebook Lead Ads (PWA)

Data: 2026-11-17 · Status: rascunho para aprovação

## 1. Intenção

A Cajuna Studio recebe leads de campanhas do Facebook/Instagram (Meta Lead Ads). O Meta grava cada lead,
automaticamente, numa planilha Google. Hoje não há um lugar para **trabalhar** esses leads — eles ficam
parados na planilha. A equipe quer um kanban no estilo HubSpot/RD Station CRM onde cada lead vira um card
sem digitação manual, e quer usá-lo no celular como um app instalado.

Ao mesmo tempo, já existe uma área admin em `/admin-cajuna` (login de admin + kanban de vários funis
guardados na aba `Deals` de outra planilha). Decisão da dona do projeto: **mesclar tudo e deixar só
`/castanha`**.

## 2. Objetivos

1. `/castanha` passa a ser a única área do administrador: tudo o que `/admin-cajuna` faz hoje, mais o
   funil novo. `/admin-cajuna` deixa de existir.
2. Novo funil **"Facebook Lead Ads"**, alimentado sozinho pela planilha do Meta.
3. `/castanha` instalável no celular (PWA), abrindo direto no painel, com login que não se perde.
4. Dados pessoais dos leads (nome, WhatsApp) nunca expostos publicamente.

### Não-objetivos (v1)

- Notificação push de lead novo.
- Criar automaticamente um card no funil de projeto quando o lead é "Ganho".
- Funcionar offline com dados (offline mostra só "sem conexão").
- Reescrever os funis existentes (Leads, Identidade Visual, etc.) — eles migram como estão.
- Corrigir a segurança da API antiga de `Deals` (ver §9, risco conhecido).

### Anti-objetivos (seria fracasso mesmo "funcionando")

- Qualquer escrita na aba do Meta (`Página1`) — quebraria a integração do Meta.
- Leads acessíveis por quem não fez login de admin (LGPD; o site tem política de privacidade publicada).
- O site público (home, portfólio etc.) ficar "instalável" ou ganhar service worker.

## 3. Restrições

- Stack existente: TanStack Start + React 19 + Tailwind 4, hospedado pela Lovable (Cloudflare Workers).
  Funções de servidor via `createServerFn` (exemplo: `src/lib/forms.functions.ts`). Segredos via
  variáveis de ambiente lidas **dentro** do handler (`src/lib/config.server.ts` explica o porquê).
- O código dos Apps Scripts não fica no repositório; a cópia do script de leads está em
  `docs/apps-script/facebook-leads.gs` (referência — a fonte da verdade é o editor do Apps Script).
- Visual: identidade Cajuna (laranja `#E97933`, azul `#2D5F8A`, preto `#1A1A1A`, fonte Paperlogy), seguir o
  estilo atual do `/admin-cajuna`.

## 4. Fontes de dados

### 4.1 Planilha de leads (nova) — "[Cajuna Studio] Campanhas Facebook Lead Ads"

- Aba `Página1`: escrita **só pelo Meta**. Colunas: `id, created_time, ad_id, ad_name, adset_id,
  adset_name, campaign_id, campaign_name, form_id, form_name, is_organic, platform,
  o_que_você_precisa?, em_que_fase_você_está?, qual_é_o_seu_negócio?, full_name, whatsapp_number,
  lead_status`.
- Aba `Funil`: escrita só pelo script. Colunas: `lead_id, etapa, responsavel, proximo_passo,
  data_proximo_passo, motivo_perda, anotacoes, atualizado_em, atualizado_por`. Lead sem linha aqui = etapa
  "Novo".
- Script exclusivo já publicado (Web App, "Qualquer pessoa"), protegido por token.
  - `POST {token, action:"listar"}` → `{ok, etapas[], leads[]}` (leads já mesclados com a aba Funil,
    mais recentes primeiro, `teste: true` para leads de teste do Meta).
  - `POST {token, action:"atualizar", id, campos:{etapa?, responsavel?, proximoPasso?,
    dataProximoPasso?, motivoPerda?, anotacoes?}, usuario}` → `{ok, lead}`.
  - Erros: `{ok:false, erro}` (`nao_autorizado`, `acao_invalida`, mensagem).
  - O body vai como `text/plain` com JSON; o Apps Script responde com redirect 302 — seguir o redirect.

### 4.2 Planilha antiga (Usuarios / Deals) — sem mudanças

Mesmo Apps Script de hoje (`action=login`, `getDeals`, `getAdmins`, `saveDeals`, `deleteDeal`).

## 5. Abordagens consideradas (para ler a planilha de leads)

| Abordagem | Prós | Contras |
|---|---|---|
| **A. Apps Script exclusivo na planilha de leads + chamadas pelo servidor do site** ✅ escolhida | Planilha do Meta intocada; tudo num lugar; token nunca vai ao navegador | Script fora do repo; precisa republicar a cada mudança |
| B. Planilha pública lida direto (CSV/gviz) | Zero script | Expõe nome/WhatsApp de todos os leads — inaceitável (LGPD) |
| C. Google Sheets API com conta de serviço | Seguro, sem Apps Script | Exige projeto no Google Cloud + credenciais; trabalho desproporcional |

Escolhida pela dona do projeto: **A**.

## 6. Design

### 6.1 Rotas

- Criar `src/routes/castanha.tsx` (ou pasta `castanha/` se o builder preferir sub-rotas) com o conteúdo de
  `admin-cajuna.tsx` + a aba nova. `head`: `noindex, nofollow`, link do manifest, `theme-color`,
  `apple-touch-icon`, `apple-mobile-web-app-capable`.
- Apagar `src/routes/admin-cajuna.tsx`. Sem redirect (a URL antiga simplesmente deixa de existir) —
  *decisão do Claude*.

### 6.2 Login e sessão (servidor)

Hoje o login é feito no navegador e vive só no `useState` (recarregou, deslogou). Para PWA isso não serve,
e as funções de servidor dos leads precisam saber se quem chama é admin.

- Função de servidor `castanhaLogin({usuario, senha})`: chama `action=login` do script antigo; se
  `ok && tipo === 'admin'`, grava cookie de sessão **HttpOnly, Secure, SameSite=Lax, Path=/**, válido por
  30 dias, com `{nome, codigo_contrato, exp}` assinado por HMAC-SHA256 (Web Crypto) usando o segredo
  `CASTANHA_SESSION_SECRET`.
- `castanhaSession()`: devolve o admin logado ou `null` (usado no carregamento da página).
- `castanhaLogout()`: apaga o cookie.
- Toda função de servidor de leads valida o cookie antes de qualquer coisa; sem sessão → erro 401.
- **Revogação** (*decisão do Claude*): a cada validação, conferir se o `codigo_contrato` da sessão ainda
  está na lista de `getAdmins` (resultado em cache no servidor por até 10 min). Quem sai da lista perde o
  acesso em no máximo 10 min. Trocar `CASTANHA_SESSION_SECRET` derruba todas as sessões de uma vez.
- O formulário de login mapeia Usuário → `codigo_contrato` e Senha → `codigo_unico`, como hoje.
- Os funis antigos continuam chamando o script antigo direto do navegador, como hoje (ver §9).

### 6.3 Funções de servidor dos leads

Arquivo sugerido: `src/lib/castanha-leads.functions.ts`.

- `listarLeads()` → chama o script com `FB_LEADS_SCRIPT_URL` + `FB_LEADS_TOKEN` e devolve os leads.
- `atualizarLead({id, campos})` → valida com zod (etapa ∈ lista; textos até 5.000 caracteres; data
  `YYYY-MM-DD` ou vazio) e repassa ao script com `usuario` = nome do admin da sessão (não confiar no
  navegador para isso).
- Variáveis de ambiente (segredos na Lovable): `FB_LEADS_SCRIPT_URL`, `FB_LEADS_TOKEN`,
  `CASTANHA_SESSION_SECRET`. URL do Web App:
  `https://script.google.com/macros/s/AKfycbzwWG1VY3sZk_FG6RayJ1FV4vWjdC-fBZ1pl8DzVJhTv270GdWAsVl4qpUKo58RGjtn/exec`
  (pode ficar como fallback no código, como `forms.functions.ts` faz; o token **não**).

### 6.4 Abas do painel

`Visão Geral` · **`Facebook Lead Ads`** (nova, segunda aba) · `Leads` · `Identidade Visual` ·
`Gerenciamento de Redes Sociais` · `Gerenciamento de Campanhas` · `Avulsos`.

### 6.5 Funil "Facebook Lead Ads"

**Etapas:** Novo → Tentando contato → Em conversa → Reunião agendada → Proposta enviada → Negociação →
Ganho → Perdido. (A lista oficial vem do script em `etapas`.)

**Mapeamento de campos (nomes no kanban):**

| Coluna Meta | Rótulo | Onde |
|---|---|---|
| `full_name` | Nome | título do card |
| `whatsapp_number` | WhatsApp | card — botão que abre `https://wa.me/<só dígitos>` |
| `o_que_você_precisa?` | O que precisa | card |
| `qual_é_o_seu_negócio?` | Negócio | card |
| `em_que_fase_você_está?` | Fase do negócio | card |
| `created_time` | Chegou em | card ("há 2h"); data completa nos detalhes |
| `campaign_name` | Campanha | card (etiqueta) |
| `platform` | Plataforma | card (ícone: `fb` Facebook, `ig` Instagram; outro/vazio → nada) |
| `is_organic` | Origem | detalhes ("Pago"/"Orgânico") |
| `adset_name` | Público | detalhes |
| `ad_name` | Anúncio | detalhes |
| `form_name` | Formulário | detalhes |
| `lead_status` | Status no Meta | detalhes |
| `id`, `ad_id`, `adset_id`, `campaign_id`, `form_id` | — | seção recolhida "Dados técnicos" |

Valores com o texto `<test lead: dummy data ...>` do Meta são mostrados como estão.

**Outras perguntas:** formulários futuros podem ter perguntas diferentes. O script devolve toda coluna
que não conhece em `lead.outras` (`{ "pergunta original": "resposta" }`); o detalhe mostra essas
respostas numa seção "Outras respostas" (*decisão do Claude*). A versão do script com `outras` precisa
ser colada e republicada no Apps Script.

**Campos editáveis (aba Funil), no painel de detalhes:** Etapa (select), Responsável (select com a lista
de `getAdmins`; texto livre se a lista falhar), Próximo passo (texto), Data do próximo passo (data),
Motivo de perda (select: Sem resposta, Sem orçamento, Só curiosidade, Fechou com outro, Fora do perfil,
Outro — **obrigatório ao ir para Perdido**; apagado se o lead sair de Perdido), Anotações (texto longo). Mostrar "Atualizado por X em Y".

**Card na coluna (esboço):**

```
┌───────────────────────────────┐
│ Maria Souza          há 2h  ⓕ │
│ Negócio: Confeitaria          │
│ Precisa: Identidade visual    │
│ Fase: Começando agora         │
│ [Orçamento grátis nov26]      │
│ (WhatsApp)  · Resp.: Ana      │
└───────────────────────────────┘
```

**Sinais visuais:**
- Etapa "Novo": o "há X" fica vermelho depois de 1 hora sem contato.
- Próximo passo com data vencida: borda/selo de alerta no card.
- Cabeçalho de cada coluna mostra a contagem.

**Interações:**
- Desktop: arrastar e soltar entre colunas (mesmo padrão de `PipelineBoard.tsx`).
- Celular: colunas com rolagem horizontal (snap por coluna); mover pelo select "Etapa" no detalhe. Não
  depender de arrastar no toque.
- Detalhe abre em painel/modal ao tocar no card.
- Arrastar para "Perdido" abre o detalhe pedindo o motivo antes de salvar.
- Atualização otimista com rollback e aviso se o script devolver erro.
- Filtros no topo: busca por nome/WhatsApp, campanha, responsável; "Mostrar leads de teste" (desligado
  por padrão).

**Volume** (*decisão do Claude*): v1 carrega todos os leads (esperado: centenas). Nas colunas Ganho e
Perdido, mostrar só os últimos 30 dias, com "ver todos" para expandir. Se passar de ~2.000 leads,
revisar o script (paginação/arquivamento).

**Atualização dos dados:** carregar ao abrir a aba, ao voltar o foco para o app, a cada 60 s enquanto a
aba estiver visível, e botão "Atualizar". Mostrar "atualizado há X".

### 6.6 Visão Geral

Acrescentar um bloco do Facebook Lead Ads: leads novos nos últimos 7 dias, leads por etapa, leads "Novo"
há mais de 1 h, taxa Ganho / (Ganho + Perdido). Leads de teste ficam fora dos números. O resto da Visão Geral fica como está.

### 6.7 PWA

- Manifest próprio da área: `name` "Castanha — Cajuna Studio", `short_name` "Castanha",
  `start_url` e `scope` `/castanha`, `display: standalone`, `theme_color`/`background_color` da marca,
  ícones 192, 512 e 512 maskable (PNG, gerados a partir de `public/logocajuna111.svg`) + apple-touch-icon
  180.
- O manifest é linkado **só** no `head` de `/castanha`.
- Service worker com escopo `/castanha`: guarda apenas a casca do app (HTML/JS/CSS/fontes/ícones) e usa
  rede primeiro; **nunca** guarda respostas com dados de leads ou deals. Sem rede: tela "Sem conexão".
  Como o escopo do SW depende do caminho do arquivo, servir em um caminho sob `/castanha` ou com o
  header `Service-Worker-Allowed` — o builder escolhe o que funcionar na hospedagem.
- Botão "Instalar app" quando o navegador oferecer `beforeinstallprompt`; no iPhone, uma dica curta
  ("Compartilhar → Adicionar à Tela de Início").

## 7. Fica a cargo do builder

Estrutura de componentes (reaproveitar ou generalizar `PipelineBoard`), biblioteca de cache/estado
(React Query já está instalado), forma de gerar os ícones, detalhes de layout dentro do estilo existente.

## 8. Como saber que deu certo

- Lead de teste do Meta aparece no funil (com "Mostrar leads de teste" ligado) sem ninguém digitar.
- Mover um card muda a aba `Funil` da planilha; a aba `Página1` não muda.
- Sem login, chamar as funções de servidor de leads devolve 401.
- No celular, "Adicionar à tela de início" abre direto em `/castanha`, e o login sobrevive a fechar e
  reabrir.
- Todas as funções atuais do `/admin-cajuna` funcionam em `/castanha`; `/admin-cajuna` dá 404.

## 9. Riscos conhecidos

- **API antiga de Deals é aberta:** `getDeals`, `getAdmins`, `saveDeals` e `deleteDeal` do script antigo
  não exigem login — quem tiver a URL (que está no código do navegador) lê e altera os deals. Fora do
  escopo desta entrega; recomendado como próximo passo (mesmo padrão: token + chamadas pelo servidor).
- O login antigo confere senha no script e devolve `tipo`; a sessão nova confia nessa resposta.
- Apps Script tem cota diária e latência de 1–3 s; o polling de 60 s por aparelho aberto é bem abaixo da
  cota para uma equipe pequena.
