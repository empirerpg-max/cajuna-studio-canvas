// Planilha falsa em memória com só o que o Apps Script do Castanha usa.
import { readFileSync } from 'node:fs';

type Cell = string | number | boolean | Date;

class FakeRange {
  constructor(private sheet: FakeSheet, private r: number, private c: number, private nr: number, private nc: number) {}
  getValues(): Cell[][] {
    const out: Cell[][] = [];
    for (let i = 0; i < this.nr; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < this.nc; j++) row.push(this.sheet.data[this.r - 1 + i]?.[this.c - 1 + j] ?? '');
      out.push(row);
    }
    return out;
  }
  setValues(vals: Cell[][]) {
    vals.forEach((row, i) => {
      const linha = (this.sheet.data[this.r - 1 + i] ??= []);
      row.forEach((v, j) => (linha[this.c - 1 + j] = v));
    });
    return this;
  }
  setNumberFormat() { return this; }
  setFontWeight() { return this; }
}

class FakeSheet {
  data: Cell[][] = [];
  constructor(public name: string) {}
  getDataRange() {
    const nr = Math.max(1, this.data.length);
    const nc = Math.max(1, ...this.data.map((r) => r.length));
    return new FakeRange(this, 1, 1, nr, nc);
  }
  getRange(a: number | string, b = 1, c = 1, d = 1) {
    if (typeof a === 'string') return new FakeRange(this, 1, 1, 0, 0);
    return new FakeRange(this, a, b, c, d);
  }
  appendRow(row: Cell[]) { this.data.push([...row]); return this; }
  getLastRow() { return this.data.length; }
  getMaxRows() { return Math.max(1000, this.data.length); }
  setFrozenRows() { return this; }
}

export function criarAmbiente(token = 'tok') {
  const abas = new Map<string, FakeSheet>();
  const ss = {
    getSheetByName: (n: string) => abas.get(n) ?? null,
    insertSheet: (n: string) => { const s = new FakeSheet(n); abas.set(n, s); return s; },
  };
  let uuid = 0;
  const env = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => (k === 'API_TOKEN' ? token : null), setProperty() {} }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { getUuid: () => `${String(++uuid).padStart(8, '0')}-0000-0000-0000-000000000000` },
    ContentService: { createTextOutput: (s: string) => ({ setMimeType: () => ({ texto: s }) }), MimeType: { JSON: 'json' } },
    Logger: { log() {} },
  };
  const codigo = readFileSync(new URL('../../../docs/apps-script/facebook-leads.gs', import.meta.url), 'utf8');
  const fn = new Function(...Object.keys(env), `${codigo}\nreturn { doPost, configurar };`);
  const api = fn(...Object.values(env)) as { doPost: (e: unknown) => { texto: string }; configurar: () => void };

  const meta = ss.insertSheet('Página1');
  meta.data.push(['id', 'created_time', 'full_name', 'whatsapp_number', 'o_que_você_precisa?']);
  meta.data.push(['l:1', '2026-11-17T12:00:00-05:00', 'Mirtes Melo', '+5568999852899', 'Identidade visual']);
  api.configurar();

  function chamar(corpo: Record<string, unknown>) {
    const r = api.doPost({ postData: { contents: JSON.stringify({ token, usuario: 'Ewerton', ...corpo }) } });
    return JSON.parse(r.texto);
  }
  return { chamar, aba: (n: string) => abas.get(n)!, doPost: api.doPost };
}
