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

/* ───────────── Clientes, contratos, movimentos e config ───────────── */

const ABA_CLIENTES = 'Clientes';
const ABA_CONTRATOS = 'Contratos';
const ABA_MOVIMENTOS = 'Movimentos';
const ABA_CONFIG = 'Config';

const COLUNAS_CLIENTES = [
  ['cliente_id', 'clienteId'],
  ['nome', 'nome'],
  ['whatsapp', 'whatsapp'],
  ['negocio', 'negocio'],
  ['origem', 'origem'],
  ['card_id', 'cardId'],
  ['funil', 'funil'],
  ['criado_em', 'criadoEm'],
  ['criado_por', 'criadoPor'],
  ['obs', 'obs'],
];

// Valores em centavos; meses em AAAA-MM.
const COLUNAS_CONTRATOS = [
  ['contrato_id', 'contratoId'],
  ['cliente_id', 'clienteId'],
  ['servico', 'servico'],
  ['valor_mensal', 'valorMensal'],
  ['meses', 'meses'],
  ['inicio', 'inicio'],
  ['valor_unico', 'valorUnico'],
  ['mes_valor_unico', 'mesValorUnico'],
  ['encerrado_em', 'encerradoEm'],
  ['criado_em', 'criadoEm'],
  ['criado_por', 'criadoPor'],
  ['obs', 'obs'],
];

const COLUNAS_MOVIMENTOS = [
  ['movimento_id', 'movimentoId'],
  ['card_id', 'cardId'],
  ['funil', 'funil'],
  ['de_etapa', 'deEtapa'],
  ['para_etapa', 'paraEtapa'],
  ['quando', 'quando'],
  ['por', 'por'],
  ['motivo', 'motivo'],
  ['valor', 'valor'],
];

const COLUNAS_CONFIG = [
  ['chave', 'chave'],
  ['valor', 'conteudo'],
];

const CAMPOS_NUMERICOS = ['valorMensal', 'meses', 'valorUnico', 'valor'];
const CHAVES_CONFIG = ['mensagem_whatsapp', 'mensagem_whatsapp_clientes'];

/* ───────────── Configuração (rodar UMA vez pelo editor) ───────────── */

function configurar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(ABA_FUNIL);
  if (!aba) aba = ss.insertSheet(ABA_FUNIL);

  const cabecalho = COLUNAS_FUNIL.map(function (c) { return c[0]; });
  aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');
  aba.setFrozenRows(1);
  // Coluna inteira como texto (inclusive linhas futuras), para a planilha não converter datas.
  aba.getRange('A:I').setNumberFormat('@');

  garantirAba(ABA_CLIENTES, COLUNAS_CLIENTES);
  garantirAba(ABA_CONTRATOS, COLUNAS_CONTRATOS);
  garantirAba(ABA_MOVIMENTOS, COLUNAS_MOVIMENTOS);
  garantirAba(ABA_CONFIG, COLUNAS_CONFIG);

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

    const usuario = String(corpo.usuario || '');
    switch (corpo.action) {
      case 'dados':
        return json({
          ok: true,
          clientes: lerTabela(ABA_CLIENTES, COLUNAS_CLIENTES).registros,
          contratos: lerTabela(ABA_CONTRATOS, COLUNAS_CONTRATOS).registros,
          movimentos: lerTabela(ABA_MOVIMENTOS, COLUNAS_MOVIMENTOS).registros,
        });
      case 'registrarGanho':
        return json(comTrava(function () { return registrarGanho(corpo, usuario); }));
      case 'salvarCliente':
        return json(comTrava(function () { return { ok: true, cliente: salvarCliente(corpo.cliente || {}, usuario) }; }));
      case 'salvarContrato':
        return json(comTrava(function () { return { ok: true, contrato: salvarContrato(corpo.contrato || {}, usuario) }; }));
      case 'cancelarContrato':
        return json(comTrava(function () { return { ok: true, contrato: cancelarContrato(corpo.contratoId) }; }));
      case 'mudarValorContrato':
        return json(comTrava(function () { return mudarValorContrato(corpo, usuario); }));
      case 'registrarMovimento':
        return json(comTrava(function () { return { ok: true, movimento: registrarMovimento(corpo.movimento || {}, usuario) }; }));
      case 'config':
        return json({ ok: true, config: lerConfig() });
      case 'salvarConfig':
        return json(comTrava(function () { return salvarConfig(corpo.chave, corpo.valor); }));
      case 'listar':
        return json({ ok: true, etapas: ETAPAS, leads: listarLeads() });
      case 'atualizar':
        return json({ ok: true, lead: atualizarLead(corpo.id, corpo.campos || {}, usuario) });
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
    const etapaAntes = ETAPAS.indexOf(atual.etapa) === -1 ? 'Novo' : atual.etapa;

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
      f.aba.getRange(f.aba.getLastRow(), 1, 1, linha.length).setNumberFormat('@');
    }
    if (campos.etapa !== undefined && campos.etapa !== etapaAntes) {
      registrarMovimento({
        cardId: id,
        funil: 'Facebook Lead Ads',
        deEtapa: etapaAntes,
        paraEtapa: campos.etapa,
        motivo: campos.etapa === 'Perdido' ? atual.motivoPerda || '' : '',
        valor: 0,
      }, usuario);
    }
    return atual;
  } finally {
    trava.releaseLock();
  }
}

