import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CornerDownLeft,
  Send,
  Upload,
  X,
} from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { submitForm } from "@/lib/forms.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/briefing")({
  head: () => ({
    meta: [
      { title: "Briefing — Cajuna Studio" },
      {
        name: "description",
        content: "Conte sobre o seu projeto pra gente entender o melhor caminho.",
      },
      { property: "og:title", content: "Briefing — Cajuna Studio" },
      {
        property: "og:description",
        content: "Formulário de briefing para projetos de identidade visual.",
      },
    ],
  }),
  component: Briefing,
});

// ─── Tipos ──────────────────────────────────────────────────────────────────

type QuestionType = "text" | "email" | "textarea" | "multicheck" | "upload";

type Question = {
  id: string;
  section: string;
  emoji: string;
  title: string;
  hint?: string;
  type: QuestionType;
  placeholder?: string;
  required?: boolean;
  skippable?: boolean;
  options?: string[];
  transitionMessage?: string;
};

// Remove emojis iniciais do label (ex: "✨ Moderna" → "Moderna")
function stripEmoji(label: string): string {
  return label.replace(/^[\p{Emoji}\s]+/u, "").trim();
}

// ─── Perguntas ───────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  // Seção 1 — Vamos nos conhecer
  {
    id: "nome",
    section: "Vamos nos conhecer",
    emoji: "👋",
    title: "Qual é o seu nome?",
    type: "text",
    placeholder: "Digite seu nome...",
    required: true,
  },
  {
    id: "email",
    section: "Vamos nos conhecer",
    emoji: "👋",
    title: "Qual é o seu e-mail?",
    type: "email",
    placeholder: "seuemail@exemplo.com",
    required: true,
  },
  {
    id: "parceiro",
    section: "Vamos nos conhecer",
    emoji: "👋",
    title: "Mais alguém vai participar do processo com você?",
    hint:
      "Quem faz parte da aprovação deve participar do preenchimento. Se houver sócio, cofundador ou alguém que aprove o projeto, vale preencher junto para evitar retrabalho.",
    type: "text",
    placeholder: "Nome da pessoa (ou deixe em branco)",
    skippable: true,
    transitionMessage: "Ótimo. Agora vamos entrar no universo da sua marca. 🏢",
  },

  // Seção 2 — Sua empresa
  {
    id: "nome_marca",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Qual é o nome e a tagline da sua marca para o logotipo?",
    hint:
      'Escreva exatamente como quer que apareça — grafia, pontuação e espaços corretos. Exemplo: "Cajuna Studio — Sua marca com identidade".',
    type: "text",
    placeholder: "Nome da marca — tagline",
    required: true,
  },
  {
    id: "historia_nome",
    section: "Sua empresa",
    emoji: "🏢",
    title: "O que esse nome significa pra você?",
    hint:
      "Existe alguma história, simbologia ou intenção por trás? Mesmo que pareça simples, isso ajuda muito na construção visual.",
    type: "textarea",
    placeholder: "Me conta a história do nome...",
    skippable: true,
  },
  {
    id: "descricao",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Do que se trata a sua marca? O que ela faz?",
    hint:
      'Descreva como explicaria pra um amigo. Evite: "presto consultoria". Prefira: "ajudo pequenos negócios a criarem presença visual no Instagram".',
    type: "textarea",
    placeholder: "Descreva sua marca e o que ela oferece...",
    required: true,
  },
  {
    id: "slogan",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Sua marca tem slogan?",
    hint:
      "Slogan é uma frase curta e marcante. Se ainda não tiver, pode deixar em branco ou colocar uma ideia.",
    type: "text",
    placeholder: "Ex: Sua marca com identidade",
    skippable: true,
  },
  {
    id: "concorrentes",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Quais são os principais concorrentes da sua empresa?",
    hint:
      "Cole o Instagram ou site de cada um. Precisamos garantir que sua marca seja única — sem semelhança visual com quem já está no mercado.",
    type: "textarea",
    placeholder: "@concorrente1 — visual colorido, foco em jovens\nwww.concorrente2.com.br — sóbrio, atende B2B",
    required: true,
  },
  {
    id: "mvv",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Quais são a missão, visão e valores da sua marca?",
    hint:
      "• Missão → o que você faz e pra quem?\n• Visão → onde quer chegar em 3 a 5 anos?\n• Valores → o que guia suas decisões todo dia?",
    type: "textarea",
    placeholder: "Missão: ...\nVisão: ...\nValores: ...",
    required: true,
  },
  {
    id: "publico",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Quem é o seu público-alvo?",
    hint:
      'Quanto mais específico, melhor. Exemplo: "Mulheres entre 28 e 40 anos, empreendedoras, classe média-alta, ativas no Instagram".',
    type: "textarea",
    placeholder: "Descreva seu cliente ideal...",
    required: true,
  },
  {
    id: "diferencial",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Qual é o diferencial da sua marca frente às concorrentes?",
    hint:
      "Pode ser atendimento, método, linguagem, produto, agilidade, experiência ou especialização.",
    type: "textarea",
    placeholder: "Nosso diferencial é...",
    required: true,
  },
  {
    id: "sensacao",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Quando olharem para a sua marca, o que você quer que sintam?",
    hint:
      'Pense em emoções. Exemplo: "Quero que sintam confiança e sofisticação" ou "Quero parecer acessível, como um amigo especialista".',
    type: "textarea",
    placeholder: "Quero que sintam...",
    required: true,
  },
  {
    id: "personalidade",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Se a sua marca fosse uma pessoa, como ela seria?",
    hint:
      "Escolha quantas palavras quiser — elas vão guiar fonte, cor e forma da sua identidade. Não precisa ser perfeito, confie no instinto! 🎨\n\n💡 Uma marca Ousada pede cores fortes e formas assimétricas; uma Delicada pede tons suaves e tipografia leve.",
    type: "multicheck",
    options: [
      "✨ Moderna",
      "💎 Elegante",
      "🎉 Extrovertida",
      "🤫 Discreta",
      "🏛️ Tradicional",
      "🧭 Aventureira",
      "🦉 Madura",
      "🌸 Sensível",
      "🪷 Delicada",
      "🤓 Nerd",
      "📐 Conservadora",
      "😄 Brincalhona",
      "☀️ Alegre",
      "😌 Calma",
      "👑 Líder",
      "⚡ Energética",
      "📚 Sábia",
      "🤝 Acessível",
      "💠 Exclusiva",
      "🎨 Criativa",
      "🔬 Científica",
      "🌹 Romântica",
      "🔥 Ousada",
      "🥃 Sóbria",
      "🪵 Rústica",
      "👔 Formal",
      "🚀 Futurista",
      "🏺 Antiga",
      "🧠 Racional",
      "💪 Determinada",
      "🌐 Mente Aberta",
      "🏖️ Relaxada",
      "🎈 Divertida",
      "🍃 Tranquila",
      "🔮 Intuitiva",
      "🛡️ Confiável",
      "🦋 Diferente",
      "🎯 Persistente",
      "⏱️ Disciplinada",
      "💼 Profissional",
      "💡 Esperta",
      "🌟 Deslumbrante",
      "📡 Atual",
      "✅ Padronizada",
      "🌼 Inocente",
      "🕊️ Livre",
      "🎓 Acadêmica",
      "⚖️ Estável",
      "🌫️ Sutil",
      "☕ Básica",
      "👟 Casual",
      "💭 Sonhadora",
      "🗂️ Convencional",
      "💥 Radical",
      "🌱 Simples",
      "😈 Atrevida",
      "📅 Cotidiana",
      "🎭 Multifacetada",
      "🪞 Refinada",
      "⚙️ Industrial",
      "🌤️ Leve",
      "🏙️ Contemporânea",
    ],
    required: true,
  },
  {
    id: "tres_palavras",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Das palavras que você escolheu, quais são as 3 mais importantes?",
    hint:
      "Essas 3 palavras serão o norte criativo. Tudo que criarmos vai passar pelo filtro delas.",
    type: "text",
    placeholder: "Palavra 1, Palavra 2, Palavra 3",
    required: true,
  },
  {
    id: "redes",
    section: "Sua empresa",
    emoji: "🏢",
    title: "Sua marca possui site ou redes sociais?",
    type: "text",
    placeholder: "@suamarca · www.suamarca.com.br",
    skippable: true,
    transitionMessage: "Perfeito. Agora vamos falar das referências visuais. 🎨",
  },

  // Seção 3 — Referências visuais
  {
    id: "simbolo",
    section: "Referências visuais",
    emoji: "🎨",
    title: "Sua marca precisa de algum símbolo junto ao logotipo?",
    hint:
      "Símbolo é o elemento visual que acompanha o nome.\n• Nike → o swoosh  • Apple → a maçã  • Starbucks → a sereia\n\nTem alguma ideia? Iniciais? Um animal? Um ícone específico?",
    type: "textarea",
    placeholder: "Descreva o que imagina (ou deixe em branco)...",
    skippable: true,
  },
  {
    id: "cores",
    section: "Referências visuais",
    emoji: "🎨",
    title: "Há alguma paleta de cores com a qual você se identifica?",
    hint:
      "🔴 Vermelho → energia  •  🔵 Azul → confiança  •  🟢 Verde → natureza  •  🟡 Dourado → sofisticação\n\nPesquise em: coolors.co · colorhunt.co · pinterest.com\nCole links ou descreva as cores.",
    type: "textarea",
    placeholder: "Cole links de paletas ou descreva as cores...",
    required: true,
  },
  {
    id: "cores_nao",
    section: "Referências visuais",
    emoji: "🎨",
    title: "Tem alguma cor que você NÃO quer de jeito algum?",
    hint:
      "Tão importante quanto o que você gosta. Se remete a concorrente ou você simplesmente não suporta — fala sem medo.",
    type: "textarea",
    placeholder: "Ex: Verde — remete a um concorrente direto...",
    skippable: true,
  },
  {
    id: "logo_antigo",
    section: "Referências visuais",
    emoji: "🎨",
    title: "Você já tem algum logotipo?",
    hint:
      "Se sim: por que quer mudar? Manteria algum elemento?\nÀs vezes o cliente quer uma evolução, não uma ruptura total.",
    type: "textarea",
    placeholder: "Me conta sobre o logo atual (ou 'Não tenho')...",
    skippable: true,
  },
  {
    id: "logos_ref",
    section: "Referências visuais",
    emoji: "🎨",
    title: "Cite pelo menos 3 logos que você aprecia — de qualquer segmento.",
    hint:
      "O objetivo é entender seu gosto visual. Para cada um, diga o que te agradou: a fonte? o símbolo? a simplicidade?\n\nBusque em: behance.net · dribbble.com · pinterest.com",
    type: "textarea",
    placeholder: "1. Nike — adoro a simplicidade do swoosh\n2. ...\n3. ...",
    required: true,
  },
  {
    id: "elementos",
    section: "Referências visuais",
    emoji: "🎨",
    title: "Quer elementos de apoio na sua identidade visual?",
    hint:
      "Elementos de apoio são os 'coadjuvantes' da marca:\n• Stickers e ícones personalizados\n• Formas e bases geométricas\n• Padrão ou estampa com logo repetido",
    type: "textarea",
    placeholder: "Descreva o que imagina (ou deixe em branco)...",
    skippable: true,
  },
  {
    id: "aplicacoes",
    section: "Referências visuais",
    emoji: "🎨",
    title: "Onde você imagina ver a sua marca aplicada?",
    hint: "Isso define os formatos e arquivos que serão entregues. Selecione tudo que fizer sentido.",
    type: "multicheck",
    options: [
      "📱 Redes sociais",
      "🖨️ Materiais impressos",
      "🏪 Fachada / placa",
      "👕 Camisetas / vestuário",
      "🎁 Brindes",
      "🪧 Outdoor / banner",
      "📦 Embalagens",
    ],
    required: true,
  },
  {
    id: "imagem_marca",
    section: "Referências visuais",
    emoji: "🎨",
    title: "Se sua marca fosse uma foto ou imagem, como seria essa cena?",
    hint:
      "Pode ser uma cena, uma sensação ou um link do Pinterest.\nEx: 'Mesa de trabalho clean com café e luz natural' ou 'Festa cheia de gente animada'.",
    type: "textarea",
    placeholder: "Descreva ou cole um link do Pinterest...",
    skippable: true,
    transitionMessage: "Quase lá! Agora só os arquivos e os detalhes finais. 📎",
  },

  // Seção 4 — Arquivos
  {
    id: "upload_refs",
    section: "Arquivos",
    emoji: "📎",
    title: "Envie referências visuais que você aprecia.",
    hint:
      "Quanto mais exemplos, mais fácil de entrar na sua cabeça. Pode ser de qualquer segmento.",
    type: "upload",
    skippable: true,
  },
  {
    id: "upload_fotos",
    section: "Arquivos",
    emoji: "📎",
    title: "Tem fotos profissionais do seu produto ou serviço?",
    hint:
      "Fotos profissionais agregam muito na apresentação final — usamos para contextualizar o logo nos mockups.",
    type: "upload",
    skippable: true,
  },
  {
    id: "upload_logo_antigo",
    section: "Arquivos",
    emoji: "📎",
    title: "Logo antigo ou rascunhos seus? Envie aqui.",
    hint:
      "Mesmo que seja um desenho no celular fotografado — vale enviar. Qualquer ideia inicial nos ajuda.",
    type: "upload",
    skippable: true,
    transitionMessage: "Ótimo! Só os detalhes finais agora. 🎯",
  },

  // Seção 5 — Detalhes finais
  {
    id: "contatos",
    section: "Detalhes finais",
    emoji: "🎯",
    title: "Quais dados de contato vão nos materiais?",
    hint:
      "Já deixe formatado como quer que apareça:\n📱 (84) 99999-9999\n📸 @suamarca\n🌐 www.suamarca.com.br",
    type: "textarea",
    placeholder: "Telefone, WhatsApp, Instagram, site, e-mail, endereço...",
    required: true,
  },
  {
    id: "destaques",
    section: "Detalhes finais",
    emoji: "🎯",
    title: "Quais destaques você tem atualmente no Instagram?",
    hint:
      'Os destaques fazem parte da identidade visual e precisam ser coerentes com a marca.\nEx: "Tenho: Sobre mim, Serviços. Quero criar: FAQ, Portfólio, Promoções."',
    type: "textarea",
    placeholder: "Destaques atuais: ...\nDestaques que quero criar: ...",
    skippable: true,
  },
  {
    id: "livre",
    section: "Detalhes finais",
    emoji: "🎯",
    title: "Tem algo que deixamos passar? Espaço livre 😊",
    hint:
      "Uma preocupação específica, referência a mais, restrição não mencionada — qualquer coisa que você ache importante.",
    type: "textarea",
    placeholder: "Fique à vontade...",
    skippable: true,
  },
];

