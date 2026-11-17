/**
 * Cajuna Studio — Funil Facebook Lead Ads
 * Script exclusivo da planilha "[Cajuna Studio] Campanhas Facebook Lead Ads".
 *
 * CÓPIA DE REFERÊNCIA — a versão que roda de verdade está no editor do Apps Script
 * da planilha. Ao mudar lá, atualize aqui (e publique uma nova versão da implantação).
 *
 * - A aba do Meta (Página1) é só LIDA, nunca alterada.
 * - O andamento de cada lead fica na aba "Funil", ligado pelo id do lead.
 * - Toda chamada exige o token guardado nas Propriedades do script.
 */

const ABA_LEADS = 'Página1';
const ABA_FUNIL = 'Funil';

const ETAPAS = [
  'Novo',
  'Tentando contato',
  'Em conversa',
  'Reunião agendada',
  'Proposta enviada',
  'Negociação',
  'Ganho',
  'Perdido',
];

// Coluna do Meta (normalizada) → nome do campo no kanban
const CAMPOS_META = {
  id: 'id',
  created_time: 'chegouEm',
  ad_id: 'anuncioId',
  ad_name: 'anuncio',
  adset_id: 'publicoId',
  adset_name: 'publico',
  campaign_id: 'campanhaId',
  campaign_name: 'campanha',
  form_id: 'formularioId',
  form_name: 'formulario',
  is_organic: 'organico',
  platform: 'plataforma',
  o_que_voce_precisa: 'oQuePrecisa',
  em_que_fase_voce_esta: 'faseDoNegocio',
  qual_e_o_seu_negocio: 'negocio',
  full_name: 'nome',
  whatsapp_number: 'whatsapp',
  lead_status: 'statusMeta',
};

// Coluna da aba Funil → nome do campo no kanban
const COLUNAS_FUNIL = [
  ['lead_id', 'id'],
  ['etapa', 'etapa'],
  ['responsavel', 'responsavel'],
  ['proximo_passo', 'proximoPasso'],
  ['data_proximo_passo', 'dataProximoPasso'],
  ['motivo_perda', 'motivoPerda'],
  ['anotacoes', 'anotacoes'],
  ['atualizado_em', 'atualizadoEm'],
  ['atualizado_por', 'atualizadoPor'],
];

// Campos que o site pode alterar
const EDITAVEIS = ['etapa', 'responsavel', 'proximoPasso', 'dataProximoPasso', 'motivoPerda', 'anotacoes'];

/* ───────────── Configuração (rodar UMA vez pelo editor) ───────────── */

function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(ABA_FUNIL);
  if (!aba) aba = ss.insertSheet(ABA_FUNIL);

  const cabecalho = COLUNAS_FUNIL.map(function (c) { return c[0]; });
  aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');
  aba.setFrozenRows(1);
  aba.getRange(1, 1, aba.getMaxRows(), cabecalho.length).setNumberFormat('@');

  const props = PropertiesService.getScriptProperties();
  let token = props.getProperty('API_TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty('API_TOKEN', token);
  }
  Logger.log('Aba "' + ABA_FUNIL + '" pronta.');
  Logger.log('Token da API (guarde em segredo): ' + token);
}

/** Teste rápido pelo editor: mostra quantos leads o script enxerga. */
function testarListagem() {
  const leads = listarLeads();
  Logger.log(leads.length + ' lead(s) encontrados.');
  if (leads.length) Logger.log(JSON.stringify(leads[0], null, 2));
}

/* ───────────── API ───────────── */

function doGet() {
  // Não devolve dados por GET — só confirma que o script está no ar.
  return json({ ok: true, servico: 'funil-facebook-leads' });
}

function doPost(e) {
  try {
    const corpo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const token = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (!token || corpo.token !== token) return json({ ok: false, erro: 'nao_autorizado' });

    switch (corpo.action) {
      case 'listar':
        return json({ ok: true, etapas: ETAPAS, leads: listarLeads() });
      case 'atualizar':
        return json({ ok: true, lead: atualizarLead(corpo.id, corpo.campos || {}, corpo.usuario || '') });
      default:
        return json({ ok: false, erro: 'acao_invalida' });
    }
  } catch (err) {
    return json({ ok: false, erro: String((err && err.message) || err) });
  }
}

