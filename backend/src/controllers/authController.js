const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../services/emailService');

const generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, lgpd_consent } = req.body;

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, phone, email_verified_at, lgpd_consent, lgpd_consent_at)
       VALUES (?, ?, ?, ?, NULL, ?, NOW())`,
      [name, email, hashedPassword, phone || null, lgpd_consent ? 1 : 0]
    );

    const userId = result.insertId;
    const token = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);

    const verificationUrl = `${process.env.FRONTEND_URL}/verificar-email?token=${verificationToken}`;
    await sendEmail({
      to: email,
      ...emailTemplates.welcome(name, verificationUrl)
    });

    await db.query(
      `UPDATE users SET refresh_token = ? WHERE id = ?`,
      [refreshToken, userId]
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: userId,
        name,
        email,
        role: 'student',
        avatar: null,
        is_active: 1
      }
    });

    console.log(`Novo usuário registrado: ${email} (ID: ${userId})`);
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Conta desativada. Entre em contato com o suporte.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await db.query(
      'UPDATE users SET last_login = NOW(), refresh_token = ? WHERE id = ?',
      [refreshToken, user.id]
    );

    let permissions = [];
    if (user.role === 'admin') {
      const [perms] = await db.query(
        'SELECT permission_key FROM admin_permissions WHERE user_id = ?',
        [user.id]
      );
      permissions = perms.map(p => p.permission_key);
    }

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        admin_level: user.admin_level,
        permissions,
        avatar: user.avatar,
        phone: user.phone,
        is_active: user.is_active,
        email_verified_at: user.email_verified_at
      }
    });

    console.log(`Login: ${email}`);
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token de verificação não fornecido.' });
    }

    const [users] = await db.query(
      'SELECT id, email_verified_at FROM users WHERE verification_token = ?',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Token de verificação inválido.' });
    }

    if (users[0].email_verified_at) {
      return res.json({ message: 'E-mail já verificado.' });
    }

    await db.query(
      'UPDATE users SET email_verified_at = NOW(), verification_token = NULL WHERE id = ?',
      [users[0].id]
    );

    res.json({ message: 'E-mail verificado com sucesso!' });
  } catch (error) {
    console.error('Erro na verificação de e-mail:', error);
    res.status(500).json({ error: 'Erro ao verificar e-mail.' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.json({ message: 'Se o e-mail existir, você receberá as instruções.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000);

    await db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [resetToken, resetExpires, users[0].id]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/recuperar-senha?token=${resetToken}`;

    try {
      await sendEmail({
        to: email,
        ...emailTemplates.resetPassword(users[0].name, resetUrl)
      });
    } catch (emailError) {
      console.log('Erro ao enviar e-mail (SMTP não configurado):', emailError.message);
    }

    const response = { message: 'Se o e-mail existir, você receberá as instruções.' };

    if (process.env.NODE_ENV === 'development') {
      response.reset_url = resetUrl;
      response.reset_token = resetToken;
      console.log(`\n===== LINK DE RECUPERAÇÃO (DEV) =====\nEmail: ${email}\nURL: ${resetUrl}\nToken: ${resetToken}\n=====================================\n`);
    }

    res.json(response);

    console.log(`Solicitação de reset de senha: ${email}`);
  } catch (error) {
    console.error('Erro no forgot password:', error);
    res.status(500).json({ error: 'Erro ao solicitar recuperação de senha.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const [users] = await db.query(
      'SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );

    res.json({ message: 'Senha alterada com sucesso!' });

    console.log(`Senha redefinida para o usuário ID: ${users[0].id}`);
  } catch (error) {
    console.error('Erro no reset password:', error);
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user && req.user.id) {
      await db.query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    }

    res.clearCookie('token');
    res.json({ message: 'Logout realizado com sucesso.' });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro ao fazer logout.' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token não fornecido.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado.' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Tipo de token inválido.' });
    }

    const [users] = await db.query(
      'SELECT id, name, email, role, avatar, is_active FROM users WHERE id = ? AND is_active = 1 AND refresh_token = ?',
      [decoded.userId, token]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado ou token revogado.' });
    }

    const newToken = generateToken(users[0].id);
    const newRefreshToken = generateRefreshToken(users[0].id);

    await db.query('UPDATE users SET refresh_token = ? WHERE id = ?', [newRefreshToken, users[0].id]);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user: users[0]
    });
  } catch (error) {
    console.error('Erro no refresh token:', error);
    res.status(500).json({ error: 'Erro ao renovar token.' });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken
};
