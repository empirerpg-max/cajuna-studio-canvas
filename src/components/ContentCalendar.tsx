import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';

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

function imageSlides(item: CalendarItem): string[] {
  const slides: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const text = (item[`Imagem ${i}`] || '').trim();
    if (text) slides.push(text);
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
          <div className="p-5" style={{ backgroundColor: '#1A1A1A' }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Calendário Editorial</p>
            <h2 className="mt-1 text-2xl font-black uppercase text-white">{mes}</h2>
            <p className="mt-1 text-xs font-bold text-[#E97933]">{clienteNome}</p>
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
                          <p className="text-[11px] font-bold leading-snug text-[#1A1A1A] line-clamp-3">
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
                          <p className="mt-2 text-[11px] italic leading-snug text-[#1A1A1A]/40">
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
          className="relative aspect-square w-full overflow-hidden select-none"
          style={{ backgroundColor: '#2D5F8A' }}
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
              className="retro-noise flex h-full w-full items-center justify-center p-8 text-center"
            >
              <p className="text-lg font-black leading-snug text-white whitespace-pre-line">
                {slides[slideIndex] || item['Título']}
              </p>
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
