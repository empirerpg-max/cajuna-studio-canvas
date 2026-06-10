import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SiteShell } from "@/components/SiteShell";
import { submitForm } from "@/lib/forms.functions";
import { Loader2, Send } from "lucide-react";

const searchSchema = z.object({
  servico: z.string().optional(),
});

export const Route = createFileRoute("/orcamento")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Solicite seu orçamento — Cajuna Studio" },
      { name: "description", content: "Peça um orçamento personalizado para identidade visual ou pacote de posts." },
      { property: "og:title", content: "Orçamento — Cajuna Studio" },
      { property: "og:description", content: "Solicite seu orçamento com a Cajuna." },
    ],
  }),
  component: Orcamento,
});

const SERVICOS = [
  "Identidade Visual",
  "Pacote Areia",
  "Pacote Ventania",
  "Pacote Caju",
  "Design de Estampas / Produtos",
  "Embalagens / Rótulos",
  "Criativos para Anúncios",
  "Kit Impressos",
  "Kit PDV",
  "Conversar com uma pessoa",
  "Outro",
];

function Orcamento() {
  const { servico } = Route.useSearch();
  const submit = useServerFn(submitForm);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fields = {
      nome: String(fd.get("nome") || ""),
      email: String(fd.get("email") || ""),
      whatsapp: String(fd.get("whatsapp") || ""),
      servico: String(fd.get("servico") || ""),
      mensagem: String(fd.get("mensagem") || ""),
    };
    if (!fields.nome || !fields.email || !fields.servico) {
      toast.error("Preencha nome, e-mail e serviço de interesse.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(fields.email)) {
      toast.error("E-mail inválido.");
      return;
    }
    const kind = fields.servico === "Conversar com uma pessoa" ? "contratacao" : "orcamento";
    setLoading(true);
    try {
      await submit({ data: { kind, fields } });
      setDone(true);
      toast.success("Recebido! Em breve respondemos com tudo.");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 pt-12 pb-20">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">orçamento</span>
        <h1 className="mt-3 text-5xl md:text-6xl font-extrabold leading-tight">
          Vamos <span className="text-secondary">conversar</span>?
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Conta o que você precisa e respondemos rapidinho com um orçamento personalizado.
        </p>

        <form onSubmit={onSubmit} className="mt-10 grid gap-5 bg-card border border-border rounded-3xl p-6 md:p-8">
          <Field label="Seu nome *" name="nome" required />
          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="E-mail *" name="email" type="email" required />
            <Field label="WhatsApp" name="whatsapp" placeholder="(00) 00000-0000" />
          </div>
          <label className="block">
            <span className="block text-sm font-semibold mb-1.5">Serviço de interesse *</span>
            <select
              name="servico"
              required
              defaultValue={servico ?? ""}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition"
            >
              <option value="" disabled>Escolha uma opção</option>
              {SERVICOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <Field
            label="Mensagem"
            name="mensagem"
            textarea
            placeholder="Conta um pouquinho sobre o seu projeto..."
          />

          <button
            type="submit"
            disabled={loading || done}
            className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {done ? "Enviado ✓" : loading ? "Enviando..." : "Enviar pedido"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Os dados são enviados direto pra nossa planilha — sem spam, prometido.
          </p>
        </form>
      </section>
    </SiteShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  textarea = false,
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const cls =
    "w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition";
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">{label}</span>
      {textarea ? (
        <textarea name={name} rows={5} placeholder={placeholder} required={required} className={cls} maxLength={4000} />
      ) : (
        <input name={name} type={type} placeholder={placeholder} required={required} className={cls} maxLength={500} />
      )}
    </label>
  );
}
