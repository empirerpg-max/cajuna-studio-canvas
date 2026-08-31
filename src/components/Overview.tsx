import { useMemo } from 'react';
import { parseCurrencyBRL } from '@/lib/masks';
import type { Deal, FunilConfig } from '@/lib/crm-types';

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function Overview({ deals, funis }: { deals: Deal[]; funis: FunilConfig[] }) {
  const stats = useMemo(() => {
    const ativos = deals.filter((d) => (d.coluna || '').toLowerCase() !== 'perdido');
    const totalGeral = ativos.reduce((s, d) => s + parseCurrencyBRL(d.valor), 0);

    const porFunil = funis.map((f) => {
      const items = ativos.filter((d) => (d.funil || 'Leads') === f.key);
      const total = items.reduce((s, d) => s + parseCurrencyBRL(d.valor), 0);
      return { funil: f.key, count: items.length, total };
    });

    const porServicoMap = new Map<string, { count: number; total: number }>();
    ativos.forEach((d) => {
      const key = d.servico?.trim() || 'Sem serviço definido';
      const cur = porServicoMap.get(key) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += parseCurrencyBRL(d.valor);
      porServicoMap.set(key, cur);
    });
    const porServico = Array.from(porServicoMap.entries())
      .map(([servico, v]) => ({ servico, ...v }))
      .sort((a, b) => b.total - a.total);

    return { totalGeral, porFunil, porServico };
  }, [deals, funis]);

  return (
    <div className="px-5 py-8">
      <div className="mx-auto max-w-[1100px] space-y-8">
        <div>
          <h2 className="text-2xl font-black text-[#1A1A1A]">Visão Geral</h2>
          <p className="text-sm text-[#1A1A1A]/50 font-medium">
            Resumo financeiro de todos os funis (exclui cartões marcados como "Perdido").
          </p>
        </div>

        <div className="rounded-3xl border-2 border-[#1A1A1A] bg-white p-6">
          <p className="text-xs font-black uppercase tracking-widest text-[#E97933]">total geral ativo</p>
          <p className="mt-1 text-4xl font-black text-[#1A1A1A]">{fmtBRL(stats.totalGeral)}</p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-[#1A1A1A]/50">Por funil</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stats.porFunil.map((f) => (
              <div key={f.funil} className="rounded-2xl border-2 border-[#1A1A1A]/10 bg-[#F0EAE3] p-4">
                <p className="text-xs font-black uppercase text-[#1A1A1A]/50">{f.funil}</p>
                <p className="mt-1 text-xl font-black text-[#1A1A1A]">{fmtBRL(f.total)}</p>
                <p className="text-xs text-[#1A1A1A]/40 font-medium">{f.count} cartão{f.count === 1 ? '' : 'ões'}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-[#1A1A1A]/50">Por pacote / serviço</h3>
          <div className="overflow-x-auto rounded-2xl border-2 border-[#1A1A1A]">
            <table className="w-full text-sm">
              <thead className="bg-[#1A1A1A] text-white text-xs uppercase font-black">
                <tr>
                  <th className="px-4 py-3 text-left">Serviço</th>
                  <th className="px-4 py-3 text-right">Qtd.</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.porServico.map((s, i) => (
                  <tr key={s.servico} className={i % 2 ? 'bg-[#F0EAE3]/50' : 'bg-white'}>
                    <td className="px-4 py-3 font-bold text-[#1A1A1A]">{s.servico}</td>
                    <td className="px-4 py-3 text-right text-[#1A1A1A]/60">{s.count}</td>
                    <td className="px-4 py-3 text-right font-black text-[#1A1A1A]">{fmtBRL(s.total)}</td>
                  </tr>
                ))}
                {stats.porServico.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[#1A1A1A]/30 font-medium">
                      Nenhum dado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
