const db = require('../config/database');
const whatsappService = require('../services/whatsappService');
const billingService = require('../services/billingService');
const { parseAmount, parseDate } = billingService;

exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Envie um arquivo Excel (.xlsx/.xls) ou PDF' });
    }
    const name = (req.body.name || `Campanha ${new Date().toLocaleDateString('pt-BR')}`).trim();
    const { records, skipped } = await billingService.importFile(req.file.buffer, req.file.originalname);

    if (records.length === 0) {
      return res.status(422).json({ error: 'Nenhum registro válido encontrado na planilha.', skipped });
    }

    const result = await billingService.createCampaign(name, req.file.originalname, records, req.user?.id);
    return res.status(201).json({
      message: `Campanha criada com ${result.total} registro(s)`,
      ...result,
      skipped,
    });
  } catch (error) {
    console.error('[Billing] Upload erro:', error.message);
    return res.status(500).json({ error: error.message || 'Erro ao importar planilha' });
  }
};

exports.list = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const { campaign_id, status, search } = req.query;

    const where = [];
    const params = [];
    if (campaign_id) {
      where.push('br.campaign_id = ?');
      params.push(campaign_id);
    }
    if (status && status !== 'all') {
      where.push('br.status = ?');
      params.push(status);
    }
    if (search) {
      where.push('(br.student_name LIKE ? OR br.phone LIKE ? OR br.course LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await db.query(
      `SELECT br.*, bc.name as campaign_name
       FROM billing_records br
       LEFT JOIN billing_campaigns bc ON bc.id = br.campaign_id
       ${whereSql}
       ORDER BY br.due_date ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
       FROM billing_records br
       ${whereSql}`,
      params
    );

    return res.json({
      data: rows,
      pagination: { page, limit, total: countRows[0].total },
    });
  } catch (error) {
    console.error('[Billing] List erro:', error.message);
    return res.status(500).json({ error: 'Erro ao listar cobranças' });
  }
};

exports.listCampaigns = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT bc.*,
              (SELECT COUNT(*) FROM billing_records br WHERE br.campaign_id = bc.id) as records_count,
              (SELECT COUNT(*) FROM billing_records br WHERE br.campaign_id = bc.id AND br.status = 'pending') as pending_count
       FROM billing_campaigns bc
       ORDER BY bc.created_at DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error('[Billing] Campaigns erro:', error.message);
    return res.status(500).json({ error: 'Erro ao listar campanhas' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [totalRows] = await db.query(
      `SELECT
        COUNT(*) as total,
        SUM(status = 'pending') as pending,
        SUM(status = 'paid') as paid,
        SUM(status = 'skipped') as skipped,
        SUM(msg_t2_sent_at IS NOT NULL) as sent_t2,
        SUM(msg_due_sent_at IS NOT NULL) as sent_due,
        SUM(msg_overdue_sent_at IS NOT NULL) as sent_overdue,
        SUM(due_date = CURDATE() AND status = 'pending') as due_today,
        SUM(due_date < CURDATE() AND status = 'pending') as overdue
       FROM billing_records`
    );
    const stats = totalRows[0] || {};
    return res.json({
      total: Number(stats.total || 0),
      pending: Number(stats.pending || 0),
      paid: Number(stats.paid || 0),
      skipped: Number(stats.skipped || 0),
      sent_t2: Number(stats.sent_t2 || 0),
      sent_due: Number(stats.sent_due || 0),
      sent_overdue: Number(stats.sent_overdue || 0),
      due_today: Number(stats.due_today || 0),
      overdue: Number(stats.overdue || 0),
    });
  } catch (error) {
    console.error('[Billing] Stats erro:', error.message);
    return res.status(500).json({ error: 'Erro ao carregar estatísticas' });
  }
};

