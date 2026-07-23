const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { paginate, paginateResult } = require('../utils/pagination');

const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo.jpg');

const generate = async (req, res) => {
  try {
    const { course_id } = req.body;

    const [enrollments] = await db.query(
      `SELECT e.id, e.final_grade, e.completed_at, e.certificate_issued
       FROM enrollments e
       WHERE e.user_id = ? AND e.course_id = ? AND e.status = 'completed'`,
      [req.user.id, course_id]
    );

    if (enrollments.length === 0) {
      return res.status(400).json({ error: 'Curso não foi concluído.' });
    }

    const enrollment = enrollments[0];

    if (enrollment.certificate_issued) {
      const [existing] = await db.query(
        'SELECT * FROM certificates WHERE enrollment_id = ?',
        [enrollment.id]
      );
      if (existing.length > 0) {
        return res.json(existing[0]);
      }
    }

    const [courses] = await db.query(
      'SELECT title, workload, workload_certificate, has_certificate FROM courses WHERE id = ?',
      [course_id]
    );

    if (courses.length === 0 || !courses[0].has_certificate) {
      return res.status(400).json({ error: 'Este curso não emite certificado.' });
    }

    const certificateCode = `CERT-${req.user.id}-${course_id}-${Date.now().toString(36).toUpperCase()}`;

    const workload_hours = courses[0].workload_certificate || courses[0].workload;

    const [result] = await db.query(
      `INSERT INTO certificates (user_id, course_id, enrollment_id, certificate_code, final_grade, workload_hours)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, course_id, enrollment.id, certificateCode, enrollment.final_grade, workload_hours]
    );

    await db.query(
      'UPDATE enrollments SET certificate_issued = 1, certificate_issued_at = NOW() WHERE id = ?',
      [enrollment.id]
    );

    const [certificate] = await db.query(
      `SELECT c.*, u.name as user_name, co.title as course_title, co.workload,
              u2.name as teacher_name
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses co ON c.course_id = co.id
       LEFT JOIN users u2 ON co.teacher_id = u2.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    const [user] = await db.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
    if (user.length > 0) {
      await sendEmail({
        to: user[0].email,
        ...emailTemplates.certificateReady(user[0].name, courses[0].title)
      });
    }

    res.status(201).json(certificate[0]);
    console.log(`Certificado gerado: ${certificateCode} para usuário ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao gerar certificado:', error);
    res.status(500).json({ error: 'Erro ao gerar certificado.' });
  }
};

const getByUser = async (req, res) => {
  try {
    const [certificates] = await db.query(
      `SELECT c.*, co.title as course_title, co.slug as course_slug, co.workload,
              co.image as course_image
       FROM certificates c
       JOIN courses co ON c.course_id = co.id
       WHERE c.user_id = ?
       ORDER BY c.issued_at DESC`,
      [req.user.id]
    );

    res.json(certificates);
  } catch (error) {
    console.error('Erro ao listar certificados:', error);
    res.status(500).json({ error: 'Erro ao listar certificados.' });
  }
};

const verify = async (req, res) => {
  try {
    const { code } = req.params;

    const [certificates] = await db.query(
      `SELECT c.certificate_code, c.final_grade, c.workload_hours, c.issued_at, c.is_valid,
              u.name as user_name, co.title as course_title, co.slug as course_slug,
              u2.name as teacher_name
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses co ON c.course_id = co.id
       LEFT JOIN users u2 ON co.teacher_id = u2.id
       WHERE c.certificate_code = ?`,
      [code]
    );

    if (certificates.length === 0) {
      return res.status(404).json({
        valid: false,
        message: 'Certificado não encontrado.'
      });
    }

    const cert = certificates[0];

    if (!cert.is_valid) {
      return res.json({
        valid: false,
        message: 'Este certificado foi invalidado.',
        certificate: cert
      });
    }

    res.json({
      valid: true,
      certificate: cert
    });
  } catch (error) {
    console.error('Erro ao verificar certificado:', error);
    res.status(500).json({ error: 'Erro ao verificar certificado.' });
  }
};

const drawBrasao = (doc, x, y, size) => {
  const cx = x + size / 2;
  const cy = y + size / 2;

  doc.save();

  doc.roundedRect(x, y, size, size * 0.75, 4).lineWidth(1.5).fillAndStroke('#1a3a5c', '#1a3a5c');

  const starCx = cx;
  const starCy = cy - size * 0.05;
  const outerR = size * 0.18;
  const innerR = outerR * 0.4;

  doc.moveTo(starCx, starCy - outerR);
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 2 * Math.PI / 5) - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    const ox = starCx + outerR * Math.cos(outerAngle);
    const oy = starCy + outerR * Math.sin(outerAngle);
    doc.lineTo(ox, oy);
    const ix = starCx + innerR * Math.cos(innerAngle);
    const iy = starCy + innerR * Math.sin(innerAngle);
    doc.lineTo(ix, iy);
  }
  doc.closePath().fill('#f9d71c');

  doc.fontSize(5).font('Helvetica-Bold').fillColor('#ffffff')
    .text('REPÚBLICA', x + 2, y + size * 0.78, { width: size - 4, align: 'center' });
  doc.fontSize(4).font('Helvetica').fillColor('#ffffff')
    .text('FEDERATIVA DO BRASIL', x + 2, y + size * 0.87, { width: size - 4, align: 'center' });

  doc.restore();
};

const download = async (req, res) => {
  try {
    const { id } = req.params;

    const [certificates] = await db.query(
      `SELECT c.*, u.name as user_name, u.cpf as user_cpf, co.title as course_title,
              co.workload, co.workload_certificate, u2.name as teacher_name,
              cat.name as category_name
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses co ON c.course_id = co.id
       LEFT JOIN users u2 ON co.teacher_id = u2.id
       LEFT JOIN categories cat ON co.category_id = cat.id
       WHERE c.id = ?`,
      [id]
    );

    if (certificates.length === 0) {
      return res.status(404).json({ error: 'Certificado não encontrado.' });
    }

    const cert = certificates[0];

    if (cert.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    const workload_hours = cert.workload_certificate || cert.workload;

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-certificado/${cert.certificate_code}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 120, margin: 1, color: { dark: '#1a56db', light: '#ffffff' } });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="certificado-${cert.course_title.replace(/\s+/g, '-').toLowerCase()}.pdf"`);

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      info: {
        Title: `Certificado - ${cert.course_title}`,
        Author: 'Faculdade Diferencial EAD',
        Subject: 'Certificado de Conclusão'
      }
    });

    doc.pipe(res);

    const pageW = doc.page.width;
    const pageH = doc.page.height;

    doc.rect(0, 0, pageW, pageH).fill('#faf9f6');

    doc.rect(30, 30, pageW - 60, pageH - 60).lineWidth(2).stroke('#1a56db');
    doc.rect(36, 36, pageW - 72, pageH - 72).lineWidth(0.5).stroke('#f97316');

    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 60, 55, { width: 100, height: 72, fit: [100, 72] });
    }

    const centerX = pageW / 2;

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a56db')
      .text('FACULDADE DIFERENCIAL EAD', 180, 60, { width: pageW - 360, align: 'center' });

    doc.fontSize(9).font('Helvetica').fillColor('#666')
      .text('Rua João da Cruz Monteiro, 1728 — Cristo Rei — Teresina/PI — CEP 64.014-210', 180, 85, { width: pageW - 360, align: 'center' });

    doc.moveTo(180, 105).lineTo(pageW - 180, 105).lineWidth(1).stroke('#f97316');

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1a56db')
      .text('CERTIFICADO', 0, 130, { width: pageW, align: 'center' });

    const userName = cert.user_name || '';
    const userCpf = cert.user_cpf || '_______________________';
    const courseName = cert.course_title || '';
    const hours = workload_hours || 40;

    const issuedDate = new Date(cert.issued_at);
    const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const monthYear = `${monthNames[issuedDate.getMonth()]} de ${issuedDate.getFullYear()}`;

    doc.fontSize(13).font('Helvetica').fillColor('#333');

    const textY = 185;
    const lineH = 28;
    const textW = pageW - 160;

    doc.text('Certificamos que', centerX - textW / 2, textY, { width: textW, align: 'center' });

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a56db');
    const nameText = userName.toUpperCase();
    const nameW = doc.widthOfString(nameText, { font: 'Helvetica-Bold', fontSize: 18 });
    doc.text(nameText, centerX - nameW / 2, textY + 30, { width: nameW });
    doc.moveTo(centerX - nameW / 2, textY + 52).lineTo(centerX + nameW / 2, textY + 52).lineWidth(0.5).stroke('#ccc');

    doc.fontSize(13).font('Helvetica').fillColor('#333');
    doc.text('portador(a) do CPF:', centerX - textW / 2, textY + 65, { width: textW, align: 'center' });

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a56db');
    const cpfText = userCpf;
    const cpfW = doc.widthOfString(cpfText, { font: 'Helvetica-Bold', fontSize: 14 });
    doc.text(cpfText, centerX - cpfW / 2, textY + 85, { width: cpfW });

    doc.fontSize(13).font('Helvetica').fillColor('#333');
    doc.text('participou do curso de', centerX - textW / 2, textY + 115, { width: textW, align: 'center' });

    doc.fontSize(15).font('Helvetica-Bold').fillColor('#f97316');
    const titleText = `"${courseName}"`;
    doc.text(titleText, centerX - textW / 2, textY + 140, { width: textW, align: 'center' });

    doc.fontSize(13).font('Helvetica').fillColor('#333');
    doc.text(`com carga horária de ${hours} horas, realizado em ${monthYear}.`, centerX - textW / 2, textY + 175, { width: textW, align: 'center' });

    const lineY = textY + 230;
    doc.fontSize(10).font('Helvetica').fillColor('#555')
      .text('________________________________________', 120, lineY, { width: 200, align: 'center' });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
      .text(cert.teacher_name || 'Diretor(a)', 120, lineY + 16, { width: 200, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('#888')
      .text('Direção / Coordenação', 120, lineY + 30, { width: 200, align: 'center' });

    doc.fontSize(10).font('Helvetica').fillColor('#555')
      .text('________________________________________', pageW - 320, lineY, { width: 200, align: 'center' });
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
      .text('Reitor(a)', pageW - 320, lineY + 16, { width: 200, align: 'center' });
    doc.fontSize(7).font('Helvetica').fillColor('#888')
      .text('Faculdade Diferencial EAD', pageW - 320, lineY + 30, { width: 200, align: 'center' });

    const footerY = pageH - 85;

    doc.rect(50, footerY, pageW - 100, 45).lineWidth(0.3).fillAndStroke('#f0f4f8', '#ddd');

    doc.fontSize(7).font('Helvetica-Bold').fillColor('#1a56db')
      .text('CÓDIGO DE VERIFICAÇÃO', 65, footerY + 6, { width: 150, align: 'center' });
    doc.fontSize(8).font('Courier-Bold').fillColor('#333')
      .text(cert.certificate_code, 65, footerY + 18, { width: 150, align: 'center' });

    doc.fontSize(7).font('Helvetica').fillColor('#666')
      .text('Para validar este certificado, acesse:', 230, footerY + 6, { width: 200, align: 'center' });
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#1a56db')
      .text(verifyUrl, 230, footerY + 18, { width: 250, align: 'center' });

    doc.image(qrBuffer, pageW - 140, footerY + 2, { width: 55, height: 55 });
    doc.fontSize(6).font('Helvetica').fillColor('#888')
      .text('Escaneie o QR Code', pageW - 145, footerY + 58, { width: 65, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao baixar certificado:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar PDF do certificado.' });
    }
  }
};

const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (c.certificate_code LIKE ? OR u.name LIKE ? OR co.title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses co ON c.course_id = co.id ${where}`,
      params
    );
    const total = countResult[0].total;

    const { query, offset } = paginate(
      `SELECT c.*, u.name as user_name, u.email as user_email, co.title as course_title
       FROM certificates c
       JOIN users u ON c.user_id = u.id
       JOIN courses co ON c.course_id = co.id
       ${where}
       ORDER BY c.issued_at DESC`,
      page, limit
    );

    const [certificates] = await db.query(query, [...params, limit, offset]);

    res.json({
      data: certificates,
      pagination: paginateResult(total, page, limit)
    });
  } catch (error) {
    console.error('Erro ao listar certificados:', error);
    res.status(500).json({ error: 'Erro ao listar certificados.' });
  }
};

module.exports = {
  generate,
  getByUser,
  verify,
  download,
  getAll
};
