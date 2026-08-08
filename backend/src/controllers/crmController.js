const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const axios = require('axios');
const whatsappService = require('../services/whatsappService');

async function fireWebhooks(event, payload) {
  try {
    const [webhooks] = await db.query(
      'SELECT * FROM webhooks WHERE event = ? AND is_active = 1',
      [event]
    );
    for (const wh of webhooks) {
      try {
        const resp = await axios.post(wh.url, { event, payload, timestamp: new Date().toISOString() }, { timeout: 10000 });
        await db.query(
          'INSERT INTO webhook_logs (webhook_id, event, payload, response_status, response_body) VALUES (?, ?, ?, ?, ?)',
          [wh.id, event, JSON.stringify(payload), resp.status, JSON.stringify(resp.data || {}).slice(0, 2000)]
        );
      } catch (whError) {
        await db.query(
          'INSERT INTO webhook_logs (webhook_id, event, payload, response_status, response_body) VALUES (?, ?, ?, ?, ?)',
          [wh.id, event, JSON.stringify(payload), whError.response?.status || 0, (whError.message || '').slice(0, 2000)]
        );
      }
    }
  } catch (error) {
    console.error('fireWebhooks error:', error.message);
  }
}

// =====================================================
// PUBLIC - Lead Capture (no auth)
// =====================================================

exports.publicCreateLead = async (req, res) => {
  try {
    const { name, email, phone, whatsapp, course_interest, source } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const [result] = await db.query(
      'INSERT INTO leads (name, email, phone, whatsapp, course_interest, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email || null, phone || null, whatsapp || null, course_interest || null, source || 'landing', 'new']
    );

    const payload = { id: result.insertId, name, email, phone, whatsapp, course_interest, source };
    await fireWebhooks('lead.created', payload);

    res.status(201).json({ id: result.insertId, message: 'Lead registrado com sucesso!' });
  } catch (error) {
    console.error('publicCreateLead error:', error);
    res.status(500).json({ error: 'Erro ao registrar lead' });
  }
};

