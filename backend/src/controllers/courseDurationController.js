const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { course_id, status } = req.query;
    let query = `
      SELECT cd.*, c.title as course_title, m.title as module_title,
             u.name as student_name, u.email as student_email
      FROM course_durations cd
      JOIN courses c ON cd.course_id = c.id
      LEFT JOIN modules m ON cd.module_id = m.id
      LEFT JOIN enrollments e ON cd.enrollment_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) {
      query += ' AND cd.course_id = ?';
      params.push(course_id);
    }
    if (status) {
      query += ' AND cd.status = ?';
      params.push(status);
    }

    query += ' ORDER BY cd.end_date ASC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar durações:', error);
    res.status(500).json({ error: 'Erro ao buscar durações.' });
  }
};

const getByStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(`
      SELECT cd.*, c.title as course_title, c.slug as course_slug,
             m.title as module_title,
             CASE
               WHEN cd.end_date < NOW() THEN 'expired'
               WHEN cd.end_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR) THEN 'warning'
               ELSE 'active'
             END as alert_status,
             TIMESTAMPDIFF(HOUR, NOW(), cd.end_date) as hours_remaining
      FROM course_durations cd
      JOIN courses c ON cd.course_id = c.id
      LEFT JOIN modules m ON cd.module_id = m.id
      JOIN enrollments e ON cd.enrollment_id = e.id
      WHERE e.user_id = ? AND cd.status = 'active'
      ORDER BY cd.end_date ASC
    `, [userId]);

    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar calendário do aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar calendário.' });
  }
};

const create = async (req, res) => {
  try {
    const { course_id, module_id, enrollment_id, title, start_date, end_date, duration_days } = req.body;

    if (!course_id || !title || !start_date || !end_date) {
      return res.status(400).json({ error: 'course_id, title, start_date e end_date são obrigatórios.' });
    }

    const [result] = await db.query(
      `INSERT INTO course_durations (course_id, module_id, enrollment_id, title, start_date, end_date, duration_days, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [course_id, module_id || null, enrollment_id || null, title, start_date, end_date, duration_days || null]
    );

    res.status(201).json({ message: 'Duração criada com sucesso.', id: result.insertId });
  } catch (error) {
    console.error('Erro ao criar duração:', error);
    res.status(500).json({ error: 'Erro ao criar duração.' });
  }
};

