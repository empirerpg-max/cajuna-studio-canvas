import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, CornerDownLeft, CheckCircle2, Upload, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/briefing")({
  head: () => ({
    meta: [
      { title: "Briefing — Cajuna Studio" },
      { name: "description", content: "Conte sobre o seu projeto pra gente entender o melhor caminho." },
      { property: "og:title", content: "Briefing — Cajuna Studio" },
      { property: "og:description", content: "Formulário de briefing para projetos de identidade visual." },
    ],
  }),
  component: Briefing,
});

// ─── tipos ──────────────────────────────────────────────────────────────────

type FieldType = "text" | "email" | "textarea" | "multicheck" | "upload";

interface Question {
  id: string;
  section: string;
  sectionEmoji: string;
  title: string;
  subtitle?: string;
  hint?: React.ReactNode;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // para multicheck
  skippable?: boolean;
  transitionMessage?: string; // mensagem antes de nova seção
}

// ─── perguntas ──────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  // SEÇÃO 1
  {
    id: "nome",
    section: "Vamos nos conhecer",
    sectionEmoji: "👋",
    title: "Qual é o seu nome?",
    type: "text",
    placeholder: "Digite seu nome...",
    required: true,
  },
  {
    id: "email",
    section: "Vamos nos conhecer",
    sectionEmoji: "👋",
    title: "Qual é o seu e-mail?",
    type: "email",
    placeholder: "seuemail@exemplo.com",
    required: true,
  },
  {
    id: "parceiro",
    section: "Vamos nos conhecer",
    sectionEmoji: "👋",
    title: "Mais alguém vai participar do processo com você?",
    hint: "Quem faz parte da aprovação deve participar do preenchimento. Sócio, co-fundador — se a opinião deles conta na hora de aprovar, preencha junto com eles.",
    type: "text",
    placeholder: "Nome da pessoa (ou deixe em branco)",
    skippable: true,
    transitionMessage: "Ótimo! Agora vamos conhecer a sua marca. 🏢",
  },
  // SEÇÃO 2
  {
    id: "nome_marca",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Nome e tagline da marca para o logotipo",
    hint: 'Escreva exatamente como quer que apareça — grafia, pontuação e espaços corretos. Exemplo: "Cajuna Studio — Sua marca com identidade" 👀',
    type: "text",
    placeholder: "Nome da Marca — Tagline aqui",
    required: true,
  },
  {
    id: "historia_nome",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "O que esse nome significa pra você?",
    hint: "Existe alguma história, simbologia ou intenção por trás? Mesmo que pareça óbvio, nos conte.",
    type: "textarea",
    placeholder: "Me conta a história do nome...",
    skippable: true,
  },
  {
    id: "descricao",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Do que se trata sua marca? O que ela faz?",
    hint: 'Descreva como explicaria pra um amigo no churrasco.\n❌ "Presto serviços de consultoria"\n✅ "Ajudo pequenos negócios a criarem presença visual no Instagram"',
    type: "textarea",
    placeholder: "Descreva o que sua marca faz...",
    required: true,
  },
  {
    id: "slogan",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Sua marca tem slogan?",
    hint: 'Slogan é uma frase curta e marcante.\n• Magazine Luiza → "Precisou, tem no Magalu"\n• Nike → "Just Do It"\n\nSe ainda não tem, pode deixar em branco.',
    type: "text",
    placeholder: "Slogan (opcional)",
    skippable: true,
  },
  {
    id: "concorrentes",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Quais são seus principais concorrentes?",
    hint: "Cole o Instagram ou site de cada um. Precisamos garantir que sua marca seja única — sem semelhança com quem já está no mercado.",
    type: "textarea",
    placeholder: "@concorrente1 — visual colorido, foco em jovens\nwww.concorrente2.com — sóbrio, atende B2B",
    required: true,
  },
  {
    id: "mvv",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Missão, visão e valores da sua marca",
    hint: "• Missão → O que você faz e pra quem?\n• Visão → Onde quer chegar em 3 a 5 anos?\n• Valores → O que guia suas decisões todo dia?",
    type: "textarea",
    placeholder: "Missão: ...\nVisão: ...\nValores: ...",
    required: true,
  },
  {
    id: "publico",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Quem é o seu público-alvo?",
    hint: 'Quanto mais específico, melhor. Exemplo: "Mulheres entre 28 e 40 anos, empreendedoras, classe média-alta, ativas no Instagram."',
    type: "textarea",
    placeholder: "Descreva seu cliente ideal...",
    required: true,
  },
  {
    id: "diferencial",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Qual é o diferencial da sua marca?",
    hint: "O que você faz que ninguém mais faz — ou faz de um jeito que ninguém mais faz?",
    type: "textarea",
    placeholder: "Meu diferencial é...",
    required: true,
  },
  {
    id: "sensacao",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Quando olharem para sua marca, o que você quer que sintam?",
    hint: 'Pense em emoções. Ex: "Quero que sintam confiança e sofisticação" ou "Quero parecer acessível, como um amigo especialista."',
    type: "textarea",
    placeholder: "Quero que sintam...",
    required: true,
  },
  {
    id: "personalidade",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Se sua marca fosse uma pessoa, como ela seria?",
    hint: "Escolha adjetivos — isso guia fonte, cor e forma:\n• Descontraída → tipografia arredondada, cores vibrantes\n• Sóbria → serifadas, tons neutros\n• Ousada → assimetria, cores fortes",
    type: "textarea",
    placeholder: "Ex: moderna, acolhedora, criativa, confiável...",
    required: true,
  },
  {
    id: "tres_palavras",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Das palavras que você escolheu, quais são as 3 mais importantes?",
    hint: "Essas 3 palavras serão nosso norte criativo. Tudo que criarmos vai passar pelo filtro delas.",
    type: "text",
    placeholder: "Palavra 1, Palavra 2, Palavra 3",
    required: true,
  },
  {
    id: "redes",
    section: "Sua empresa",
    sectionEmoji: "🏢",
    title: "Sua marca tem site ou redes sociais?",
    type: "text",
    placeholder: "@minhamarca · www.minhamarca.com.br",
    skippable: true,
    transitionMessage: "Incrível! Agora vamos falar das referências visuais. 🎨",
  },
  // SEÇÃO 3
  {
    id: "simbolo",
    section: "Referências visuais",
    sectionEmoji: "🎨",
    title: "Sua marca precisa de um símbolo no logotipo?",
    hint: "Símbolo é o elemento visual que acompanha o nome:\n• Nike → o swoosh  • Apple → a maçã  • Starbucks → a sereia\n\nTem alguma ideia? Com as iniciais? Um animal?",
    type: "textarea",
    placeholder: "Descreva o que imagina (ou deixe em branco)...",
    skippable: true,
  },
  {
    id: "cores",
    section: "Referências visuais",
    sectionEmoji: "🎨",
    title: "Há alguma paleta de cores que te representa?",
    hint: "🔴 Vermelho → energia  •  🔵 Azul → confiança  •  🟢 Verde → natureza  •  🟡 Dourado → sofisticação\n\nPesquise em: coolors.co · colorhunt.co · pinterest.com\nCole links ou descreva as cores.",
    type: "textarea",
    placeholder: "Cole links de paletas ou descreva as cores...",
    required: true,
  },
  {
    id: "cores_nao",
    section: "Referências visuais",
    sectionEmoji: "🎨",
    title: "Tem alguma cor que você NÃO quer de jeito algum?",
    hint: "Tão importante quanto o que você gosta. Se remete a concorrente ou você simplesmente não suporta — fala sem medo.",
    type: "textarea",
    placeholder: "Ex: Verde — remete a um concorrente direto...",
    skippable: true,
  },
  {
    id: "logo_antigo",
    section: "Referências visuais",
    sectionEmoji: "🎨",
    title: "Você tem um logotipo antigo?",
    hint: "Se sim: por que quer mudar? Manteria algum elemento? Às vezes o cliente quer uma evolução, não uma ruptura total.",
    type: "textarea",
    placeholder: "Me conta sobre o logo atual (ou 'Não tenho')...",
    skippable: true,
  },
  {
    id: "logos_ref",
    section: "Referências visuais",
    sectionEmoji: "🎨",
    title: "Cite 3 logos que você aprecia — de qualquer segmento",
    hint: "O objetivo é entender seu gosto visual. Diga o que te agradou em cada um: a fonte? o símbolo? a simplicidade?\n\nBusque em: behance.net · dribbble.com · pinterest.com",
    type: "textarea",
    placeholder: "1. Nike — adoro a simplicidade do swoosh\n2. ...\n3. ...",
    required: true,
  },
  {
    id: "elementos",
    section: "Referências visuais",
    sectionEmoji: "🎨",
    title: "Quer elementos de apoio na sua identidade?",
    hint: "Elementos de apoio são os 'coadjuvantes':\n• Stickers / ícones personalizados\n• Formas e bases geométricas\n• Padrão/estampa com logo repetido",
    type: "textarea",
    placeholder: "Descreva o que imagina (ou deixe em branco)...",
    skippable: true,
  },
  {
    id: "aplicacoes",
    section: "Referências visuais",
    sectionEmoji: "🎨",
    title: "Onde você imagina ver sua marca aplicada?",
    hint: "Isso define os formatos e arquivos que vamos entregar. Selecione tudo que faz sentido.",
    type: "multicheck",
    options: [
      "📱 Redes sociais",
      "🖨️ Mat. impressos",
      "🏪 Fachada / placa",
      "👕 Vestuário",
      "🎁 Brindes",
      "🪧 Outdoor / Banner",
      "📦 Embalagens",
    ],
    required: true,
  },
  {
    id: "imagem_marca",
    section: "Referências visuais",
    sectionEmoji: "🎨",
    title: "Se sua marca fosse uma imagem, qual seria?",
    hint: "Pode ser uma cena, sensação ou link do Pinterest.\nEx: 'Mesa de trabalho clean com café e luz natural' ou 'Festa cheia de gente animada'.",
    type: "textarea",
    placeholder: "Descreva ou cole um link do Pinterest...",
    skippable: true,
    transitionMessage: "Quase lá! Agora só os arquivos e detalhes finais. 📎",
  },
  // SEÇÃO 4
  {
    id: "upload_logos",
    section: "Arquivos",
    sectionEmoji: "📎",
    title: "Envie logos de referência que você aprecia",
    hint: "Quanto mais exemplos, mais fácil de entrar na sua cabeça. Pode ser de qualquer segmento.",
    type: "upload",
    skippable: true,
  },
  {
    id: "upload_fotos",
    section: "Arquivos",
    sectionEmoji: "📎",
    title: "Tem fotos profissionais do seu produto ou serviço?",
    hint: "Fotos profissionais agregam muito na apresentação final — usamos para contextualizar o logo nos mockups.",
    type: "upload",
    skippable: true,
  },
  {
    id: "upload_rascunhos",
    section: "Arquivos",
    sectionEmoji: "📎",
    title: "Logo antigo ou rascunhos seus?",
    hint: "Mesmo que seja um desenho no celular fotografado — vale enviar. Qualquer ideia inicial nos ajuda.",
    type: "upload",
    skippable: true,
    transitionMessage: "Ótimo! Só os detalhes finais agora. 🎯",
  },
  // SEÇÃO 5
  {
    id: "contatos",
    section: "Detalhes finais",
    sectionEmoji: "🎯",
    title: "Quais dados de contato vão nos materiais?",
    hint: "Já deixe formatado como quer que apareça:\n📱 (84) 99999-9999\n📸 @suamarca\n🌐 www.suamarca.com.br",
    type: "textarea",
    placeholder: "Telefone, WhatsApp, Instagram, site, e-mail, endereço...",
    required: true,
  },
  {
    id: "destaques",
    section: "Detalhes finais",
    sectionEmoji: "🎯",
    title: "E os destaques do Instagram?",
    hint: 'Os destaques fazem parte da identidade visual e precisam de coerência com a marca.\nEx: "Tenho: Sobre mim, Serviços. Quero criar: FAQ, Portfólio, Promoções."',
    type: "textarea",
    placeholder: "Destaques atuais: ...\nDestaques novos que quero criar: ...",
    skippable: true,
  },
  {
    id: "livre",
    section: "Detalhes finais",
    sectionEmoji: "🎯",
    title: "Tem algo que deixamos passar? Espaço livre 😊",
    hint: "Uma preocupação específica, referência a mais, restrição não mencionada — qualquer coisa que você acha importante.",
    type: "textarea",
    placeholder: "Fique à vontade...",
    skippable: true,
  },
];

