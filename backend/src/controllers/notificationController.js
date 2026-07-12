const db = require('../config/database');
const { paginate, paginateResult } = require('../utils/pagination');

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [req.user.id]
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT id, title, message, type, link, is_read, read_at, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      page, limit
    );

    const [notifications] = await db.query(query, [req.user.id, limit, offset]);

    res.json({
      data: notifications,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({ error: 'Erro ao listar notificações.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const [notifications] = await db.query(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }

    await db.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?',
      [id]
    );

    res.json({ message: 'Notificação marcada como lida.' });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificação.' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({ message: 'Todas as notificações marcadas como lidas.' });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    res.status(500).json({ error: 'Erro ao atualizar notificações.' });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({ unread_count: result[0].count });
  } catch (error) {
    console.error('Erro ao buscar contagem de notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações.' });
  }
};

module.exports = {
  getAll,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