const createBulk = async (req, res) => {
  try {
    const { course_id, enrollments, durations } = req.body;

    if (!course_id || !durations || !Array.isArray(durations)) {
      return res.status(400).json({ error: 'course_id e durations[] são obrigatórios.' });
    }

    const results = [];

    for (const dur of durations) {
      if (enrollments && Array.isArray(enrollments)) {
        for (const enrollmentId of enrollments) {
          const [result] = await db.query(
            `INSERT INTO course_durations (course_id, module_id, enrollment_id, title, start_date, end_date, duration_days, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
            [course_id, dur.module_id || null, enrollmentId, dur.title, dur.start_date, dur.end_date, dur.duration_days || null]
          );
          results.push({ id: result.insertId, enrollment_id: enrollmentId });
        }
      } else {
        const [result] = await db.query(
          `INSERT INTO course_durations (course_id, module_id, enrollment_id, title, start_date, end_date, duration_days, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
          [course_id, dur.module_id || null, null, dur.title, dur.start_date, dur.end_date, dur.duration_days || null]
        );
        results.push({ id: result.insertId });
      }
    }

    res.status(201).json({ message: `${results.length} durações criadas.`, items: results });
  } catch (error) {
    console.error('Erro ao criar durações em lote:', error);
    res.status(500).json({ error: 'Erro ao criar durações em lote.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, start_date, end_date, duration_days, status } = req.body;

    const fields = [];
    const params = [];

    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (start_date !== undefined) { fields.push('start_date = ?'); params.push(start_date); }
    if (end_date !== undefined) { fields.push('end_date = ?'); params.push(end_date); }
    if (duration_days !== undefined) { fields.push('duration_days = ?'); params.push(duration_days); }
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    params.push(id);
    await db.query(`UPDATE course_durations SET ${fields.join(', ')} WHERE id = ?`, params);

    res.json({ message: 'Duração atualizada.' });
  } catch (error) {
    console.error('Erro ao atualizar duração:', error);
    res.status(500).json({ error: 'Erro ao atualizar duração.' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM course_durations WHERE id = ?', [id]);
    res.json({ message: 'Duração excluída.' });
  } catch (error) {
    console.error('Erro ao excluir duração:', error);
    res.status(500).json({ error: 'Erro ao excluir duração.' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(`
      SELECT sn.*, c.title as course_title
      FROM student_notifications sn
      LEFT JOIN courses c ON sn.course_id = c.id
      WHERE sn.user_id = ?
      ORDER BY sn.created_at DESC
      LIMIT 50
    `, [userId]);

    const unreadCount = rows.filter(r => !r.is_read).length;

    res.json({ notifications: rows, unread_count: unreadCount });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await db.query('UPDATE student_notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Notificação marcada como lida.' });
  } catch (error) {
    console.error('Erro ao marcar notificação:', error);
    res.status(500).json({ error: 'Erro ao marcar notificação.' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('UPDATE student_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
    res.json({ message: 'Todas notificações marcadas como lidas.' });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({ error: 'Erro ao marcar notificações.' });
  }
};

const checkAlerts = async (req, res) => {
  try {
    const [expiring] = await db.query(`
      SELECT cd.*, e.user_id, c.title as course_title, u.name as student_name
      FROM course_durations cd
      JOIN enrollments e ON cd.enrollment_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON cd.course_id = c.id
      WHERE cd.status = 'active'
        AND cd.end_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR)
        AND cd.end_date > NOW()
        AND cd.alert_sent_24h = 0
    `);

    let alertsCreated = 0;

    for (const item of expiring) {
      const hoursLeft = Math.round((new Date(item.end_date) - new Date()) / (1000 * 60 * 60));

      await db.query(
        `INSERT INTO student_notifications (user_id, type, title, message, course_id, duration_id)
         VALUES (?, 'deadline_24h', ?, ?, ?, ?)`,
        [
          item.user_id,
          `Prazo se encerrando!`,
          `O período da disciplina "${item.title}" do curso "${item.course_title}" encerra em ${hoursLeft} horas.`,
          item.course_id,
          item.id,
        ]
      );

      await db.query('UPDATE course_durations SET alert_sent_24h = 1 WHERE id = ?', [item.id]);
      alertsCreated++;
    }

    const [expired] = await db.query(`
      SELECT cd.*, e.user_id, c.title as course_title
      FROM course_durations cd
      JOIN enrollments e ON cd.enrollment_id = e.id
      JOIN courses c ON cd.course_id = c.id
      WHERE cd.status = 'active' AND cd.end_date <= NOW() AND cd.alert_sent = 0
    `);

    for (const item of expired) {
      await db.query(
        `INSERT INTO student_notifications (user_id, type, title, message, course_id, duration_id)
         VALUES (?, 'deadline_expired', ?, ?, ?, ?)`,
        [
          item.user_id,
          `Prazo encerrado!`,
          `O período da disciplina "${item.title}" do curso "${item.course_title}" foi encerrado.`,
          item.course_id,
          item.id,
        ]
      );

      await db.query("UPDATE course_durations SET alert_sent = 1, status = 'expired' WHERE id = ?", [item.id]);
      alertsCreated++;
    }

    res.json({ alerts_created: alertsCreated, expiring_count: expiring.length, expired_count: expired.length });
  } catch (error) {
    console.error('Erro ao verificar alertas:', error);
    res.status(500).json({ error: 'Erro ao verificar alertas.' });
  }
};

module.exports = {
  getAll,
  getByStudent,
  create,
  createBulk,
  update,
  remove,
  getNotifications,
  markAsRead,
  markAllAsRead,
  checkAlerts,
};
