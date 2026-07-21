const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Acesso negado. Faça login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await db.query(
      'SELECT id, name, email, role, admin_level, is_active, avatar FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' });
    }

    req.user = users[0];

    if (req.user.role === 'admin') {
      const [perms] = await db.query(
        'SELECT permission_key FROM admin_permissions WHERE user_id = ?',
        [req.user.id]
      );
      req.user.permissions = perms.map(p => p.permission_key);
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    res.status(500).json({ error: 'Erro ao autenticar usuário.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso negado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para esta ação.' });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const [users] = await db.query(
        'SELECT id, name, email, role, admin_level, is_active, avatar FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId]
      );
      if (users.length > 0) {
        req.user = users[0];
      }
    }
  } catch (error) {
    // Ignorar erros de token em auth opcional
  }
  next();
};

const checkPermission = (...allowedPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Acesso negado.' });
    }
    if (req.user.role !== 'admin') {
      return next();
    }
    if (req.user.admin_level === 'master') {
      return next();
    }
    const hasPermission = allowedPermissions.some(p => req.user.permissions?.includes(p));
    if (!hasPermission) {
      return res.status(403).json({ error: 'Sem permissão para acessar este recurso.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize, optionalAuth, checkPermission };
