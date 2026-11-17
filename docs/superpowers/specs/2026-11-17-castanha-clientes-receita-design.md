# /castanha — Clientes, contratos, receita e painel do mês

Data: 2026-11-17 · Status: rascunho para aprovação · Continua: `2026-11-17-castanha-crm-design.md`

## 1. Intenção

O Castanha já gerencia os leads do Facebook. A equipe quer usar o mesmo lugar para **organizar os
clientes** e **entender o negócio mês a mês**:

- o que entrou (leads novos) e o que virou venda;
- quantos foram perdidos no mês e **por quê** (motivo e etapa em que se perdeu);
- **quanto entra de receita em cada mês**, sabendo que há contratos recorrentes (ex.: 4 meses, valor X
  por mês) e valores únicos (ex.: identidade visual paga uma vez).

Vale para **todos os clientes**, não só os que vieram do Facebook (confirmado pela dona do projeto).
A referência de mercado está na análise publicada ("Raio-X dos CRMs"): motivos de perda curtos e por
etapa (RD Station, Agendor), valor mensal × meses separado do valor único (Pipedrive, HubSpot), venda
ganha vira cliente com contrato (Ploomes).

## 2. Objetivos

1. Ao ganhar uma venda (Facebook → "Ganho"; funil antigo "Leads" → "Fechado"), registrar **cliente** e
   **contrato** (valor mensal × meses a partir de um mês, e/ou valor único num mês).
2. Também poder cadastrar cliente/contrato **à mão** (cliente que não passou por funil).
3. **Toda mudança de etapa** nos dois funis de venda fica registrada (de → para, quando, quem, motivo).
4. **Painel do mês** na Visão Geral: entraram, ganhos, perdidos, conversão, perdidos por motivo e por
   etapa, receita mês a mês (recorrente × único), recorrente ativo e já garantido.
5. **Aba Clientes**: clientes com contratos ativos, valor mensal, quando termina, aviso de contratos
   que terminam em até 30 dias, encerrar contrato antes do fim.
6. Motivo de perda obrigatório também no funil antigo "Leads".
7. Botão de WhatsApp abre a conversa **com a primeira mensagem já escrita**.
8. Corrigir textos com erro na área (ex.: "cartãoões").

### Não-objetivos (agora)

- Migrar os funis antigos para a planilha nova / proteger a API antiga (fica para depois — "caminho B").
- Cobrança, nota fiscal, controle de pagamento recebido × atrasado (a receita é a **prevista pelo
  contrato**, não o que caiu na conta).
- Resumo por e-mail, tempo até primeiro contato (fase "Depois" da análise).
- Histórico das mudanças **anteriores** a esta entrega (o painel começa a contar a partir de agora;
  os leads do Facebook já perdidos aparecem com o motivo, mas sem etapa de saída).

### Anti-objetivos

- Lançar o valor total do contrato no mês em que fechou (distorce a receita mensal).
- Escrever na aba do Meta (`Página1`).
- Expor clientes, contratos ou valores sem login de admin.

## 3. Restrições

- Mesmo stack e padrões da entrega anterior (funções de servidor + `requireAdmin` + token do script).
- Os dados novos ficam na **planilha de leads do Facebook**, via **o script exclusivo** (caminho A
  escolhido pela dona do projeto). A planilha antiga (Usuarios/Deals) não muda.
- O código do script antigo não está disponível → nada novo é guardado nele.
- Datas de mês no formato `YYYY-MM`; fuso `America/Fortaleza`.
- A dona do projeto cola o script atualizado e roda `configurar()` de novo (cria as abas novas).

## 4. Abordagens consideradas

| | Abordagem | Situação |
|---|---|---|
| **A** | Abas novas (Clientes, Contratos, Movimentos) na planilha de leads, pelo script exclusivo com token | ✅ escolhida |
| B | Planilha nova "Castanha" com tudo, migrando os Deals antigos | depois (resolve também a segurança dos Deals) |
| C | Estender o script antigo | descartada (API aberta, código indisponível) |