/* ───────────── Tabelas genéricas (Clientes, Contratos, Movimentos, Config) ───────────── */

function garantirAba(nome, colunas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aba = ss.getSheetByName(nome);
  if (!aba) aba = ss.insertSheet(nome);
  aba.getRange('A:Z').setNumberFormat('@');
  const cabecalho = colunas.map(function (c) { return c[0]; });
  aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]).setFontWeight('bold');
  aba.setFrozenRows(1);
  return aba;
}

function lerTabela(nome, colunas) {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nome);
  if (!aba) throw new Error('Aba "' + nome + '" não existe. Rode a função configurar() uma vez.');
  const valores = aba.getDataRange().getValues();
  const cab = valores[0].map(normalizar);
  const registros = [];
  const linhaPorId = {};
  const idCampo = colunas[0][1];
  for (let i = 1; i < valores.length; i++) {
    const reg = {};
    colunas.forEach(function (c) {
      const j = cab.indexOf(c[0]);
      const v = j === -1 ? '' : texto(valores[i][j]);
      reg[c[1]] = CAMPOS_NUMERICOS.indexOf(c[1]) === -1 ? v : Number(v) || 0;
    });
    if (!reg[idCampo]) continue;
    linhaPorId[reg[idCampo]] = i + 1;
    registros.push(reg);
  }
  return { aba: aba, cab: cab, registros: registros, linhaPorId: linhaPorId };
}

function gravarRegistro(nome, colunas, reg) {
  const t = lerTabela(nome, colunas);
  const linha = t.cab.map(function (col) {
    const par = colunas.filter(function (c) { return c[0] === col; })[0];
    return seguro(par ? reg[par[1]] : '');
  });
  const n = t.linhaPorId[reg[colunas[0][1]]];
  if (n) {
    t.aba.getRange(n, 1, 1, linha.length).setValues([linha]);
  } else {
    t.aba.appendRow(linha);
    t.aba.getRange(t.aba.getLastRow(), 1, 1, linha.length).setNumberFormat('@');
  }
  return reg;
}

