import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark, Grid3x3, Eye, ImageOff } from 'lucide-react';
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

const TIPO_STYLE: Record<string, { dot: string; label: string }> = {
  Carrossel: { dot: '#2D5F8A', label: 'Carrossel' },
  Reel: { dot: '#E97933', label: 'Reel' },
  'Post único': { dot: '#4C9A2A', label: 'Post único' },
  Meme: { dot: '#C9A227', label: 'Meme' },
};

function normalizeWeekday(value: string): string {
  return (value || '').trim().toLowerCase();
}

type Slide = { type: 'image'; url: string } | { type: 'text'; content: string };

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

function imageSlides(item: CalendarItem): Slide[] {
  const slides: Slide[] = [];
  for (let i = 1; i <= 10; i++) {
    const raw = (item[`Imagem ${i}`] || '').trim();
    if (!raw) continue;
    slides.push(isImageLink(raw) ? { type: 'image', url: toDriveImageUrl(raw) } : { type: 'text', content: raw });
  }
  if (slides.length === 0) {
    slides.push({ type: 'text', content: item['Título'] || '' });
  }
  return slides;
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
                          {tipoStyle && (
                            <div className="mb-1 flex items-center gap-1.5">
                              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tipoStyle.dot }} />
                              <span className="text-[10px] font-bold text-[#1A1A1A]/60">{tipoStyle.label}</span>
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
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1A1A1A] text-xs font-black text-white"
              style={{ backgroundColor: '#E97933' }}
            >
              {clienteNome.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-black text-[#1A1A1A]">{clienteNome}</span>
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
          <Send size={22} />
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
    </motion.div>
  );
}
