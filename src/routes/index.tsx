import { createFileRoute, Link } from '@tanstack/react-router';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Check, MessageCircle, Sparkles } from 'lucide-react';
import { SiteShell } from '@/components/SiteShell';
import { WaveDivider } from '@/components/WaveDivider';
import { RetroCard } from '@/components/RetroCard';
import { CajuMascot } from '@/components/CajuMascot';

export const Route = createFileRoute('/')({ 
  head: () => ({
    meta: [
      { title: 'Cajuna Studio — Identidade visual & posts' },
      { name: 'description', content: 'Estúdio de identidade visual e social media. Marcas com afeto, estratégia e estética.' },
      { property: 'og:title', content: 'Cajuna Studio' },
      { property: 'og:description', content: 'Identidade visual e posts para marcas que querem ser lembradas.' },
    ],
  }),
  component: Home,
});

const identidade = {
  base: [
    'Logo principal',
    'Variações do logo',
    'Elementos de apoio',
    'Tipografias da marca',
    'Cartão de visita',
    'Aplicação da marca em 4 mockups',
    'Manual da marca',
    'Registro de anterioridade',
  ],
  adicionais: [
    'Aplicações extras da marca',
    'Ícones de apoio',
    'Modelos para redes sociais',
    'Avatar de rede social',
    'Banner para redes sociais — R$1.000',
  ],
};

const pacotesPosts = [
  {
    nome: 'Areia',
    preco: 'R$ 250',
    pix: 'R$ 237,50 no pix (5% off)',
    parcelas: 'ou 3x sem juros',
    itens: [
      '4 posts para feed (1 por semana)',
      '4 stories (1 por semana)',
      'Legendas otimizadas + hashtags',
      'Brinde: capa de destaque na 1ª contratação',
    ],
    destaque: false,
  },
  {
    nome: 'Ventania',
    preco: 'R$ 433',
    pix: 'R$ 411,35 no pix',
    parcelas: 'ou 3x sem juros',
    itens: [
      '10 posts para feed (3 por semana)',
      '10 stories (3 por semana)',
      'Legendas otimizadas + hashtags',
      'Brinde: capa de destaque na 1ª contratação',
    ],
    destaque: true,
  },
  {
    nome: 'Caju',
    preco: 'R$ 520',
    pix: 'R$ 494,00 no pix',
    parcelas: 'ou 3x sem juros',
    itens: [
      '12 posts para feed (3 por semana)',
      '12 stories (3 por semana)',
      'Capa para reels',
      'Apoio na idealização dos posts',
      'Brinde: capa de destaque na 1ª contratação',
    ],
    destaque: false,
  },
];