exports.generateQRCode = async (req, res) => {
  try {
    const { source = 'default' } = req.query;
    const baseUrl = process.env.FRONTEND_URL || 'https://fadead.com.br';
    const url = `${baseUrl}/matricula${source && source !== 'default' ? `?ref=${encodeURIComponent(source)}` : ''}`;

    const qrBuffer = await QRCode.toBuffer(url, {
      width: 400,
      margin: 2,
      color: { dark: '#1a56db', light: '#ffffff' },
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="matricula-${source}.png"`);
    res.send(qrBuffer);
  } catch (error) {
    console.error('generateQRCode error:', error);
    res.status(500).json({ error: 'Erro ao gerar QR Code' });
  }
};

// =====================================================
// LEADS
// =====================================================

exports.listLeads = async (req, res) => {
  try {
    const { status, source, search, assigned_to, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let where = [];
    let params = [];

    if (status) { where.push('l.status = ?'); params.push(status); }
    if (source) { where.push('l.source = ?'); params.push(source); }
    if (assigned_to) { where.push('l.assigned_to = ?'); params.push(assigned_to); }
    if (search) {
      where.push('(l.name LIKE ? OR l.email LIKE ? OR l.phone LIKE ? OR l.whatsapp LIKE ? OR l.cpf LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [leads] = await db.query(
      `SELECT l.*, c.title as course_name, u.name as assigned_name,
        (SELECT COUNT(*) FROM lead_interactions WHERE lead_id = l.id) as interaction_count,
        (SELECT created_at FROM lead_interactions WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1) as last_contact
       FROM leads l
       LEFT JOIN courses c ON l.course_id = c.id
       LEFT JOIN users u ON l.assigned_to = u.id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM leads l ${whereClause}`, params
    );

    res.json({ leads, total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('listLeads error:', error);
    res.status(500).json({ error: 'Erro ao listar leads' });
  }
};

exports.getLead = async (req, res) => {
  try {
    const [leads] = await db.query(
      `SELECT l.*, c.title as course_name, u.name as assigned_name
       FROM leads l
       LEFT JOIN courses c ON l.course_id = c.id
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.id = ?`,
      [req.params.id]
    );
    if (leads.length === 0) return res.status(404).json({ error: 'Lead não encontrado' });

    const [interactions] = await db.query(
      `SELECT i.*, u.name as author_name
       FROM lead_interactions i
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.lead_id = ?
       ORDER BY i.created_at DESC`,
      [req.params.id]
    );

    const [tags] = await db.query(
      `SELECT t.* FROM lead_tags t
       JOIN lead_tag_relation r ON t.id = r.tag_id
       WHERE r.lead_id = ?`,
      [req.params.id]
    );

    res.json({ ...leads[0], interactions, tags });
  } catch (error) {
    console.error('getLead error:', error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
};

exports.createLead = async (req, res) => {
  try {
    const { name, email, phone, whatsapp, cpf, source, source_detail, status, course_interest, course_id, notes, assigned_to, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const [result] = await db.query(
      `INSERT INTO leads (name, email, phone, whatsapp, cpf, source, source_detail, status, course_interest, course_id, notes, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email || null, phone || null, whatsapp || null, cpf || null, source || 'manual', source_detail || null, status || 'new', course_interest || null, course_id || null, notes || null, assigned_to || null]
    );

    const leadId = result.insertId;

    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await db.query('INSERT IGNORE INTO lead_tag_relation (lead_id, tag_id) VALUES (?, ?)', [leadId, tagId]);
      }
    }

    await db.query(
      `INSERT INTO lead_interactions (lead_id, type, direction, subject, message, created_by)
       VALUES (?, 'system', 'outbound', 'Lead criado', 'Lead adicionado ao CRM', ?)`,
      [leadId, req.user?.id || null]
    );

    const [newLead] = await db.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    await fireWebhooks('lead.created', newLead[0]);

    res.status(201).json(newLead[0]);
  } catch (error) {
    console.error('createLead error:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const { name, email, phone, whatsapp, cpf, source, source_detail, status, course_interest, course_id, notes, assigned_to, tags } = req.body;
    const oldStatus = (await db.query('SELECT status FROM leads WHERE id = ?', [req.params.id]))[0]?.[0]?.status;

    await db.query(
      `UPDATE leads SET name=?, email=?, phone=?, whatsapp=?, cpf=?, source=?, source_detail=?, status=?, course_interest=?, course_id=?, notes=?, assigned_to=?
       WHERE id=?`,
      [name, email || null, phone || null, whatsapp || null, cpf || null, source || 'manual', source_detail || null, status || 'new', course_interest || null, course_id || null, notes || null, assigned_to || null, req.params.id]
    );

    if (tags !== undefined) {
      await db.query('DELETE FROM lead_tag_relation WHERE lead_id = ?', [req.params.id]);
      if (tags && tags.length > 0) {
        for (const tagId of tags) {
          await db.query('INSERT IGNORE INTO lead_tag_relation (lead_id, tag_id) VALUES (?, ?)', [req.params.id, tagId]);
        }
      }
    }

    if (oldStatus !== status) {
      await db.query(
        `INSERT INTO lead_interactions (lead_id, type, direction, subject, message, created_by)
         VALUES (?, 'system', 'outbound', 'Status alterado', ?, ?)`,
        [req.params.id, `Status alterado de "${oldStatus}" para "${status}"`, req.user?.id || null]
      );
    }

    const [updated] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('updateLead error:', error);
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    await db.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lead removido' });
  } catch (error) {
    console.error('deleteLead error:', error);
    res.status(500).json({ error: 'Erro ao remover lead' });
  }
};

exports.moveLead = async (req, res) => {
  try {
    const { status } = req.body;
    const oldLead = (await db.query('SELECT status FROM leads WHERE id = ?', [req.params.id]))[0]?.[0];
    if (!oldLead) return res.status(404).json({ error: 'Lead não encontrado' });

    await db.query('UPDATE leads SET status = ? WHERE id = ?', [status, req.params.id]);

    await db.query(
      `INSERT INTO lead_interactions (lead_id, type, direction, subject, message, created_by)
       VALUES (?, 'system', 'outbound', 'Kanban movido', ?, ?)`,
      [req.params.id, `Movido de "${oldLead.status}" para "${status}"`, req.user?.id || null]
    );

    res.json({ message: 'Lead movido', status });
  } catch (error) {
    console.error('moveLead error:', error);
    res.status(500).json({ error: 'Erro ao mover lead' });
  }
};

