const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { paginate, paginateResult } = require('../utils/pagination');
const { uploadAvatar, uploadDocument } = require('../utils/upload');

const getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, name, email, role, avatar, phone, cpf, birth_date, gender,
              address, city, state, zip_code, bio, email_verified_at, is_active,
              lgpd_consent, last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, cpf, birth_date, gender, address, city, state, zip_code, bio } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (cpf !== undefined) { fields.push('cpf = ?'); values.push(cpf); }
    if (birth_date !== undefined) { fields.push('birth_date = ?'); values.push(birth_date); }
    if (gender !== undefined) { fields.push('gender = ?'); values.push(gender); }
    if (address !== undefined) { fields.push('address = ?'); values.push(address); }
    if (city !== undefined) { fields.push('city = ?'); values.push(city); }
    if (state !== undefined) { fields.push('state = ?'); values.push(state); }
    if (zip_code !== undefined) { fields.push('zip_code = ?'); values.push(zip_code); }
    if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(req.user.id);

    await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await db.query(
      'SELECT id, name, email, role, avatar, phone, cpf, birth_date, gender, address, city, state, zip_code, bio, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);

    const isValid = await bcrypt.compare(current_password, users[0].password);
    if (!isValid) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Senha alterada com sucesso!' });

    console.log(`Senha alterada: usuário ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro ao alterar senha.' });
  }
};

const uploadAvatarHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);

    res.json({
      message: 'Avatar atualizado com sucesso!',
      avatar: avatarUrl
    });
  } catch (error) {
    console.error('Erro ao fazer upload do avatar:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do avatar.' });
  }
};

const uploadDocumentHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum documento enviado.' });
    }

    const { document_type } = req.body;

    if (!document_type) {
      return res.status(400).json({ error: 'Tipo de documento é obrigatório.' });
    }

    const documentUrl = `/uploads/attachments/${req.file.filename}`;

    const [result] = await db.query(
      `INSERT INTO user_documents (user_id, document_type, document_url, original_name)
       VALUES (?, ?, ?, ?)`,
      [req.user.id, document_type, documentUrl, req.file.originalname]
    );

    res.status(201).json({
      message: 'Documento enviado com sucesso!',
      document: {
        id: result.insertId,
        document_type,
        document_url: documentUrl,
        original_name: req.file.originalname,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Erro ao fazer upload do documento:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do documento.' });
  }
};

const getDocuments = async (req, res) => {
  try {
    const [documents] = await db.query(
      `SELECT id, document_type, document_url, original_name, status, rejection_reason, created_at, reviewed_at
       FROM user_documents WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(documents);
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos.' });
  }
};

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search, role, is_active } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }

    if (is_active !== undefined) {
      where += ' AND is_active = ?';
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    const countParams = [...params];
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM users ${where}`,
      countParams
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT id, name, email, role, avatar, phone, cpf, is_active, email_verified_at, last_login, created_at, updated_at FROM users ${where} ORDER BY created_at DESC`,
      page, limit
    );

    const [users] = await db.query(query, [...params, limit, offset]);

    res.json({
      data: users,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      `SELECT id, name, email, role, avatar, phone, cpf, birth_date, gender,
              address, city, state, zip_code, bio, email_verified_at, is_active,
              lgpd_consent, last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const [documents] = await db.query(
      'SELECT id, document_type, document_url, original_name, status FROM user_documents WHERE user_id = ?',
      [id]
    );

    const [enrollments] = await db.query(
      `SELECT COUNT(*) as total FROM enrollments WHERE user_id = ? AND status = 'active'`,
      [id]
    );

    res.json({
      ...users[0],
      documents,
      active_enrollments: enrollments[0].total
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, cpf, birth_date, gender, bio, address, city, state, zip_code, is_active } = req.body;

    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (email) {
      const [emailCheck] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailCheck.length > 0) {
        return res.status(409).json({ error: 'E-mail já está em uso.' });
      }
    }

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (cpf !== undefined) { fields.push('cpf = ?'); values.push(cpf); }
    if (birth_date !== undefined) { fields.push('birth_date = ?'); values.push(birth_date); }
    if (gender !== undefined) { fields.push('gender = ?'); values.push(gender); }
    if (bio !== undefined) { fields.push('bio = ?'); values.push(bio); }
    if (address !== undefined) { fields.push('address = ?'); values.push(address); }
    if (city !== undefined) { fields.push('city = ?'); values.push(city); }
    if (state !== undefined) { fields.push('state = ?'); values.push(state); }
    if (zip_code !== undefined) { fields.push('zip_code = ?'); values.push(zip_code); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query(
      'SELECT id, name, email, role, avatar, phone, is_active, updated_at FROM users WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
    console.log(`Usuário atualizado: ID ${id} por admin ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário.' });
  }
};

const toggleActive = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query('SELECT id, is_active, role FROM users WHERE id = ?', [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (users[0].role === 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Não é possível desativar outro administrador.' });
    }

    const newStatus = users[0].is_active ? 0 : 1;

    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);

    res.json({
      message: newStatus ? 'Usuário ativado com sucesso.' : 'Usuário desativado com sucesso.',
      is_active: !!newStatus
    });

    console.log(`Usuário ${id} ${newStatus ? 'ativado' : 'desativado'} por admin ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao alternar status do usuário:', error);
    res.status(500).json({ error: 'Erro ao alterar status do usuário.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar: uploadAvatarHandler,
  uploadDocument: uploadDocumentHandler,
  getDocuments,
  getAll,
  getById,
  update,
  toggleActive
};
