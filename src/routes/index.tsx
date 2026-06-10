import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, MessageCircle, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { CajuLogo } from "@/components/CajuLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cajuna Studio — Identidade visual & posts" },
      { name: "description", content: "Estúdio de identidade visual e social media. Marcas com afeto, estratégia e estética." },
      { property: "og:title", content: "Cajuna Studio" },
      { property: "og:description", content: "Identidade visual e posts para marcas que querem ser lembradas." },
    ],
  }),
  component: Home,
});

const identidade = {
  base: [
    "Logo principal",
    "Variações do logo",
    "Elementos de apoio",
    "Tipografias da marca",
    "Cartão de visita",
    "Aplicação da marca em 4 mockups",
    "Manual da marca",
    "Registro de anterioridade",
  ],
  adicionais: [
    "Aplicações extras da marca",
    "Ícones de apoio",
    "Modelos para redes sociais",
    "Avatar de rede social",
    "Banner para redes sociais — R$1.000",
  ],
};

const pacotesPosts = [
  {
    nome: "Areia",
    preco: "R$ 250",
    pix: "R$ 237,50 no pix (5% off)",
    parcelas: "ou 3x sem juros",
    itens: [
      "4 posts para feed (1 por semana)",
      "4 stories (1 por semana)",
      "Legendas otimizadas + hashtags",
      "Brinde: capa de destaque na 1ª contratação",
    ],
    destaque: false,
  },
  {
    nome: "Ventania",
    preco: "R$ 433",
    pix: "R$ 411,35 no pix",
    parcelas: "ou 3x sem juros",
    itens: [
      "10 posts para feed (3 por semana)",
      "10 stories (3 por semana)",
      "Legendas otimizadas + hashtags",
      "Brinde: capa de destaque na 1ª contratação",
    ],
    destaque: true,
  },
  {
    nome: "Caju",
    preco: "R$ 520",
    pix: "R$ 494,00 no pix",
    parcelas: "ou 3x sem juros",
    itens: [
      "12 posts para feed (3 por semana)",
      "12 stories (3 por semana)",
      "Capa para reels",
      "Apoio na idealização dos posts",
      "Brinde: capa de destaque na 1ª contratação",
    ],
    destaque: false,
  },
];

const designs = [
  { titulo: "Estampas & Produtos", preco: "a partir de R$ 150", desc: "Estampas para eventos, brindes ou o que o cliente pedir." },
  { titulo: "Embalagens & Rótulos", preco: "R$ 200", desc: "Design de embalagem, rótulo e etiquetas." },
  { titulo: "Criativos para Anúncios", preco: "R$ 60 / criativo", desc: "Facebook Ads, Google Ads — combos com parcelamento." },
  { titulo: "Kit Impressos Essencial", preco: "R$ 200", desc: "Cartão de visita + folder, flyer ou cardápio." },
  { titulo: "Kit PDV", preco: "R$ 200", desc: "Banner, fachada simples, adesivagem de vitrine." },
];

