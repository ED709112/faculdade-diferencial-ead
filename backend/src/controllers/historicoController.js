const db = require('../config/database');
const PDFDocument = require('pdfkit');

const SITUATION_LABELS = {
  completed: 'Concluído',
  active: 'Cursando',
  inactive: 'Inativo',
  expired: 'Vencido',
  cancelled: 'Cancelado',
};

function round2(value) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return Math.round(value * 100) / 100;
}

function disciplineSituation(average) {
  if (average === null || average === undefined) return 'Cursando';
  return average >= 6 ? 'Aprovado' : 'Reprovado';
}

async function buildHistorico(studentId) {
  const [enrollments] = await db.query(
    `SELECT e.id AS enrollment_id, e.course_id, e.status AS enrollment_status,
            e.final_grade, e.progress_percentage, e.completed_at,
            e.certificate_issued, e.certificate_issued_at, e.turma_id,
            c.title AS course_title, c.workload AS course_workload, c.slug,
            t.name AS turma_name, t.period AS turma_period, t.shift AS turma_shift,
            t.start_date AS turma_start, t.end_date AS turma_end,
            p.name AS polo_name
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN turmas t ON t.id = e.turma_id
     LEFT JOIN polos p ON p.id = c.polo_id
     WHERE e.user_id = ?
     ORDER BY e.created_at DESC`,
    [studentId]
  );

  const [gradeRows] = await db.query(
    `SELECT sg.discipline_id, sg.bimester, sg.grade1, sg.grade2, sg.absences,
            d.name AS discipline_name, d.workload AS discipline_workload,
            cd.course_id
     FROM student_gradebook sg
     JOIN disciplines d ON d.id = sg.discipline_id
     LEFT JOIN course_disciplines cd ON cd.discipline_id = d.id
     WHERE sg.student_id = ?
     ORDER BY d.name ASC, sg.bimester ASC`,
    [studentId]
  );

  const byDiscipline = new Map();
  for (const row of gradeRows) {
    if (!byDiscipline.has(row.discipline_id)) {
      byDiscipline.set(row.discipline_id, {
        discipline_id: row.discipline_id,
        name: row.discipline_name,
        workload: row.discipline_workload,
        course_id: row.course_id,
        entries: [],
      });
    }
    byDiscipline.get(row.discipline_id).entries.push({
      bimester: row.bimester,
      grade1: row.grade1 !== null ? Number(row.grade1) : null,
      grade2: row.grade2 !== null ? Number(row.grade2) : null,
      absences: row.absences || 0,
    });
  }

  const byCourse = new Map();
  for (const en of enrollments) {
    byCourse.set(en.course_id, {
      enrollment_id: en.enrollment_id,
      course_id: en.course_id,
      title: en.course_title,
      slug: en.course_slug,
      workload: en.course_workload,
      enrollment_status: en.enrollment_status,
      final_grade: en.final_grade !== null ? Number(en.final_grade) : null,
      progress_percentage: en.progress_percentage,
      completed_at: en.completed_at,
      certificate_issued: en.certificate_issued,
      certificate_issued_at: en.certificate_issued_at,
      turma: en.turma_id ? {
        id: en.turma_id,
        name: en.turma_name,
        period: en.turma_period,
        shift: en.turma_shift,
        start_date: en.turma_start,
        end_date: en.turma_end,
      } : null,
      polo: en.polo_name,
      disciplines: [],
    });
  }

  for (const course of byCourse.values()) {
    const [courseDisciplines] = await db.query(
      `SELECT cd.discipline_id, d.name, d.workload
       FROM course_disciplines cd
       JOIN disciplines d ON d.id = cd.discipline_id
       WHERE cd.course_id = ?
       ORDER BY cd.sort_order ASC, d.name ASC`,
      [course.course_id]
    );
    course.course_disciplines = courseDisciplines;
  }

  const unlinked = [];

  for (const disc of byDiscipline.values()) {
    const averages = disc.entries.map(e => {
      if (e.grade1 === null && e.grade2 === null) return null;
      return ((e.grade1 || 0) + (e.grade2 || 0)) / 2;
    });

    const validAverages = averages.filter(a => a !== null);
    const average = validAverages.length
      ? round2(validAverages.reduce((s, a) => s + a, 0) / validAverages.length)
      : null;

    const totalAbsences = disc.entries.reduce((s, e) => s + e.absences, 0);
    const frequency = disc.workload && disc.workload > 0
      ? round2(Math.max(0, ((disc.workload - totalAbsences) / disc.workload) * 100))
      : null;

    const disciplineSummary = {
      discipline_id: disc.discipline_id,
      name: disc.name,
      workload: disc.workload,
      average,
      total_absences: totalAbsences,
      frequency,
      situation: disciplineSituation(average),
      bimester_entries: disc.entries,
    };

    const course = disc.course_id ? byCourse.get(disc.course_id) : undefined;
    if (course) {
      course.disciplines.push(disciplineSummary);
    } else {
      unlinked.push(disciplineSummary);
    }
  }

  for (const course of byCourse.values()) {
    const present = new Set(course.disciplines.map(d => d.discipline_id));
    for (const cd of course.course_disciplines || []) {
      if (!present.has(cd.discipline_id)) {
        course.disciplines.push({
          discipline_id: cd.discipline_id,
          name: cd.name,
          workload: cd.workload,
          average: null,
          total_absences: 0,
          frequency: null,
          situation: 'Cursando',
          bimester_entries: [],
        });
      }
    }
  }

  for (const course of byCourse.values()) {
    const validAverages = course.disciplines.map(d => d.average).filter(a => a !== null);
    course.average = validAverages.length
      ? round2(validAverages.reduce((s, a) => s + a, 0) / validAverages.length)
      : null;

    if (course.enrollment_status === 'completed') {
      course.situation = course.final_grade !== null
        ? (course.final_grade >= 6 ? 'Aprovado' : 'Reprovado')
        : 'Concluído';
    } else {
      course.situation = SITUATION_LABELS[course.enrollment_status] || course.enrollment_status;
    }

    delete course.course_disciplines;
  }

  return {
    courses: Array.from(byCourse.values()),
    unlinked_disciplines: unlinked,
  };
}