/* ───────────── Leitura ───────────── */

function listarLeads() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_LEADS);
  if (!aba) throw new Error('Aba "' + ABA_LEADS + '" não encontrada.');

  const valores = aba.getDataRange().getValues();
  if (valores.length < 2) return [];

  const original = valores[0].map(texto);
  const cabecalho = original.map(normalizar);
  const funil = lerFunil();
  const leads = [];

  for (let i = 1; i < valores.length; i++) {
    const lead = { outras: {} };
    cabecalho.forEach(function (col, j) {
      const campo = CAMPOS_META[col];
      if (campo) lead[campo] = texto(valores[i][j]);
      // Perguntas de outros formulários (colunas que o script não conhece)
      else if (col && texto(valores[i][j])) lead.outras[original[j]] = texto(valores[i][j]);
    });
    if (!lead.id) continue;

    lead.teste = String(lead.nome || '').indexOf('<test lead') === 0;

    const andamento = funil.porId[lead.id] || {};
    COLUNAS_FUNIL.forEach(function (c) {
      if (c[1] !== 'id') lead[c[1]] = andamento[c[1]] || '';
    });
    if (ETAPAS.indexOf(lead.etapa) === -1) lead.etapa = 'Novo';

    leads.push(lead);
  }

  // Mais recentes primeiro
  leads.sort(function (a, b) {
    return (Date.parse(b.chegouEm) || 0) - (Date.parse(a.chegouEm) || 0);
  });
  return leads;
}

function lerFunil() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_FUNIL);
  if (!aba) throw new Error('Aba "' + ABA_FUNIL + '" não existe. Rode a função configurar() uma vez.');

  const valores = aba.getDataRange().getValues();
  const cab = valores[0].map(normalizar);
  const porId = {};
  const linhaPorId = {};

  for (let i = 1; i < valores.length; i++) {
    const reg = {};
    COLUNAS_FUNIL.forEach(function (c) {
      const j = cab.indexOf(c[0]);
      reg[c[1]] = j === -1 ? '' : texto(valores[i][j]);
    });
    if (reg.id) {
      porId[reg.id] = reg;
      linhaPorId[reg.id] = i + 1;
    }
  }
  return { aba: aba, cab: cab, porId: porId, linhaPorId: linhaPorId };
}

function leadExiste(id) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA_LEADS);
  const valores = aba.getDataRange().getValues();
  const j = valores[0].map(normalizar).indexOf('id');
  if (j === -1) return false;
  for (let i = 1; i < valores.length; i++) {
    if (texto(valores[i][j]) === id) return true;
  }
  return false;
}

/* ───────────── Escrita (só na aba Funil) ───────────── */

function atualizarLead(id, campos, usuario) {
  id = String(id || '').trim();
  if (!id) throw new Error('id obrigatório.');
  if (campos.etapa !== undefined && ETAPAS.indexOf(campos.etapa) === -1) {
    throw new Error('Etapa inválida: ' + campos.etapa);
  }

  const trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    if (!leadExiste(id)) throw new Error('Lead não encontrado: ' + id);

    const f = lerFunil();
    const atual = f.porId[id] || { id: id, etapa: 'Novo' };

    EDITAVEIS.forEach(function (campo) {
      if (campos[campo] !== undefined) atual[campo] = String(campos[campo]);
    });
    atual.atualizadoEm = new Date().toISOString();
    atual.atualizadoPor = String(usuario);

    const linha = f.cab.map(function (col) {
      const par = COLUNAS_FUNIL.filter(function (c) { return c[0] === col; })[0];
      return seguro(par ? atual[par[1]] : '');
    });

    if (f.linhaPorId[id]) {
      f.aba.getRange(f.linhaPorId[id], 1, 1, linha.length).setValues([linha]);
    } else {
      f.aba.appendRow(linha);
    }
    return atual;
  } finally {
    trava.releaseLock();
  }
}

/* ───────────── Utilitários ───────────── */

// "o_que_você_precisa?" → "o_que_voce_precisa"
function normalizar(t) {
  return String(t)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function texto(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

// Impede que texto digitado vire fórmula na planilha (ex.: "=IMPORTXML(...)")
function seguro(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
