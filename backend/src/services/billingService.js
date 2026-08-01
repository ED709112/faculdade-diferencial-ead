const db = require('../config/database');
const ExcelJS = require('exceljs');
const whatsappService = require('./whatsappService');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// =====================================================
// HELPERS DE NORMALIZAÇÃO
// =====================================================

function normalizeHeader(h) {
  return String(h ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function resolveIndexes(headers) {
  const idx = { name: -1, phone: -1, course: -1, amount: -1, due: -1, parcels: -1 };
  headers.forEach((h, i) => {
    if (idx.name === -1 && (h.includes('nome') || h.includes('estudante') || h === 'aluno' || h === 'alunos' || h === 'name')) idx.name = i;
    if (idx.phone === -1 && (h.includes('whatsapp') || h.includes('celular') || h.includes('telefone') || h === 'phone' || h.includes('numero'))) idx.phone = i;
    if (idx.course === -1 && (h.includes('curso') || h.includes('turma'))) idx.course = i;
    if (idx.due === -1 && h.includes('venc')) idx.due = i;
    if (idx.parcels === -1 && h.includes('parcela')) idx.parcels = i;
  });
  // Valor: prefere "Valor Total"; senão, a 1ª coluna de valor
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === 'valortotal') { idx.amount = i; break; }
  }
  if (idx.amount === -1) {
    headers.forEach((h, i) => {
      if (idx.amount === -1 && (h.includes('valor') || h === 'mensalidade' || h === 'amount')) idx.amount = i;
    });
  }
  return idx;
}

function normalizePhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  } else if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    // ok
  } else {
    return null;
  }
  return digits;
}

function parseAmount(raw) {
  if (raw === null || raw === undefined) return null;
  let s = String(raw).trim();
  if (!s) return null;
  if (typeof raw === 'number') {
    return isNaN(raw) ? null : raw;
  }
  s = s.replace(/[R$\s]/g, '');
  if (!s) return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

function parseDate(raw) {
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const y = raw.getUTCFullYear();
    const m = String(raw.getUTCMonth() + 1).padStart(2, '0');
    const d = String(raw.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof raw === 'number') {
    const dt = new Date(Math.round((raw - 25569) * 86400 * 1000));
    if (!isNaN(dt.getTime())) {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return null;
  }
  const s = String(raw ?? '').trim();
  if (!s) return null;

  let m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    let [_, d, mo, y] = m;
    y = y.length === 2 ? `20${y}` : y;
    const dt = new Date(`${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00Z`);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    return null;
  }
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const dt = new Date(`${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}T00:00:00Z`);
    if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    return null;
  }
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return null;
}

function formatBRL(value) {
  const n = parseFloat(value);
  if (isNaN(n)) return '0,00';
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return String(dateStr);
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Data de ontem (dispara a mensagem de cobrança/atraso na régua)
function yesterdayDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// =====================================================
// IMPORTAR ARQUIVO (XLSX/XLS/PDF)
// =====================================================

function extractPdfText(pdfBuffer) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), `billing_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`);
    fs.writeFileSync(tmpFile, pdfBuffer);
    const script = path.join(__dirname, 'pdf_text.py');
    execFile('python3', [script, tmpFile], { maxBuffer: 20 * 1024 * 1024, timeout: 60000 }, (err, stdout) => {
      try { fs.unlinkSync(tmpFile); } catch {}
      if (err) return reject(new Error(`Falha ao ler PDF: ${err.message}`));
      resolve(stdout);
    });
  });
}

