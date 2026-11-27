import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Download,
  Bookmark,
  Grid3x3,
  Eye,
  ImageOff,
  Copy,
  Check,
  CircleDashed,
  Pause,
  Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CalendarItem = Record<string, string> & { _row?: string };

const WEEKDAYS = [
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
  'domingo',
];

const WEEKDAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const STORY_RING = 'linear-gradient(45deg, #F9CE34, #EE2A7B 50%, #6228D7)';

const TIPO_STYLE: Record<string, { dot: string; label: string }> = {
  Carrossel: { dot: '#2D5F8A', label: 'Carrossel' },
  Reel: { dot: '#E97933', label: 'Reel' },
  'Post único': { dot: '#4C9A2A', label: 'Post único' },
  Meme: { dot: '#C9A227', label: 'Meme' },
};

function normalizeWeekday(value: string): string {
  return (value || '').trim().toLowerCase();
}

type Slide = { type: 'image'; url: string; downloadUrl: string } | { type: 'text'; content: string };

const DRIVE_ID_PATTERNS = [
  /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
  /[?&]id=([a-zA-Z0-9_-]{10,})/,
  /\/d\/([a-zA-Z0-9_-]{10,})/,
];

function driveFileId(url: string): string | null {
  for (const pattern of DRIVE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isImageLink(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function toDriveImageUrl(value: string, width = 900): string {
  const fileId = driveFileId(value);
  return fileId ? `https://lh3.googleusercontent.com/d/${fileId}=w${width}` : value;
}

function toDriveDownloadUrl(value: string): string {
  const fileId = driveFileId(value);
  return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : value;
}

function imageSlides(item: CalendarItem): Slide[] {
  const slides: Slide[] = [];
  for (let i = 1; i <= 10; i++) {
    const raw = (item[`Imagem ${i}`] || '').trim();
    if (!raw) continue;
    slides.push(
      isImageLink(raw)
        ? { type: 'image', url: toDriveImageUrl(raw), downloadUrl: toDriveDownloadUrl(raw) }
        : { type: 'text', content: raw }
    );
  }
  if (slides.length === 0) {
    slides.push({ type: 'text', content: item['Título'] || '' });
  }
  return slides;
}

// Story vinculado ao post: coluna "Story" e/ou "Story 1" … "Story 10" da planilha.
// Formato vertical 9:16 (1080x1920), igual ao Instagram.
const STORY_DURATION_MS = 5000;

function storySlides(item: CalendarItem): Slide[] {
  const raws = [item['Story'], ...Array.from({ length: 10 }, (_, i) => item[`Story ${i + 1}`])];
  const slides: Slide[] = [];
  raws.forEach((value) => {
    const raw = (value || '').trim();
    if (!raw) return;
    slides.push(
      isImageLink(raw)
        ? { type: 'image', url: toDriveImageUrl(raw, 1080), downloadUrl: toDriveDownloadUrl(raw) }
        : { type: 'text', content: raw }
    );
  });
  return slides;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

function weekdayColumns(items: CalendarItem[]) {
  const weeks: (CalendarItem | null)[][] = [];
  let current: (CalendarItem | null)[] = new Array(7).fill(null);
  let hasContent = false;

  items.forEach((item) => {
    const idx = WEEKDAYS.indexOf(normalizeWeekday(item['Dia da semana']));
    if (idx < 0) return;
    if (idx === 0 && hasContent) {
      weeks.push(current);
      current = new Array(7).fill(null);
      hasContent = false;
    }
    current[idx] = item;
    hasContent = true;
    if (idx === 6) {
      weeks.push(current);
      current = new Array(7).fill(null);
      hasContent = false;
    }
  });
  if (hasContent) weeks.push(current);
  return weeks;
}

export function ContentCalendar({
  items,
  loading,
  error,
  clienteNome,
  onLike,
  onComment,
}: {
  items: CalendarItem[];
  loading: boolean;
  error: string;
  clienteNome: string;
  onLike?: (item: CalendarItem, aprovado: boolean) => void;
  onComment?: (item: CalendarItem, comentario: string) => void;
}) {
  const [openItem, setOpenItem] = useState<CalendarItem | null>(null);
  const [previewMes, setPreviewMes] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items.forEach((item) => {
      const mes = item['Mês'] || 'Sem mês';
      if (!map.has(mes)) map.set(mes, []);
      map.get(mes)!.push(item);
    });
    return Array.from(map.entries());
  }, [items]);

  if (loading) {
    return (
      <div className="rounded-2xl border p-8 text-center text-[#1A1A1A]/40 font-medium" style={{ borderColor: '#e3e7f7' }}>
        Carregando calendário...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#e3e7f7' }}>
        <p className="text-[#1A1A1A]/40 font-medium text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {grouped.map(([mes, mesItems]) => (
        <div key={mes} className="overflow-hidden rounded-3xl border-2 border-[#1A1A1A]">
          {/* Header estilo calendário editorial */}
          <div className="flex items-start justify-between gap-4 p-5" style={{ backgroundColor: '#1A1A1A' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Calendário Editorial</p>
              <h2 className="mt-1 text-2xl font-black uppercase text-white">{mes}</h2>
              <p className="mt-1 text-xs font-bold text-[#E97933]">{clienteNome}</p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewMes(mes)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-white/20"
            >
              <Eye size={14} />
              Prévia
            </button>
          </div>

          {/* Grid de dias da semana */}
          <div className="grid grid-cols-7 border-b-2 border-[#1A1A1A] bg-[#1A1A1A]">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-2 text-center text-[10px] font-black uppercase tracking-wide text-white/60">
                {label}
              </div>
            ))}
          </div>

          <div className="bg-[#FFF8F2]">
            {weekdayColumns(mesItems).map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 divide-x" style={{ borderColor: '#e3e7f7' }}>
                {week.map((item, di) => {
                  if (!item) {
                    return <div key={di} className="min-h-[120px] border-t" style={{ borderColor: '#e3e7f7' }} />;
                  }
                  const temConteudo = (item['Conteúdo?'] || '').trim().toLowerCase() === 'sim';
                  const tipo = (item['Tipo'] || '').trim();
                  const tipoStyle = TIPO_STYLE[tipo];
                  const temImagem = imageSlides(item).some((s) => s.type === 'image');
                  const temStory = storySlides(item).length > 0;

                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => temConteudo && setOpenItem(item)}
                      disabled={!temConteudo}
                      className="min-h-[120px] border-t p-2.5 text-left transition hover:bg-white disabled:cursor-default sm:p-3"
                      style={{ borderColor: '#e3e7f7' }}
                    >
                      <span className="text-xs font-black text-[#1A1A1A]">{item['Dia']}</span>
                      {temConteudo ? (
                        <div className="mt-1.5">
                          {(tipoStyle || temStory) && (
                            <div className="mb-1 flex flex-wrap items-center gap-1.5">
                              {tipoStyle && (
                                <>
                                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tipoStyle.dot }} />
                                  <span className="text-[10px] font-bold text-[#1A1A1A]/60">{tipoStyle.label}</span>
                                </>
                              )}
                              {temStory && (
                                <span
                                  className="rounded-full px-1.5 py-px text-[8px] font-black uppercase tracking-wide text-white"
                                  style={{ background: STORY_RING }}
                                >
                                  + Story
                                </span>
                              )}
                            </div>
                          )}
                          {!temImagem && (
                            <div className="flex justify-center py-1.5">
                              <ImageOff size={30} strokeWidth={1.4} className="text-[#1A1A1A]/20" />
                            </div>
                          )}
                          <p
                            className={cn(
                              'whitespace-pre-line text-[11px] font-bold leading-snug break-words',
                              temImagem ? 'text-[#1A1A1A]' : 'text-center text-[#1A1A1A]/60'
                            )}
                          >
                            {item['Título']}
                          </p>
                          {item['Funil'] && item['Nome do funil'] && (
                            <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-[#E97933]">
                              Funil {item['Funil']} · {item['Nome do funil']}
                            </p>
                          )}
                        </div>
                      ) : (
                        item['Título'] && (
                          <p className="mt-2 whitespace-pre-line text-[11px] italic leading-snug text-[#1A1A1A]/40">
                            {item['Título']}
                          </p>
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 rounded-2xl border p-4" style={{ borderColor: '#e3e7f7' }}>
        {Object.entries(TIPO_STYLE).map(([tipo, style]) => (
          <div key={tipo} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: style.dot }} />
            <span className="text-xs font-bold text-[#1A1A1A]/60">{tipo}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {previewMes && (
          <InstaPreviewModal
            items={grouped.find(([mes]) => mes === previewMes)?.[1] || []}
            clienteNome={clienteNome}
            onClose={() => setPreviewMes(null)}
            onOpenItem={(item) => {
              setPreviewMes(null);
              setOpenItem(item);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openItem && (
          <PostPreviewModal
            item={items.find((it) => it._row === openItem._row) || openItem}
            clienteNome={clienteNome}
            onClose={() => setOpenItem(null)}
            onLike={onLike}
            onComment={onComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InstaPreviewModal({
  items,
  clienteNome,
  onClose,
  onOpenItem,
}: {
  items: CalendarItem[];
  clienteNome: string;
  onClose: () => void;
  onOpenItem: (item: CalendarItem) => void;
}) {
  const grupos = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items
      .filter((item) => (item['Conteúdo?'] || '').trim().toLowerCase() === 'sim')
      .forEach((item) => {
        const handle = (item['Insta'] || '').trim() || clienteNome;
        if (!map.has(handle)) map.set(handle, []);
        map.get(handle)!.push(item);
      });
    return Array.from(map.entries());
  }, [items, clienteNome]);

  const [activeHandle, setActiveHandle] = useState(grupos[0]?.[0] || clienteNome);
  const posts = grupos.find(([handle]) => handle === activeHandle)?.[1] || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1A1A1A]/80 p-4 backdrop-blur-sm md:p-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="mt-6 w-full max-w-lg overflow-hidden rounded-3xl border-2 border-[#1A1A1A] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: '#f0f0f0' }}>
          <div className="flex items-center gap-1.5 text-sm font-black text-[#1A1A1A]">
            <Grid3x3 size={16} />
            Prévia do Feed
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[#F0EAE3]">
            <X size={18} />
          </button>
        </div>

        {/* Tabs de conta, quando houver mais de um @ */}
        {grupos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-b px-4 py-2.5" style={{ borderColor: '#f0f0f0' }}>
            {grupos.map(([handle]) => (
              <button
                key={handle}
                type="button"
                onClick={() => setActiveHandle(handle)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-black transition',
                  activeHandle === handle
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-[#F0EAE3] text-[#1A1A1A]/60 hover:bg-[#F0EAE3]/70'
                )}
              >
                @{handle}
              </button>
            ))}
          </div>
        )}

        {/* Perfil estilo Instagram */}
        <div className="flex items-center gap-4 p-5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#1A1A1A] text-xl font-black text-white"
            style={{ backgroundColor: '#E97933' }}
          >
            {activeHandle.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#1A1A1A]">@{activeHandle}</p>
            <p className="text-xs font-bold text-[#1A1A1A]/50">{posts.length} posts programados</p>
          </div>
        </div>

        {/* Grid de posts */}
        {posts.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-[#1A1A1A]/40">Nenhum conteúdo programado ainda.</p>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 border-t" style={{ borderColor: '#f0f0f0' }}>
            {posts.map((item) => (
              <FeedThumbnail key={item._row} item={item} onClick={() => onOpenItem(item)} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function FeedThumbnail({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
  const slides = useMemo(() => imageSlides(item), [item]);
  const first = slides[0];

  return (
    <button type="button" onClick={onClick} className="relative aspect-square w-full overflow-hidden bg-[#141414]">
      {first?.type === 'image' ? (
        <img src={first.url} alt={item['Título'] || 'Post'} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
          <ImageOff size={44} strokeWidth={1.4} className="text-white/25" />
          <p className="line-clamp-3 whitespace-pre-line text-[9px] font-bold uppercase leading-tight text-white/60">
            {first?.type === 'text' ? first.content : item['Título']}
          </p>
        </div>
      )}
    </button>
  );
}

function EditorialTextSlide({
  text,
  tipo,
  tipoStyle,
  dia,
  slideIndex,
  totalSlides,
}: {
  text: string;
  tipo: string;
  tipoStyle?: { dot: string; label: string };
  dia?: string;
  slideIndex: number;
  totalSlides: number;
}) {
  const accent = tipoStyle?.dot || '#E97933';

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#141414] p-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">
          {dia ? `Dia ${dia}` : 'Post'}
          {totalSlides > 1 ? ` · ${slideIndex + 1}/${totalSlides}` : ''}
        </span>
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 text-center">
        <ImageOff size={76} strokeWidth={1.3} className="text-white/25" />
        <p className="whitespace-pre-line text-sm font-bold leading-snug text-white/70">{text}</p>
      </div>

      <div className="flex items-center justify-between">
        <span
          className="rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white"
          style={{ borderColor: accent }}
        >
          {tipo || 'Post'}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wide text-white/40">Imagem em produção</span>
      </div>
    </div>
  );
}

function PostPreviewModal({
  item,
  clienteNome,
  onClose,
  onLike,
  onComment,
}: {
  item: CalendarItem;
  clienteNome: string;
  onClose: () => void;
  onLike?: (item: CalendarItem, aprovado: boolean) => void;
  onComment?: (item: CalendarItem, comentario: string) => void;
}) {
  const slides = useMemo(() => imageSlides(item), [item]);
  const [slideIndex, setSlideIndex] = useState(0);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [commentDraft, setCommentDraft] = useState(item['Comentário'] || '');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [legendaCopiada, setLegendaCopiada] = useState(false);
  const stories = useMemo(() => storySlides(item), [item]);
  const temStory = stories.length > 0;

  const roteiro = (item['Roteiro'] || '').trim();
  const direcao = (item['Direção criativa'] || '').trim();
  const liked = (item['Aprovado?'] || '').trim().toLowerCase() === 'sim';
  const savedComment = (item['Comentário'] || '').trim();
  const tipo = (item['Tipo'] || '').trim();
  const tipoStyle = TIPO_STYLE[tipo];
  const currentSlide = slides[Math.min(slideIndex, slides.length - 1)];

  function toggleLike() {
    onLike?.(item, !liked);
  }

  function handleDoubleClick() {
    if (!liked) {
      onLike?.(item, true);
      setShowHeartBurst(true);
      window.setTimeout(() => setShowHeartBurst(false), 700);
    }
  }

  async function copiarLegenda() {
    const ok = await copyText(item['Legenda'] || '');
    if (!ok) return;
    setLegendaCopiada(true);
    window.setTimeout(() => setLegendaCopiada(false), 1800);
  }

  function submitComment() {
    onComment?.(item, commentDraft.trim());
    setShowCommentBox(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1A1A1A]/80 p-4 backdrop-blur-sm md:p-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="mt-6 w-full max-w-md overflow-hidden rounded-3xl border-2 border-[#1A1A1A] bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header estilo Instagram */}
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: '#f0f0f0' }}>
          <div className="flex items-center gap-2.5">
            {temStory ? (
              <button
                type="button"
                onClick={() => setShowStory(true)}
                aria-label="Ver story deste post"
                title="Ver story deste post"
                className="rounded-full p-[2px] transition hover:scale-105"
                style={{ background: STORY_RING }}
              >
                <span className="block rounded-full bg-white p-[2px]">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white"
                    style={{ backgroundColor: '#E97933' }}
                  >
                    {clienteNome.charAt(0).toUpperCase()}
                  </span>
                </span>
              </button>
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1A1A1A] text-xs font-black text-white"
                style={{ backgroundColor: '#E97933' }}
              >
                {clienteNome.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="leading-tight">
              <span className="block text-sm font-black text-[#1A1A1A]">{clienteNome}</span>
              {temStory && (
                <button
                  type="button"
                  onClick={() => setShowStory(true)}
                  className="text-[11px] font-bold text-[#EE2A7B] hover:underline"
                >
                  Ver story deste post
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[#F0EAE3]">
            <X size={18} />
          </button>
        </div>

        {/* Slides */}
        <div
          className="relative aspect-[4/5] w-full overflow-hidden select-none"
          style={{ backgroundColor: '#141414' }}
          onDoubleClick={handleDoubleClick}
        >
          <AnimatePresence>
            {showHeartBurst && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.15 }}
                exit={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.4 }}
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
              >
                <Heart size={90} className="text-white drop-shadow-lg" fill="white" />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              {currentSlide?.type === 'image' ? (
                <img
                  src={currentSlide.url}
                  alt={item['Título'] || 'Post'}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <EditorialTextSlide
                  text={currentSlide?.content || item['Título'] || ''}
                  tipo={tipo}
                  tipoStyle={tipoStyle}
                  dia={item['Dia']}
                  slideIndex={slideIndex}
                  totalSlides={slides.length}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {slides.length > 1 && (
            <>
              <button
                onClick={() => setSlideIndex((i) => (i - 1 + slides.length) % slides.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 hover:bg-white"
                aria-label="Slide anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setSlideIndex((i) => (i + 1) % slides.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 hover:bg-white"
                aria-label="Próximo slide"
              >
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {slides.map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: i === slideIndex ? '#fff' : 'rgba(255,255,255,0.4)' }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Ações estilo Instagram */}
        <div className="flex items-center gap-4 px-4 pt-3 text-[#1A1A1A]">
          <button type="button" onClick={toggleLike} aria-label={liked ? 'Remover aprovação' : 'Aprovar'}>
            <Heart
              size={22}
              className={liked ? 'text-[#E97933] transition' : 'transition hover:text-[#1A1A1A]/60'}
              fill={liked ? '#E97933' : 'none'}
            />
          </button>
          <button
            type="button"
            onClick={() => setShowCommentBox((v) => !v)}
            aria-label="Comentar"
          >
            <MessageCircle size={22} />
          </button>
          {currentSlide?.type === 'image' && (
            <a
              href={currentSlide.downloadUrl}
              download
              aria-label="Baixar imagem em qualidade original"
              className="transition hover:text-[#1A1A1A]/60"
            >
              <Download size={22} />
            </a>
          )}
          {temStory && (
            <button
              type="button"
              onClick={() => setShowStory(true)}
              aria-label="Ver story deste post"
              title="Ver story deste post"
              className="transition hover:text-[#EE2A7B]"
            >
              <CircleDashed size={22} />
            </button>
          )}
          <Bookmark size={22} className="ml-auto" />
        </div>

        {liked && (
          <p className="px-4 pt-1.5 text-xs font-bold text-[#E97933]">Aprovado por {clienteNome}</p>
        )}

        {/* Legenda */}
        {item['Legenda'] && (
          <div className="px-4 pb-2 pt-2">
            <p className="text-sm text-[#1A1A1A]">
              <span className="font-black">{clienteNome}</span>{' '}
              <span className="whitespace-pre-line">{item['Legenda']}</span>
            </p>
            <button
              type="button"
              onClick={copiarLegenda}
              className={cn(
                'mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide transition',
                legendaCopiada
                  ? 'border-[#4C9A2A] bg-[#4C9A2A] text-white'
                  : 'border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
              )}
            >
              {legendaCopiada ? <Check size={14} /> : <Copy size={14} />}
              {legendaCopiada ? 'Legenda copiada!' : 'Copiar legenda'}
            </button>
          </div>
        )}

        {/* Comentário */}
        <div className="px-4 pb-4">
          {savedComment && !showCommentBox && (
            <div className="mb-2 rounded-xl p-2.5 text-sm" style={{ backgroundColor: '#F0EAE3' }}>
              <span className="font-black text-[#1A1A1A]">{clienteNome}</span>{' '}
              <span className="whitespace-pre-line text-[#1A1A1A]/80">{savedComment}</span>
            </div>
          )}
          {showCommentBox ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Adicione um comentário..."
                className="flex-1 rounded-full border px-3.5 py-2 text-sm outline-none focus:border-[#E97933]"
                style={{ borderColor: '#e3e7f7' }}
              />
              <button
                type="button"
                onClick={submitComment}
                className="text-sm font-black text-[#E97933] disabled:opacity-40"
                disabled={!commentDraft.trim()}
              >
                Publicar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCommentBox(true)}
              className="text-sm font-medium text-[#1A1A1A]/40"
            >
              {savedComment ? 'Editar comentário...' : 'Adicionar um comentário...'}
            </button>
          )}
        </div>

        {/* Detalhes de produção */}
        {(roteiro || direcao) && (
          <div className="space-y-3 border-t p-4" style={{ borderColor: '#f0f0f0' }}>
            {roteiro && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-[#1A1A1A]/40">Roteiro</p>
                <p className="mt-1 text-sm text-[#1A1A1A]/80 whitespace-pre-line">{roteiro}</p>
              </div>
            )}
            {direcao && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-wide text-[#1A1A1A]/40">Direção criativa</p>
                <p className="mt-1 text-sm text-[#1A1A1A]/80 whitespace-pre-line">{direcao}</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showStory && temStory && (
          <StoryViewer
            slides={stories}
            item={item}
            clienteNome={clienteNome}
            onClose={() => setShowStory(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StoryViewer({
  slides,
  item,
  clienteNome,
  onClose,
}: {
  slides: Slide[];
  item: CalendarItem;
  clienteNome: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const elapsedRef = useRef(0);
  const current = slides[Math.min(index, slides.length - 1)];

  const next = useCallback(() => {
    elapsedRef.current = 0;
    setProgress(0);
    if (index < slides.length - 1) setIndex((i) => i + 1);
    else onClose();
  }, [index, slides.length, onClose]);

  const prev = useCallback(() => {
    elapsedRef.current = 0;
    setProgress(0);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  // Barra de progresso + avanço automático (pausa ao segurar)
  useEffect(() => {
    if (paused) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      elapsedRef.current += now - last;
      last = now;
      const pct = Math.min(1, elapsedRef.current / STORY_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) next();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, next]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const holdHandlers = {
    onPointerDown: () => setPaused(true),
    onPointerUp: () => setPaused(false),
    onPointerLeave: () => setPaused(false),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 sm:p-6"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      {/* Formato padrão de stories: 9:16 (1080x1920) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.2 }}
        className="relative aspect-[9/16] w-[min(100vw,calc(100dvh*9/16))] overflow-hidden bg-[#141414] select-none sm:w-[min(calc(90dvh*9/16),480px)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {current.type === 'image' ? (
          <img
            key={current.url}
            src={current.url}
            alt={`Story · ${item['Título'] || 'Post'}`}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-5 p-10 text-center">
            <ImageOff size={76} strokeWidth={1.3} className="text-white/25" />
            <p className="whitespace-pre-line text-base font-bold leading-snug text-white/75">{current.content}</p>
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/40">Story em produção</span>
          </div>
        )}

        {/* Zonas de toque: esquerda volta, direita avança, segurar pausa */}
        <div className="absolute inset-0 z-10 flex">
          <button type="button" aria-label="Story anterior" className="h-full w-1/3" onClick={prev} {...holdHandlers} />
          <button type="button" aria-label="Próximo story" className="h-full w-2/3" onClick={next} {...holdHandlers} />
        </div>

        {/* Topo: barras de progresso + perfil + ações */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-3 pb-8 pt-3">
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
                <span
                  className="block h-full bg-white"
                  style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }}
                />
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2.5">
            <span className="rounded-full p-[2px]" style={{ background: STORY_RING }}>
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black text-xs font-black text-white"
                style={{ backgroundColor: '#E97933' }}
              >
                {clienteNome.charAt(0).toUpperCase()}
              </span>
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-black text-white">{clienteNome}</p>
              <p className="truncate text-[11px] font-bold text-white/70">
                Story do post{item['Dia'] ? ` · Dia ${item['Dia']}` : ''}
                {item['Título'] ? ` · ${item['Título']}` : ''}
              </p>
            </div>

            <div className="pointer-events-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? 'Continuar' : 'Pausar'}
                className="rounded-full p-1.5 text-white hover:bg-white/15"
              >
                {paused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar story"
                className="rounded-full p-1.5 text-white hover:bg-white/15"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé: download em qualidade original */}
        {current.type === 'image' && (
          <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/60 to-transparent px-4 pb-5 pt-10">
            <a
              href={current.downloadUrl}
              download
              target="_blank"
              rel="noreferrer"
              onClick={() => setPaused(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-[#1A1A1A] transition hover:bg-white/85"
            >
              <Download size={14} />
              Baixar story{slides.length > 1 ? ` ${index + 1}/${slides.length}` : ''}
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
