import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { SiteShell } from "@/components/SiteShell";
import { X } from "lucide-react";

import p1 from "@/assets/portfolio/p1.jpg";
import p2 from "@/assets/portfolio/p2.jpg";
import p3 from "@/assets/portfolio/p3.jpg";
import p4 from "@/assets/portfolio/p4.jpg";
import p5 from "@/assets/portfolio/p5.jpg";
import p6 from "@/assets/portfolio/p6.jpg";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfólio — Cajuna Studio" },
      { name: "description", content: "Projetos de identidade visual, packaging, social media e impressos criados pela Cajuna Studio." },
      { property: "og:title", content: "Portfólio — Cajuna Studio" },
      { property: "og:description", content: "Projetos de identidade visual e social media." },
    ],
  }),
  component: Portfolio,
});

type Project = {
  img: string;
  title: string;
  category: string;
  client: string;
  desc: string;
};

const projects: Project[] = [
  { img: p1, title: "Kibring", category: "Identidade Visual", client: "Estúdio gastronômico", desc: "Sistema de papelaria com paleta laranja e navy em alto contraste." },
  { img: p2, title: "Hexa Lab", category: "Brand Mark", client: "Tech startup", desc: "Marca geométrica com símbolo modular pensado pra múltiplas aplicações." },
  { img: p3, title: "Mosaico Social", category: "Social Media", client: "Marca de moda", desc: "Grid de posts e stories estruturado em sistema visual." },
  { img: p4, title: "Vivo Care", category: "Packaging", client: "Cosmético natural", desc: "Embalagem minimalista, blocos de cor e tipografia limpa." },
  { img: p5, title: "Mina Caffè", category: "Impressos", client: "Cafeteria de bairro", desc: "Cardápios, cartões e materiais de mesa em paleta quente." },
  { img: p6, title: "Brand Book Atlas", category: "Manual de Marca", client: "Consultoria", desc: "Guia completo de uso de marca, cores, tipos e aplicações." },
];

function Portfolio() {
  const [open, setOpen] = useState<Project | null>(null);

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-5 pt-12 pb-8">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">portfólio</span>
        <h1 className="mt-3 text-5xl md:text-6xl font-extrabold leading-tight">
          Marcas que <span className="text-secondary">amamos</span> ter feito.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Uma seleção de projetos recentes — identidade visual, social media, packaging e impressos.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p, i) => (
            <motion.button
              key={p.title}
              type="button"
              onClick={() => setOpen(p)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -6 }}
              className="group text-left rounded-2xl overflow-hidden bg-card border border-border hover:border-primary transition-all"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={p.img}
                  alt={p.title}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary">{p.category}</div>
                <h3 className="mt-1 text-xl font-bold">{p.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{p.client}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm p-4 md:p-10 overflow-y-auto"
          onClick={() => setOpen(null)}
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mx-auto max-w-4xl bg-card rounded-3xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/90 hover:bg-background shadow"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            <img src={open.img} alt={open.title} className="w-full max-h-[60vh] object-cover" />
            <div className="p-8">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">{open.category}</div>
              <h2 className="mt-2 text-3xl font-bold">{open.title}</h2>
              <div className="text-sm text-muted-foreground mt-1">{open.client}</div>
              <p className="mt-5 text-foreground/80">{open.desc}</p>
            </div>
          </motion.div>
        </div>
      )}
    </SiteShell>
  );
}
