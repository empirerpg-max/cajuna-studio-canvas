// Gera os ícones do app /castanha (PWA) a partir do mascote da Cajuna.
// Uso: node scripts/gerar-icones-castanha.mjs  (precisa do Playwright com Chromium)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const svg = readFileSync(new URL('../public/macoteprincipal.svg', import.meta.url), 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const FUNDO = '#FFF8F2';

const ICONES = [
  { arquivo: 'icon-192.png', tamanho: 192, escala: 0.78 },
  { arquivo: 'icon-512.png', tamanho: 512, escala: 0.78 },
  // Maskable: o sistema pode cortar até 20% de cada borda, então o mascote ocupa 60%.
  { arquivo: 'icon-maskable-512.png', tamanho: 512, escala: 0.6 },
  { arquivo: 'apple-touch-icon.png', tamanho: 180, escala: 0.72 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { arquivo, tamanho, escala } of ICONES) {
  await page.setViewportSize({ width: tamanho, height: tamanho });
  await page.setContent(
    `<html><body style="margin:0;width:${tamanho}px;height:${tamanho}px;background:${FUNDO};display:flex;align-items:center;justify-content:center">
       <img src="${dataUrl}" style="width:${Math.round(tamanho * escala)}px;height:${Math.round(tamanho * escala)}px;object-fit:contain">
     </body></html>`,
  );
  await page.waitForLoadState('load');
  await page.screenshot({ path: new URL(`../public/castanha-icons/${arquivo}`, import.meta.url).pathname });
  console.log('gerado', arquivo);
}
await browser.close();