exports.updateRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, due_date, amount, course } = req.body;

    const [exists] = await db.query('SELECT id FROM billing_records WHERE id = ?', [id]);
    if (exists.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    const fields = [];
    const params = [];
    if (status && ['pending', 'paid', 'skipped'].includes(status)) {
      fields.push('status = ?');
      params.push(status);
    }
    if (due_date) {
      const parsed = parseDate(due_date);
      if (!parsed) return res.status(422).json({ error: 'Data de vencimento inválida' });
      fields.push('due_date = ?');
      params.push(parsed);
    }
    if (amount !== undefined && amount !== null && amount !== '') {
      const parsed = parseAmount(amount);
      if (parsed === null) return res.status(422).json({ error: 'Valor inválido' });
      fields.push('amount = ?');
      params.push(parsed);
    }
    if (course !== undefined) {
      fields.push('course = ?');
      params.push(course);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    await db.query(`UPDATE billing_records SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    return res.json({ message: 'Registro atualizado' });
  } catch (error) {
    console.error('[Billing] Update erro:', error.message);
    return res.status(500).json({ error: 'Erro ao atualizar registro' });
  }
};

exports.deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM billing_records WHERE id = ?', [id]);
    return res.json({ message: 'Registro excluído' });
  } catch (error) {
    console.error('[Billing] Delete erro:', error.message);
    return res.status(500).json({ error: 'Erro ao excluir registro' });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM billing_records WHERE campaign_id = ?', [id]);
      await connection.query('DELETE FROM billing_campaigns WHERE id = ?', [id]);
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
    return res.json({ message: 'Campanha excluída' });
  } catch (error) {
    console.error('[Billing] Delete campaign erro:', error.message);
    return res.status(500).json({ error: 'Erro ao excluir campanha' });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT template_key, title, message FROM billing_templates ORDER BY id');
    return res.json(rows);
  } catch (error) {
    console.error('[Billing] Templates erro:', error.message);
    return res.status(500).json({ error: 'Erro ao carregar templates' });
  }
};

exports.updateTemplates = async (req, res) => {
  try {
    const templates = Array.isArray(req.body.templates) ? req.body.templates : [];
    if (templates.length === 0) {
      return res.status(400).json({ error: 'Envie os templates' });
    }
    for (const t of templates) {
      if (!t.template_key || !t.message) continue;
      await db.query(
        `INSERT INTO billing_templates (template_key, title, message)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE title = VALUES(title), message = VALUES(message)`,
        [t.template_key, t.title || null, t.message]
      );
    }
    return res.json({ message: 'Templates atualizados' });
  } catch (error) {
    console.error('[Billing] Update templates erro:', error.message);
    return res.status(500).json({ error: 'Erro ao atualizar templates' });
  }
};

exports.getConfig = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'billing%' ORDER BY setting_key`
    );
    return res.json(rows.map((r) => ({ key: r.setting_key, value: r.setting_value })));
  } catch (error) {
    console.error('[Billing] Get config erro:', error.message);
    return res.status(500).json({ error: 'Erro ao carregar configurações' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const allowed = ['billing_active', 'billing_send_start', 'billing_send_end', 'billing_max_per_hour', 'billing_interval_seconds'];
    const updates = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push([key, String(req.body[key])]);
      }
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhuma configuração enviada' });
    }
    for (const [key, value] of updates) {
      await db.query(
        `INSERT INTO settings (setting_key, setting_value, setting_type, setting_group)
         VALUES (?, ?, 'text', 'billing')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value]
      );
    }
    return res.json({ message: 'Configurações salvas' });
  } catch (error) {
    console.error('[Billing] Update config erro:', error.message);
    return res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
};

exports.sendNow = async (req, res) => {
  try {
    const { id, type } = req.body;
    if (!id || !['t2', 'due', 'overdue'].includes(type)) {
      return res.status(400).json({ error: 'Informe o registro e o tipo de mensagem' });
    }
    const [rows] = await db.query('SELECT * FROM billing_records WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Registro não encontrado' });

    const templates = await billingService.loadTemplates();
    const tpl = templates[type];
    if (!tpl) return res.status(500).json({ error: 'Template não encontrado' });

    const text = billingService.fillTemplate(tpl, rows[0]);
    await whatsappService.sendMessage(rows[0].phone, text);
    return res.json({ message: 'Mensagem enviada', phone: rows[0].phone });
  } catch (error) {
    console.error('[Billing] Send now erro:', error.message);
    return res.status(500).json({ error: error.message || 'Erro ao enviar mensagem' });
  }
};