function Home() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />
        <div className="mx-auto max-w-6xl px-5 pt-12 pb-20 md:pt-20 md:pb-28 grid md:grid-cols-2 gap-10 items-center relative">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold tracking-wide uppercase"
            >
              <Sparkles size={14} /> estúdio de identidade visual
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="mt-5 text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.02]"
            >
              Marcas que <span className="text-primary">florescem</span>,<br />
              redes que <span className="text-secondary">conversam</span>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-6 text-lg text-muted-foreground max-w-lg"
            >
              A Cajuna Studio cria identidades visuais com personalidade e cuida
              dos seus posts pra sua marca aparecer bem todo dia.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/orcamento"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition shadow-lg shadow-primary/25"
              >
                Solicitar orçamento <ArrowRight size={18} />
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-foreground/10 font-semibold hover:bg-accent transition"
              >
                Ver portfólio
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center"
          >
            <CajuLogo size={360} />
          </motion.div>
        </div>
      </section>

      {/* Quem é a Cajuna */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid md:grid-cols-5 gap-10 items-start">
          <div className="md:col-span-2">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">quem é a cajuna</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold">Identidade que não passa despercebida.</h2>
          </div>
          <div className="md:col-span-3 space-y-5 text-lg text-foreground/80">
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
        </div>
      </section>

      {/* Identidade Visual */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-3xl bg-secondary text-secondary-foreground p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="relative grid md:grid-cols-2 gap-10">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-primary">pacote principal</span>
              <h3 className="mt-2 text-4xl md:text-5xl font-bold">Identidade Visual</h3>
              <p className="mt-4 text-secondary-foreground/80 text-lg">
                Valor base fixo com ajustes conforme suas escolhas. O pacote essencial
                já entrega tudo que sua marca precisa pra existir bonita no mundo.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/orcamento"
                  search={{ servico: "Identidade Visual" } as never}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
                >
                  Quero contratar <ArrowRight size={18} />
                </Link>
                <Link
                  to="/orcamento"
                  search={{ servico: "Conversar com uma pessoa" } as never}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary-foreground/10 hover:bg-secondary-foreground/20 border border-secondary-foreground/20 font-semibold transition"
                >
                  <MessageCircle size={18} /> Falar com uma pessoa
                </Link>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-lg mb-3">No pacote base</h4>
                <ul className="space-y-2">
                  {identidade.base.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground/90">
                      <Check size={16} className="text-primary mt-0.5 shrink-0" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-3">Adicionais</h4>
                <ul className="space-y-2">
                  {identidade.adicionais.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-secondary-foreground/90">
                      <Check size={16} className="text-primary mt-0.5 shrink-0" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pacotes de Posts */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">design de posts</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Pacotes mensais</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Três opções pra cuidar do seu feed sem dor de cabeça. Entrega sempre na sexta anterior.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {pacotesPosts.map((p) => (
            <motion.div
              key={p.nome}
              whileHover={{ y: -4 }}
              className={`rounded-3xl p-7 border-2 flex flex-col ${
                p.destaque
                  ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20"
                  : "bg-card border-border"
              }`}
            >
              {p.destaque && (
                <div className="text-xs font-bold uppercase tracking-wider mb-2 opacity-90">⭐ mais escolhido</div>
              )}
              <h3 className="text-2xl font-bold">Pacote {p.nome}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold">{p.preco}</span>
                <span className={`text-sm ${p.destaque ? "text-primary-foreground/80" : "text-muted-foreground"}`}>/mês</span>
              </div>
              <div className={`text-xs mt-1 ${p.destaque ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {p.pix} · {p.parcelas}
              </div>
              <ul className="mt-6 space-y-2.5 flex-1">
                {p.itens.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check size={16} className={`mt-0.5 shrink-0 ${p.destaque ? "" : "text-primary"}`} /> {i}
                  </li>
                ))}
              </ul>
              <Link
                to="/orcamento"
                search={{ servico: `Pacote ${p.nome}` } as never}
                className={`mt-7 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-semibold transition ${
                  p.destaque
                    ? "bg-primary-foreground text-primary hover:opacity-90"
                    : "bg-foreground text-background hover:opacity-90"
                }`}
              >
                Contratar {p.nome} <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            to="/orcamento"
            search={{ servico: "Conversar com uma pessoa" } as never}
            className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
          >
            <MessageCircle size={16} /> Prefiro falar com uma pessoa antes
          </Link>
        </div>
      </section>

      {/* Designs Diversos */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-2xl mb-10">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">designs diversos</span>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold">Pra tudo o que vier além.</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Solicitações pontuais? A gente abraça. Esses são pontos de partida — podem virar pacotes personalizados.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {designs.map((d) => (
            <div key={d.titulo} className="rounded-2xl border border-border p-6 bg-card hover:border-primary transition">
              <h4 className="font-bold text-lg">{d.titulo}</h4>
              <div className="text-primary text-sm font-semibold mt-1">{d.preco}</div>
              <p className="mt-3 text-sm text-muted-foreground">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="rounded-3xl bg-foreground text-background p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-40 w-96 rounded-full bg-primary/30 blur-3xl" />
          <h2 className="text-4xl md:text-5xl font-bold relative">Bora deixar sua marca mais Cajuna?</h2>
          <p className="mt-4 text-background/70 text-lg relative">Conta o que você precisa — respondemos com carinho.</p>
          <Link
            to="/orcamento"
            className="mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition relative"
          >
            Pedir orçamento agora <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