## 5. Dados (abas novas na planilha de leads)

Todas as colunas como texto (mesma regra da aba `Funil`). IDs gerados pelo script
(`cli_<uuid curto>`, `ctr_<...>`, `mov_<...>`).

**`Clientes`**: `cliente_id, nome, whatsapp, negocio, origem, card_id, funil, criado_em, criado_por, obs`
- `origem`: `Facebook Lead Ads` | `Leads` | `Manual`.
- `card_id`: id do lead do Meta (`l:...`) ou do deal antigo; vazio se manual.

**`Contratos`**: `contrato_id, cliente_id, servico, valor_mensal, meses, inicio, valor_unico,
mes_valor_unico, encerrado_em, criado_em, criado_por, obs`
- Recorrente: `valor_mensal` (centavos inteiros, ver §6.1) × `meses` a partir de `inicio` (`YYYY-MM`).
- Único: `valor_unico` em `mes_valor_unico` (`YYYY-MM`).
- Um contrato pode ter só recorrente, só único, ou os dois (ex.: setup + mensalidade).
- `encerrado_em` (`YYYY-MM`, opcional): o recorrente para de contar **a partir desse mês**.

**`Movimentos`**: `movimento_id, card_id, funil, de_etapa, para_etapa, quando, por, motivo, valor`
- Uma linha por mudança de etapa em `Facebook Lead Ads` ou `Leads`.
- `valor`: valor do deal antigo no momento (o lead do Facebook não tem valor → vazio).
- Para o funil do Facebook, **o próprio script grava** o movimento dentro de `atualizar` quando a
  etapa muda (ele sabe a etapa anterior pela aba `Funil`).
- Para o funil antigo, o site chama uma função de servidor `registrarMovimento` quando o card muda de
  coluna (o deal continua salvo no script antigo como hoje).

## 6. Regras de cálculo (lógica pura, testável)

### 6.1 Dinheiro
Valores guardados e calculados em **centavos inteiros** (evita erro de arredondamento); exibidos como
`R$ 1.200,00`. Entrada aceita "1200", "1.200", "1.200,50", "R$ 1.200,50".

### 6.2 Receita de um mês M
`receita(M) = Σ valor_mensal dos contratos com inicio ≤ M < inicio + meses e (sem encerrado_em ou M < encerrado_em)`
`+ Σ valor_unico dos contratos com mes_valor_unico = M`

- **Recorrente ativo (MRR) em M** = só a primeira soma.
- **Já garantido depois de M** = soma de todos os meses > M (recorrente restante + únicos futuros).
- Gráfico: 12 meses (6 anteriores + mês escolhido + 5 seguintes), barras empilhadas recorrente/único.

### 6.3 Contagens do mês M (painel)
- **Entraram**: leads do Facebook com `chegouEm` em M (sem teste) + deals antigos do funil `Leads`
  com `createdAt` em M.
- **Ganhos**: cards cujo **último** movimento para `Ganho`/`Fechado` aconteceu em M e que **não**
  saíram dessa etapa depois.
- **Perdidos**: igual, para `Perdido`. Agrupados por `motivo` (contagem e soma de `valor`) e por
  `de_etapa` (etapa em que se perdeu).
- **Conversão do mês** = ganhos / (ganhos + perdidos); "—" se zero.
- Alerta "Outro passou de 20% das perdas" quando aplicável.
- Comparação com o mês anterior (seta ↑/↓ e diferença) nos 4 números.
- Ganhos/perdidos dependem dos movimentos registrados a partir desta entrega; o painel mostra a nota
  "Ganhos e perdidos contados desde {data da primeira linha em Movimentos}". Deal do funil antigo criado
  já em Fechado/Perdido, ou com coluna trocada pelo formulário de edição, também gera movimento
  (de_etapa vazio). Deals antigos sem `createdAt` não entram em "Entraram". Sem backfill.

