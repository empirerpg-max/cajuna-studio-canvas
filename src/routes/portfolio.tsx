import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { SiteShell } from '@/components/SiteShell';
import { WaveDivider } from '@/components/WaveDivider';
import { X, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/portfolio')({
  head: () => ({
    meta: [
      { title: 'Portfólio — Cajuna Studio' },
      { name: 'description', content: 'Projetos de identidade visual criados pela Cajuna Studio.' },
      { property: 'og:title', content: 'Portfólio — Cajuna Studio' },
      { property: 'og:description', content: 'Projetos de identidade visual.' },
    ],
  }),
  component: Portfolio,
});

/**
 * Converte o ID de um arquivo do Google Drive (compartilhado como "qualquer
 * pessoa com o link pode ver") em uma URL de imagem embutível, sem precisar
 * baixar o arquivo — igual a um embed do Behance.
 */
function driveImage(fileId: string, width = 1600) {
  return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;
}

type Project = {
  title: string;
  category: string;
  client: string;
  desc: string;
  accent: string;
  images: string[];
};

const projects: Project[] = [
  {
    title: 'Águia Cursinho',
    category: 'Identidade Visual',
    client: 'Cursinho pré-vestibular',
    desc: 'Identidade visual completa desenvolvida para a Águia Cursinho.',
    accent: '#E97933',
    images: [
      driveImage('1fVvV4gqkS9awek9Yp0kdhJ8rqqDnW7bY'),
      driveImage('1JPCPJ14D0_elZMMW7nkHyH3PEqtcWKHG'),
      driveImage('1XXEL-nEX5kYAf2ZabWf0uvo3NoIjuMFZ'),
      driveImage('1I1w1vBGLsuGLwTmMyz154EUJs9UK5-9P'),
      driveImage('14I3gg7sgn9V1kLJXjcQhEwfCPXBCzX2K'),
    ],
  },
  {
    title: 'Ana Amaral Confeitaria',
    category: 'Identidade Visual',
    client: 'Confeitaria artesanal',
    desc: 'Identidade visual desenvolvida para a Ana Amaral Confeitaria.',
    accent: '#2D5F8A',
    images: [],
  },
];

/** Imagem com fallback colorido caso o arquivo do Drive não carregue */
function PortfolioImage({
  src,
  alt,
  accent,
  className = '',
}: {
  src?: string;
  alt: string;
  accent: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${className}`}
        style={{ backgroundColor: accent + '22' }}
      >
        <ImageOff size={32} style={{ color: accent }} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${className}`}
    />
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.06 } }),
};

function Portfolio() {
  const [open, setOpen] = useState<Project | null>(null);
  const [imgIndex, setImgIndex] = useState(0);

  function openProject(p: Project) {
    setOpen(p);
    setImgIndex(0);
  }

  function closeModal() {
    setOpen(null);
    setImgIndex(0);
  }

  return (
    <SiteShell>
      {/* HEADER */}
      <section className="retro-noise" style={{ backgroundColor: '#2D5F8A' }}>
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E97933]">portfólio</span>
          <h1 className="mt-3 text-5xl md:text-6xl font-black text-white leading-tight">
            Marcas que <span style={{ color: '#E97933' }}>amamos</span> ter feito.
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-2xl">
            Projetos de identidade visual desenvolvidos pela Cajuna Studio.
          </p>
        </div>
        <WaveDivider fill="#FFF8F2" />
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-6xl px-5 py-10 pb-20">
        <motion.div layout className="grid sm:grid-cols-2 gap-5">
          {projects.map((p, i) => (
            <motion.button
              layout
              key={p.title}
              type="button"
              onClick={() => openProject(p)}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="group text-left rounded-3xl overflow-hidden border-2 border-[#1A1A1A] bg-white hover:border-[#E97933] transition-colors"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#F0EAE3]">
                <PortfolioImage src={p.images[0]} alt={p.title} accent={p.accent} />
              </div>
              <div className="p-5">
                <div className="text-xs font-black uppercase tracking-widest text-[#E97933]">{p.category}</div>
                <h3 className="mt-1 text-xl font-black">{p.title}</h3>
                <p className="text-sm text-[#1A1A1A]/55 mt-1">{p.client}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        <div className="flex justify-end mt-10 pr-4">
          <img src="/mascote2.svg" alt="" aria-hidden className="w-20 h-20 object-contain opacity-60" />
        </div>
      </section>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-[#1A1A1A]/80 backdrop-blur-sm p-4 md:p-10 overflow-y-auto flex items-start justify-center"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-4xl bg-white rounded-3xl border-2 border-[#1A1A1A] overflow-hidden relative mt-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white border-2 border-[#1A1A1A] hover:bg-[#FFF8F2]"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="w-full aspect-video bg-[#F0EAE3] overflow-hidden relative">
              <PortfolioImage
                src={open.images[imgIndex]}
                alt={open.title}
                accent={open.accent}
                className="w-full h-full"
              />
              {open.images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex((i) => (i - 1 + open.images.length) % open.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border-2 border-[#1A1A1A] hover:bg-white"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setImgIndex((i) => (i + 1) % open.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border-2 border-[#1A1A1A] hover:bg-white"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {open.images.length > 1 && (
              <div className="flex gap-2 px-8 pt-4 overflow-x-auto">
                {open.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 ${
                      i === imgIndex ? 'border-[#E97933]' : 'border-[#1A1A1A]/20'
                    }`}
                  >
                    <PortfolioImage src={src} alt={`${open.title} ${i + 1}`} accent={open.accent} />
                  </button>
                ))}
              </div>
            )}

            <div className="p-8">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 border-[#1A1A1A]"
                  style={{ backgroundColor: open.accent + '22', color: open.accent }}
                >
                  {open.category}
                </span>
                <span className="text-sm text-[#1A1A1A]/50 font-medium">{open.client}</span>
              </div>
              <h2 className="mt-4 text-3xl font-black">{open.title}</h2>
              <p className="mt-4 text-[#1A1A1A]/75 text-lg leading-relaxed">{open.desc}</p>
            </div>
          </motion.div>
        </div>
      )}
    </SiteShell>
  );
}
