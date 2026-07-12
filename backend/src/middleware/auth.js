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
      'SELECT id, name, email, role, is_active, avatar FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' });
    }

    req.user = users[0];
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
        'SELECT id, name, email, role, is_active, avatar FROM users WHERE id = ? AND is_active = 1',
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

module.exports = { authenticate, authorize, optionalAuth };