function novoId(prefixo) {
  return prefixo + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function comTrava(fn) {
  const trava = LockService.getScriptLock();
  trava.waitLock(10000);
  try {
    return fn();
  } finally {
    trava.releaseLock();
  }
}

function agora() {
  return new Date().toISOString();
}

function mesValido(m) {
  return /^\d{4}-\d{2}$/.test(String(m || ''));
}

function somarMeses(mes, n) {
  const p = mes.split('-');
  const i = Number(p[0]) * 12 + Number(p[1]) - 1 + n;
  const a = Math.floor(i / 12);
  const m = (i % 12) + 1;
  return a + '-' + (m < 10 ? '0' + m : m);
}

function diffMeses(a, b) {
  const pa = a.split('-');
  const pb = b.split('-');
  return (Number(pb[0]) * 12 + Number(pb[1])) - (Number(pa[0]) * 12 + Number(pa[1]));
}

function centavos(v) {
  const n = Math.round(Number(v) || 0);
  return n > 0 ? n : 0;
}

function salvarCliente(c, usuario) {
  if (!String(c.nome || '').trim()) throw new Error('Informe o nome do cliente.');
  const t = lerTabela(ABA_CLIENTES, COLUNAS_CLIENTES);
  const existente = c.clienteId ? t.registros.filter(function (r) { return r.clienteId === c.clienteId; })[0] : null;
  if (c.clienteId && !existente) throw new Error('Cliente não encontrado.');
  const reg = existente || {
    clienteId: novoId('cli'),
    origem: ['Facebook Lead Ads', 'Leads', 'Manual'].indexOf(c.origem) === -1 ? 'Manual' : c.origem,
    cardId: String(c.cardId || ''),
    funil: String(c.funil || ''),
    criadoEm: agora(),
    criadoPor: usuario,
  };
  ['nome', 'whatsapp', 'negocio', 'obs'].forEach(function (k) {
    if (c[k] !== undefined) reg[k] = String(c[k]).trim();
  });
  return gravarRegistro(ABA_CLIENTES, COLUNAS_CLIENTES, reg);
}

function validarContrato(c) {
  if (!String(c.servico || '').trim()) throw new Error('Informe o serviço.');
  const temRec = c.valorMensal > 0;
  const temUni = c.valorUnico > 0;
  if (!temRec && !temUni) throw new Error('Informe um valor mensal ou um valor único.');
  if (temRec && (!(c.meses >= 1 && c.meses <= 60) || !mesValido(c.inicio))) throw new Error('Confira meses e primeiro mês.');
  if (temUni && !mesValido(c.mesValorUnico)) throw new Error('Escolha o mês do valor único.');
}

function salvarContrato(c, usuario) {
  const clientes = lerTabela(ABA_CLIENTES, COLUNAS_CLIENTES).registros;
  if (!clientes.some(function (r) { return r.clienteId === c.clienteId; })) throw new Error('Cliente não encontrado.');
  const t = lerTabela(ABA_CONTRATOS, COLUNAS_CONTRATOS);
  const existente = c.contratoId ? t.registros.filter(function (r) { return r.contratoId === c.contratoId; })[0] : null;
  if (c.contratoId && !existente) throw new Error('Contrato não encontrado.');
  const reg = existente || { contratoId: novoId('ctr'), clienteId: c.clienteId, criadoEm: agora(), criadoPor: usuario, encerradoEm: '' };
  reg.servico = String(c.servico || '').trim();
  reg.valorMensal = centavos(c.valorMensal);
  reg.meses = reg.valorMensal ? Math.round(Number(c.meses) || 0) : 0;
  reg.inicio = reg.valorMensal ? String(c.inicio || '') : '';
  reg.valorUnico = centavos(c.valorUnico);
  reg.mesValorUnico = reg.valorUnico ? String(c.mesValorUnico || '') : '';
  if (c.encerradoEm !== undefined) reg.encerradoEm = mesValido(c.encerradoEm) ? c.encerradoEm : '';
  reg.obs = String(c.obs || '').trim();
  validarContrato(reg);
  return gravarRegistro(ABA_CONTRATOS, COLUNAS_CONTRATOS, reg);
}

function acharContrato(id) {
  const c = lerTabela(ABA_CONTRATOS, COLUNAS_CONTRATOS).registros.filter(function (r) { return r.contratoId === id; })[0];
  if (!c) throw new Error('Contrato não encontrado.');
  return c;
}

function cancelarContrato(id) {
  const c = acharContrato(id);
  const meses = [c.inicio, c.mesValorUnico].filter(mesValido).sort();
  c.encerradoEm = meses[0] || '';
  const d = agora().slice(0, 10).split('-');
  c.obs = (c.obs ? c.obs + ' · ' : '') + 'Cancelado em ' + d[2] + '/' + d[1] + '/' + d[0];
  return gravarRegistro(ABA_CONTRATOS, COLUNAS_CONTRATOS, c);
}

function mudarValorContrato(corpo, usuario) {
  const c = acharContrato(corpo.contratoId);
  const aPartirDe = String(corpo.aPartirDe || '');
  const valor = centavos(corpo.valorMensal);
  if (!(c.valorMensal > 0) || !mesValido(c.inicio)) throw new Error('Este contrato não tem valor mensal.');
  if (!mesValido(aPartirDe) || !valor) throw new Error('Informe o mês e o novo valor.');
  let fim = somarMeses(c.inicio, c.meses);
  if (mesValido(c.encerradoEm) && c.encerradoEm < fim) fim = c.encerradoEm;
  if (aPartirDe <= c.inicio) throw new Error('Para mudar desde o primeiro mês, use Editar.');
  const restante = diffMeses(aPartirDe, fim);
  if (restante <= 0) throw new Error('O contrato já terminou nesse mês.');
  // Valor único marcado para depois do reajuste vai para o contrato novo (senão seria perdido).
  let unicoNovo = 0;
  let mesUnicoNovo = '';
  if (c.valorUnico > 0 && mesValido(c.mesValorUnico) && c.mesValorUnico >= aPartirDe) {
    unicoNovo = c.valorUnico;
    mesUnicoNovo = c.mesValorUnico;
    c.valorUnico = 0;
    c.mesValorUnico = '';
  }
  c.encerradoEm = aPartirDe;
  gravarRegistro(ABA_CONTRATOS, COLUNAS_CONTRATOS, c);
  const novo = gravarRegistro(ABA_CONTRATOS, COLUNAS_CONTRATOS, {
    contratoId: novoId('ctr'),
    clienteId: c.clienteId,
    servico: c.servico,
    valorMensal: valor,
    meses: restante,
    inicio: aPartirDe,
    valorUnico: unicoNovo,
    mesValorUnico: mesUnicoNovo,
    encerradoEm: '',
    criadoEm: agora(),
    criadoPor: usuario,
    obs: 'Reajuste do contrato ' + c.contratoId,
  });
  return { ok: true, anterior: c, novo: novo };
}

function registrarMovimento(m, usuario) {
  const de = String(m.deEtapa || '');
  const para = String(m.paraEtapa || '');
  if (!m.cardId || !para || de === para) return null;
  return gravarRegistro(ABA_MOVIMENTOS, COLUNAS_MOVIMENTOS, {
    movimentoId: novoId('mov'),
    cardId: String(m.cardId),
    funil: String(m.funil || ''),
    deEtapa: de,
    paraEtapa: para,
    quando: agora(),
    por: usuario,
    motivo: String(m.motivo || ''),
    valor: centavos(m.valor),
  });
}

function registrarGanho(corpo, usuario) {
  const dados = corpo.cliente || {};
  const clientes = lerTabela(ABA_CLIENTES, COLUNAS_CLIENTES).registros;
  let cliente = dados.cardId ? clientes.filter(function (r) { return r.cardId === String(dados.cardId); })[0] : null;
  if (!cliente) cliente = salvarCliente(dados, usuario);
  const contrato = corpo.contrato ? salvarContrato(Object.assign({}, corpo.contrato, { clienteId: cliente.clienteId, contratoId: '' }), usuario) : null;
  const movimento = corpo.movimento ? registrarMovimento(corpo.movimento, usuario) : null;
  return { ok: true, cliente: cliente, contrato: contrato, movimento: movimento };
}

function lerConfig() {
  const out = {};
  lerTabela(ABA_CONFIG, COLUNAS_CONFIG).registros.forEach(function (r) { out[r.chave] = r.conteudo; });
  return out;
}

function salvarConfig(chave, valor) {
  if (CHAVES_CONFIG.indexOf(chave) === -1) throw new Error('Configuração desconhecida.');
  const v = String(valor || '');
  if (v.length > 1000) throw new Error('Texto muito longo (máximo 1000 caracteres).');
  gravarRegistro(ABA_CONFIG, COLUNAS_CONFIG, { chave: chave, conteudo: v });
  return { ok: true, config: lerConfig() };
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
  const t = String(v).trim();
  // Desfaz a proteção anti-fórmula de seguro() caso a planilha guarde o apóstrofo.
  return /^'[=+\-@]/.test(t) ? t.slice(1) : t;
}

// Impede que texto digitado vire fórmula na planilha (ex.: "=IMPORTXML(...)")
function seguro(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