// ─── Componente principal ────────────────────────────────────────────────────

function Briefing() {
  const submit = useServerFn(submitForm);

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [transitionMsg, setTransitionMsg] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [checks, setChecks] = useState<Record<string, string[]>>({});

  const q = QUESTIONS[step];
  const progress = Math.round(((step + 1) / QUESTIONS.length) * 100);

  // Palavras escolhidas na pergunta personalidade (sem emojis)
  const personalidadeTags = (checks["personalidade"] ?? []).map(stripEmoji);

  // Sincroniza o campo de texto ao mudar de pergunta
  useEffect(() => {
    if (!started || !q) return;
    if (q.type === "text" || q.type === "email" || q.type === "textarea") {
      setValue(answers[q.id] ?? "");
    } else {
      setValue("");
    }
  }, [step, started]); // eslint-disable-line react-hooks/exhaustive-deps

  // Valor atual resolvido (para validação)
  const currentValue = useMemo(() => {
    if (!q) return "";
    if (q.type === "multicheck") return (checks[q.id] ?? []).join(", ");
    if (q.type === "upload") return (files[q.id] ?? []).map((f) => f.name).join(", ");
    return value.trim();
  }, [q, value, checks, files]);

  function persistCurrent() {
    if (!q) return;
    if (q.type === "text" || q.type === "email" || q.type === "textarea") {
      setAnswers((prev) => ({ ...prev, [q.id]: value.trim() }));
    }
  }

  async function goNext() {
    if (!q) return;

    if (q.required && !currentValue) {
      toast.error("Preencha essa etapa antes de continuar.");
      return;
    }

    persistCurrent();

    if (step === QUESTIONS.length - 1) {
      await handleSubmit();
      return;
    }

    const next = QUESTIONS[step + 1];

    if (q.transitionMessage && next && next.section !== q.section) {
      setTransitionMsg(q.transitionMessage);
      setTimeout(() => {
        setTransitionMsg(null);
        setDirection(1);
        setStep((s) => s + 1);
      }, 1700);
    } else {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }

  function goBack() {
    if (step === 0) {
      setStarted(false);
      return;
    }
    persistCurrent();
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function toggleOption(option: string) {
    if (!q) return;
    setChecks((prev) => {
      const cur = prev[q.id] ?? [];
      return {
        ...prev,
        [q.id]: cur.includes(option) ? cur.filter((x) => x !== option) : [...cur, option],
      };
    });
  }

  async function handleSubmit() {
    const payload: Record<string, string> = { ...answers };

    if (q && (q.type === "text" || q.type === "email" || q.type === "textarea")) {
      payload[q.id] = value.trim();
    }

    // Multicheck → salva sem emojis na planilha
    Object.entries(checks).forEach(([key, vals]) => {
      payload[key] = vals.map(stripEmoji).join(", ");
    });

    Object.entries(files).forEach(([key, vals]) => {
      payload[key] = vals.length ? vals.map((f) => f.name).join(", ") : "";
    });

    if (!payload.nome || !payload.email) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      await submit({ data: { kind: "briefing", fields: payload } });
      setDone(true);
      toast.success("Briefing enviado! Em breve entramos em contato. 🎉");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!q) return;
    if (q.type === "textarea") {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void goNext();
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        void goNext();
      }
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SiteShell>
      <section className="mx-auto max-w-5xl px-5 pt-12 pb-24">

        {!done && (
          <div className="mb-8">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              briefing
            </span>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
              Vamos construir sua{" "}
              <span className="text-secondary">marca juntos</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Uma pergunta por vez, com contexto e exemplos para te ajudar a
              responder com clareza — sem precisar marcar dez reuniões.
            </p>
          </div>
        )}

        {/* TELA DE BOAS-VINDAS */}
        {!started && !done && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-border bg-card p-8 md:p-12"
          >
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
                ✦ Identidade Visual
              </div>

              <h2 className="mt-6 text-3xl font-extrabold leading-tight md:text-5xl">
                E aí, tudo bom? <br />
                Bora criar algo único?
              </h2>

              <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                Esse briefing é uma conversa guiada — você responde uma etapa de
                cada vez, com dicas, exemplos e referências para não travar. Quanto
                mais cuidado no preenchimento, mais certeiro o resultado.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {[
                  "~20 minutos",
                  `${QUESTIONS.length} etapas`,
                  "Uma pergunta por vez",
                  "Salvo automaticamente",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5"
                  >
                    {tag === "~20 minutos" && (
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                    )}
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => setStarted(true)}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 font-semibold text-primary-foreground hover:opacity-90 active:scale-95 transition"
              >
                Começar agora
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* WIZARD DE PERGUNTAS */}
        {started && !done && (
          <div className="rounded-[2rem] border border-border bg-card overflow-hidden">

            <div className="h-1 w-full bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>

            <div className="flex items-center justify-between border-b border-border px-6 py-3 md:px-8">
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-primary">{progress}%</span>{" "}
                concluído
              </span>
              <span className="text-sm text-muted-foreground">
                {step + 1} / {QUESTIONS.length}
              </span>
            </div>

            <div className="flex min-h-[480px] items-center px-6 py-10 md:min-h-[520px] md:px-10 md:py-12">
              <AnimatePresence mode="wait" initial={false}>

                {transitionMsg && (
                  <motion.div
                    key="transition"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="w-full text-center"
                  >
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
                      {q?.emoji}
                    </div>
                    <h3 className="text-2xl font-bold leading-tight md:text-4xl">
                      {transitionMsg}
                    </h3>
                  </motion.div>
                )}

                {!transitionMsg && q && (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: direction > 0 ? 28 : -28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: direction > 0 ? -28 : 28 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    className="w-full max-w-3xl"
                  >
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                      <span>{q.emoji}</span>
                      <span>{q.section}</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <h2 className="text-2xl font-extrabold leading-tight tracking-tight md:text-4xl">
                      {q.title}
                    </h2>

                    {q.hint && (
                      <div className="mt-5 rounded-2xl border border-border bg-background px-5 py-4 text-sm leading-7 text-muted-foreground whitespace-pre-line">
                        {q.hint}
                      </div>
                    )}

                    <div className="mt-6">
                      {(q.type === "text" || q.type === "email") && (
                        <>
                          {/* Para tres_palavras: mostra tags da personalidade como referência */}
                          {q.id === "tres_palavras" && personalidadeTags.length > 0 && (
                            <div className="mb-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Suas escolhas anteriores:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {personalidadeTags.map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      const current = value.trim();
                                      const parts = current
                                        ? current.split(",").map((s) => s.trim()).filter(Boolean)
                                        : [];
                                      if (!parts.includes(tag)) {
                                        setValue([...parts, tag].join(", "));
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                                  >
                                    + {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <input
                            autoFocus
                            type={q.type}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={q.placeholder}
                            className="w-full rounded-2xl border-2 border-border bg-background px-4 py-4 text-base transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                          />
                          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                              Enter ↵
                            </kbd>
                            para continuar
                          </p>
                        </>
                      )}

                      {q.type === "textarea" && (
                        <>
                          <textarea
                            autoFocus
                            rows={6}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={q.placeholder}
                            className="w-full resize-none rounded-2xl border-2 border-border bg-background px-4 py-4 text-base transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                          />
                          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                              Ctrl
                            </kbd>
                            +
                            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                              Enter ↵
                            </kbd>
                            para continuar
                          </p>
                        </>
                      )}

                      {q.type === "multicheck" && (
                        <div className="flex flex-wrap gap-3">
                          {q.options?.map((option) => {
                            const active = (checks[q.id] ?? []).includes(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => toggleOption(option)}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-medium transition",
                                  active
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background hover:border-primary/50",
                                )}
                              >
                                {active ? (
                                  <CheckCircle2 size={15} />
                                ) : (
                                  <Check size={15} className="opacity-30" />
                                )}
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === "upload" && (
                        <UploadField
                          files={files[q.id] ?? []}
                          onChange={(nextFiles) =>
                            setFiles((prev) => ({ ...prev, [q.id]: nextFiles }))
                          }
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!transitionMsg && (
              <div className="flex items-center justify-between border-t border-border px-6 py-4 md:px-8">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>

                <div className="flex items-center gap-3">
                  {q?.skippable && (
                    <button
                      type="button"
                      onClick={() => void goNext()}
                      className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      Pular →
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void goNext()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95 disabled:opacity-60"
                  >
                    {step === QUESTIONS.length - 1 ? (
                      <>
                        {loading ? "Enviando..." : "Enviar briefing"}
                        <Send size={16} />
                      </>
                    ) : (
                      <>
                        OK
                        <CornerDownLeft size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TELA DE SUCESSO */}
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-card p-8 text-center md:p-12"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10">
              <CheckCircle2 size={38} className="text-green-500" />
            </div>

            <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-600">
              ✦ Briefing recebido!
            </div>

            <h2 className="mt-4 text-3xl font-extrabold leading-tight md:text-4xl">
              Perfeito,{" "}
              <span className="text-primary">
                {answers.nome?.split(" ")[0] ?? "cliente"}
              </span>
              ! 🎉
            </h2>

            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Recebemos tudo com sucesso. Nossa equipe vai analisar cada detalhe
              com carinho e entrar em contato em breve. Esse cuidado que você teve
              aqui vai fazer toda a diferença no resultado final. ✨
            </p>

            <div className="mt-8 rounded-2xl border border-border bg-background p-5 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Resumo do seu briefing
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="font-semibold text-foreground">Nome:</span>{" "}
                  {answers.nome || "—"}
                </li>
                <li>
                  <span className="font-semibold text-foreground">E-mail:</span>{" "}
                  {answers.email || "—"}
                </li>
                <li>
                  <span className="font-semibold text-foreground">Marca:</span>{" "}
                  {answers.nome_marca || "—"}
                </li>
                <li>
                  <span className="font-semibold text-foreground">3 palavras-chave:</span>{" "}
                  {answers.tres_palavras || "—"}
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </section>
    </SiteShell>
  );
}

// ─── Upload Field ─────────────────────────────────────────────────────────────

function UploadField({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-background px-6 py-10 text-center transition hover:border-primary/60 hover:bg-primary/5">
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (!e.target.files) return;
            onChange([...files, ...Array.from(e.target.files)]);
          }}
        />
        <Upload size={28} className="text-primary" />
        <div className="text-sm">
          <span className="font-semibold text-primary">Clique para enviar</span>{" "}
          <span className="text-muted-foreground">ou arraste os arquivos aqui</span>
        </div>
        <p className="text-xs text-muted-foreground">PNG, JPG, PDF</p>
      </label>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm"
            >
              <span className="max-w-[200px] truncate">📎 {file.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="text-muted-foreground transition hover:text-destructive"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
