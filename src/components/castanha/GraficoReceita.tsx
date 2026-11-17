import { useEffect, useRef } from 'react';
import { nomeMes } from '@/lib/castanha/util';

const W = 760;
const H = 260;
const L = 52;
const R = 8;
const T = 14;
const B = 34;

function passoRedondo(max: number) {
  const bruto = max / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const n = bruto / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

function rotuloEixo(centavos: number) {
  const reais = centavos / 100;
  if (reais >= 1000) return `${(reais / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return reais.toLocaleString('pt-BR');
}

/** Barras empilhadas (mensalidade × valor único) dos 12 meses; clicar escolhe o mês. */
export function GraficoReceita({
  serie,
  mesSelecionado,
  onEscolher,
}: {
  serie: { mes: string; recorrente: number; unico: number }[];
  mesSelecionado: string;
  onEscolher: (mes: string) => void;
}) {
  const max = Math.max(100000, ...serie.map((d) => d.recorrente + d.unico));
  const passo = passoRedondo(max);
  const topo = Math.ceil(max / passo) * passo;
  const y = (v: number) => T + (H - T - B) * (1 - v / topo);
  const bw = (W - L - R) / serie.length;
  const caixa = useRef<HTMLDivElement>(null);
  // Em telas estreitas o gráfico rola; abre centralizado no mês escolhido (que fica no meio da série).
  useEffect(() => {
    const el = caixa.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [mesSelecionado]);
  const linhas: number[] = [];
  for (let v = 0; v <= topo; v += passo) linhas.push(v);

  return (
    <div ref={caixa} className="-mx-1 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full min-w-[560px]" role="img" aria-label="Receita por mês">
        {linhas.map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#1A1A1A" strokeOpacity={v === 0 ? 0.6 : 0.08} strokeWidth={v === 0 ? 2 : 1} />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#1A1A1A" fillOpacity={0.45}>
              {rotuloEixo(v)}
            </text>
          </g>
        ))}
        {serie.map((d, i) => {
          const x = L + i * bw;
          const w = Math.min(38, bw * 0.62);
          const bx = x + (bw - w) / 2;
          const sel = d.mes === mesSelecionado;
          const yRec = y(d.recorrente);
          const yTot = y(d.recorrente + d.unico);
          return (
            <g
              key={d.mes}
              onClick={() => onEscolher(d.mes)}
              className="cursor-pointer"
              role="button"
              aria-label={`Ver ${nomeMes(d.mes)}`}
            >
              <rect x={x} y={T} width={bw} height={H - T - B} fill={sel ? '#E97933' : 'transparent'} fillOpacity={sel ? 0.1 : 0} rx={8} />
              {d.recorrente > 0 && (
                <rect x={bx} y={yRec} width={w} height={y(0) - yRec} fill="#E97933" stroke="#1A1A1A" strokeWidth={2} rx={4} />
              )}
              {d.unico > 0 && (
                <rect x={bx} y={yTot} width={w} height={yRec - yTot} fill="#2D5F8A" stroke="#1A1A1A" strokeWidth={2} rx={4} />
              )}
              {sel ? (
                <>
                  <rect x={x + bw / 2 - 26} y={H - B + 8} width={52} height={20} rx={10} fill="#1A1A1A" />
                  <text x={x + bw / 2} y={H - B + 22} textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">
                    {nomeMes(d.mes)}
                  </text>
                </>
              ) : (
                <text x={x + bw / 2} y={H - B + 22} textAnchor="middle" fontSize="11" fill="#1A1A1A" fillOpacity={0.55}>
                  {nomeMes(d.mes)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
