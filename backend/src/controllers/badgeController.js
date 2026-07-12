const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [badges] = await db.query(
      'SELECT * FROM badges WHERE is_active = 1 ORDER BY points ASC'
    );
    res.json(badges);
  } catch (error) {
    console.error('Erro ao listar badges:', error);
    res.status(500).json({ error: 'Erro ao listar badges.' });
  }
};

const getUserBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    const [badges] = await db.query(
      `SELECT b.*, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    const [allBadges] = await db.query(
      'SELECT * FROM badges WHERE is_active = 1 ORDER BY points ASC'
    );

    const [pointsResult] = await db.query(
      'SELECT COALESCE(SUM(points), 0) as total_points FROM user_points WHERE user_id = ?',
      [userId]
    );

    const totalPoints = pointsResult[0].total_points;

    const [history] = await db.query(
      `SELECT up.*, b.name as badge_name
       FROM user_points up
       LEFT JOIN badges b ON up.reference_type = 'badge' AND up.reference_id = b.id
       WHERE up.user_id = ?
       ORDER BY up.created_at DESC
       LIMIT 20`,
      [userId]
    );

    const [rankResult] = await db.query(
      `SELECT COUNT(*) + 1 as rank
       FROM (
         SELECT user_id, SUM(points) as total
         FROM user_points
         GROUP BY user_id
         HAVING total > ?
       ) AS higher`,
      [totalPoints]
    );

    res.json({
      earned: badges,
      all: allBadges,
      total_points: totalPoints,
      rank: rankResult[0].rank,
      history,
    });
  } catch (error) {
    console.error('Erro ao buscar badges do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar badges.' });
  }
};

const awardBadge = async (req, res) => {
  try {
    const { user_id, badge_id } = req.body;

    const [existing] = await db.query(
      'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
      [user_id, badge_id]
    );

    if (existing.length > 0) {
      return res.json({ message: 'Badge já concedida.' });
    }

    await db.query(
      'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
      [user_id, badge_id]
    );

    const [badge] = await db.query('SELECT points FROM badges WHERE id = ?', [badge_id]);
    if (badge.length > 0 && badge[0].points > 0) {
      await db.query(
        'INSERT INTO user_points (user_id, points, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
        [user_id, badge[0].points, `Badge conquistada`, 'badge', badge_id]
      );
    }

    console.log(`Badge ${badge_id} concedida ao usuário ${user_id}`);
    res.json({ message: 'Badge concedida com sucesso.' });
  } catch (error) {
    console.error('Erro ao conceder badge:', error);
    res.status(500).json({ error: 'Erro ao conceder badge.' });
  }
};

const addPoints = async (req, res) => {
  try {
    const { user_id, points, reason, reference_type, reference_id } = req.body;

    if (!user_id || !points || !reason) {
      return res.status(400).json({ error: 'user_id, points e reason são obrigatórios.' });
    }

    await db.query(
      'INSERT INTO user_points (user_id, points, reason, reference_type, reference_id) VALUES (?, ?, ?, ?, ?)',
      [user_id, points, reason, reference_type || null, reference_id || null]
    );

    res.json({ message: 'Pontos adicionados com sucesso.' });
  } catch (error) {
    console.error('Erro ao adicionar pontos:', error);
    res.status(500).json({ error: 'Erro ao adicionar pontos.' });
  }
};

const getRanking = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const [ranking] = await db.query(
      `SELECT u.id, u.name, u.avatar,
              COALESCE(SUM(up.points), 0) as total_points,
              (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badge_count
       FROM users u
       LEFT JOIN user_points up ON u.id = up.user_id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY total_points DESC
       LIMIT ?`,
      [limit]
    );

    const currentUserRank = await db.query(
      `SELECT COUNT(*) + 1 as rank
       FROM (
         SELECT user_id, SUM(points) as total
         FROM user_points
         GROUP BY user_id
         HAVING total > (
           SELECT COALESCE(SUM(points), 0) FROM user_points WHERE user_id = ?
         )
       ) AS higher`,
      [req.user.id]
    );

    const [currentUser] = await db.query(
      `SELECT COALESCE(SUM(points), 0) as total_points,
              (SELECT COUNT(*) FROM user_badges WHERE user_id = ?) as badge_count
       FROM user_points WHERE user_id = ?`,
      [req.user.id, req.user.id]
    );

    res.json({
      ranking,
      me: {
        rank: currentUserRank[0].rank,
        total_points: currentUser[0].total_points,
        badge_count: currentUser[0].badge_count,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    res.status(500).json({ error: 'Erro ao buscar ranking.' });
  }
};

const createBadge = async (req, res) => {
  try {
    const { name, description, icon, criteria, points } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório.' });
    }

    const [result] = await db.query(
      'INSERT INTO badges (name, description, icon, criteria, points) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, icon || null, criteria || null, points || 0]
    );

    const [badge] = await db.query('SELECT * FROM badges WHERE id = ?', [result.insertId]);
    res.status(201).json(badge[0]);
  } catch (error) {
    console.error('Erro ao criar badge:', error);
    res.status(500).json({ error: 'Erro ao criar badge.' });
  }
};

const updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, criteria, points, is_active } = req.body;

    await db.query(
      `UPDATE badges SET name = COALESCE(?, name), description = COALESCE(?, description),
       icon = COALESCE(?, icon), criteria = COALESCE(?, criteria),
       points = COALESCE(?, points), is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, description, icon, criteria, points, is_active, id]
    );

    const [badge] = await db.query('SELECT * FROM badges WHERE id = ?', [id]);
    res.json(badge[0]);
  } catch (error) {
    console.error('Erro ao atualizar badge:', error);
    res.status(500).json({ error: 'Erro ao atualizar badge.' });
  }
};

const deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM badges WHERE id = ?', [id]);
    res.json({ message: 'Badge removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover badge:', error);
    res.status(500).json({ error: 'Erro ao remover badge.' });
  }
};

const getAllAdmin = async (req, res) => {
  try {
    const [badges] = await db.query(
      `SELECT b.*,
              (SELECT COUNT(*) FROM user_badges WHERE badge_id = b.id) as awarded_count
       FROM badges b
       ORDER BY b.points ASC`
    );
    res.json(badges);
  } catch (error) {
    console.error('Erro ao listar badges (admin):', error);
    res.status(500).json({ error: 'Erro ao listar badges.' });
  }
};

module.exports = {
  getAll,
  getUserBadges,
  awardBadge,
  addPoints,
  getRanking,
  createBadge,
  updateBadge,
  deleteBadge,
  getAllAdmin,
};
