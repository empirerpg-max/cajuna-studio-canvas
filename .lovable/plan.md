## Site Cajuna Studio

Site institucional em português com 4 páginas, identidade visual baseada no logo do cajuzinho (laranja #E97933, azul #2D5F8A, preto), fonte Paperlogy e logo animado.

### Páginas

**1. Home (`/`)**
- Hero com logo do caju animado (flutua, "respira", olhinhos piscam), headline e CTAs
- Seção "Quem é a Cajuna" — apresentação da agência
- Seção **Identidade Visual** — pacote base com lista de entregas + adicionais (avatar, banners R$1.000, etc.) com CTA "Quero esse" e "Falar com uma pessoa"
- Seção **Pacotes de Posts** — 3 cards: Areia (R$250), Ventania (R$433/520), Caju (R$520) com entregas, parcelamento e pix
- Seção **Designs Diversos** — Estampas/Produtos, Embalagens, Criativos para anúncios, Kits impressos
- CTA final → orçamento

**2. Portfólio (`/portfolio`)**
- Grid estilo Behance com 8 cards placeholder (imagens geradas), hover com zoom + título/categoria
- Modal/route detail simples ao clicar (imagem grande + descrição)

**3. Briefing (`/briefing`)**
- Página com formulário placeholder ("perguntas em breve") + um formulário inicial (nome, e-mail, tipo de projeto, descrição livre) que envia para o Google Sheet
- Nota visível para o usuário (você) de que pode pedir para eu adicionar as perguntas reais depois

**4. Orçamento (`/orcamento`)**
- Formulário: nome, e-mail, WhatsApp, qual pacote/serviço de interesse (select), mensagem
- Envia para o Google Sheet
- CTA também aparece como destino do botão "Contratar"/"Quero falar com uma pessoa" da home

### Layout global
- Header com logo pequeno + nav (Home, Portfólio, Briefing, Orçamento)
- Footer com Instagram (@cajunastudio), e-mail/whats (placeholder), copyright
- Animações suaves (framer-motion) em entradas de seção

### Detalhes técnicos

- **Stack**: TanStack Start (já configurado), Tailwind v4, framer-motion
- **Logo animado**: SVG recriado a partir do PNG enviado (forma de caju + olhinhos), animado via framer-motion (float + piscar). PNG original também salvo como asset para favicon/og.
- **Fonte Paperlogy**: carregada via `<link>` no `__root.tsx` (Google Fonts / fontshare). Se indisponível, fallback para fonte similar (ex: Plus Jakarta Sans).
- **Cores** registradas como design tokens em `src/styles.css` (`--primary` laranja, `--secondary` azul, foreground preto), mapeadas em `@theme inline`.
- **Envio para Google Sheets**:
  - Conecto o connector Google Sheets (popup de OAuth no seu workspace — você autoriza com a conta dona da planilha)
  - Crio uma server function `submitToSheet` em `src/lib/forms.functions.ts` que faz POST para `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/{ID}/values/{aba}:append?valueInputOption=USER_ENTERED`
  - 3 abas separadas na planilha: `Orcamento`, `Briefing`, `Contratacao` (você pode criar antes ou eu detecto/crio na primeira chamada)
  - Validação com zod (nome, e-mail, comprimento de mensagem) antes de enviar
  - Feedback de sucesso/erro com toast (sonner)
- **Rotas**: `src/routes/index.tsx`, `portfolio.tsx`, `briefing.tsx`, `orcamento.tsx` — cada uma com `head()` próprio (title, description, og)
- **Portfólio placeholder**: 8 imagens geradas (estilo identidade visual variado) salvas em `src/assets/portfolio/`

### O que você ainda pode me passar depois
- Perguntas reais do briefing
- Imagens reais do portfólio (substituir placeholders)
- WhatsApp e e-mail de contato pro footer
- Texto "quem somos" mais detalhado se quiser ajustar

Ao implementar, vou pedir sua confirmação para autorizar o Google Sheets (popup de conexão) e o ID da planilha será extraído do link que você enviou.