const APPS_SCRIPT_URL = "SUA_URL_APPS_SCRIPT_AQUI";

// ─── componente principal ────────────────────────────────────────────────────

function Briefing() {
  const [step, setStep] = useState(-1); // -1 = welcome
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [checked, setChecked] = useState<Record<string, string[]>>({});
  const [current, setCurrent] = useState("");
  const [transition, setTransition] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);

  const q = QUESTIONS[step] ?? null;
  const progress = step < 0 ? 0 : Math.round(((step + 1) / QUESTIONS.length) * 100);

  const getValue = () => {
    if (!q) return "";
    if (q.type === "multicheck") return (checked[q.id] ?? []).join(", ");
    if (q.type === "upload") return (files[q.id] ?? []).map((f) => f.name).join(", ");
    return answers[q.id] ?? "";
  };

  const advance = useCallback(async () => {
    if (!q) return;
    const val = getValue();
    if (q.required && !val.trim()) {
      toast.error("Por favor, preencha esse campo antes de continuar.");
      return;
    }
    if (q.type !== "multicheck" && q.type !== "upload") {
      setAnswers((p) => ({ ...p, [q.id]: current }));
    }

    // último passo → submit
    if (step === QUESTIONS.length - 1) {
      await handleSubmit();
      return;
    }

    const next = QUESTIONS[step + 1];
    const msg = q.transitionMessage;

    if (msg && next?.section !== q.section) {
      setTransition(msg);
      setTimeout(() => {
        setTransition(null);
        setDirection(1);
        setStep((s) => s + 1);
        setCurrent("");
      }, 1800);
    } else {
      setDirection(1);
      setStep((s) => s + 1);
      setCurrent("");
    }
  }, [q, step, current, checked, files, answers]);

  const back = () => {
    if (step <= 0) {
      setStep(-1);
      return;
    }
    setDirection(-1);
    setStep((s) => s - 1);
    setCurrent(answers[QUESTIONS[step - 1]?.id] ?? "");
  };

  // sync current ↔ answers on step change
  useEffect(() => {
    if ((q && q.type === "text") || q?.type === "email" || q?.type === "textarea") {
      setCurrent(answers[q.id] ?? "");
    }
  }, [step]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (q?.type === "textarea") {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        advance();
      }
    } else {
      if (e.key === "Enter") {
        e.preventDefault();
        advance();
      }
    }
  };

  const toggleCheck = (opt: string) => {
    if (!q) return;
    setChecked((p) => {
      const prev = p[q.id] ?? [];
      return {
        ...p,
        [q.id]: prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
      };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = { ...answers };
    QUESTIONS.forEach((q) => {
      if (q.type === "multicheck") payload[q.id] = (checked[q.id] ?? []).join(", ");
    });
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (_) {}
    setSubmitting(false);
    setSubmitted(true);
  };

  // ─── render ────────────────────────────────────────────────────────────────

  if (submitted)
    return (
      <SuccessScreen
        name={answers.nome ?? ""}
        marca={answers.nome_marca ?? ""}
        palavras={answers.tres_palavras ?? ""}
      />
    );

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Progress bar */}
      {step >= 0 && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-border z-50">
          <motion.div
            className="h-full bg-primary"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2.5 font-display font-bold text-sm">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
            C
          </div>
          Cajuna Studio
        </div>
        {step >= 0 && (
          <span className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">{progress}%</span> concluído
          </span>
        )}
      </nav>

      {/* Main */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {/* WELCOME */}
          {step === -1 && (
            <motion.div
              key="welcome"
              className="absolute inset-0 flex flex-col items-center justify-center px-6 py-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-full max-w-xl">
                <span className="text-4xl block mb-6">👋</span>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-4">
                  ✦ Identidade Visual
                </div>
                <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-5">
                  E aí, tudo bom?
                  <br />
                  Vamos criar sua <span className="text-primary">marca juntos.</span>
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-lg">
                  Esse briefing é uma conversa guiada — uma pergunta de cada vez. Cada etapa tem dicas, exemplos e links
                  pra te ajudar a responder com segurança.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  ~20 minutos &nbsp;·&nbsp; {QUESTIONS.length} perguntas &nbsp;·&nbsp; 5 seções
                </div>
                <button
                  onClick={() => {
                    setStep(0);
                    setCurrent("");
                  }}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-primary text-white font-semibold text-base hover:opacity-90 active:scale-95 transition"
                >
                  Começar agora <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* TRANSITION MESSAGE */}
          {transition && (
            <motion.div
              key="transition"
              className="absolute inset-0 flex items-center justify-center px-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center">
                <div className="text-5xl mb-4">{QUESTIONS[step]?.sectionEmoji}</div>
                <p className="font-display text-2xl md:text-3xl font-bold text-foreground">{transition}</p>
              </div>
            </motion.div>
          )}

          {/* QUESTION */}
          {!transition && step >= 0 && q && (
            <motion.div
              key={`q-${step}`}
              className="absolute inset-0 flex flex-col items-center justify-center px-5 py-10 overflow-y-auto"
              initial={{ opacity: 0, y: direction > 0 ? 40 : -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction > 0 ? -40 : 40 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="w-full max-w-xl">
                {/* Section badge */}
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-3">
                  {q.sectionEmoji} {q.section}
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Question */}
                <h2 className="font-display text-2xl md:text-3xl font-bold leading-snug tracking-tight mb-4">
                  {q.title}
                </h2>

                {/* Hint */}
                {q.hint && (
                  <div className="text-sm text-muted-foreground leading-relaxed mb-5 pl-3 border-l-2 border-primary/60 whitespace-pre-line">
                    {q.hint}
                  </div>
                )}

                {/* Input */}
                {(q.type === "text" || q.type === "email") && (
                  <input
                    type={q.type}
                    autoFocus
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={q.placeholder}
                    className="w-full px-4 py-3.5 rounded-2xl bg-card border-2 border-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 text-base transition caret-primary"
                  />
                )}

                {q.type === "textarea" && (
                  <textarea
                    autoFocus
                    rows={4}
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={q.placeholder}
                    className="w-full px-4 py-3.5 rounded-2xl bg-card border-2 border-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 text-base transition resize-none caret-primary"
                  />
                )}

                {q.type === "multicheck" && (
                  <div className="flex flex-wrap gap-2.5">
                    {q.options?.map((opt) => {
                      const sel = (checked[q.id] ?? []).includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => toggleCheck(opt)}
                          className={cn(
                            "inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all",
                            sel
                              ? "bg-primary/15 border-primary text-primary font-semibold"
                              : "bg-card border-border text-foreground hover:border-primary/50",
                          )}
                        >
                          {sel && <CheckCircle2 size={14} />}
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === "upload" && (
                  <UploadZone
                    id={q.id}
                    files={files[q.id] ?? []}
                    onFiles={(f) => setFiles((p) => ({ ...p, [q.id]: f }))}
                  />
                )}

                {/* Enter hint */}
                {(q.type === "text" || q.type === "email") && (
                  <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[11px] font-mono border border-border">
                      Enter ↵
                    </kbd>
                    para continuar
                  </p>
                )}
                {q.type === "textarea" && (
                  <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[11px] font-mono border border-border">
                      Ctrl
                    </kbd>
                    +
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[11px] font-mono border border-border">
                      Enter ↵
                    </kbd>
                    para continuar
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom bar */}
      {step >= 0 && !transition && (
        <div className="shrink-0 px-5 py-4 border-t border-border/50 flex items-center justify-between bg-background/80 backdrop-blur-sm">
          <button
            onClick={back}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={15} /> Voltar
          </button>

          <div className="flex items-center gap-3">
            {q?.skippable && (
              <button onClick={advance} className="text-sm text-muted-foreground hover:text-foreground transition">
                Pular →
              </button>
            )}
            <button
              onClick={advance}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:opacity-90 active:scale-95 transition disabled:opacity-60"
            >
              {submitting ? (
                "Enviando..."
              ) : step === QUESTIONS.length - 1 ? (
                "Enviar 🚀"
              ) : (
                <>
                  OK <CornerDownLeft size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────

function UploadZone({ id, files, onFiles }: { id: string; files: File[]; onFiles: (f: File[]) => void }) {
  const remove = (i: number) => onFiles(files.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      <label className="flex flex-col items-center gap-3 p-8 rounded-2xl border-2 border-dashed border-border bg-card cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition group">
        <input
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onFiles([...files, ...Array.from(e.target.files ?? [])])}
        />
        <Upload size={28} className="text-muted-foreground group-hover:text-primary transition" />
        <div className="text-sm text-center text-muted-foreground">
          <span className="text-primary font-semibold">Clique para enviar</span> ou arraste aqui
          <br />
          PNG, JPG, PDF
        </div>
      </label>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary/15 border border-secondary/30 text-secondary text-xs rounded-full"
            >
              📎 {f.name}
              <button onClick={() => remove(i)} className="hover:text-destructive transition">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────────

function SuccessScreen({ name, marca, palavras }: { name: string; marca: string; palavras: string }) {
  const firstName = name.split(" ")[0] || "Cliente";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500 flex items-center justify-center text-4xl mb-7"
      >
        ✓
      </motion.div>
      <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-500 mb-4">
        ✦ Briefing recebido!
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
        Perfeito, <span className="text-primary">{firstName}</span>! 🎉
      </h1>
      <p className="text-muted-foreground text-lg leading-relaxed max-w-md mb-8">
        Recebemos tudo com sucesso. Nossa equipe vai analisar cada detalhe com carinho e entrar em contato em breve.
        Esse cuidado que você teve aqui vai fazer toda a diferença no resultado final. ✨
      </p>
      {(marca || palavras) && (
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 text-left space-y-2 text-sm">
          <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Resumo</div>
          {marca && (
            <div>
              🏷️ <span className="font-semibold">{marca}</span>
            </div>
          )}
          {palavras && (
            <div>
              ✨ <span className="text-muted-foreground">Palavras-chave:</span> {palavras}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