// =====================================================
// INTERACTIONS
// =====================================================

exports.addInteraction = async (req, res) => {
  try {
    const { type, direction, subject, message } = req.body;
    const leadId = req.params.id;

    if (!message) return res.status(400).json({ error: 'Mensagem é obrigatória' });

    const [result] = await db.query(
      `INSERT INTO lead_interactions (lead_id, type, direction, subject, message, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [leadId, type || 'note', direction || 'outbound', subject || null, message, req.user?.id || null]
    );

    const [interaction] = await db.query(
      `SELECT i.*, u.name as author_name FROM lead_interactions i LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ?`,
      [result.insertId]
    );

    res.status(201).json(interaction[0]);
  } catch (error) {
    console.error('addInteraction error:', error);
    res.status(500).json({ error: 'Erro ao adicionar interação' });
  }
};

// =====================================================
// TAGS
// =====================================================

exports.listTags = async (req, res) => {
  try {
    const [tags] = await db.query('SELECT * FROM lead_tags ORDER BY name');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar tags' });
  }
};

exports.createTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
    const [result] = await db.query('INSERT INTO lead_tags (name, color) VALUES (?, ?)', [name, color || '#1a56db']);
    res.status(201).json({ id: result.insertId, name, color: color || '#1a56db' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Tag já existe' });
    res.status(500).json({ error: 'Erro ao criar tag' });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    await db.query('DELETE FROM lead_tags WHERE id = ?', [req.params.id]);
    res.json({ message: 'Tag removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover tag' });
  }
};

// =====================================================
// STATS
// =====================================================

exports.getStats = async (req, res) => {
  try {
    const [statusCounts] = await db.query(
      `SELECT status, COUNT(*) as count FROM leads GROUP BY status`
    );

    const [sourceCounts] = await db.query(
      `SELECT source, COUNT(*) as count FROM leads GROUP BY source ORDER BY count DESC`
    );

    const [recentLeads] = await db.query(
      `SELECT id, name, status, source, created_at FROM leads ORDER BY created_at DESC LIMIT 5`
    );

    const [totalResult] = await db.query('SELECT COUNT(*) as total FROM leads');
    const [todayResult] = await db.query(
      "SELECT COUNT(*) as total FROM leads WHERE DATE(created_at) = CURDATE()"
    );

    const stats = {};
    statusCounts.forEach(s => { stats[s.status] = s.count; });

    res.json({
      total: totalResult[0].total,
      today: todayResult[0].total,
      byStatus: stats,
      byStatusList: statusCounts,
      bySource: sourceCounts,
      recentLeads,
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// =====================================================
// EXPORTAÇÃO EXCEL
// =====================================================

exports.exportLeads = async (req, res) => {
  try {
    const { status, source, search } = req.query;
    let where = [];
    let params = [];

    if (status) { where.push('l.status = ?'); params.push(status); }
    if (source) { where.push('l.source = ?'); params.push(source); }
    if (search) {
      where.push('(l.name LIKE ? OR l.email LIKE ? OR l.phone LIKE ? OR l.whatsapp LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [leads] = await db.query(
      `SELECT l.*, c.title as course_name, u.name as assigned_name
       FROM leads l
       LEFT JOIN courses c ON l.course_id = c.id
       LEFT JOIN users u ON l.assigned_to = u.id
       ${whereClause}
       ORDER BY l.created_at DESC`,
      params
    );

    const statusLabels = {
      new: 'Novo', contacted: 'Contato', interested: 'Interessado',
      enrolled: 'Matriculado', lost: 'Perdido',
    };

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Faculdade Diferencial CRM';
    const sheet = workbook.addWorksheet('Leads');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nome', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Telefone', key: 'phone', width: 18 },
      { header: 'WhatsApp', key: 'whatsapp', width: 18 },
      { header: 'CPF', key: 'cpf', width: 16 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Origem', key: 'source', width: 14 },
      { header: 'Curso de Interesse', key: 'course_interest', width: 30 },
      { header: 'Atendente', key: 'assigned_name', width: 20 },
      { header: 'Criado em', key: 'created_at', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a56db' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    leads.forEach(l => {
      sheet.addRow({
        id: l.id,
        name: l.name,
        email: l.email || '',
        phone: l.phone || '',
        whatsapp: l.whatsapp || '',
        cpf: l.cpf || '',
        status: statusLabels[l.status] || l.status,
        source: l.source || '',
        course_interest: l.course_interest || '',
        assigned_name: l.assigned_name || '',
        created_at: l.created_at ? new Date(l.created_at).toLocaleDateString('pt-BR') : '',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('exportLeads error:', error);
    res.status(500).json({ error: 'Erro ao exportar leads' });
  }
};

// =====================================================
// RESPOSTAS RÁPIDAS
// =====================================================

exports.listQuickResponses = async (req, res) => {
  try {
    const [responses] = await db.query('SELECT * FROM quick_responses ORDER BY category, title');
    res.json(responses);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar respostas rápidas' });
  }
};

exports.createQuickResponse = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    const [result] = await db.query(
      'INSERT INTO quick_responses (title, content, category) VALUES (?, ?, ?)',
      [title, content, category || 'geral']
    );
    const [created] = await db.query('SELECT * FROM quick_responses WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar resposta rápida' });
  }
};

exports.updateQuickResponse = async (req, res) => {
  try {
    const { title, content, category, is_active } = req.body;
    await db.query(
      'UPDATE quick_responses SET title = COALESCE(?, title), content = COALESCE(?, content), category = COALESCE(?, category), is_active = COALESCE(?, is_active) WHERE id = ?',
      [title || null, content || null, category || null, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM quick_responses WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar resposta rápida' });
  }
};

exports.deleteQuickResponse = async (req, res) => {
  try {
    await db.query('DELETE FROM quick_responses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Resposta rápida removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover resposta rápida' });
  }
};

// =====================================================
// LEMBRETES
// =====================================================

exports.listReminders = async (req, res) => {
  try {
    const { pending } = req.query;
    let where = '';
    if (pending === 'true') where = 'WHERE r.is_done = 0';
    const [reminders] = await db.query(
      `SELECT r.*, l.name as lead_name FROM reminders r
       LEFT JOIN leads l ON r.lead_id = l.id
       ${where}
       ORDER BY r.remind_at ASC`,
    );
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar lembretes' });
  }
};

exports.createReminder = async (req, res) => {
  try {
    const { lead_id, title, notes, remind_at } = req.body;
    if (!title || !remind_at) return res.status(400).json({ error: 'Título e data são obrigatórios' });
    const [result] = await db.query(
      'INSERT INTO reminders (lead_id, title, notes, remind_at, created_by) VALUES (?, ?, ?, ?, ?)',
      [lead_id || null, title, notes || null, remind_at, req.user?.id || null]
    );
    const [created] = await db.query(
      `SELECT r.*, l.name as lead_name FROM reminders r LEFT JOIN leads l ON r.lead_id = l.id WHERE r.id = ?`,
      [result.insertId]
    );
    res.status(201).json(created[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar lembrete' });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const { title, notes, remind_at, is_done } = req.body;
    await db.query(
      'UPDATE reminders SET title = COALESCE(?, title), notes = COALESCE(?, notes), remind_at = COALESCE(?, remind_at), is_done = COALESCE(?, is_done) WHERE id = ?',
      [title || null, notes || null, remind_at || null, is_done !== undefined ? (is_done ? 1 : 0) : null, req.params.id]
    );
    const [updated] = await db.query(
      `SELECT r.*, l.name as lead_name FROM reminders r LEFT JOIN leads l ON r.lead_id = l.id WHERE r.id = ?`,
      [req.params.id]
    );
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar lembrete' });
  }
};

exports.deleteReminder = async (req, res) => {
  try {
    await db.query('DELETE FROM reminders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lembrete removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover lembrete' });
  }
};

// =====================================================
// FOLLOW UP AUTOMATIZADO
// =====================================================

exports.listFollowUpRules = async (req, res) => {
  try {
    const [rules] = await db.query('SELECT * FROM follow_up_rules ORDER BY created_at DESC');
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar regras de follow up' });
  }
};

exports.createFollowUpRule = async (req, res) => {
  try {
    const { name, from_status, to_status, days_waiting } = req.body;
    if (!name || !from_status || !to_status) return res.status(400).json({ error: 'Nome e status são obrigatórios' });
    if (from_status === to_status) return res.status(400).json({ error: 'Status de origem e destino devem ser diferentes' });
    const [result] = await db.query(
      'INSERT INTO follow_up_rules (name, from_status, to_status, days_waiting) VALUES (?, ?, ?, ?)',
      [name, from_status, to_status, days_waiting || 3]
    );
    const [created] = await db.query('SELECT * FROM follow_up_rules WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar regra de follow up' });
  }
};

exports.updateFollowUpRule = async (req, res) => {
  try {
    const { name, from_status, to_status, days_waiting, is_active } = req.body;
    await db.query(
      'UPDATE follow_up_rules SET name = COALESCE(?, name), from_status = COALESCE(?, from_status), to_status = COALESCE(?, to_status), days_waiting = COALESCE(?, days_waiting), is_active = COALESCE(?, is_active) WHERE id = ?',
      [name || null, from_status || null, to_status || null, days_waiting || null, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM follow_up_rules WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar regra de follow up' });
  }
};

exports.deleteFollowUpRule = async (req, res) => {
  try {
    await db.query('DELETE FROM follow_up_rules WHERE id = ?', [req.params.id]);
    res.json({ message: 'Regra removida' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover regra' });
  }
};

// =====================================================
// WEBHOOKS
// =====================================================

exports.listWebhooks = async (req, res) => {
  try {
    const [webhooks] = await db.query('SELECT * FROM webhooks ORDER BY created_at DESC');
    res.json(webhooks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar webhooks' });
  }
};

exports.createWebhook = async (req, res) => {
  try {
    const { name, url, event } = req.body;
    if (!name || !url) return res.status(400).json({ error: 'Nome e URL são obrigatórios' });
    const [result] = await db.query(
      'INSERT INTO webhooks (name, url, event) VALUES (?, ?, ?)',
      [name, url, event || 'lead.created']
    );
    const [created] = await db.query('SELECT * FROM webhooks WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar webhook' });
  }
};

exports.updateWebhook = async (req, res) => {
  try {
    const { name, url, event, is_active } = req.body;
    await db.query(
      'UPDATE webhooks SET name = COALESCE(?, name), url = COALESCE(?, url), event = COALESCE(?, event), is_active = COALESCE(?, is_active) WHERE id = ?',
      [name || null, url || null, event || null, is_active !== undefined ? (is_active ? 1 : 0) : null, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM webhooks WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar webhook' });
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    await db.query('DELETE FROM webhooks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Webhook removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover webhook' });
  }
};

exports.testWebhook = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL é obrigatória' });
    const resp = await axios.post(url, {
      event: 'test',
      payload: { message: 'Teste de webhook do CRM' },
      timestamp: new Date().toISOString(),
    }, { timeout: 10000 });
    res.json({ success: true, status: resp.status });
  } catch (error) {
    res.json({ success: false, status: error.response?.status || 0, error: error.message });
  }
};

exports.listWebhookLogs = async (req, res) => {
  try {
    const [logs] = await db.query(
      `SELECT l.*, w.name as webhook_name FROM webhook_logs l
       LEFT JOIN webhooks w ON l.webhook_id = w.id
       ORDER BY l.created_at DESC LIMIT 50`
    );
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar logs de webhook' });
  }
};

// =====================================================
// EQUIPE (atendentes)
// =====================================================

exports.listTeam = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, email, role, avatar FROM users
       WHERE role IN ('admin', 'teacher')
       ORDER BY name`
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar equipe' });
  }
};

// =====================================================
// BACKUPS
// =====================================================

exports.listBackups = async (req, res) => {
  try {
    const [backups] = await db.query('SELECT * FROM backup_history ORDER BY created_at DESC LIMIT 30');
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar backups' });
  }
};

exports.runBackupNow = async (req, res) => {
  try {
    const automation = require('../services/crmAutomation');
    await automation.runDatabaseBackup();
    res.json({ message: 'Backup realizado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar backup: ' + error.message });
  }
};

// =====================================================
// IMPORT EM LOTE DE LEADS (Excel)
// =====================================================

function leadNormHeader(h) {
  return String(h ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function leadCleanStr(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'richText' in v) v = v.richText.map((r) => r.text).join('');
  if (typeof v === 'object' && 'text' in v) v = v.text;
  if (typeof v === 'object' && 'result' in v) v = v.result;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).replace(/\s+/g, ' ').trim();
}

function leadDigits(s) {
  return String(s || '').replace(/\D/g, '');
}

function leadPhoneE164(raw) {
  let d = leadDigits(raw);
  if (!d) return null;
  if (d.length === 10 || d.length === 11) d = '55' + d;
  if (!(d.startsWith('55') && (d.length === 12 || d.length === 13))) return null;
  return d;
}

function leadDate(v) {
  const s = leadCleanStr(v);
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt.toISOString().slice(0, 10);
}

const LEAD_COL_MAP = {
  nome: 'name',
  cpf: 'cpf',
  rg: 'rg',
  ra: 'ra',
  datanascimento: 'data_nascimento',
  sexo: 'sexo',
  endereco: 'endereco',
  numero: 'numero',
  n: 'numero',
  complemento: 'complemento',
  bairro: 'bairro',
  cidade: 'cidade',
  estado: 'estado',
  cep: 'cep',
  telefone: 'phone',
  celular: 'phone_fallback',
  whatsapp: 'whatsapp',
  email: 'email',
  naturalidade: 'naturalidade',
  situacao: 'situacao',
  datacadastro: 'data_cadastro',
  responsavel: 'responsavel',
  whatsappresponsavel: 'responsavel_whatsapp',
  telefoneresponsavel: 'responsavel_telefone',
  escola: 'escola',
  seriegrau: 'serie_grau',
  localdetrabalho: 'local_trabalho',
  titulodeeleitor: 'titulo_eleitor',
  observacoes: 'observacoes',
};

exports.importLeads = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Envie um arquivo Excel (.xlsx)' });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const ws = workbook.worksheets[0];

    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        values[colNumber] = leadCleanStr(cell.value);
      });
      rows.push({ rowNumber, values });
    });
    if (rows.length < 2) return res.status(400).json({ error: 'Arquivo sem dados' });

    // Detecta a linha de cabeçalho (nome + cpf ou whatsapp)
    let headerRowNumber = -1;
    let colMap = {};
    for (const r of rows) {
      const found = {};
      for (const [i, v] of Object.entries(r.values)) {
        const nh = leadNormHeader(v);
        if (nh && LEAD_COL_MAP[nh]) found[LEAD_COL_MAP[nh]] = parseInt(i, 10);
      }
      if (found.name && (found.cpf || found.whatsapp)) {
        headerRowNumber = r.rowNumber;
        colMap = found;
        break;
      }
    }
    if (headerRowNumber === -1) {
      return res.status(400).json({ error: 'Cabeçalho não encontrado. Necessário colunas com Nome e CPF ou WhatsApp.' });
    }

    // CPFs e WhatsApps já cadastrados (dedup)
    const [existing] = await db.query('SELECT cpf, whatsapp, phone FROM leads');
    const cpfSet = new Set();
    const waSet = new Set();
    for (const l of existing) {
      const c = leadDigits(l.cpf);
      if (c) cpfSet.add(c);
      const w = leadDigits(l.whatsapp || l.phone);
      if (w) waSet.add(w);
    }

    const get = (row, key) => (colMap[key] ? row.values[colMap[key]] : '');
    const insertCols = [
      'name', 'email', 'phone', 'whatsapp', 'cpf', 'source', 'source_detail', 'status',
      'rg', 'ra', 'data_nascimento', 'sexo', 'endereco', 'numero', 'complemento', 'bairro',
      'cidade', 'estado', 'cep', 'naturalidade', 'situacao', 'data_cadastro',
      'responsavel', 'responsavel_whatsapp', 'responsavel_telefone',
      'escola', 'serie_grau', 'local_trabalho', 'titulo_eleitor', 'observacoes',
    ];

    const imported = [];
    const skipped = [];
    let dupCpf = 0;
    let dupWhats = 0;
    let semTelefone = 0;
    const fileName = req.file.originalname || 'importação';

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const sql = `INSERT INTO leads (${insertCols.join(', ')}) VALUES (${insertCols.map(() => '?').join(', ')})`;
      for (const r of rows) {
        if (r.rowNumber <= headerRowNumber) continue;

        const name = leadCleanStr(get(r, 'name'));
        if (!name || /^\d+$/.test(name)) {
          skipped.push({ row: r.rowNumber, reason: name ? 'linha de totais/rodapé' : 'sem nome' });
          continue;
        }
        const cpf = leadDigits(get(r, 'cpf'));
        if (cpf && cpfSet.has(cpf)) {
          dupCpf++;
          skipped.push({ row: r.rowNumber, reason: 'CPF duplicado' });
          continue;
        }
        const whatsapp = leadPhoneE164(get(r, 'whatsapp')) || leadPhoneE164(get(r, 'phone_fallback')) || leadPhoneE164(get(r, 'phone'));
        if (!cpf && whatsapp && waSet.has(whatsapp)) {
          dupWhats++;
          skipped.push({ row: r.rowNumber, reason: 'WhatsApp duplicado' });
          continue;
        }
        if (!whatsapp) semTelefone++;

        const vals = {
          name,
          email: leadCleanStr(get(r, 'email')) || null,
          phone: leadCleanStr(get(r, 'phone')) || null,
          whatsapp,
          cpf: cpf || null,
          source: 'importação',
          source_detail: fileName,
          status: 'new',
          rg: leadCleanStr(get(r, 'rg')) || null,
          ra: leadCleanStr(get(r, 'ra')) || null,
          data_nascimento: leadDate(get(r, 'data_nascimento')),
          sexo: leadCleanStr(get(r, 'sexo')) || null,
          endereco: leadCleanStr(get(r, 'endereco')) || null,
          numero: leadCleanStr(get(r, 'numero')) || null,
          complemento: leadCleanStr(get(r, 'complemento')) || null,
          bairro: leadCleanStr(get(r, 'bairro')) || null,
          cidade: leadCleanStr(get(r, 'cidade')) || null,
          estado: leadCleanStr(get(r, 'estado')) || null,
          cep: leadCleanStr(get(r, 'cep')) || null,
          naturalidade: leadCleanStr(get(r, 'naturalidade')) || null,
          situacao: leadCleanStr(get(r, 'situacao')) || 'Ativo',
          data_cadastro: leadDate(get(r, 'data_cadastro')),
          responsavel: leadCleanStr(get(r, 'responsavel')) || null,
          responsavel_whatsapp: leadPhoneE164(get(r, 'responsavel_whatsapp')),
          responsavel_telefone: leadCleanStr(get(r, 'responsavel_telefone')) || null,
          escola: leadCleanStr(get(r, 'escola')) || null,
          serie_grau: leadCleanStr(get(r, 'serie_grau')) || null,
          local_trabalho: leadCleanStr(get(r, 'local_trabalho')) || null,
          titulo_eleitor: leadCleanStr(get(r, 'titulo_eleitor')) || null,
          observacoes: leadCleanStr(get(r, 'observacoes')) || null,
        };

        await connection.query(sql, insertCols.map((c) => vals[c]));
        imported.push(r.rowNumber);
        if (cpf) cpfSet.add(cpf);
        if (whatsapp) waSet.add(whatsapp);
      }
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    res.json({
      message: `Importação concluída: ${imported.length} cadastro(s) importado(s)`,
      imported: imported.length,
      skipped: skipped.length,
      duplicatesCpf: dupCpf,
      duplicatesWhatsapp: dupWhats,
      semTelefone,
      skippedDetails: skipped.slice(0, 50),
    });
  } catch (error) {
    console.error('[Leads] Erro ao importar:', error.message);
    res.status(500).json({ error: 'Erro ao importar: ' + error.message });
  }
};

