const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { sendEmail } = require('../services/emailService');

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../../uploads'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx|ppt|pptx/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
});

router.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nome, e-mail e mensagem são obrigatórios.' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h2 style="margin: 0;">Nova Mensagem de Contato</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb;">
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>E-mail:</strong> ${email}</p>
          ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <p><strong>Mensagem:</strong></p>
          <p style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; white-space: pre-wrap;">${message}</p>
          ${req.file ? `<p><strong>Anexo:</strong> ${req.file.originalname}</p>` : ''}
        </div>
        <div style="background: #f3f4f6; padding: 12px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 12px 12px;">
          Faculdade Diferencial EAD - Mensagem enviada via formulário de contato
        </div>
      </div>
    `;

    const attachments = req.file
      ? [{ filename: req.file.originalname, path: req.file.path }]
      : [];

    await sendEmail({
      to: 'faculdadediferencial@gmail.com',
      subject: `[Contato] ${name} - ${email}`,
      html,
      attachments,
    });

    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar mensagem de contato:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem. Tente novamente.' });
  }
});

module.exports = router;
