const db = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

const DOCUMENT_TYPES = [
  'rg', 'cpf', 'comprovante_residencia', 'certificado_ensino_medio',
  'diploma_graduacao', 'titulo_eleitoral', 'certidao_nascimento',
  'foto_3x4', 'outros'
];

const uploadStudentDoc = async (req, res) => {
  try {
    const { document_type } = req.body;

    if (!document_type || !DOCUMENT_TYPES.includes(document_type)) {
      return res.status(400).json({ error: 'Tipo de documento inválido.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório.' });
    }

    const [existing] = await db.query(
      `SELECT id, document_url FROM user_documents 
       WHERE user_id = ? AND document_type = ? AND status != 'rejected'`,
      [req.user.id, document_type]
    );

    if (existing.length > 0) {
      const oldPath = path.join(__dirname, '..', '..', 'uploads', 'student-docs', path.basename(existing[0].document_url));
      try { await fs.unlink(oldPath); } catch {}

      await db.query(
        `UPDATE user_documents SET document_url = ?, original_name = ?, status = 'pending', 
         reviewed_by = NULL, reviewed_at = NULL, rejection_reason = NULL, created_at = NOW()
         WHERE id = ?`,
        [`/uploads/student-docs/${req.file.filename}`, req.file.originalname, existing[0].id]
      );

      return res.json({ message: 'Documento atualizado com sucesso.', id: existing[0].id });
    }

    const [result] = await db.query(
      `INSERT INTO user_documents (user_id, document_type, document_url, original_name, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [req.user.id, document_type, `/uploads/student-docs/${req.file.filename}`, req.file.originalname]
    );

    res.status(201).json({ message: 'Documento enviado com sucesso.', id: result.insertId });
  } catch (error) {
    console.error('Erro ao enviar documento:', error);
    res.status(500).json({ error: 'Erro ao enviar documento.' });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const [docs] = await db.query(
      `SELECT ud.*, u.name as reviewed_by_name
       FROM user_documents ud
       LEFT JOIN users u ON ud.reviewed_by = u.id
       WHERE ud.user_id = ?
       ORDER BY ud.created_at DESC`,
      [req.user.id]
    );

    const documentTypeLabels = {
      rg: 'RG',
      cpf: 'CPF',
      comprovante_residencia: 'Comprovante de Residência',
      certificado_ensino_medio: 'Certificado do Ensino Médio',
      diploma_graduacao: 'Diploma de Graduação',
      titulo_eleitoral: 'Título de Eleitor',
      certidao_nascimento: 'Certidão de Nascimento',
      foto_3x4: 'Foto 3x4',
      outros: 'Outros'
    };

    const result = docs.map(doc => ({
      ...doc,
      document_type_label: documentTypeLabels[doc.document_type] || doc.document_type
    }));

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos.' });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const [doc] = await db.query(
      'SELECT document_url FROM user_documents WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (doc.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    if (doc[0].status === 'approved') {
      return res.status(400).json({ error: 'Não é possível excluir um documento aprovado.' });
    }

    const filePath = path.join(__dirname, '..', '..', doc[0].document_url);
    try { await fs.unlink(filePath); } catch {}

    await db.query('DELETE FROM user_documents WHERE id = ? AND user_id = ?', [id, req.user.id]);

    res.json({ message: 'Documento excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    res.status(500).json({ error: 'Erro ao excluir documento.' });
  }
};

const getAllDocuments = async (req, res) => {
  try {
    const { status, user_id, document_type, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND ud.status = ?'; params.push(status); }
    if (user_id) { where += ' AND ud.user_id = ?'; params.push(user_id); }
    if (document_type) { where += ' AND ud.document_type = ?'; params.push(document_type); }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM user_documents ud ${where}`, params
    );
    const total = countResult[0].total;

    const [docs] = await db.query(
      `SELECT ud.*, u.name as user_name, u.email as user_email,
              rev.name as reviewed_by_name
       FROM user_documents ud
       LEFT JOIN users u ON ud.user_id = u.id
       LEFT JOIN users rev ON ud.reviewed_by = rev.id
       ${where}
       ORDER BY ud.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const documentTypeLabels = {
      rg: 'RG', cpf: 'CPF', comprovante_residencia: 'Comprovante de Residência',
      certificado_ensino_medio: 'Certificado do Ensino Médio',
      diploma_graduacao: 'Diploma de Graduação', titulo_eleitoral: 'Título de Eleitor',
      certidao_nascimento: 'Certidão de Nascimento', foto_3x4: 'Foto 3x4', outros: 'Outros'
    };

    res.json({
      documents: docs.map(d => ({ ...d, document_type_label: documentTypeLabels[d.document_type] || d.document_type })),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Erro ao buscar documentos:', error);
    res.status(500).json({ error: 'Erro ao buscar documentos.' });
  }
};

const reviewDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Use "approved" ou "rejected".' });
    }

    if (status === 'rejected' && !rejection_reason) {
      return res.status(400).json({ error: 'Motivo da recusa é obrigatório.' });
    }

    const [doc] = await db.query('SELECT id FROM user_documents WHERE id = ?', [id]);
    if (doc.length === 0) {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    await db.query(
      `UPDATE user_documents SET status = ?, reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ? WHERE id = ?`,
      [status, req.user.id, status === 'rejected' ? rejection_reason : null, id]
    );

    res.json({ message: `Documento ${status === 'approved' ? 'aprovado' : 'recusado'} com sucesso.` });
  } catch (error) {
    console.error('Erro ao revisar documento:', error);
    res.status(500).json({ error: 'Erro ao revisar documento.' });
  }
};

const getDocumentStats = async (req, res) => {
  try {
    const [stats] = await db.query(
      `SELECT status, COUNT(*) as count FROM user_documents GROUP BY status`
    );
    const result = { pending: 0, approved: 0, rejected: 0, total: 0 };
    stats.forEach(s => { result[s.status] = s.count; result.total += s.count; });
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
};

module.exports = {
  uploadStudentDoc,
  getMyDocuments,
  deleteDocument,
  getAllDocuments,
  reviewDocument,
  getDocumentStats
};
