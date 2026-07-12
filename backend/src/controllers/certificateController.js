const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { paginate, paginateResult } = require('../utils/pagination');

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
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { width: 150, margin: 1, color: { dark: '#1a56db', light: '#ffffff' } });

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

    const borderX = 50;
    const borderY = 50;
    const borderW = doc.page.width - 100;
    const borderH = doc.page.height - 100;

    doc.rect(borderX, borderY, borderW, borderH).stroke('#1a56db');
    doc.rect(borderX + 5, borderY + 5, borderW - 10, borderH - 10).stroke('#f97316');

    doc.fontSize(28).font('Helvetica-Bold').fillColor('#1a56db')
      .text('FACULDADE DIFERENCIAL EAD', { align: 'center', y: 100 });

    doc.moveTo(200, 140).lineTo(doc.page.width - 200, 140).stroke('#f97316');

    doc.fontSize(18).font('Helvetica').fillColor('#333')
      .text('CERTIFICADO DE CONCLUSÃO', { align: 'center', y: 160 });

    doc.fontSize(14).font('Helvetica').fillColor('#555')
      .text('Certificamos que', { align: 'center', y: 200 });

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1a56db')
      .text(cert.user_name.toUpperCase(), { align: 'center', y: 230 });

    doc.fontSize(14).font('Helvetica').fillColor('#555')
      .text('concluiu o curso', { align: 'center', y: 270 });

    doc.fontSize(18).font('Helvetica-Bold').fillColor('#f97316')
      .text(cert.course_title, { align: 'center', y: 300 });

    doc.fontSize(12).font('Helvetica').fillColor('#555')
      .text(`Com carga horária de ${workload_hours} horas`, { align: 'center', y: 340 });

    if (cert.final_grade) {
      doc.text(`Nota final: ${parseFloat(cert.final_grade).toFixed(1)}%`, { align: 'center', y: 365 });
    }

    doc.fontSize(11).fillColor('#777')
      .text(`Código de verificação: ${cert.certificate_code}`, { align: 'center', y: 400 });

    doc.fontSize(10).fillColor('#999')
      .text(`Emitido em: ${new Date(cert.issued_at).toLocaleDateString('pt-BR')}`, { align: 'center', y: 420 });

    doc.image(qrBuffer, doc.page.width - 150, doc.page.height - 130, { width: 80, height: 80 });

    doc.fontSize(8).fillColor('#999')
      .text('Escaneie para verificar', doc.page.width - 155, doc.page.height - 48, { width: 90, align: 'center' });

    doc.fontSize(12).font('Helvetica').fillColor('#333')
      .text('_________________________________', { align: 'center', y: 490 });
    doc.fontSize(11).fillColor('#555')
      .text(cert.teacher_name || 'Professor', { align: 'center', y: 510 });

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