## 7. Telas

### 7.1 Ganhou a venda → "Registrar contrato"
- Disparo: soltar/mover um lead do Facebook para **Ganho**, ou um deal do funil antigo para **Fechado**.
- Abre um modal com o **cliente** pré-preenchido (nome, WhatsApp, negócio vindos do card) e o
  **contrato**: Serviço, [Recorrente] valor por mês + meses (padrão 4) + primeiro mês (padrão: mês
  seguinte) e/ou [Único] valor + mês (padrão: mês atual), Observação.
- Prévia em tempo real: "R$ 1.200/mês de dez/26 a mar/27 · total R$ 4.800" (+ único).
- "Registrar" salva cliente + contrato (+ o movimento de etapa). "Agora não" salva só a mudança de
  etapa; o card mostra um selo "sem contrato" e o detalhe tem o botão "Registrar contrato".
- Se o card já tem cliente (mesmo `card_id`), o contrato novo é ligado a ele.
- **Card que volta para Ganho e já tem contrato ativo** (*decisão do Claude*): o modal mostra o contrato
  existente com "Manter este contrato" (padrão) ou "Registrar outro contrato". Evita duplicar receita
  quando alguém arrasta por engano.

### 7.1b Card sai de Ganho/Fechado tendo contrato
*Decisão do Claude.* Ao mover para outra etapa um card que tem contrato ativo, o site pergunta:
"O contrato de {cliente} continua valendo?" → **Manter** (padrão; ex.: arrastou por engano) ou
**Cancelar contrato** (o contrato é encerrado no mês de início → deixa de contar receita em todos os
meses; fica visível como "cancelado" no cliente). Ação nova no script: `cancelarContrato`.

### 7.2 Perdeu no funil antigo
- Soltar um deal do funil `Leads` em **Perdido** abre o mesmo seletor de motivo do Facebook
  (lista `MOTIVOS_PERDA`); o motivo vai para `Movimentos`. Sem motivo, o card não muda.

### 7.3 Visão Geral (vira o "painel do mês")
Ordem: seletor de mês (← nov/26 →) · 4 números (Entraram, Ganhos, Perdidos, Conversão) com comparação ·
Receita (3 números + gráfico) · Perdidos por motivo (barras horizontais, com valor) e por etapa ·
bloco atual do Facebook · blocos financeiros antigos (por funil / por serviço).

### 7.4 Aba "Clientes" (nova, depois de "Facebook Lead Ads")
- Lista: cliente, origem, serviços ativos, valor mensal ativo, termina em, total do contrato.
- Filtros: ativos / encerrados / todos; busca por nome.
- Destaque "termina em até 30 dias".
- Detalhe do cliente: contratos (editar, encerrar antes do fim escolhendo o mês), botão WhatsApp,
  "Novo contrato".
- **Editar x mudar valor** (*decisão do Claude*): "Editar" corrige erro de digitação e recalcula todos
  os meses (inclusive passados). Para reajuste, o botão **"Mudar valor a partir de…"** encerra o
  contrato no mês escolhido e cria outro com o valor novo dali em diante — os meses passados não mudam.
- Botão "Novo cliente" (origem `Manual`).

### 7.5 WhatsApp com mensagem pronta
`https://wa.me/<número>?text=<mensagem>` com:
> Oi, {primeiro nome}! Aqui é {nome do admin logado}, da Cajuna Studio 🧡 Vi que você pediu um orçamento de {o que precisa}. Posso te fazer umas perguntinhas rápidas?