function parseBrDate(line) {
  const m = String(line).trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (!m) return null;
  let y = m[3].length === 2 ? `20${m[3]}` : m[3];
  const d = new Date(`${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function parsePdfText(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const records = [];
  let course = '';

  const isHeaderOrNoise = (l) =>
    /^Nº|^No\s|^Vencimento$|^Aluno$|^Valor$|^Histórico$|^Historicos?$/i.test(l) ||
    /^Contas a Receber/i.test(l) ||
    /^Período de/i.test(l) ||
    /^Nº Registros/i.test(l) ||
    /^Total Receber/i.test(l) ||
    /^Totais/i.test(l) ||
    /^pág/i.test(l) ||
    /^\d{1,2}:\d{2}:\d{2}/.test(l) ||
    /^\d+$/.test(l);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(line)) {
      const prev = lines[i - 1] || '';
      const nextName = lines[i + 1] || '';
      const nextVal = lines[i + 2] || '';
      const nextHist = lines[i + 3] || '';
      const due = parseBrDate(line);
      if (/^\d{4,6}$/.test(prev) && nextName && /^R\$\s?/.test(nextVal) && due) {
        records.push({
          _row: prev,
          student_name: nextName,
          due_date: due,
          amount: parseAmount(nextVal),
          course: course || null,
          reference: nextHist || null,
        });
        i += 3;
        continue;
      }
    }

    if (!isHeaderOrNoise(line) && line.length >= 4 && !/^\d{4,6}$/.test(line)) {
      course = line;
    }
  }

  return records;
}

function normalizeName(name) {
  return String(name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(DA|DE|DO|DAS|DOS)\b/g, ' ')
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function enrichPhones(records) {
  try {
    const [students] = await db.query(
      `SELECT name, phone FROM users WHERE role = 'student' AND phone IS NOT NULL AND phone != ''`
    );
    const map = new Map();
    for (const s of students) {
      const key = normalizeName(s.name);
      if (key && !map.has(key)) map.set(key, s.phone);
    }
    for (const r of records) {
      if (r.phone) continue;
      const found = map.get(normalizeName(r.student_name));
      if (found) r.phone = normalizePhone(found);
    }
  } catch (error) {
    console.error('[Billing] Enriquecimento de telefones falhou:', error.message);
  }
}

// -------- Detecção do formato convertido pelo ilovepdf (PDF -> XLSX) --------

function cellStr(cell) {
  try {
    let v = cell.value;
    if (v && typeof v === 'object' && 'result' in v) v = v.result;
    if (v && typeof v === 'object' && 'richText' in v) v = v.richText.map((r) => r.text).join('');
    if (v && typeof v === 'object' && 'text' in v) v = v.text;
    if (v === null || v === undefined) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v).replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  }
}

// Versão para valores brutos (row.values), sem objetos Cell do exceljs
function rawStr(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'richText' in v) v = v.richText.map((r) => r.text).join('');
  if (typeof v === 'object' && 'text' in v) v = v.text;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).replace(/\s+/g, ' ').trim();
}

function cellDateStr(cell) {
  const s = cellStr(cell);
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s) && /^\d{4}-\d{2}-\d{2}$/.test(s.slice(0, 10))) return s.slice(0, 10);
  if (/^\d{4}-\d{1,2}-\d{1,2}T/.test(s)) return s.slice(0, 10);
  return null;
}

function looksLikeIlovepdf(wb) {
  const sheetNames = wb.worksheets.map((w) => w.name);
  if (sheetNames.some((n) => /^table\s*\d+$/i.test(n))) return true;
  return false;
}

function parseIlovepdfWorkbook(wb) {
  const records = [];
  let pendingCourse = '';

  for (const ws of wb.worksheets) {
    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row) => rows.push(row));

    let hasData = false;
    const extracted = [];

    for (const row of rows) {
      const cells = [];
      for (let c = 1; c <= ws.columnCount; c++) {
        const cell = row.getCell(c);
        const s = cellStr(cell);
        const date = cellDateStr(cell);
        cells.push({ str: s, date, cell });
      }

      const data = {
        num: '', name: '', date: null, valor: '', historico: '', cells,
      };
      for (const c of cells) {
        if (!c.str) continue;
        if (/^\d{4,6}$/.test(c.str) && !data.num) { data.num = c.str; continue; }
        if (/^R\$\s?/.test(c.str) && !data.valor) { data.valor = c.str; continue; }
        if (c.date && !data.date) { data.date = c.date; continue; }
        if (!data.name && c.str.length >= 2) { data.name = c.str; continue; }
        if (data.name && !data.historico && c.str.length >= 2) { data.historico = c.str; }
      }

      if (/^\d{4,6}$/.test(data.num) && data.name && data.date) {
        hasData = true;
        // ilovepdf interpreta datas BR (dd/mm) como mm/dd -> trocar dia/mês
        const [y, mm, dd] = data.date.split('-');
        const real = new Date(`${y}-${dd}-${mm}T00:00:00Z`);
        const realDate = isNaN(real.getTime()) ? data.date : real.toISOString().slice(0, 10);
        extracted.push({
          _row: data.num,
          student_name: data.name,
          due_date: realDate,
          amount: parseAmount(data.valor),
          reference: data.historico || null,
          course: pendingCourse || null,
        });
      }
    }

    if (!hasData) {
      // procura título de curso em folhas sem dados
      for (const row of rows) {
        for (let c = 1; c <= row.columnCount; c++) {
          const s = cellStr(row.getCell(c));
          if (s.length >= 8 && !/^(R\$|Nº|Contas a Receber|Período|Vencimento|Aluno|Histórico|Valor|Totais|Registros|Total|pág)/i.test(s)) {
            pendingCourse = s;
            break;
          }
        }
        if (pendingCourse) break;
      }
      continue;
    }

    records.push(...extracted);
  }

  return records;
}

// -------- Formato padrão (planilha com cabeçalhos) --------

function parseHeaderSheet(ws) {
  const allRows = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    allRows.push({ rowNumber, values: row.values.slice(1).map(rawStr) });
  });

  let headerRowNumber = -1;
  for (const r of allRows) {
    const idx = resolveIndexes(r.values.map(normalizeHeader));
    if (idx.name !== -1 && idx.phone !== -1) {
      headerRowNumber = r.rowNumber;
      break;
    }
  }
  if (headerRowNumber === -1) return { records: [], skipped: [] };

  const headers = allRows.find((r) => r.rowNumber === headerRowNumber).values.map(normalizeHeader);
  const idx = resolveIndexes(headers);

  const records = [];
  const skipped = [];
  for (const r of allRows) {
    if (r.rowNumber <= headerRowNumber) continue;
    const get = (i) => (i >= 0 && i < r.values.length ? r.values[i] : undefined);

    const name = String(get(idx.name) ?? '').trim();
    const phone = normalizePhone(get(idx.phone));
    const due = parseDate(get(idx.due)) || yesterdayDate();
    if (!name || !phone) {
      skipped.push({ row: r.rowNumber, reason: !name ? 'sem nome' : 'telefone inválido' });
      continue;
    }
    let reference = null;
    if (idx.parcels >= 0) {
      const p = String(get(idx.parcels) ?? '').trim();
      if (p && p !== '0') reference = `${p} parcela(s) em atraso`;
    }
    records.push({
      _row: r.rowNumber,
      student_name: name,
      phone,
      course: String(get(idx.course) ?? '').trim() || null,
      amount: parseAmount(get(idx.amount)),
      due_date: due,
      reference,
    });
  }
  return { records, skipped };
}

async function importFile(buffer, filename) {
  const lower = String(filename || '').toLowerCase();
  let records = [];
  let skipped = [];

  if (lower.endsWith('.pdf')) {
    const text = await extractPdfText(buffer);
    records = parsePdfText(text);
  } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    if (looksLikeIlovepdf(workbook)) {
      records = parseIlovepdfWorkbook(workbook);
    } else {
      for (const ws of workbook.worksheets) {
        const res = parseHeaderSheet(ws);
        records.push(...res.records);
        skipped.push(...res.skipped);
      }
    }
  } else {
    throw new Error('Formato não suportado. Envie .xlsx, .xls ou .pdf');
  }

  await enrichPhones(records);

  const finalRecords = [];
  const finalSkipped = [...skipped];
  for (const r of records) {
    if (!r.phone) {
      finalSkipped.push({ row: r._row || '?', reason: 'sem telefone (aluno não encontrado no cadastro)' });
      continue;
    }
    finalRecords.push(r);
  }

  return { records: finalRecords, skipped: finalSkipped };
}

async function createCampaign(name, fileName, records, createdBy) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [campRes] = await connection.query(
      'INSERT INTO billing_campaigns (name, file_name, total_records, status, created_by) VALUES (?, ?, ?, ?, ?)',
      [name, fileName, records.length, 'completed', createdBy]
    );
    const campaignId = campRes.insertId;
    for (const r of records) {
      await connection.query(
        `INSERT INTO billing_records (campaign_id, student_name, phone, course, amount, due_date, status, reference)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
        [campaignId, r.student_name, r.phone, r.course, r.amount, r.due_date, r.reference || null]
      );
    }
    await connection.commit();
    return { campaignId, total: records.length };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// =====================================================