const getMyHistorico = async (req, res) => {
  try {
    const [students] = await db.query('SELECT id, name, email, avatar FROM users WHERE id = ?', [req.user.id]);
    if (students.length === 0) return res.status(404).json({ error: 'Aluno não encontrado.' });

    const historico = await buildHistorico(req.user.id);
    res.json({ student: students[0], ...historico });
  } catch (error) {
    console.error('Erro ao gerar histórico escolar:', error);
    res.status(500).json({ error: 'Erro ao gerar histórico escolar.' });
  }
};

const getStudentHistorico = async (req, res) => {
  try {
    const { userId } = req.params;
    const [students] = await db.query(
      'SELECT id, name, email, avatar FROM users WHERE id = ? AND role = ?',
      [userId, 'student']
    );
    if (students.length === 0) return res.status(404).json({ error: 'Aluno não encontrado.' });

    const historico = await buildHistorico(userId);
    res.json({ student: students[0], ...historico });
  } catch (error) {
    console.error('Erro ao gerar histórico escolar:', error);
    res.status(500).json({ error: 'Erro ao gerar histórico escolar.' });
  }
};

function formatGrade(value) {
  if (value === null || value === undefined) return '—';
  return value.toFixed(2).replace('.', ',');
}

function formatPdfDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

const downloadHistoricoPdf = async (req, res) => {
  try {
    const studentId = req.params.userId || req.user.id;
    const isAdmin = req.user.role === 'admin';

    const [students] = await db.query('SELECT id, name, email, cpf FROM users WHERE id = ?', [studentId]);
    if (students.length === 0) return res.status(404).json({ error: 'Aluno não encontrado.' });

    const student = students[0];
    if (!isAdmin && student.id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    const historico = await buildHistorico(studentId);

    const safeName = student.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'aluno';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="historico-escolar-${safeName}.pdf"`);

    const doc = new PDFDocument({
      layout: 'portrait',
      size: 'A4',
      margin: 48,
      info: {
        Title: `Histórico Escolar - ${student.name}`,
        Author: 'Faculdade Diferencial',
        Subject: 'Histórico Escolar',
      },
    });

    doc.pipe(res);

    const pageW = doc.page.width;
    const margin = 48;
    const infoX = margin;
    const infoW = pageW - margin * 2;

    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1a56db')
      .text('FACULDADE DIFERENCIAL', 0, 30, { width: pageW, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#666')
      .text('Rua João da Cruz Monteiro, 1728 — Cristo Rei — Teresina/PI — CEP 64.014-210', 0, 54, { width: pageW, align: 'center' });
    doc.moveTo(margin, 72).lineTo(pageW - margin, 72).lineWidth(1.2).stroke('#1a56db');
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#1a56db')
      .text('HISTÓRICO ESCOLAR', 0, 86, { width: pageW, align: 'center' });

    let y = 124;

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333').text('DADOS DO ALUNO', infoX, y);
    y += 16;
    doc.font('Helvetica').fontSize(9).fillColor('#333');
    doc.text(`Nome: ${student.name}`, infoX, y);
    if (student.cpf) {
      doc.text(`CPF: ${student.cpf}`, infoX + infoW / 2, y);
    }
    doc.text(`E-mail: ${student.email}`, infoX, y + 14);
    y += 34;
    doc.moveTo(infoX, y).lineTo(infoX + infoW, y).lineWidth(0.5).stroke('#ccc');
    y += 14;

    const columns = [
      { key: 'name', title: 'Disciplina', x: infoX, w: infoW * 0.42, align: 'left' },
      { key: 'workload', title: 'CH', x: infoX + infoW * 0.42, w: infoW * 0.10, align: 'center' },
      { key: 'frequency', title: 'Freq.', x: infoX + infoW * 0.52, w: infoW * 0.12, align: 'center' },
      { key: 'absences', title: 'Faltas', x: infoX + infoW * 0.64, w: infoW * 0.12, align: 'center' },
      { key: 'average', title: 'Média', x: infoX + infoW * 0.76, w: infoW * 0.12, align: 'center' },
      { key: 'situation', title: 'Situação', x: infoX + infoW * 0.88, w: infoW * 0.12, align: 'center' },
    ];

    const drawCourseSection = (course) => {
      if (y > doc.page.height - 160) {
        doc.addPage();
        y = margin;
      }

      doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a56db').text(course.title, infoX, y);
      y += 15;

      const infoParts = [];
      if (course.polo) infoParts.push(`Polo: ${course.polo}`);
      if (course.turma) {
        let turmaInfo = `Turma: ${course.turma.name}`;
        if (course.turma.period) turmaInfo += ` — ${course.turma.period}º período`;
        if (course.turma.shift) turmaInfo += ` (${course.turma.shift})`;
        infoParts.push(turmaInfo);
      }
      if (course.workload) infoParts.push(`Carga horária: ${course.workload}h`);
      infoParts.push(`Situação: ${course.situation}`);
      doc.font('Helvetica').fontSize(9).fillColor('#555').text(infoParts.join('  |  '), infoX, y);
      y += 15;

      doc.font('Helvetica-Bold').fontSize(8.5);
      doc.rect(infoX, y, infoW, 18).fill('#1a56db');
      doc.fillColor('#ffffff');
      for (const col of columns) {
        doc.text(col.title, col.x + 3, y + 5, { width: col.w - 6, align: 'center' });
      }
      y += 18;

      doc.font('Helvetica').fontSize(9);
      let row = 0;
      for (const d of course.disciplines) {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = margin;
          doc.rect(infoX, y, infoW, 18).fill('#1a56db');
          doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5);
          for (const col of columns) {
            doc.text(col.title, col.x + 3, y + 5, { width: col.w - 6, align: 'center' });
          }
          y += 18;
          doc.font('Helvetica').fontSize(9);
        }
        if (row % 2 === 0) {
          doc.rect(infoX, y, infoW, 18).fill('#f3f6fb');
        }
        doc.fillColor('#333');
        doc.text(d.name, columns[0].x + 3, y + 5, { width: columns[0].w - 6 });
        doc.text(d.workload ? `${d.workload}h` : '—', columns[1].x, y + 5, { width: columns[1].w, align: 'center' });
        doc.text(d.frequency !== null ? `${d.frequency}%` : '—', columns[2].x, y + 5, { width: columns[2].w, align: 'center' });
        doc.text(String(d.total_absences || 0), columns[3].x, y + 5, { width: columns[3].w, align: 'center' });
        doc.text(formatGrade(d.average), columns[4].x, y + 5, { width: columns[4].w, align: 'center' });
        doc.text(d.situation, columns[5].x, y + 5, { width: columns[5].w, align: 'center' });
        y += 18;
        row++;
      }

      y += 6;
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#1a56db')
        .text(`Média geral do curso: ${formatGrade(course.average)}`, infoX, y);
      y += 24;
    };

    for (const course of historico.courses) {
      drawCourseSection(course);
    }

    if (y + 120 > doc.page.height - 40) {
      doc.addPage();
      y = margin;
    } else {
      y = Math.max(y + 20, doc.page.height - 130);
    }

    const signW = (infoW - 40) / 2;
    doc.font('Helvetica').fontSize(9).fillColor('#555')
      .text('________________________________________', infoX, y, { width: signW, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
      .text('Direção Acadêmica', infoX, y + 16, { width: signW, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#555')
      .text('________________________________________', infoX + signW + 40, y, { width: signW, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333')
      .text('Secretaria Escolar', infoX + signW + 40, y + 16, { width: signW, align: 'center' });

    doc.font('Helvetica').fontSize(8).fillColor('#888')
      .text(`Documento emitido em ${formatPdfDate(new Date().toISOString())} — Faculdade Diferencial`, infoX, doc.page.height - 58, { width: infoW, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao gerar PDF do histórico escolar:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao gerar PDF do histórico escolar.' });
    }
  }
};

module.exports = { getMyHistorico, getStudentHistorico, downloadHistoricoPdf };
