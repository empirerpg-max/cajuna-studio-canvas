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

const pacotesIdentidade = [
  {
    nome: 'Maturi',
    preco: 'R$ 200',
    anterior: null as string | null,
    itens: [
      'Briefing simples',
      'Logotipo em versão principal',
      'Versões positiva e negativa (preto e branco)',
      'Arquivos em PNG e JPG',
    ],
  },
  {
    nome: 'Caju',
    preco: 'R$ 350',
    anterior: 'Maturi',
    itens: [
      'Logotipo colorido',
      'Paleta de cores principal (HEX, RGB e CMYK)',
      'Tipografia principal',
      'Arquivos vetoriais (SVG e PDF)',
    ],
  },
  {
    nome: 'Safra',
    preco: 'R$ 600',
    anterior: 'Caju',
    itens: [
      'Briefing completo com apresentação do conceito da marca',
      'Logotipo em três versões (horizontal, vertical e símbolo)',
      'Paleta secundária com nomes e significado das cores',
      'Tipografia secundária com hierarquia (título, subtítulo e parágrafo)',
      'Aplicação sobre fundos coloridos e prova de contraste',
      'Kit básico de redes sociais (foto de perfil e capas de destaques)',
    ],
  },
  {
    nome: 'Cajuna',
    preco: 'A combinar',
    anterior: 'Safra',
    itens: [
      'Manual da marca completo em PDF',
      'Área de proteção e redução mínima',
      'Texturas (arquivos editáveis, PDF, SVG, PNG e JPG)',
      'Elementos de apoio',
      'Templates de posts',
      'Mockups da marca aplicada',
    ],
  },
];

const pacoteRedesSociais = {
  nome: 'Cajueiro',
  itens: [
    'Estratégia de postagens sob medida pro seu momento',
    'Calendário de planejamento mensal',
    'Design de posts, stories e capas de destaque',
    'Edição de vídeos e adaptação do material do feed pro story',
    'Legendas otimizadas + hashtags',
  ],
};

const campanhas = [
  { titulo: 'Criação de e-mails', desc: 'E-mails com finalidade em conversão, engajamento e direcionamento.' },
  { titulo: 'SMS e WhatsApp', desc: 'Criação de campanhas de SMS ou WhatsApp.' },
  { titulo: 'Escolha da ferramenta ideal', desc: 'Pesquisamos a melhor ferramenta para você fazer os envios, apresentamos os custos e apoiamos o uso do início ao fim.' },
  { titulo: 'Análise de resultados', desc: 'Analisamos os resultados, validamos cenários e adaptamos as estratégias com um calendário dedicado e detalhado.' },
];

const sitesEApps = [
  { titulo: 'Criação', desc: 'Construímos um site ou aplicativo para você aplicar a sua identidade visual, conforme a sua necessidade.' },
  { titulo: 'Entrega', desc: 'Deixamos o aplicativo ou site pronto para você utilizar, de acordo com a sua necessidade.' },
  { titulo: 'Acompanhamento', desc: 'Acompanhamos o site ou o app, ajustamos a rota se preciso, criamos melhorias ou adaptamos conforme a necessidade.' },
];

const impressao = [
  { titulo: 'Do cartão ao outdoor', desc: 'Criamos desde cartão de visita até outdoor — o que sua marca precisar aparecer impresso.' },
  { titulo: 'Melhor custo-benefício', desc: 'Procuramos a melhor empresa com custo-benefício para impressão, trazemos o orçamento e encaminhamos para a contratação.' },
  { titulo: 'Do plano à entrega', desc: 'Planejamos, apresentamos e encaminhamos — você só aprova.' },
];