// RÉGUA DE COBRANÇA - ENVIO AUTOMÁTICO
// =====================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(intervalSeconds) {
  const base = intervalSeconds * 1000;
  const jitter = Math.floor(Math.random() * (intervalSeconds * 500));
  return base + jitter;
}

// Estado do gotejamento (reset a cada hora; a cada ciclo sincroniza com o log do banco)
let throttle = { hour: '', count: 0 };

async function getSendConfig() {
  try {
    const [rows] = await db.query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('billing_active', 'billing_send_start', 'billing_send_end', 'billing_max_per_hour', 'billing_interval_seconds')`
    );
    const cfg = {};
    rows.forEach((r) => { cfg[r.setting_key] = r.setting_value; });
    return {
      active: String(cfg.billing_active ?? '1') !== '0',
      start: parseInt(cfg.billing_send_start, 10) || 8,
      end: parseInt(cfg.billing_send_end, 10) || 20,
      maxPerHour: parseInt(cfg.billing_max_per_hour, 10) || 30,
      intervalSeconds: parseFloat(cfg.billing_interval_seconds) || 25,
    };
  } catch {
    return { active: true, start: 8, end: 20, maxPerHour: 30, intervalSeconds: 25 };
  }
}

async function syncThrottle(cfg) {
  const now = new Date();
  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  if (throttle.hour !== hourKey) {
    try {
      const [rows] = await db.query(
        'SELECT COUNT(*) as c FROM billing_send_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)'
      );
      throttle.count = Number(rows[0].c || 0);
    } catch {
      throttle.count = 0;
    }
    throttle.hour = hourKey;
  }
  if (throttle.count > cfg.maxPerHour) throttle.count = cfg.maxPerHour;
}

async function loadTemplates() {
  const [rows] = await db.query('SELECT template_key, message FROM billing_templates');
  const map = {};
  rows.forEach((r) => { map[r.template_key] = r.message; });
  return map;
}

function fillTemplate(tpl, record) {
  let out = tpl;
  if (record.course) {
    out = out.replace(/\{curso\}/g, record.course);
  } else {
    out = out
      .replace(/referente ao curso \{curso\},?\s*/gi, '')
      .replace(/,?\s*do curso \{curso\}/gi, '');
  }
  out = out
    .replace(/\{nome\}/g, record.student_name || '')
    .replace(/\{valor\}/g, formatBRL(record.amount))
    .replace(/\{vencimento\}/g, formatDate(record.due_date))
    .replace(/\{parcelas\}/g, record.reference || '')
    .replace(/\s{2,}/g, ' ');
  return out.trim();
}

async function sendWithThrottle(targets, templates, cfg) {
  for (const { record, field, type } of targets) {
    if (throttle.count >= cfg.maxPerHour) {
      console.log(`[Billing] Limite de ${cfg.maxPerHour} msg/h atingido. Envios continuam depois.`);
      return;
    }
    try {
      const tpl = templates[type];
      if (!tpl) continue;
      const text = fillTemplate(tpl, record);
      await whatsappService.sendMessage(record.phone, text);
      await db.query(
        `UPDATE billing_records SET ${field} = NOW(), last_error = NULL WHERE id = ?`,
        [record.id]
      );
      await db.query(
        'INSERT INTO billing_send_log (record_id, phone, type) VALUES (?, ?, ?)',
        [record.id, record.phone, type]
      );
      throttle.count += 1;
      console.log(`[Billing] ${type} enviado para ${record.student_name} (${record.phone}) [${throttle.count}/${cfg.maxPerHour}]`);
    } catch (error) {
      await db.query(
        'UPDATE billing_records SET last_error = ? WHERE id = ?',
        [String(error.message || error).slice(0, 500), record.id]
      );
      console.error(`[Billing] ${type} erro para ${record.phone}:`, error.message);
    }
    if (throttle.count < cfg.maxPerHour) {
      await sleep(randomDelay(cfg.intervalSeconds));
    }
  }
}

async function processBillingDunning() {
  try {
    const cfg = await getSendConfig();
    if (!cfg.active) return;

    const now = new Date();
    const hour = now.getHours();
    if (hour < cfg.start || hour >= cfg.end) return;

    await syncThrottle(cfg);
    if (throttle.count >= cfg.maxPerHour) return;

    const templates = await loadTemplates();
    const targets = [];

    const [t2] = await db.query(
      `SELECT * FROM billing_records WHERE status = 'pending' AND due_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY) AND msg_t2_sent_at IS NULL LIMIT 100`
    );
    t2.forEach((r) => targets.push({ record: r, field: 'msg_t2_sent_at', type: 't2' }));

    const [due] = await db.query(
      `SELECT * FROM billing_records WHERE status = 'pending' AND due_date = CURDATE() AND msg_due_sent_at IS NULL LIMIT 100`
    );
    due.forEach((r) => targets.push({ record: r, field: 'msg_due_sent_at', type: 'due' }));

    const [overdue] = await db.query(
      `SELECT * FROM billing_records WHERE status = 'pending' AND due_date < CURDATE() AND msg_overdue_sent_at IS NULL LIMIT 100`
    );
    overdue.forEach((r) => targets.push({ record: r, field: 'msg_overdue_sent_at', type: 'overdue' }));

    if (targets.length > 0) {
      console.log(`[Billing] ${targets.length} mensagens na fila (limite: ${cfg.maxPerHour}/h, intervalo: ${cfg.intervalSeconds}s)`);
    }
    await sendWithThrottle(targets, templates, cfg);
  } catch (error) {
    console.error('[Billing] Erro no processamento da régua:', error.message);
  }
}

module.exports = {
  importFile,
  createCampaign,
  processBillingDunning,
  loadTemplates,
  fillTemplate,
  normalizePhone,
  parseAmount,
  parseDate,
  formatBRL,
  formatDate,
  parseHeaderSheet,
  resolveIndexes,
  parseIlovepdfWorkbook,
};