// =====================================================
// WHATSAPP CHAT EMBUTIDO (CRM)
// =====================================================

function whatsappDigits(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

const CRM_WHATSAPP_INSTANCE = 'faculdade';

async function findLeadConversation(lead) {
  const digits = whatsappDigits(lead.whatsapp || lead.phone);
  if (!digits) return null;
  const [convs] = await db.query(
    `SELECT * FROM chatbot_conversations
     WHERE phone = ? OR phone = ?
     ORDER BY (lead_id = ?) DESC, last_message_at DESC LIMIT 1`,
    [digits, `55${digits}`, lead.id]
  );
  return convs[0] || null;
}

exports.getLeadWhatsappChat = async (req, res) => {
  try {
    const [leads] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (leads.length === 0) return res.status(404).json({ error: 'Lead não encontrado' });

    const lead = leads[0];
    const digits = whatsappDigits(lead.whatsapp || lead.phone);

    const conversation = await findLeadConversation(lead);
    let messages = [];
    if (conversation) {
      const [rows] = await db.query(
        'SELECT id, conversation_id, direction, message_type, content, is_bot, created_at FROM chatbot_messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversation.id]
      );
      messages = rows;
    }

    let connected = false;
    try {
      const st = await whatsappService.getInstanceStatus(CRM_WHATSAPP_INSTANCE);
      connected = (st?.instance?.state || st?.state) === 'open';
    } catch (statusError) {
      console.error('WhatsApp status check error:', statusError.message);
    }

    res.json({ conversation, messages, whatsapp: digits, connected });
  } catch (error) {
    console.error('getLeadWhatsappChat error:', error);
    res.status(500).json({ error: 'Erro ao buscar chat do WhatsApp' });
  }
};

exports.sendLeadWhatsappMessage = async (req, res) => {
  try {
    const content = String(req.body?.content || '').trim();
    if (!content) return res.status(400).json({ error: 'Mensagem é obrigatória' });

    const [leads] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (leads.length === 0) return res.status(404).json({ error: 'Lead não encontrado' });

    const lead = leads[0];
    const digits = whatsappDigits(lead.whatsapp || lead.phone);
    if (!digits) return res.status(400).json({ error: 'Lead sem número de WhatsApp' });

    let conversation = await findLeadConversation(lead);
    if (!conversation) {
      const [result] = await db.query(
        'INSERT INTO chatbot_conversations (phone, contact_name, status, lead_id) VALUES (?, ?, ?, ?)',
        [digits, lead.name, 'human', lead.id]
      );
      conversation = { id: result.insertId };
    } else if (conversation.lead_id !== lead.id) {
      await db.query('UPDATE chatbot_conversations SET lead_id = ? WHERE id = ?', [lead.id, conversation.id]);
    }

    // Atendimento humano: evita resposta automática do bot no meio do atendimento
    await db.query("UPDATE chatbot_conversations SET status = 'human' WHERE id = ?", [conversation.id]);

    const [msgResult] = await db.query(
      "INSERT INTO chatbot_messages (conversation_id, direction, message_type, content, is_bot) VALUES (?, 'outbound', 'text', ?, 0)",
      [conversation.id, content]
    );
    await db.query('UPDATE chatbot_conversations SET last_message_at = NOW() WHERE id = ?', [conversation.id]);

    let sendError = null;
    try {
      await whatsappService.sendMessage(digits, content, CRM_WHATSAPP_INSTANCE);
    } catch (waError) {
      sendError = waError.message;
      console.error('WhatsApp CRM send failed:', waError.message);
    }

    try {
      await db.query(
        "INSERT INTO lead_interactions (lead_id, type, direction, subject, message) VALUES (?, 'whatsapp', 'outbound', NULL, ?)",
        [lead.id, content]
      );
    } catch (intError) {
      console.error('Erro ao registrar interação do chat:', intError.message);
    }

    const [newMsg] = await db.query(
      'SELECT id, conversation_id, direction, message_type, content, is_bot, created_at FROM chatbot_messages WHERE id = ?',
      [msgResult.insertId]
    );

    res.status(201).json({ message: newMsg[0], conversation_id: conversation.id, sendError });
  } catch (error) {
    console.error('sendLeadWhatsappMessage error:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};
