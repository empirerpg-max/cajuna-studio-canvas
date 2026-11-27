import { describe, expect, test } from 'bun:test';
import { monthGrid, type CalendarItem } from '../src/components/ContentCalendar';

const row = (mes: string, semana: string, dia: string, titulo: string): CalendarItem => ({
  Mês: mes,
  'Dia da semana': semana,
  Dia: dia,
  'Conteúdo?': 'Sim',
  Título: titulo,
  Ano: '2026',
});

function posicao(grid: ReturnType<typeof monthGrid>, titulo: string) {
  for (const [wi, week] of grid.weeks.entries()) {
    for (const [di, cell] of week.entries()) {
      if (cell.items.some((it) => it['Título'] === titulo)) return { semana: wi, coluna: di, dia: cell.day };
    }
  }
  return null;
}

describe('monthGrid', () => {
  test('posiciona pela data, mesmo com "segunda" sem "-feira"', () => {
    const grid = monthGrid([
      row('novembro', 'sexta-feira', '27', 'A'),
      row('novembro', 'domingo', '29', 'B'),
      row('novembro', 'segunda', '30', 'C'),
    ]);
    expect(posicao(grid, 'A')).toEqual({ semana: 4, coluna: 4, dia: 27 });
    expect(posicao(grid, 'B')).toEqual({ semana: 4, coluna: 6, dia: 29 });
    expect(posicao(grid, 'C')).toEqual({ semana: 5, coluna: 0, dia: 30 });
    expect(grid.semDia).toHaveLength(0);
  });

  test('ignora dia da semana errado ou vazio e usa a data', () => {
    const grid = monthGrid([row('Novembro ', '', '30', 'X'), row('11', 'quarta', '2', 'Y')]);
    expect(posicao(grid, 'X')?.coluna).toBe(0); // 30/11/2026 é segunda
    expect(posicao(grid, 'Y')?.coluna).toBe(0); // 02/11/2026 é segunda
  });

  test('linha sem dia vai para "sem dia definido"', () => {
    const grid = monthGrid([row('novembro', '', '', 'Z')]);
    expect(grid.semDia.map((it) => it['Título'])).toEqual(['Z']);
  });
});
