const db = require('../config/database');
const { paginate, paginateResult } = require('../utils/pagination');
const { sendEmail, emailTemplates } = require('../services/emailService');

const getConversations = async (req, res) => {
  try {
    const [conversations] = await db.query(
      `SELECT c.id, c.course_id, c.updated_at,
              co.title as course_title,
              (SELECT m.message FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
              (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at,
              (SELECT m.sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_sender_id,
              (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = 0 AND sender_id != ?) as unread_count
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       LEFT JOIN courses co ON c.course_id = co.id
       WHERE cp.user_id = ?
       ORDER BY last_message_at DESC, c.updated_at DESC`,
      [req.user.id, req.user.id]
    );

    for (const conv of conversations) {
      const [participants] = await db.query(
        `SELECT u.id, u.name, u.avatar, u.role
         FROM conversation_participants cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.conversation_id = ? AND u.id != ?`,
        [conv.id, req.user.id]
      );
      conv.other_participants = participants;
      conv.unread_count = parseInt(conv.unread_count);
    }

    res.json(conversations);
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: 'Erro ao listar conversas.' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const [participant] = await db.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversationId, req.user.id]
    );

    if (participant.length === 0) {
      return res.status(403).json({ error: 'Você não participa desta conversa.' });
    }

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM messages WHERE conversation_id = ?',
      [conversationId]
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, u.role as sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at DESC`,
      page, limit
    );

    const [messages] = await db.query(query, [conversationId, limit, offset]);

    await db.query(
      'UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?',
      [conversationId, req.user.id]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        userId: req.user.id
      });
    }

    res.json({
      data: messages.reverse(),
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    res.status(500).json({ error: 'Erro ao listar mensagens.' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversation_id, message, attachment_url } = req.body;

    const [participant] = await db.query(
      'SELECT id FROM conversation_participants WHERE conversation_id = ? AND user_id = ?',
      [conversation_id, req.user.id]
    );

    if (participant.length === 0) {
      return res.status(403).json({ error: 'Você não participa desta conversa.' });
    }

    const [result] = await db.query(
      'INSERT INTO messages (conversation_id, sender_id, message, attachment_url) VALUES (?, ?, ?, ?)',
      [conversation_id, req.user.id, message, attachment_url || null]
    );

    await db.query('UPDATE conversations SET updated_at = NOW() WHERE id = ?', [conversation_id]);

    const [newMessage] = await db.query(
      `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, u.role as sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    const [participants] = await db.query(
      'SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id != ?',
      [conversation_id, req.user.id]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversation_id}`).emit('new_message', {
        conversation_id,
        message: newMessage[0]
      });
    }

    const [conv] = await db.query(
      `SELECT co.title, c.course_id FROM conversations c
       LEFT JOIN courses co ON c.course_id = co.id
       WHERE c.id = ?`,
      [conversation_id]
    );

    for (const p of participants) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, 'Nova mensagem', ?, 'info', ?)`,
        [p.user_id, `Nova mensagem de ${req.user.name}`, `/mensagens/${conversation_id}`]
      );

      const [user] = await db.query('SELECT email, name FROM users WHERE id = ?', [p.user_id]);
      if (user.length > 0 && user[0].email) {
        const messagePreview = message.length > 100 ? message.substring(0, 100) + '...' : message;
        await sendEmail({
          to: user[0].email,
          ...emailTemplates.newMessage(req.user.name, conv.length > 0 ? conv[0].title : null, messagePreview)
        });
      }

      if (io) {
        const [userSocket] = await db.query('SELECT id FROM users WHERE id = ?', [p.user_id]);
        io.to(`user_${p.user_id}`).emit('new_notification', {
          title: 'Nova mensagem',
          message: `Nova mensagem de ${req.user.name}`,
          link: `/mensagens/${conversation_id}`
        });
      }
    }

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem.' });
  }
};

const createConversation = async (req, res) => {
  try {
    const { participant_ids, course_id, initial_message } = req.body;

    if (!Array.isArray(participant_ids) || participant_ids.length === 0) {
      return res.status(400).json({ error: 'Lista de participantes é obrigatória.' });
    }

    if (!participant_ids.includes(req.user.id)) {
      participant_ids.push(req.user.id);
    }

    const allIds = [...new Set(participant_ids)];

    if (allIds.length < 2) {
      return res.status(400).json({ error: 'É necessário pelo menos 2 participantes.' });
    }

    const [existingConv] = await db.query(
      `SELECT c.id, COUNT(cp.id) as participants_count
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       GROUP BY c.id
       HAVING participants_count = ? AND
         (SELECT COUNT(*) FROM conversation_participants cp2
          WHERE cp2.conversation_id = c.id AND cp2.user_id IN (${allIds.map(() => '?').join(',')})) = ?`,
      [allIds.length, ...allIds, allIds.length]
    );

    if (existingConv.length > 0) {
      const [participants] = await db.query(
        'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
        [existingConv[0].id]
      );
      const existingIds = participants.map(p => p.user_id);
      const allMatch = allIds.every(id => existingIds.includes(id)) && existingIds.every(id => allIds.includes(id));

      if (allMatch) {
        return res.json({ conversation_id: existingConv[0].id, message: 'Conversa já existe.' });
      }
    }

    const [convResult] = await db.query(
      'INSERT INTO conversations (course_id) VALUES (?)',
      [course_id || null]
    );

    for (const userId of allIds) {
      await db.query(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)',
        [convResult.insertId, userId]
      );
    }

    if (initial_message) {
      await db.query(
        'INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)',
        [convResult.insertId, req.user.id, initial_message]
      );
    }

    const [conversation] = await db.query(
      `SELECT c.*, co.title as course_title
       FROM conversations c
       LEFT JOIN courses co ON c.course_id = co.id
       WHERE c.id = ?`,
      [convResult.insertId]
    );

    const [participants] = await db.query(
      `SELECT u.id, u.name, u.avatar, u.role
       FROM conversation_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.conversation_id = ?`,
      [convResult.insertId]
    );
    conversation[0].participants = participants;

    res.status(201).json(conversation[0]);
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    res.status(500).json({ error: 'Erro ao criar conversa.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await db.query(
      'UPDATE conversation_participants SET last_read_at = NOW() WHERE conversation_id = ? AND user_id = ?',
      [conversationId, req.user.id]
    );

    await db.query(
      `UPDATE messages SET is_read = 1, read_at = NOW()
       WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
      [conversationId, req.user.id]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('messages_read', {
        conversationId,
        userId: req.user.id
      });
    }

    res.json({ message: 'Mensagens marcadas como lidas.' });
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({ error: 'Erro ao atualizar mensagens.' });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  createConversation,
  markAsRead
};
