import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { SiteShell } from "@/components/SiteShell";
import { submitForm } from "@/lib/forms.functions";
import { Loader2, Send } from "lucide-react";

export const Route = createFileRoute("/briefing")({
  head: () => ({
    meta: [
      { title: "Briefing — Cajuna Studio" },
      { name: "description", content: "Conte sobre o seu projeto pra gente entender o melhor caminho." },
      { property: "og:title", content: "Briefing — Cajuna Studio" },
      { property: "og:description", content: "Formulário de briefing para projetos de identidade visual." },
    ],
  }),
  component: Briefing,
});

function Briefing() {
  const submit = useServerFn(submitForm);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fields = {
      nome: String(fd.get("nome") || ""),
      email: String(fd.get("email") || ""),
      empresa: String(fd.get("empresa") || ""),
      tipo: String(fd.get("tipo") || ""),
      sobre: String(fd.get("sobre") || ""),
      referencias: String(fd.get("referencias") || ""),
      prazo: String(fd.get("prazo") || ""),
    };
    if (!fields.nome || !fields.email || !fields.sobre) {
      toast.error("Preencha nome, e-mail e descrição.");
      return;
    }
    setLoading(true);
    try {
      await submit({ data: { kind: "briefing", fields } });
      setDone(true);
      toast.success("Briefing enviado! Em breve respondemos.");
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
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">briefing</span>
        <h1 className="mt-3 text-5xl md:text-6xl font-extrabold leading-tight">
          Conta pra gente <span className="text-secondary">tudo</span>.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Esse é o nosso ponto de partida. As perguntas completas chegam em breve —
          enquanto isso, esse formulário curto já ajuda a entender seu projeto.
        </p>

        <form onSubmit={onSubmit} className="mt-10 grid gap-5 bg-card border border-border rounded-3xl p-6 md:p-8">
          <Field label="Seu nome *" name="nome" required />
          <Field label="E-mail *" name="email" type="email" required />
          <Field label="Empresa / projeto" name="empresa" />
          <Field label="Que tipo de projeto?" name="tipo" placeholder="Ex: identidade visual nova, rebranding, posts mensais..." />
          <Field
            label="Conta sobre o seu negócio e o que você precisa *"
            name="sobre"
            textarea
            placeholder="Quem é seu público, o que vende, o tom da marca..."
            required
          />
          <Field label="Referências (links, marcas que admira)" name="referencias" textarea />
          <Field label="Prazo ideal" name="prazo" placeholder="Ex: começar em 2 semanas" />

          <button
            type="submit"
            disabled={loading || done}
            className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            {done ? "Enviado ✓" : loading ? "Enviando..." : "Enviar briefing"}
          </button>
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
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const cls =
    "w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition";
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">{label}</span>
      {textarea ? (
        <textarea
          name={name}
          rows={4}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          className={cls}
          maxLength={4000}
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          maxLength={500}
          className={cls}
        />
      )}
    </label>
  );
}
