import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { useServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { SiteShell } from '@/components/SiteShell';
import { WaveDivider } from '@/components/WaveDivider';
import { RetroCard } from '@/components/RetroCard';
import { submitForm } from '@/lib/forms.functions';
import { Loader2, Send } from 'lucide-react';

const searchSchema = z.object({ servico: z.string().optional() });

export const Route = createFileRoute('/orcamento')({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: 'Solicite seu orçamento — Cajuna Studio' },
      { name: 'description', content: 'Peça um orçamento personalizado para identidade visual ou pacote de posts.' },
      { property: 'og:title', content: 'Orçamento — Cajuna Studio' },
      { property: 'og:description', content: 'Solicite seu orçamento com a Cajuna.' },
    ],
  }),
  component: Orcamento,
});

const SERVICOS = [
  'Identidade Visual',
  'Pacote Areia',
  'Pacote Ventania',
  'Pacote Caju',
  'Campanhas de Marketing',
  'Sites e Aplicativos',
  'Design de Estampas / Produtos',
  'Embalagens / Rótulos',
  'Kit Impressos',
  'Kit PDV',
  'Conversar com uma pessoa',
  'Outro',
];

function Orcamento() {
  const { servico } = Route.useSearch();
  const submit = useServerFn(submitForm);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const lgpdAceito = fd.get('lgpd') === 'on';
    const fields = {
      nome: String(fd.get('nome') || ''),
      email: String(fd.get('email') || ''),
      whatsapp: String(fd.get('whatsapp') || ''),
      servico: String(fd.get('servico') || ''),
      lgpd: lgpdAceito ? 'Sim' : 'Não',
      mensagem: String(fd.get('mensagem') || ''),
    };
    if (!fields.nome || !fields.email || !fields.servico) {
      toast.error('Preencha nome, e-mail e serviço de interesse.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(fields.email)) {
      toast.error('E-mail inválido.');
      return;
    }
    if (!lgpdAceito) {
      toast.error('Você precisa aceitar o tratamento dos seus dados para continuar.');
      return;
    }
    const kind = fields.servico === 'Conversar com uma pessoa' ? 'contratacao' : 'orcamento';
    setLoading(true);
    try {
      await submit({ data: { kind, fields } });
      setDone(true);
      toast.success('Recebido! Em breve respondemos com tudo.');
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar.');
    } finally {
      setLoading(false);
    }
  }

  const fieldCls = 'w-full px-4 py-3 rounded-xl bg-[#FFF8F2] border-2 border-[#1A1A1A] focus:border-[#E97933] focus:outline-none focus:ring-2 focus:ring-[#E97933]/20 transition font-medium';

  return (
    <SiteShell>
      {/* Header */}
      <section className="retro-noise" style={{ backgroundColor: '#2D5F8A' }}>
        <div className="mx-auto max-w-3xl px-5 pt-14 pb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E97933]">orçamento</span>
          <h1 className="mt-3 text-5xl md:text-6xl font-black text-white leading-tight">
            Vamos <span style={{ color: '#E97933' }}>conversar</span>?
          </h1>
          <p className="mt-4 text-lg text-white/70">
            Conta o que você precisa e respondemos rapidinho com um orçamento personalizado.
          </p>
        </div>
        <WaveDivider fill="#FFF8F2" />
      </section>

      {/* Form */}
      <section className="mx-auto max-w-3xl px-5 py-12 pb-24">
        <RetroCard className="relative">
          {/* mascote3 (nuvem + lápis) no canto */}
          <img
            src="/mascote3.svg"
            alt=""
            aria-hidden
            className="absolute -bottom-4 -right-4 w-24 h-24 object-contain opacity-80 pointer-events-none"
          />
          <form onSubmit={onSubmit} className="grid gap-5">
            <Field label="Seu nome *" name="nome" required cls={fieldCls} />
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="E-mail *" name="email" type="email" required cls={fieldCls} />
              <Field label="WhatsApp" name="whatsapp" placeholder="(00) 00000-0000" cls={fieldCls} />
            </div>
            <label className="block">
              <span className="block text-sm font-black mb-1.5">Serviço de interesse *</span>
              <select
                name="servico"
                required
                defaultValue={servico ?? ''}
                className={fieldCls}
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
              cls={fieldCls}
            />
            <label className="flex items-start gap-3 text-xs font-medium text-[#1A1A1A]/70">
              <input
                type="checkbox"
                name="lgpd"
                required
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#E97933]"
              />
              <span>
                Autorizo a Cajuna Studio a coletar e tratar meus dados pessoais informados
                neste formulário, exclusivamente para fins de contato e elaboração de
                orçamento, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei
                nº 13.709/2018).
              </span>
            </label>
            <button
              type="submit"
              disabled={loading || done}
              className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border-2 border-[#1A1A1A] bg-[#E97933] text-[#1A1A1A] font-black hover:bg-[#d4692a] transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              {done ? 'Enviado ✓' : loading ? 'Enviando...' : 'Enviar pedido'}
            </button>
            <p className="text-xs text-[#1A1A1A]/50 text-center font-medium">
              Entraremos em contato o quanto antes 🙂
            </p>
          </form>
        </RetroCard>
      </section>
    </SiteShell>
  );
}

function Field({
  label, name, type = 'text', textarea = false, placeholder, required = false, cls,
}: {
  label: string; name: string; type?: string; textarea?: boolean;
  placeholder?: string; required?: boolean; cls: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-black mb-1.5">{label}</span>
      {textarea ? (
        <textarea name={name} rows={5} placeholder={placeholder} required={required} className={cls} maxLength={4000} />
      ) : (
        <input name={name} type={type} placeholder={placeholder} required={required} className={cls} maxLength={500} />
      )}
    </label>
  );
}
