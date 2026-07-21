const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const ALL_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'courses', label: 'Cursos' },
  { key: 'categories', label: 'Categorias' },
  { key: 'teachers', label: 'Professores' },
  { key: 'students', label: 'Alunos' },
  { key: 'enrollments', label: 'Matrículas' },
  { key: 'durations', label: 'Duração dos Cursos' },
  { key: 'coupons', label: 'Cupons' },
  { key: 'products', label: 'Produtos' },
  { key: 'financial', label: 'Financeiro' },
  { key: 'badges', label: 'Badges' },
  { key: 'settings', label: 'Configurações' },
  { key: 'users', label: 'Usuários' },
  { key: 'banners', label: 'Banners' },
  { key: 'news', label: 'Notícias' },
  { key: 'logs', label: 'Logs' },
  { key: 'admin_managers', label: 'Gerenciar Admins' },
];

router.use(authenticate, authorize('admin'));

const requireMaster = (req, res, next) => {
  if (req.user.admin_level !== 'master') {
    return res.status(403).json({ error: 'Apenas administradores master podem acessar este recurso.' });
  }
  next();
};

router.get('/permissions-list', requireMaster, (req, res) => {
  res.json(ALL_PERMISSIONS);
});

router.get('/admins', requireMaster, async (req, res) => {
  try {
    const [admins] = await db.query(
      `SELECT id, name, email, role, admin_level, is_active, created_at
       FROM users WHERE role = 'admin' ORDER BY admin_level DESC, name ASC`
    );

    for (const admin of admins) {
      if (admin.admin_level === 'limited') {
        const [perms] = await db.query(
          'SELECT permission_key FROM admin_permissions WHERE user_id = ?',
          [admin.id]
        );
        admin.permissions = perms.map(p => p.permission_key);
      } else {
        admin.permissions = ALL_PERMISSIONS.map(p => p.key);
      }
    }

    res.json(admins);
  } catch (error) {
    console.error('Erro ao listar admins:', error);
    res.status(500).json({ error: 'Erro ao listar administradores.' });
  }
});

router.post('/admins', requireMaster, async (req, res) => {
  try {
    const { name, email, password, admin_level, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Este email já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, admin_level) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'admin', admin_level || 'limited']
    );

    const userId = result.insertId;

    if (admin_level === 'limited' && permissions && permissions.length > 0) {
      const values = permissions.map(p => [userId, p]);
      await db.query(
        'INSERT INTO admin_permissions (user_id, permission_key) VALUES ?',
        [values]
      );
    }

    res.status(201).json({ success: true, message: 'Administrador criado com sucesso.', id: userId });
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    res.status(500).json({ error: 'Erro ao criar administrador.' });
  }
});

router.put('/admins/:id', requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, admin_level, permissions, is_active } = req.body;

    if (parseInt(id) === req.user.id && admin_level === 'limited') {
      return res.status(400).json({ error: 'Você não pode rebaixar seu próprio nível.' });
    }

    const [existing] = await db.query('SELECT id, admin_level FROM users WHERE id = ? AND role = "admin"', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Administrador não encontrado.' });
    }

    let query = 'UPDATE users SET name = ?, email = ?, admin_level = ?, is_active = ?';
    const params = [name, email, admin_level || 'limited', is_active !== undefined ? is_active : 1];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    await db.query(query, params);

    await db.query('DELETE FROM admin_permissions WHERE user_id = ?', [id]);

    if (admin_level === 'limited' && permissions && permissions.length > 0) {
      const values = permissions.map(p => [parseInt(id), p]);
      await db.query(
        'INSERT INTO admin_permissions (user_id, permission_key) VALUES ?',
        [values]
      );
    }

    res.json({ success: true, message: 'Administrador atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar admin:', error);
    res.status(500).json({ error: 'Erro ao atualizar administrador.' });
  }
});

router.delete('/admins/:id', requireMaster, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário.' });
    }

    const [admin] = await db.query('SELECT id FROM users WHERE id = ? AND role = "admin"', [id]);
    if (admin.length === 0) {
      return res.status(404).json({ error: 'Administrador não encontrado.' });
    }

    await db.query('DELETE FROM admin_permissions WHERE user_id = ?', [id]);
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ success: true, message: 'Administrador excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir admin:', error);
    res.status(500).json({ error: 'Erro ao excluir administrador.' });
  }
});

module.exports = router;
