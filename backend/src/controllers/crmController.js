const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const ExcelJS = require('exceljs');
const axios = require('axios');

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