const materiaisImpressos = [
  { titulo: 'Estampas & Produtos', desc: 'Estampas para eventos, brindes ou o que o cliente pedir.' },
  { titulo: 'Embalagens & Rótulos', desc: 'Design de embalagem, rótulo e etiquetas.' },
  { titulo: 'Kit Impressos Essencial', desc: 'Cartão de visita + folder, flyer ou cardápio.' },
  { titulo: 'Kit PDV', desc: 'Banner, fachada simples, adesivagem de vitrine.' },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.07, ease: 'easeOut' } }),
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
              Contratar a Cajuna Studio é estar sempre à frente do seu concorrente
              e ao lado do seu cliente.
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
              Cajuna significa <strong>Caju + Duna</strong>, originado no Rio Grande do
              Norte e inspirado no maior cajueiro do mundo. Para além disso, Cajuna é a{' '}
              <strong>extensão da sua marca</strong> — o crescimento de várias raízes ao
              longo de uma vasta extensão de espaço e tempo.
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
          <motion.div
            className="max-w-2xl mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#E97933]">identidade visual</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-white">Do logo simples ao manual completo.</h2>
            <p className="mt-4 text-white/75 text-lg">
              Quatro pacotes que crescem junto com a sua marca — cada um leva tudo do
              anterior, mais o que sua fase pede.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pacotesIdentidade.map((p, i) => (
              <motion.div
                key={p.nome}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                whileHover={{ y: -5 }}
              >
                <RetroCard className="flex flex-col h-full">
                  <h3 className="text-xl font-black">{p.nome}</h3>
                  <div className="mt-2 text-3xl font-black">{p.preco}</div>
                  <ul className="mt-5 space-y-2 flex-1">
                    {p.anterior && (
                      <li className="text-sm font-bold text-[#E97933]">Tudo do {p.anterior} +</li>
                    )}
                    {p.itens.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check size={15} className="mt-0.5 shrink-0 text-[#E97933]" /> {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/orcamento"
                    search={{ servico: `Identidade Visual — ${p.nome}` } as never}
                    className="mt-7 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold bg-[#E97933] text-[#2D5F8A] hover:bg-[#d4692a] transition-colors"
                  >
                    Solicitar orçamento <ArrowRight size={15} />
                  </Link>
                </RetroCard>
              </motion.div>
            ))}
          </div>

          <div className="mt-8">
            <Link
              to="/orcamento"
              search={{ servico: 'Conversar com uma pessoa' } as never}
              className="inline-flex items-center gap-2 text-sm font-bold text-white/80 hover:underline"
            >
              <MessageCircle size={15} /> Prefiro falar com uma pessoa antes
            </Link>
          </div>
        </div>
        <WaveDivider fill="#FFF8F2" />
      </section>

      {/* ──────────────── GERENCIAMENTO DE REDES SOCIAIS ──────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#E97933]">gerenciamento de redes sociais</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black">Não é só gerenciamento.</h2>
          <p className="mt-4 text-[#1A1A1A]/65 text-lg">
            É uma expansão verdadeira da sua marca para o seu público — estratégia de
            postagens, calendário de planejamento, design de posts, edição de vídeos e
            adaptação do material do feed pro story.
          </p>
        </motion.div>

        <motion.div
          className="max-w-2xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <RetroCard highlighted className="flex flex-col items-center text-center">
            <h3 className="text-2xl font-black">Pacote {pacoteRedesSociais.nome}</h3>
            <p className="mt-1 text-sm font-bold text-[#1A1A1A]/60">Valor a combinar, feito sob medida com você</p>
            <ul className="mt-5 space-y-2.5 text-left">
              {pacoteRedesSociais.itens.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check size={15} className="mt-0.5 shrink-0 text-[#1A1A1A]" /> {item}
                </li>
              ))}
            </ul>
            <Link
              to="/orcamento"
              search={{ servico: `Pacote ${pacoteRedesSociais.nome}` } as never}
              className="mt-7 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold bg-[#1A1A1A] text-[#E97933] hover:bg-[#333] transition-colors"
            >
              Montar meu pacote <ArrowRight size={15} />
            </Link>
          </RetroCard>
        </motion.div>

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

      {/* ──────────────── CAMPANHAS DE MARKETING ──────────────── */}
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
            <span className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/60">campanhas de marketing</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-[#1A1A1A]">E-mail, SMS e WhatsApp na medida certa.</h2>
            <p className="mt-4 text-[#1A1A1A]/75 text-lg">
              Da criação da campanha à análise dos resultados, cuidamos de cada etapa
              pra sua mensagem chegar no momento certo.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {campanhas.map((c, i) => (
              <motion.div
                key={c.titulo}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <RetroCard className="h-full hover:scale-[1.02] transition-transform">
                  <h4 className="font-black text-lg">{c.titulo}</h4>
                  <p className="mt-3 text-sm text-[#1A1A1A]/65">{c.desc}</p>
                </RetroCard>
              </motion.div>
            ))}
          </div>
        </div>
        <WaveDivider fill="#2D5F8A" />
      </section>

      {/* ──────────────── SITES E APLICATIVOS ──────────────── */}
      <section className="retro-noise" style={{ backgroundColor: '#2D5F8A' }}>
        <WaveDivider fill="#2D5F8A" flip />
        <div className="mx-auto max-w-6xl px-5 py-16">
          <motion.div
            className="max-w-2xl mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-[#E97933]">sites e aplicativos</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-black text-white">Do zero ao ar, e depois também.</h2>
            <p className="mt-4 text-white/75 text-lg">
              Construímos, entregamos e continuamos por perto — ajustando a rota
              conforme sua marca cresce.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-5">
            {sitesEApps.map((s, i) => (
              <motion.div
                key={s.titulo}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <RetroCard className="h-full">
                  <h4 className="font-black text-lg">{s.titulo}</h4>
                  <p className="mt-3 text-sm text-[#1A1A1A]/65">{s.desc}</p>
                </RetroCard>
              </motion.div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/orcamento"
              search={{ servico: 'Sites e Aplicativos' } as never}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#E97933] bg-[#E97933] text-[#1A1A1A] font-bold hover:bg-[#d4692a] transition-colors"
            >
              Solicitar orçamento <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <WaveDivider fill="#FFF8F2" />
      </section>

      {/* ──────────────── MATERIAIS PARA IMPRESSÃO ──────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <motion.div
          className="max-w-2xl mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#E97933]">materiais para impressão</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-black">Do cartão de visita ao outdoor.</h2>
          <p className="mt-4 text-[#1A1A1A]/65 text-lg">
            Cuidamos do design e também da ponte com a gráfica: pesquisamos o melhor
            custo-benefício e encaminhamos tudo pra você.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {impressao.map((c, i) => (
            <motion.div
              key={c.titulo}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <RetroCard className="h-full">
                <h4 className="font-black text-lg">{c.titulo}</h4>
                <p className="mt-3 text-sm text-[#1A1A1A]/65">{c.desc}</p>
              </RetroCard>
            </motion.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {materiaisImpressos.map((d, i) => (
            <motion.div
              key={d.titulo}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <RetroCard className="h-full hover:scale-[1.02] transition-transform">
                <h4 className="font-black text-base">{d.titulo}</h4>
                <p className="mt-2 text-sm text-[#1A1A1A]/65">{d.desc}</p>
              </RetroCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ──────────────── CTA FINAL ──────────────── */}
      <section
        className="retro-noise relative overflow-hidden"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        <WaveDivider fill="#1A1A1A" flip />
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
