const db = require('../config/database');
const promoService = require('../services/promoService');

exports.create = async (req, res) => {
  try {
    const { name, message, message_reminder, message_urgency, reminder_days, urgency_days, poster_url, course_id, course_name, enrollment_link } = req.body;
    const id = await promoService.createCampaign({
      name, message, message_reminder, message_urgency, reminder_days, urgency_days,
      poster_url, course_id, course_name, enrollment_link, createdBy: req.user?.id,
    });
    return res.status(201).json({ message: 'Campanha criada', id });
  } catch (error) {
    console.error('[Promo] Create erro:', error.message);
    return res.status(500).json({ error: error.message || 'Erro ao criar campanha' });
  }
};

exports.list = async (req, res) => {
  try {
    const rows = await promoService.listCampaigns();
    return res.json(rows);
  } catch (error) {
    console.error('[Promo] List erro:', error.message);
    return res.status(500).json({ error: 'Erro ao listar campanhas' });
  }
};

exports.get = async (req, res) => {
  try {
    const campaign = await promoService.getCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
    return res.json(campaign);
  } catch (error) {
    console.error('[Promo] Get erro:', error.message);
    return res.status(500).json({ error: 'Erro ao carregar campanha' });
  }
};

exports.update = async (req, res) => {
  try {
    await promoService.updateCampaign(req.params.id, req.body);
    return res.json({ message: 'Campanha atualizada' });
  } catch (error) {
    console.error('[Promo] Update erro:', error.message);
    return res.status(500).json({ error: error.message || 'Erro ao atualizar campanha' });
  }
};

exports.remove = async (req, res) => {
  try {
    await promoService.deleteCampaign(req.params.id);
    return res.json({ message: 'Campanha excluída' });
  } catch (error) {
    console.error('[Promo] Delete erro:', error.message);
    return res.status(500).json({ error: 'Erro ao excluir campanha' });
  }
};

exports.build = async (req, res) => {
  try {
    const { leadIds, source } = req.body || {};
    const result = await promoService.buildRecipients(req.params.id, { leadIds, source });
    return res.json({ message: `${result.added} contato(s) adicionado(s)`, ...result });
  } catch (error) {
    console.error('[Promo] Build erro:', error.message);
    return res.status(500).json({ error: error.message || 'Erro ao gerar lista de contatos' });
  }
};

exports.records = async (req, res) => {
  try {
    const { campaign_id, status, search } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];
    if (campaign_id) { where.push('r.campaign_id = ?'); params.push(campaign_id); }
    if (status && status !== 'all') { where.push('r.status = ?'); params.push(status); }
    if (search) { where.push('(r.name LIKE ? OR r.whatsapp LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT r.*, pc.name AS campaign_name
       FROM promo_campaign_records r
       LEFT JOIN promo_campaigns pc ON pc.id = r.campaign_id
       ${whereSql}
       ORDER BY r.id ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM promo_campaign_records r ${whereSql}`,
      params
    );
    return res.json({ data: rows, pagination: { page, limit, total: countRows[0].total } });
  } catch (error) {
    console.error('[Promo] Records erro:', error.message);
    return res.status(500).json({ error: 'Erro ao listar contatos' });
  }
};

exports.sendNow = async (req, res) => {
  try {
    const phone = await promoService.sendNow(req.params.id);
    return res.json({ message: 'Mensagem enviada', phone });
  } catch (error) {
    console.error('[Promo] Send now erro:', error.message);
    return res.status(500).json({ error: error.message || 'Erro ao enviar mensagem' });
  }
};

exports.stats = async (req, res) => {
  try {
    const [[row]] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM promo_campaigns) AS campaigns,
        (SELECT COUNT(*) FROM promo_campaigns WHERE status = 'active') AS active,
        (SELECT COUNT(*) FROM promo_campaigns WHERE status = 'completed') AS completed,
        (SELECT COUNT(*) FROM promo_campaign_records) AS total_records,
        (SELECT COUNT(*) FROM promo_campaign_records WHERE status = 'sent') AS sent,
        (SELECT COUNT(*) FROM promo_campaign_records WHERE status = 'pending') AS pending,
        (SELECT COUNT(*) FROM promo_campaign_records WHERE status = 'error') AS errors,
        (SELECT COUNT(*) FROM promo_send_log WHERE created_at >= CURDATE()) AS sent_today`
    );
    return res.json({
      campaigns: Number(row?.campaigns || 0),
      active: Number(row?.active || 0),
      completed: Number(row?.completed || 0),
      total_records: Number(row?.total_records || 0),
      sent: Number(row?.sent || 0),
      pending: Number(row?.pending || 0),
      errors: Number(row?.errors || 0),
      sent_today: Number(row?.sent_today || 0),
    });
  } catch (error) {
    console.error('[Promo] Stats erro:', error.message);
    return res.status(500).json({ error: 'Erro ao carregar estatísticas' });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT setting_key, setting_value FROM settings
       WHERE setting_key IN ('promo_active', 'promo_send_start', 'promo_send_end', 'promo_max_per_hour', 'promo_interval_seconds', 'site_url')
       ORDER BY setting_key`
    );
    return res.json(rows.map((r) => ({ key: r.setting_key, value: r.setting_value })));
  } catch (error) {
    console.error('[Promo] Get config erro:', error.message);
    return res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const allowed = ['promo_active', 'promo_send_start', 'promo_send_end', 'promo_max_per_hour', 'promo_interval_seconds', 'site_url'];
    const updates = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates.push([key, String(req.body[key])]);
    }
    if (updates.length === 0) return res.status(400).json({ error: 'Nenhuma configuração enviada' });
    for (const [key, value] of updates) {
      await db.query(
        `INSERT INTO settings (setting_key, setting_value, setting_type, setting_group)
         VALUES (?, ?, 'text', 'promo')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value]
      );
    }
    return res.json({ message: 'Configurações salvas' });
  } catch (error) {
    console.error('[Promo] Update config erro:', error.message);
    return res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
};
