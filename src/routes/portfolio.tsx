import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { SiteShell } from '@/components/SiteShell';
import { WaveDivider } from '@/components/WaveDivider';
import { X, ImageOff } from 'lucide-react';

export const Route = createFileRoute('/portfolio')({
  head: () => ({
    meta: [
      { title: 'Portfólio — Cajuna Studio' },
      { name: 'description', content: 'Projetos de identidade visual, packaging, social media e impressos criados pela Cajuna Studio.' },
      { property: 'og:title', content: 'Portfólio — Cajuna Studio' },
      { property: 'og:description', content: 'Projetos de identidade visual e social media.' },
    ],
  }),
  component: Portfolio,
});

/**
 * Unsplash Source retorna uma imagem aleatória por query.
 * Seed estabiliza a imagem entre renders (mesmo seed = mesma foto).
 */
function unsplash(query: string, seed: number, w = 800, h = 600) {
  return `https://source.unsplash.com/${w}x${h}/?${encodeURIComponent(query)}&sig=${seed}`;
}

type Project = {
  img: string;
  imgQuery: string;
  seed: number;
  title: string;
  category: string;
  client: string;
  desc: string;
  accent: string;
};

const projects: Project[] = [
  {
    img: unsplash('branding identity logo design', 1, 800, 600),
    imgQuery: 'branding identity logo design',
    seed: 1,
    title: 'Kibring',
    category: 'Identidade Visual',
    client: 'Estúdio gastronômico',
    desc: 'Sistema de papelaria com paleta laranja e navy em alto contraste. Do símbolo ao manual, passando por cartão, folder e mockups de aplicação.',
    accent: '#E97933',
  },
  {
    img: unsplash('tech startup brand geometric', 2, 800, 600),
    imgQuery: 'tech startup brand geometric',
    seed: 2,
    title: 'Hexa Lab',
    category: 'Brand Mark',
    client: 'Tech startup',
    desc: 'Marca geométrica com símbolo modular pensado pra múltiplas aplicações — de favicon a outdoor.',
    accent: '#2D5F8A',
  },
  {
    img: unsplash('fashion social media instagram feed', 3, 800, 600),
    imgQuery: 'fashion social media instagram feed',
    seed: 3,
    title: 'Mosaico Social',
    category: 'Social Media',
    client: 'Marca de moda',
    desc: 'Grid de posts e stories estruturado em sistema visual. Frequência semanal, identidade impecável.',
    accent: '#E97933',
  },
  {
    img: unsplash('natural cosmetic packaging product', 4, 800, 600),
    imgQuery: 'natural cosmetic packaging product',
    seed: 4,
    title: 'Vivo Care',
    category: 'Packaging',
    client: 'Cosmético natural',
    desc: 'Embalagem minimalista, blocos de cor e tipografia limpa. Projeto pensado pra prateleira e pra foto.',
    accent: '#2D5F8A',
  },
  {
    img: unsplash('cafe coffee shop menu branding', 5, 800, 600),
    imgQuery: 'cafe coffee shop menu branding',
    seed: 5,
    title: 'Mina Caffè',
    category: 'Impressos',
    client: 'Cafeteria de bairro',
    desc: 'Cardápios, cartões e materiais de mesa em paleta quente. Cada detalhe reforça o clima aconchegante do espaço.',
    accent: '#E97933',
  },
  {
    img: unsplash('brand book design manual typography', 6, 800, 600),
    imgQuery: 'brand book design manual typography',
    seed: 6,
    title: 'Brand Book Atlas',
    category: 'Manual de Marca',
    client: 'Consultoria',
    desc: 'Guia completo de uso de marca: cores, tipografias, tom de voz e aplicações em todos os canais.',
    accent: '#2D5F8A',
  },
  {
    img: unsplash('food packaging label design', 7, 800, 600),
    imgQuery: 'food packaging label design',
    seed: 7,
    title: 'Semeio',
    category: 'Embalagem & Rótulo',
    client: 'Alimentos artesanais',
    desc: 'Rótulo com identidade orgânica e elementos de ilustração. Projeto pensado pra se destacar nas gôndolas.',
    accent: '#E97933',
  },
  {
    img: unsplash('event poster retro design print', 8, 800, 600),
    imgQuery: 'event poster retro design print',
    seed: 8,
    title: 'Festa Raiz',
    category: 'Estampa & Evento',
    client: 'Produtora cultural',
    desc: 'Arte para banner, camiseta e materiais de divulgação de evento regional com estética popular.',
    accent: '#2D5F8A',
  },
  {
    img: unsplash('digital ads social media creative', 9, 800, 600),
    imgQuery: 'digital ads social media creative',
    seed: 9,
    title: 'Campanha Verão',
    category: 'Criativos para Anúncios',
    client: 'E-commerce de moda',
    desc: 'Série de criativos para Facebook e Instagram Ads com CRO visual: hierarquia clara e CTA forte.',
    accent: '#E97933',
  },
];

/** Imagem com fallback colorido caso Unsplash falhe */
function PortfolioImage({
  src,
  alt,
  accent,
  className = '',
}: {
  src: string;
  alt: string;
  accent: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
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
      width={800}
      height={600}
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${className}`}
    />
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.06 } }),
};

const CATS = ['Todos', ...Array.from(new Set(projects.map((p) => p.category)))];

function Portfolio() {
  const [open, setOpen] = useState<Project | null>(null);
  const [cat, setCat] = useState('Todos');

  const filtered = cat === 'Todos' ? projects : projects.filter((p) => p.category === cat);

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
            Uma seleção de projetos recentes — identidade visual, social media, packaging e impressos.
          </p>
        </div>
        <WaveDivider fill="#FFF8F2" />
      </section>

      {/* FILTROS */}
      <section className="mx-auto max-w-6xl px-5 pt-10">
        <div className="flex flex-wrap gap-2">
          {CATS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full border-2 border-[#1A1A1A] text-sm font-bold transition-colors ${
                cat === c
                  ? 'bg-[#E97933] text-[#1A1A1A]'
                  : 'bg-white text-[#1A1A1A] hover:bg-[#FFF8F2]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* GRID */}
      <section className="mx-auto max-w-6xl px-5 py-8 pb-20">
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <motion.button
              layout
              key={p.title}
              type="button"
              onClick={() => setOpen(p)}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="group text-left rounded-3xl overflow-hidden border-2 border-[#1A1A1A] bg-white hover:border-[#E97933] transition-colors"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#F0EAE3]">
                <PortfolioImage src={p.img} alt={p.title} accent={p.accent} />
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
          onClick={() => setOpen(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-4xl bg-white rounded-3xl border-2 border-[#1A1A1A] overflow-hidden relative mt-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white border-2 border-[#1A1A1A] hover:bg-[#FFF8F2]"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
            <div className="w-full aspect-video bg-[#F0EAE3] overflow-hidden">
              <PortfolioImage
                src={unsplash(open.imgQuery, open.seed, 1200, 675)}
                alt={open.title}
                accent={open.accent}
                className="w-full h-full"
              />
            </div>
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
