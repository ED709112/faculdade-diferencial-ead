const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

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
