const db = require('../config/database');
const whatsappService = require('./whatsappService');

// =====================================================
// HELPERS
// =====================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(intervalSeconds) {
  const base = intervalSeconds * 1000;
  const jitter = Math.floor(Math.random() * (intervalSeconds * 500));
  return base + jitter;
}

// Estado do gotejamento (reset a cada hora; sincroniza com os logs do banco)
let throttle = { hour: '', count: 0 };

async function getConfig() {
  try {
    const [rows] = await db.query(
      `SELECT setting_key, setting_value FROM settings
       WHERE setting_key IN ('promo_active', 'promo_send_start', 'promo_send_end', 'promo_max_per_hour', 'promo_interval_seconds', 'site_url')`
    );
    const cfg = {};
    rows.forEach((r) => { cfg[r.setting_key] = r.setting_value; });
    return {
      active: String(cfg.promo_active ?? '1') !== '0',
      start: parseInt(cfg.promo_send_start, 10) || 8,
      end: parseInt(cfg.promo_send_end, 10) || 20,
      maxPerHour: parseInt(cfg.promo_max_per_hour, 10) || 20,
      intervalSeconds: parseFloat(cfg.promo_interval_seconds) || 25,
      siteUrl: String(cfg.site_url || 'https://fadead.com.br').replace(/\/+$/, ''),
    };
  } catch {
    return { active: true, start: 8, end: 20, maxPerHour: 20, intervalSeconds: 25, siteUrl: 'https://fadead.com.br' };
  }
}

// Conta envios da última hora (divulgação + cobrança) para não estourar o limite no mesmo número
async function syncThrottle(cfg) {
  const now = new Date();
  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  if (throttle.hour !== hourKey) {
    try {
      const [[row]] = await db.query(
        `SELECT
          (SELECT COUNT(*) FROM promo_send_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) +
          (SELECT COUNT(*) FROM billing_send_log WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)) AS c`
      );
      throttle.count = Number(row?.c || 0);
    } catch {
      throttle.count = 0;
    }
    throttle.hour = hourKey;
  }
  if (throttle.count > cfg.maxPerHour) throttle.count = cfg.maxPerHour;
}

function buildLink(cfg, campaign) {
  if (campaign.enrollment_link) {
    return campaign.enrollment_link.startsWith('http') ? campaign.enrollment_link : `${cfg.siteUrl}${campaign.enrollment_link}`;
  }
  if (campaign.course_id) return `${cfg.siteUrl}/matricula?curso=${campaign.course_id}`;
  return `${cfg.siteUrl}/matricula`;
}

