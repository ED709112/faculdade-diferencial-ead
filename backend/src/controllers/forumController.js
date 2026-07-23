const db = require('../config/database');

const getPosts = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { module_id, page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'fp.course_id = ?';
    const params = [courseId];

    if (module_id) {
      where += ' AND fp.module_id = ?';
      params.push(parseInt(module_id));
    }
    if (search) {
      where += ' AND (fp.title LIKE ? OR fp.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM forum_posts fp WHERE ${where}`,
      params
    );

    const [posts] = await db.query(
      `SELECT fp.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role,
              m.title as module_title
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       LEFT JOIN modules m ON fp.module_id = m.id
       WHERE ${where}
       ORDER BY fp.is_pinned DESC, fp.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: posts,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar posts do fórum:', error);
    res.status(500).json({ error: 'Erro ao listar posts.' });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('UPDATE forum_posts SET view_count = view_count + 1 WHERE id = ?', [id]);

    const [posts] = await db.query(
      `SELECT fp.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role,
              m.title as module_title
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       LEFT JOIN modules m ON fp.module_id = m.id
       WHERE fp.id = ?`,
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    const [replies] = await db.query(
      `SELECT fr.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role
       FROM forum_replies fr
       JOIN users u ON fr.user_id = u.id
       WHERE fr.post_id = ?
       ORDER BY fr.is_solution DESC, fr.created_at ASC`,
      [id]
    );

    res.json({ ...posts[0], replies });
  } catch (error) {
    console.error('Erro ao buscar post:', error);
    res.status(500).json({ error: 'Erro ao buscar post.' });
  }
};

const createPost = async (req, res) => {
  try {
    const { course_id, module_id, title, content } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    }

    const [enrollment] = await db.query(
      `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'active'`,
      [req.user.id, course_id]
    );

    if (enrollment.length === 0 && req.user.role === 'student') {
      return res.status(403).json({ error: 'Você não está matriculado neste curso.' });
    }

    const [result] = await db.query(
      `INSERT INTO forum_posts (course_id, module_id, user_id, title, content)
       VALUES (?, ?, ?, ?, ?)`,
      [course_id, module_id || null, req.user.id, title.trim(), content.trim()]
    );

    const [post] = await db.query(
      `SELECT fp.*, u.name as author_name, u.avatar as author_avatar
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       WHERE fp.id = ?`,
      [result.insertId]
    );

    // Award points for forum post (+5 pts)
    if (req.user.role === 'student') {
      await db.query(
        'INSERT INTO user_points (user_id, points, reason, reference_type, reference_id) VALUES (?, 5, ?, ?, ?)',
        [req.user.id, 'Post no fórum', 'forum_post', result.insertId]
      );
    }

    res.status(201).json(post[0]);
  } catch (error) {
    console.error('Erro ao criar post:', error);
    res.status(500).json({ error: 'Erro ao criar post.' });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, is_pinned, is_resolved } = req.body;

    const [posts] = await db.query('SELECT * FROM forum_posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    if (posts[0].user_id !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (content !== undefined) { fields.push('content = ?'); values.push(content); }
    if (is_pinned !== undefined && req.user.role !== 'student') { fields.push('is_pinned = ?'); values.push(is_pinned ? 1 : 0); }
    if (is_resolved !== undefined) {
      if (req.user.role !== 'student' || posts[0].user_id === req.user.id) {
        fields.push('is_resolved = ?'); values.push(is_resolved ? 1 : 0);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE forum_posts SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query(
      `SELECT fp.*, u.name as author_name FROM forum_posts fp JOIN users u ON fp.user_id = u.id WHERE fp.id = ?`,
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar post:', error);
    res.status(500).json({ error: 'Erro ao atualizar post.' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const [posts] = await db.query('SELECT * FROM forum_posts WHERE id = ?', [id]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    if (posts[0].user_id !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    await db.query('DELETE FROM forum_posts WHERE id = ?', [id]);
    res.json({ message: 'Post excluído.' });
  } catch (error) {
    console.error('Erro ao excluir post:', error);
    res.status(500).json({ error: 'Erro ao excluir post.' });
  }
};

const createReply = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Conteúdo é obrigatório.' });
    }

    const [posts] = await db.query('SELECT id, course_id FROM forum_posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado.' });
    }

    const [enrollment] = await db.query(
      `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'active'`,
      [req.user.id, posts[0].course_id]
    );

    if (enrollment.length === 0 && req.user.role === 'student') {
      return res.status(403).json({ error: 'Você não está matriculado neste curso.' });
    }

    const [result] = await db.query(
      'INSERT INTO forum_replies (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, req.user.id, content.trim()]
    );

    await db.query('UPDATE forum_posts SET replies_count = replies_count + 1 WHERE id = ?', [postId]);

    // Award points for forum reply (+3 pts)
    if (req.user.role === 'student') {
      await db.query(
        'INSERT INTO user_points (user_id, points, reason, reference_type, reference_id) VALUES (?, 3, ?, ?, ?)',
        [req.user.id, 'Resposta no fórum', 'forum_reply', result.insertId]
      );
    }

    const [reply] = await db.query(
      `SELECT fr.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role
       FROM forum_replies fr
       JOIN users u ON fr.user_id = u.id
       WHERE fr.id = ?`,
      [result.insertId]
    );

    res.status(201).json(reply[0]);
  } catch (error) {
    console.error('Erro ao criar resposta:', error);
    res.status(500).json({ error: 'Erro ao criar resposta.' });
  }
};

const markSolution = async (req, res) => {
  try {
    const { replyId } = req.params;

    const [replies] = await db.query(
      `SELECT fr.*, fp.user_id as post_author_id
       FROM forum_replies fr
       JOIN forum_posts fp ON fr.post_id = fp.id
       WHERE fr.id = ?`,
      [replyId]
    );

    if (replies.length === 0) {
      return res.status(404).json({ error: 'Resposta não encontrada.' });
    }

    const reply = replies[0];
    if (reply.post_author_id !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ error: 'Apenas o autor do post pode marcar como solução.' });
    }

    await db.query('UPDATE forum_replies SET is_solution = 0 WHERE post_id = ?', [reply.post_id]);
    await db.query('UPDATE forum_replies SET is_solution = 1 WHERE id = ?', [replyId]);
    await db.query('UPDATE forum_posts SET is_resolved = 1 WHERE id = ?', [reply.post_id]);

    res.json({ message: 'Resposta marcada como solução.' });
  } catch (error) {
    console.error('Erro ao marcar solução:', error);
    res.status(500).json({ error: 'Erro ao marcar solução.' });
  }
};

const deleteReply = async (req, res) => {
  try {
    const { replyId } = req.params;

    const [replies] = await db.query(
      `SELECT fr.*, fp.user_id as post_author_id
       FROM forum_replies fr
       JOIN forum_posts fp ON fr.post_id = fp.id
       WHERE fr.id = ?`,
      [replyId]
    );

    if (replies.length === 0) {
      return res.status(404).json({ error: 'Resposta não encontrada.' });
    }

    if (replies[0].user_id !== req.user.id && req.user.role === 'student') {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    await db.query('DELETE FROM forum_replies WHERE id = ?', [replyId]);
    await db.query('UPDATE forum_posts SET replies_count = GREATEST(0, replies_count - 1) WHERE id = ?', [replies[0].post_id]);

    res.json({ message: 'Resposta excluída.' });
  } catch (error) {
    console.error('Erro ao excluir resposta:', error);
    res.status(500).json({ error: 'Erro ao excluir resposta.' });
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  createReply,
  markSolution,
  deleteReply,
};
