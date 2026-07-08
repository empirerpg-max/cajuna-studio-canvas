import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SiteShell } from '@/components/SiteShell';
import { cn } from '@/lib/utils';
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
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
  Send,
  Upload,
  Download,
  X,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'inicio' | 'perfil' | 'contratos' | 'briefing' | 'arquivos';
type QuestionType = 'text' | 'email' | 'textarea' | 'multicheck' | 'upload';

interface ClienteUser {
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
  _prazo_info?: { atrasado: boolean; diasRestantes: number } | null;
}

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

// ─── Briefing Questions (exact copy from /briefing) ──────────────────────────

function stripEmoji(label: string): string {
  return label.replace(/^[\p{Emoji}\s]+/u, '').trim();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const QUESTIONS: Question[] = [
  { id: 'nome', section: 'Vamos nos conhecer', emoji: '👋', title: 'Qual é o seu nome?', type: 'text', placeholder: 'Digite seu nome...', required: true },
  { id: 'email', section: 'Vamos nos conhecer', emoji: '👋', title: 'Qual é o seu e-mail?', type: 'email', placeholder: 'seuemail@exemplo.com', required: true },
  { id: 'parceiro', section: 'Vamos nos conhecer', emoji: '👋', title: 'Mais alguém vai participar do processo com você?', hint: 'Quem faz parte da aprovação deve participar do preenchimento. Se houver sócio, cofundador ou alguém que aprove o projeto, vale preencher junto para evitar retrabalho.', type: 'text', placeholder: 'Nome da pessoa (ou deixe em branco)', skippable: true, transitionMessage: 'Ótimo. Agora vamos entrar no universo da sua marca. 🏢' },
  { id: 'nome_marca', section: 'Sua empresa', emoji: '🏢', title: 'Qual é o nome e a tagline da sua marca para o logotipo?', hint: 'Escreva exatamente como quer que apareça — grafia, pontuação e espaços corretos. Exemplo: "Cajuna Studio — Sua marca com identidade".', type: 'text', placeholder: 'Nome da marca — tagline', required: true },
  { id: 'historia_nome', section: 'Sua empresa', emoji: '🏢', title: 'O que esse nome significa pra você?', hint: 'Existe alguma história, simbologia ou intenção por trás? Mesmo que pareça simples, isso ajuda muito na construção visual.', type: 'textarea', placeholder: 'Me conta a história do nome...', skippable: true },
  { id: 'descricao', section: 'Sua empresa', emoji: '🏢', title: 'Do que se trata a sua marca? O que ela faz?', hint: 'Descreva como explicaria pra um amigo. Evite: "presto consultoria". Prefira: "ajudo pequenos negócios a criarem presença visual no Instagram".', type: 'textarea', placeholder: 'Descreva sua marca e o que ela oferece...', required: true },
  { id: 'slogan', section: 'Sua empresa', emoji: '🏢', title: 'Sua marca tem slogan?', hint: 'Slogan é uma frase curta e marcante. Se ainda não tiver, pode deixar em branco ou colocar uma ideia.', type: 'text', placeholder: 'Ex: Sua marca com identidade', skippable: true },
  { id: 'concorrentes', section: 'Sua empresa', emoji: '🏢', title: 'Quais são os principais concorrentes da sua empresa?', hint: 'Cole o Instagram ou site de cada um. Precisamos garantir que sua marca seja única — sem semelhança visual com quem já está no mercado.', type: 'textarea', placeholder: '@concorrente1 — visual colorido, foco em jovens\nwww.concorrente2.com.br — sóbrio, atende B2B', required: true },
  { id: 'mvv', section: 'Sua empresa', emoji: '🏢', title: 'Quais são a missão, visão e valores da sua marca?', hint: '• Missão → o que você faz e pra quem?\n• Visão → onde quer chegar em 3 a 5 anos?\n• Valores → o que guia suas decisões todo dia?', type: 'textarea', placeholder: 'Missão: ...\nVisão: ...\nValores: ...', required: true },
  { id: 'publico', section: 'Sua empresa', emoji: '🏢', title: 'Quem é o seu público-alvo?', hint: 'Quanto mais específico, melhor. Exemplo: "Mulheres entre 28 e 40 anos, empreendedoras, classe média-alta, ativas no Instagram".', type: 'textarea', placeholder: 'Descreva seu cliente ideal...', required: true },
  { id: 'diferencial', section: 'Sua empresa', emoji: '🏢', title: 'Qual é o diferencial da sua marca frente às concorrentes?', hint: 'Pode ser atendimento, método, linguagem, produto, agilidade, experiência ou especialização.', type: 'textarea', placeholder: 'Nosso diferencial é...', required: true },
  { id: 'sensacao', section: 'Sua empresa', emoji: '🏢', title: 'Quando olharem para a sua marca, o que você quer que sintam?', hint: 'Pense em emoções. Exemplo: "Quero que sintam confiança e sofisticação" ou "Quero parecer acessível, como um amigo especialista".', type: 'textarea', placeholder: 'Quero que sintam...', required: true },
  {
    id: 'personalidade', section: 'Sua empresa', emoji: '🏢',
    title: 'Se a sua marca fosse uma pessoa, como ela seria?',
    hint: 'Escolha quantas palavras quiser — elas vão guiar fonte, cor e forma da sua identidade. Não precisa ser perfeito, confie no instinto! 🎨\n\n💡 Uma marca Ousada pede cores fortes e formas assimétricas; uma Delicada pede tons suaves e tipografia leve.',
    type: 'multicheck',
    options: ['✨ Moderna','💎 Elegante','🎉 Extrovertida','🤫 Discreta','🏛️ Tradicional','🧭 Aventureira','🦉 Madura','🌸 Sensível','🪷 Delicada','🤓 Nerd','📐 Conservadora','😄 Brincalhona','☀️ Alegre','😌 Calma','👑 Líder','⚡ Energética','📚 Sábia','🤝 Acessível','💠 Exclusiva','🎨 Criativa','🔬 Científica','🌹 Romântica','🔥 Ousada','🥃 Sóbria','🪵 Rústica','👔 Formal','🚀 Futurista','🏺 Antiga','🧠 Racional','💪 Determinada','🌐 Mente Aberta','🏖️ Relaxada','🎈 Divertida','🍃 Tranquila','🔮 Intuitiva','🛡️ Confiável','🦋 Diferente','🎯 Persistente','⏱️ Disciplinada','💼 Profissional','💡 Esperta','🌟 Deslumbrante','📡 Atual','✅ Padronizada','🌼 Inocente','🕊️ Livre','🎓 Acadêmica','⚖️ Estável','🌫️ Sutil','☕ Básica','👟 Casual','💭 Sonhadora','🗂️ Convencional','💥 Radical','🌱 Simples','😈 Atrevida','📅 Cotidiana','🎭 Multifacetada','🪞 Refinada','⚙️ Industrial','🌤️ Leve','🏙️ Contemporânea'],
    required: true,
  },
  { id: 'tres_palavras', section: 'Sua empresa', emoji: '🏢', title: 'Das palavras que você escolheu, quais são as 3 mais importantes?', hint: 'Essas 3 palavras serão o norte criativo. Tudo que criarmos vai passar pelo filtro delas.', type: 'text', placeholder: 'Palavra 1, Palavra 2, Palavra 3', required: true },
  { id: 'redes', section: 'Sua empresa', emoji: '🏢', title: 'Sua marca possui site ou redes sociais?', type: 'text', placeholder: '@suamarca · www.suamarca.com.br', skippable: true, transitionMessage: 'Perfeito. Agora vamos falar das referências visuais. 🎨' },
  { id: 'simbolo', section: 'Referências visuais', emoji: '🎨', title: 'Sua marca precisa de algum símbolo junto ao logotipo?', hint: 'Símbolo é o elemento visual que acompanha o nome.\n• Nike → o swoosh  • Apple → a maçã  • Starbucks → a sereia\n\nTem alguma ideia? Iniciais? Um animal? Um ícone específico?', type: 'textarea', placeholder: 'Descreva o que imagina (ou deixe em branco)...', skippable: true },
  { id: 'cores', section: 'Referências visuais', emoji: '🎨', title: 'Há alguma paleta de cores com a qual você se identifica?', hint: '🔴 Vermelho → energia  •  🔵 Azul → confiança  •  🟢 Verde → natureza  •  🟡 Dourado → sofisticação\n\nPesquise em: coolors.co · colorhunt.co · pinterest.com\nCole links ou descreva as cores.', type: 'textarea', placeholder: 'Cole links de paletas ou descreva as cores...', required: true },
  { id: 'cores_nao', section: 'Referências visuais', emoji: '🎨', title: 'Tem alguma cor que você NÃO quer de jeito algum?', hint: 'Tão importante quanto o que você gosta. Se remete a concorrente ou você simplesmente não suporta — fala sem medo.', type: 'textarea', placeholder: 'Ex: Verde — remete a um concorrente direto...', skippable: true },
  { id: 'logo_antigo', section: 'Referências visuais', emoji: '🎨', title: 'Você já tem algum logotipo?', hint: 'Se sim: por que quer mudar? Manteria algum elemento?\nÀs vezes o cliente quer uma evolução, não uma ruptura total.', type: 'textarea', placeholder: 'Me conta sobre o logo atual (ou "Não tenho")...', skippable: true },
  { id: 'logos_ref', section: 'Referências visuais', emoji: '🎨', title: 'Cite pelo menos 3 logos que você aprecia — de qualquer segmento.', hint: 'O objetivo é entender seu gosto visual. Para cada um, diga o que te agradou: a fonte? o símbolo? a simplicidade?\n\nBusque em: behance.net · dribbble.com · pinterest.com', type: 'textarea', placeholder: '1. Nike — adoro a simplicidade do swoosh\n2. ...\n3. ...', required: true },
  { id: 'elementos', section: 'Referências visuais', emoji: '🎨', title: 'Quer elementos de apoio na sua identidade visual?', hint: 'Elementos de apoio são os "coadjuvantes" da marca:\n• Stickers e ícones personalizados\n• Formas e bases geométricas\n• Padrão ou estampa com logo repetido', type: 'textarea', placeholder: 'Descreva o que imagina (ou deixe em branco)...', skippable: true },
  { id: 'aplicacoes', section: 'Referências visuais', emoji: '🎨', title: 'Onde você imagina ver a sua marca aplicada?', hint: 'Isso define os formatos e arquivos que serão entregues. Selecione tudo que fizer sentido.', type: 'multicheck', options: ['📱 Redes sociais','🖨️ Materiais impressos','🏪 Fachada / placa','👕 Camisetas / vestuário','🎁 Brindes','🪧 Outdoor / banner','📦 Embalagens'], required: true },
  { id: 'imagem_marca', section: 'Referências visuais', emoji: '🎨', title: 'Se sua marca fosse uma foto ou imagem, como seria essa cena?', hint: 'Pode ser uma cena, uma sensação ou um link do Pinterest.\nEx: "Mesa de trabalho clean com café e luz natural" ou "Festa cheia de gente animada".', type: 'textarea', placeholder: 'Descreva ou cole um link do Pinterest...', skippable: true, transitionMessage: 'Quase lá! Agora só os arquivos e os detalhes finais. 📎' },
  { id: 'upload_refs', section: 'Arquivos', emoji: '📎', title: 'Referências visuais enviadas.', type: 'upload', skippable: true },
  { id: 'upload_fotos', section: 'Arquivos', emoji: '📎', title: 'Fotos do produto ou serviço.', type: 'upload', skippable: true },
  { id: 'upload_logo_antigo', section: 'Arquivos', emoji: '📎', title: 'Logo antigo ou rascunhos.', type: 'upload', skippable: true, transitionMessage: 'Ótimo! Só os detalhes finais agora. 🎯' },
  { id: 'contatos', section: 'Detalhes finais', emoji: '🎯', title: 'Quais dados de contato vão nos materiais?', hint: 'Já deixe formatado como quer que apareça:\n📱 (84) 99999-9999\n📸 @suamarca\n🌐 www.suamarca.com.br', type: 'textarea', placeholder: 'Telefone, WhatsApp, Instagram, site, e-mail, endereço...', required: true },
  { id: 'destaques', section: 'Detalhes finais', emoji: '🎯', title: 'Quais destaques você tem atualmente no Instagram?', hint: 'Os destaques fazem parte da identidade visual e precisam ser coerentes com a marca.\nEx: "Tenho: Sobre mim, Serviços. Quero criar: FAQ, Portfólio, Promoções."', type: 'textarea', placeholder: 'Destaques atuais: ...\nDestaques que quero criar: ...', skippable: true },
  { id: 'livre', section: 'Detalhes finais', emoji: '🎯', title: 'Tem algo que deixamos passar? Espaço livre 😊', hint: 'Uma preocupação específica, referência a mais, restrição não mencionada — qualquer coisa que você ache importante.', type: 'textarea', placeholder: 'Fique à vontade...', skippable: true },
];

const SECTIONS = Array.from(new Set(QUESTIONS.map((q) => q.section)));

const navItems: { id: View; label: string }[] = [
  { id: 'inicio', label: 'Início' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'contratos', label: 'Contratos' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'arquivos', label: 'Arquivos' },
];

const ETAPAS = ['Briefing', 'Criação', 'Revisão', 'Entrega', 'Concluído'];

// ─── Upload Field ─────────────────────────────────────────────────────────────

function UploadField({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  return (
    <div className="space-y-4">
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition hover:bg-[#E97933]/5"
        style={{ borderColor: '#e3e7f7', background: '#f9fafb' }}
      >
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
        <Upload size={28} style={{ color: '#E97933' }} />
        <div className="text-sm">
          <span className="font-black" style={{ color: '#E97933' }}>Clique para enviar</span>{' '}
          <span className="text-[#1A1A1A]/40 font-medium">ou arraste os arquivos aqui</span>
        </div>
        <p className="text-xs text-[#1A1A1A]/30 font-medium">PNG, JPG, PDF</p>
      </label>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border-2"
              style={{ borderColor: '#e3e7f7', background: '#f5f8ff' }}
            >
              <span className="max-w-[200px] truncate font-medium text-[#1A1A1A]/70">📎 {file.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="text-[#1A1A1A]/30 hover:text-[#e77f89] transition-colors"
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

// ─── Briefing Wizard (embedded, no SiteShell) ─────────────────────────────────

function BriefingWizard({
  clienteUser,
  onStatusChange,
}: {
  clienteUser: ClienteUser;
  onStatusChange: (status: string) => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [transitionMsg, setTransitionMsg] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [checks, setChecks] = useState<Record<string, string[]>>({});
  const [finalPayload, setFinalPayload] = useState<Record<string, string>>({});

  const q = QUESTIONS[step];
  const progress = Math.round(((step + 1) / QUESTIONS.length) * 100);
  const personalidadeTags = (checks['personalidade'] ?? []).map(stripEmoji);

  useEffect(() => {
    if (!started || !q) return;
    if (q.type === 'text' || q.type === 'email' || q.type === 'textarea') {
      setValue(answers[q.id] ?? '');
    } else {
      setValue('');
    }
  }, [step, started]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentValue = useMemo(() => {
    if (!q) return '';
    if (q.type === 'multicheck') return (checks[q.id] ?? []).join(', ');
    if (q.type === 'upload') return (files[q.id] ?? []).map((f) => f.name).join(', ');
    return value.trim();
  }, [q, value, checks, files]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  }

  function persistCurrent() {
    if (!q) return;
    if (q.type === 'text' || q.type === 'email' || q.type === 'textarea') {
      setAnswers((prev) => ({ ...prev, [q.id]: value.trim() }));
    }
  }

  async function goNext() {
    if (!q) return;
    if (q.required && !currentValue) { showToast('Preencha essa etapa antes de continuar.'); return; }
    persistCurrent();
    if (step === QUESTIONS.length - 1) { await handleSubmit(); return; }
    const next = QUESTIONS[step + 1];
    if (q.transitionMessage && next && next.section !== q.section) {
      setTransitionMsg(q.transitionMessage);
      setTimeout(() => { setTransitionMsg(null); setDirection(1); setStep((s) => s + 1); }, 1700);
    } else {
      setDirection(1); setStep((s) => s + 1);
    }
  }

  function goBack() {
    if (step === 0) { setStarted(false); return; }
    persistCurrent(); setDirection(-1); setStep((s) => s - 1);
  }

  function toggleOption(option: string) {
    if (!q) return;
    setChecks((prev) => {
      const cur = prev[q.id] ?? [];
      return { ...prev, [q.id]: cur.includes(option) ? cur.filter((x) => x !== option) : [...cur, option] };
    });
  }

  async function prepareFilesPayload() {
    const result: Record<string, Array<{ name: string; mimeType: string; base64: string }>> = {};
    for (const [key, fileList] of Object.entries(files)) {
      if (!fileList.length) continue;
      result[key] = await Promise.all(
        fileList.map(async (file) => ({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: await fileToBase64(file),
        }))
      );
    }
    return result;
  }

  async function handleSubmit() {
    const payload: Record<string, string> = { ...answers };
    if (q && (q.type === 'text' || q.type === 'email' || q.type === 'textarea')) payload[q.id] = value.trim();
    Object.entries(checks).forEach(([key, vals]) => { pa