const designs = [
  { titulo: 'Estampas & Produtos', preco: 'a partir de R$ 150', desc: 'Estampas para eventos, brindes ou o que o cliente pedir.' },
  { titulo: 'Embalagens & Rótulos', preco: 'R$ 200', desc: 'Design de embalagem, rótulo e etiquetas.' },
  { titulo: 'Criativos para Anúncios', preco: 'R$ 60 / criativo', desc: 'Facebook Ads, Google Ads — combos com parcelamento.' },
  { titulo: 'Kit Impressos Essencial', preco: 'R$ 200', desc: 'Cartão de visita + folder, flyer ou cardápio.' },
  { titulo: 'Kit PDV', preco: 'R$ 200', desc: 'Banner, fachada simples, adesivagem de vitrine.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.07, ease: 'easeOut' } }),
};

function Home() {
  return (
    <SiteShell>
      {/* ──────────────── HERO ──────────────── */}
      <section className="retro-noise relative overflow-hidden" style={{ backgroundColor: '#E97933' }}>
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-4 grid md:grid-cols-2 gap-8 items-center">
          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] text-xs font-bold uppercase tracking-widest mb-5"
            >
              <Sparkles size={13} /> estúdio de identidade visual
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.0] text-[#1A1A1A]"
            >
              Marcas que{' '}
              <span className="text-white">florescem</span>,<br />
              redes que{' '}
              <span style={{ color: '#2D5F8A' }}>conversam</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 text-lg font-medium text-[#1A1A1A]/80 max-w-lg"
            >
              A Cajuna Studio cria identidades visuais com personalidade e cuida
              dos seus posts pra sua marca aparecer bem todo dia.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/orcamento"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#1A1A1A] bg-[#1A1A1A] text-white font-bold hover:bg-[#333] transition-colors"
              >
                Solicitar orçamento <ArrowRight size={17} />
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#1A1A1A] bg-white text-[#1A1A1A] font-bold hover:bg-[#FFF8F2] transition-colors"
              >
                Ver portfólio
              </Link>
            </motion.div>
          </div>

          {/* Right — mascote principal com speed lines */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="flex justify-center"
          >
            <CajuMascot
              src="/macoteprincipal.svg"
              alt="Cajuna mascot — caju dorminhoco"
              size={340}
              float
              speedLines
            />
          </motion.div>
        </div>

        <WaveDivider fill="#FFF8F2" />
      </section>

      {/* ──────────────── QUEM É A CAJUNA ──────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <motion.div
          className="grid md:grid-cols-5 gap-10 items-start"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
        >
          <div className="md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E97933]">quem é a cajuna</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-[#1A1A1A]">Identidade que não passa despercebida.</h2>
          </div>
          <div className="md:col-span-3 space-y-5 text-lg text-[#1A1A1A]/75">
            <p>
              A Cajuna é um estúdio que nasceu pra deixar as marcas mais bonitas, mais
              humanas e mais consistentes. A gente faz identidade visual do começo ao fim
              — do conceito ao manual — e segue cuidando da sua presença nas redes.
            </p>
            <p>
              Trabalhamos lado a lado com você: nada de templates engessados. Cada projeto
              é construído com escuta, estratégia e um afeto que dá pra sentir.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ──────────────── IDENTIDADE VISUAL ──────────────── */}
      <section className="retro-noise" style={{ backgroundColor: '#2D5F8A' }}>
        <WaveDivider fill="#2D5F8A" flip />
        <div className="mx-auto max-w-6xl px-5 py-16">
          <RetroCard dark className="relative overflow-hidden">
            {/* decorative mascote5 (coroa) */}
            <img
              src="/mascote5.svg"
              alt=""
              aria-hidden
              className="absolute -top-4 -right-4 w-28 h-28 object-contain opacity-90 pointer-events-none"
            />
            <div className="relative grid md:grid-cols-2 gap-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#E97933]">pacote principal</span>
                <h3 className="mt-2 text-4xl md:text-5xl font-black text-white">Identidade Visual</h3>
                <p className="mt-4 text-white/75 text-lg">
                  Valor base fixo com ajustes conforme suas escolhas. O pacote essencial
                  já entrega tudo que sua marca precisa pra existir bonita no mundo.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/orcamento"
                    search={{ servico: 'Identidade Visual' } as never}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#E97933] bg-[#E97933] text-[#1A1A1A] font-bold hover:bg-[#d4692a] transition-colors"
                  >
                    Quero contratar <ArrowRight size={17} />
                  </Link>
                  <Link
                    to="/orcamento"
                    search={{ servico: 'Conversar com uma pessoa' } as never}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white/30 text-white font-bold hover:border-white/60 transition-colors"
                  >
                    <MessageCircle size={17} /> Falar com uma pessoa
                  </Link>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-lg text-white mb-3">No pacote base</h4>
                  <ul className="space-y-2">
                    {identidade.base.map((i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        <Check size={15} className="text-[#E97933] mt-0.5 shrink-0" /> {i}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white mb-3">Adicionais</h4>
                  <ul className="space-y-2">
                    {identidade.adicionais.map((i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                        <Check size={15} className="text-[#E97933] mt-0.5 shrink-0" /> {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </RetroCard>
        </div>
        <WaveDivider fill="#FFF8F2" />
      </section>

      {/* ──────────────── PACOTES MENSAIS ──────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#E97933]">design de posts</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black">Pacotes mensais</h2>
          <p className="mt-4 text-[#1A1A1A]/65 text-lg">
            Três opções pra cuidar do seu feed sem dor de cabeça. Entrega sempre na sexta anterior.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {pacotesPosts.map((p, i) => (
            <motion.div
              key={p.nome}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              whileHover={{ y: -5 }}
            >
              <RetroCard highlighted={p.destaque} className="flex flex-col h-full">
                {p.destaque && (
                  <div className="text-xs font-black uppercase tracking-widest mb-2 text-[#1A1A1A]">⭐ mais escolhido</div>
                )}
                <h3 className="text-2xl font-black">Pacote {p.nome}</h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl font-black">{p.preco}</span>
                  <span className={`text-sm font-medium ${p.destaque ? 'text-[#1A1A1A]/70' : 'text-[#1A1A1A]/50'}`}>/mês</span>
                </div>
                <div className={`text-xs mt-1 font-medium ${p.destaque ? 'text-[#1A1A1A]/70' : 'text-[#1A1A1A]/50'}`}>
                  {p.pix} · {p.parcelas}
                </div>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check size={15} className={`mt-0.5 shrink-0 ${p.destaque ? 'text-[#1A1A1A]' : 'text-[#E97933]'}`} /> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/orcamento"
                  search={{ servico: `Pacote ${p.nome}` } as never}
                  className={`mt-7 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-bold border-2 border-[#1A1A1A] transition-colors ${
                    p.destaque
                      ? 'bg-[#1A1A1A] text-white hover:bg-[#333]'
                      : 'bg-[#E97933] text-[#1A1A1A] hover:bg-[#d4692a]'
                  }`}
                >
                  Contratar {p.nome} <ArrowRight size={15} />
                </Link>
              </RetroCard>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/orcamento"
            search={{ servico: 'Conversar com uma pessoa' } as never}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#2D5F8A] hover:underline"
          >
            <MessageCircle size={15} /> Prefiro falar com uma pessoa antes
          </Link>
        </div>
      </section>

      {/* ──────────────── DESIGNS DIVERSOS ──────────────── */}
      <section className="retro-noise py-16" style={{ backgroundColor: '#E97933' }}>
        <WaveDivider fill="#E97933" flip />
        <div className="mx-auto max-w-6xl px-5">
          <motion.div
            className="max-w-2xl mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/60">designs diversos</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-[#1A1A1A]">Pra tudo o que vier além.</h2>
            <p className="mt-4 text-[#1A1A1A]/75 text-lg">
              Solicitações pontuais? A gente abraça. Esses são pontos de partida — podem virar pacotes personalizados.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {designs.map((d, i) => (
              <motion.div
                key={d.titulo}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <RetroCard className="h-full hover:scale-[1.02] transition-transform">
                  <h4 className="font-black text-lg">{d.titulo}</h4>
                  <div className="text-[#E97933] text-sm font-bold mt-1">{d.preco}</div>
                  <p className="mt-3 text-sm text-[#1A1A1A]/65">{d.desc}</p>
                </RetroCard>
              </motion.div>
            ))}
          </div>
        </div>
        <WaveDivider fill="#1A1A1A" />
      </section>

      {/* ──────────────── CTA FINAL ──────────────── */}
      <section
        className="retro-noise relative overflow-hidden"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <div className="mx-auto max-w-6xl px-5 py-20 text-center relative z-10">
          {/* mascote4 ghosted no fundo */}
          <img
            src="/mascote4.svg"
            alt=""
            aria-hidden
            className="absolute right-10 top-1/2 -translate-y-1/2 w-52 opacity-[0.07] pointer-events-none select-none"
          />
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-4xl md:text-5xl font-black text-white"
          >
            Bora deixar sua marca mais Cajuna?
          </motion.h2>
          <p className="mt-4 text-white/55 text-lg">Conta o que você precisa — respondemos com carinho.</p>
          <Link
            to="/orcamento"
            className="mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-full border-2 border-[#E97933] bg-[#E97933] text-[#1A1A1A] font-black hover:bg-[#d4692a] transition-colors"
          >
            Pedir orçamento agora <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
