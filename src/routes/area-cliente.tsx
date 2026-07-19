import { createFileRoute } from '@tanstack/react-router';
import { SiteShell } from '@/components/SiteShell';

export const Route = createFileRoute('/area-cliente')({
  head: () => ({
    meta: [
      { title: 'Área do Cliente — Cajuna Studio' },
      { name: 'description', content: 'Acesso exclusivo para clientes Cajuna Studio.' },
    ],
  }),
  component: AreaCliente,
});

function AreaCliente() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A]">Área do Cliente</h1>
        <p className="mt-4 text-[#1A1A1A]/70 text-lg">
          Em breve: acesso exclusivo com acompanhamento de projetos, briefings e arquivos.
        </p>
      </section>
    </SiteShell>
  );
}