- Sem "o que precisa" (ou lead de teste), o trecho entre colchetes some (ver modelo abaixo).
- Primeiro nome = primeira palavra do nome, com só a inicial maiúscula.
- **Mensagem editável pela equipe** (pedido da dona do projeto): botão "Mensagem do WhatsApp" no
  cabeçalho do funil Facebook Lead Ads abre um campo de texto com o modelo e as variáveis
  `{nome}`, `{admin}`, `{precisa}`, `{negocio}`; trechos entre `[` `]` só aparecem se todas as
  variáveis dentro deles tiverem valor. Prévia ao vivo com um lead de exemplo. Botão "Voltar ao
  padrão". Guardado na aba `Config` da planilha de leads (`chave`, `valor`), igual para toda a equipe.
  Modelo padrão:
  `Oi, {nome}! Aqui é {admin}, da Cajuna Studio 🧡 Vi que você pediu um orçamento[ de {precisa}]. Posso te fazer umas perguntinhas rápidas?`
- **Em todos os funis** (pedido da dona do projeto): Facebook Lead Ads, Leads, Identidade Visual,
  Redes Sociais, Campanhas, Avulsos — no card e no detalhe — e na aba Clientes. Funis antigos usam o
  campo `contato` do deal como número.
- **Dois modelos** (*decisão do Claude*: a mensagem de orçamento não serve para cliente em produção):
  - **Prospecção** (Facebook Lead Ads e Leads): o modelo de orçamento acima. No funil Leads,
    `{precisa}` = serviço do deal e `{negocio}` vazio.
  - **Clientes** (funis de projeto e aba Clientes): padrão
    `Oi, {nome}! Aqui é {admin}, da Cajuna Studio 🧡 Tudo bem por aí?` com as mesmas variáveis.
  - Os dois editáveis no mesmo modal (abas "Prospecção" / "Clientes"); chaves `mensagem_whatsapp` e
    `mensagem_whatsapp_clientes`. O botão "Mensagem do WhatsApp" fica no cabeçalho de todos os funis.
- Formato de número recebido do Meta: `+5568999852899` (já funciona).

### 7.6 Textos
- Função de plural (`1 cartão` / `2 cartões`, `1 lead` / `2 leads`, `1 cliente` / `2 clientes`) usada
  em todo lugar com contagem.
- Revisão de todos os textos visíveis da área `/castanha` (acentos, plurais, maiúsculas).

## 8. API (funções de servidor; todas com `requireAdmin`)

- `listarCastanha()` → `{ clientes, contratos, movimentos }` (uma chamada ao script, ação `dados`).
- `salvarCliente(cliente)`, `salvarContrato(contrato)` (criar ou editar; script gera ids).
- `registrarGanho({ cliente, contrato?, movimento })` (uma ação no script, sob lock, para não criar
  cliente sem movimento).
- `registrarMovimento(movimento)` (funil antigo).
- `lerConfig()` / `salvarConfig({ chave, valor })` (aba `Config`; hoje só `mensagem_whatsapp`).
- `cancelarContrato(contrato_id)`, `mudarValorContrato({ contrato_id, a_partir_de, valor_mensal })`.
- O `atualizar` do Facebook passa a gravar movimento quando a etapa muda.

## 9. Como saber que deu certo

- Mover lead para Ganho com contrato 4× R$ 1.200 a partir de dez → painel mostra R$ 1.200 em dez, jan,
  fev, mar e R$ 0 em abr; "já garantido" em nov = R$ 4.800.
- Valor único de R$ 3.500 em nov aparece só em nov.
- Encerrar o contrato em fev → some de fev em diante.
- Perder um deal do funil antigo em "Proposta Enviada" com "Sem orçamento" → aparece no painel do mês
  em motivo e etapa, com o valor do deal.
- Botão do WhatsApp abre com a mensagem certa para `+5568999852899`.
- Nenhum "cartãoões" na área.

## 10. Fica a cargo do builder

Componentes, layout interno dos modais e tabelas (dentro do estilo atual), biblioteca de gráfico
(preferir SVG simples como no Raio-X; `recharts` já existe no projeto), formato exato dos ids.

## 11. Riscos

- Funis antigos continuam com API aberta (já documentado).
- O painel depende de os movimentos serem registrados; mudanças feitas direto na planilha não entram.
- Uma chamada a mais ao Apps Script na abertura (dados do painel) — 1–3 s.