function fillMessage(tpl, record, campaign, link) {
  return String(tpl || '')
    .replace(/\{nome\}/g, record.name || '')
    .replace(/\{curso\}/g, campaign.course_name || '')
    .replace(/\{link\}/g, link)
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// =====================================================
// CAMPANHAS
// =====================================================

async function createCampaign({ name, message, poster_url, course_id, course_name, enrollment_link, createdBy }) {
  if (!name || !message) throw new Error('Nome e mensagem são obrigatórios');
  const [res] = await db.query(
    `INSERT INTO promo_campaigns (name, message, poster_url, course_id, course_name, enrollment_link, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)`,
    [name, message, poster_url || null, course_id || null, course_name || null, enrollment_link || null, createdBy || null]
  );
  return res.insertId;
}

async function listCampaigns() {
  const [rows] = await db.query(
    `SELECT pc.*,
            (SELECT COUNT(*) FROM promo_campaign_records r WHERE r.campaign_id = pc.id) AS records_count,
            (SELECT COUNT(*) FROM promo_campaign_records r WHERE r.campaign_id = pc.id AND r.status IN ('pending','error')) AS pending_count
     FROM promo_campaigns pc
     ORDER BY pc.created_at DESC`
  );
  return rows;
}

async function getCampaign(id) {
  const [rows] = await db.query(
    `SELECT pc.*,
            (SELECT COUNT(*) FROM promo_campaign_records r WHERE r.campaign_id = pc.id) AS records_count,
            (SELECT COUNT(*) FROM promo_campaign_records r WHERE r.campaign_id = pc.id AND r.status IN ('pending','error')) AS pending_count
     FROM promo_campaigns pc WHERE pc.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function updateCampaign(id, fields) {
  const allowed = ['name', 'message', 'poster_url', 'course_id', 'course_name', 'enrollment_link', 'status'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(fields[key] === '' ? null : fields[key]);
    }
  }
  if (sets.length === 0) throw new Error('Nenhum campo para atualizar');
  params.push(id);
  await db.query(`UPDATE promo_campaigns SET ${sets.join(', ')} WHERE id = ?`, params);
}

async function deleteCampaign(id) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [recs] = await connection.query('SELECT id FROM promo_campaign_records WHERE campaign_id = ?', [id]);
    for (const r of recs) {
      await connection.query('DELETE FROM promo_send_log WHERE record_id = ?', [r.id]);
    }
    await connection.query('DELETE FROM promo_campaign_records WHERE campaign_id = ?', [id]);
    await connection.query('DELETE FROM promo_campaigns WHERE id = ?', [id]);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// Cria a fila de contatos a partir dos leads do CRM (com WhatsApp)
async function buildRecipients(campaignId, { leadIds, source } = {}) {
  const camp = await getCampaign(campaignId);
  if (!camp) throw new Error('Campanha não encontrada');

  let sql = `SELECT id, name, whatsapp FROM leads WHERE whatsapp IS NOT NULL AND whatsapp != ''`;
  const params = [];
  if (source) {
    sql += ' AND source = ?';
    params.push(source);
  }
  if (leadIds && leadIds.length) {
    sql += ' AND id IN (?)';
    params.push(leadIds);
  }
  const [leads] = await db.query(sql, params);

  const [existing] = await db.query('SELECT lead_id FROM promo_campaign_records WHERE campaign_id = ?', [campaignId]);
  const seen = new Set(existing.map((r) => r.lead_id));

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let added = 0;
    for (const lead of leads) {
      if (seen.has(lead.id)) continue;
      await connection.query(
        'INSERT INTO promo_campaign_records (campaign_id, lead_id, name, whatsapp) VALUES (?, ?, ?, ?)',
        [campaignId, lead.id, lead.name, lead.whatsapp]
      );
      seen.add(lead.id);
      added++;
    }
    const [[{ total }]] = await connection.query(
      'SELECT COUNT(*) AS total FROM promo_campaign_records WHERE campaign_id = ?',
      [campaignId]
    );
    await connection.query('UPDATE promo_campaigns SET total_records = ? WHERE id = ?', [total, campaignId]);
    await connection.commit();
    return { added, total: Number(total) };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// =====================================================
// ENVIO AUTOMÁTICO (gotejamento)
// =====================================================

async function processPromoSending() {
  try {
    const cfg = await getConfig();
    if (!cfg.active) return;

    const hour = new Date().getHours();
    if (hour < cfg.start || hour >= cfg.end) return;

    await syncThrottle(cfg);
    if (throttle.count >= cfg.maxPerHour) return;

    const [camps] = await db.query(
      `SELECT * FROM promo_campaigns WHERE status = 'active' AND total_records > sent_count ORDER BY created_at ASC`
    );
    if (camps.length === 0) return;

    const [pending] = await db.query(
      `SELECT r.* FROM promo_campaign_records r
       JOIN promo_campaigns c ON c.id = r.campaign_id
       WHERE r.status IN ('pending','error') AND c.status = 'active'
       ORDER BY r.id ASC
       LIMIT ?`,
      [Math.max(cfg.maxPerHour - throttle.count, 1)]
    );
    if (pending.length === 0) return;

    console.log(`[Promo] ${pending.length} mensagens na fila (limite: ${cfg.maxPerHour}/h, intervalo: ${cfg.intervalSeconds}s)`);

    const campaignMap = new Map(camps.map((c) => [c.id, c]));

    for (const rec of pending) {
      if (throttle.count >= cfg.maxPerHour) {
        console.log(`[Promo] Limite de ${cfg.maxPerHour} msg/h atingido. Envios continuam depois.`);
        return;
      }
      const camp = campaignMap.get(rec.campaign_id);
      if (!camp) continue;
      try {
        const link = buildLink(cfg, camp);
        const text = fillMessage(camp.message, rec, camp, link);
        if (camp.poster_url) {
          const img = camp.poster_url.startsWith('http') ? camp.poster_url : `${cfg.siteUrl}${camp.poster_url}`;
          await whatsappService.sendImage(rec.whatsapp, img, text);
        } else {
          await whatsappService.sendMessage(rec.whatsapp, text);
        }
        await db.query(
          `UPDATE promo_campaign_records SET status = 'sent', sent_at = NOW(), last_error = NULL WHERE id = ?`,
          [rec.id]
        );
        await db.query('UPDATE promo_campaigns SET sent_count = sent_count + 1 WHERE id = ?', [camp.id]);
        await db.query('INSERT INTO promo_send_log (record_id, phone) VALUES (?, ?)', [rec.id, rec.whatsapp]);
        throttle.count += 1;
        console.log(`[Promo] Enviado para ${rec.name} (${rec.whatsapp}) [${throttle.count}/${cfg.maxPerHour}]`);
      } catch (error) {
        await db.query(
          `UPDATE promo_campaign_records SET status = 'error', last_error = ? WHERE id = ?`,
          [String(error.message || error).slice(0, 500), rec.id]
        );
        console.error(`[Promo] Erro para ${rec.whatsapp}:`, error.message);
      }
      if (throttle.count < cfg.maxPerHour) {
        await sleep(randomDelay(cfg.intervalSeconds));
      }
    }

    for (const c of camps) {
      if (c.total_records > 0 && c.sent_count >= c.total_records) {
        await db.query("UPDATE promo_campaigns SET status = 'completed' WHERE id = ?", [c.id]);
      }
    }
  } catch (error) {
    console.error('[Promo] Erro no processamento:', error.message);
  }
}

// Envio manual de teste
async function sendNow(recordId) {
  const [rows] = await db.query(
    `SELECT r.*, c.message, c.poster_url, c.course_name, c.course_id, c.enrollment_link
     FROM promo_campaign_records r
     JOIN promo_campaigns c ON c.id = r.campaign_id
     WHERE r.id = ?`,
    [recordId]
  );
  if (rows.length === 0) throw new Error('Registro não encontrado');

  const cfg = await getConfig();
  const link = buildLink(cfg, rows[0]);
  const text = fillMessage(rows[0].message, rows[0], rows[0], link);

  if (rows[0].poster_url) {
    const img = rows[0].poster_url.startsWith('http') ? rows[0].poster_url : `${cfg.siteUrl}${rows[0].poster_url}`;
    await whatsappService.sendImage(rows[0].whatsapp, img, text);
  } else {
    await whatsappService.sendMessage(rows[0].whatsapp, text);
  }
  return rows[0].whatsapp;
}

module.exports = {
  getConfig,
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  buildRecipients,
  processPromoSending,
  sendNow,
  fillMessage,
};
