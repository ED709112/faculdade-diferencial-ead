const db = require('../config/database');
const efibank = require('../services/efibankService');

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function addMonthsClamped(dateStr, months) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const dim = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, dim);
  return `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function computeDueDate({ first_due_date, due_day, interval_days, installmentNumber }) {
  if (due_day) {
    const [y, m] = String(first_due_date).split('-').map(Number);
    const base = `${y}-${String(m).padStart(2, '0')}-${String(due_day).padStart(2, '0')}`;
    return addMonthsClamped(base, installmentNumber - 1);
  }
  const days = (installmentNumber - 1) * (parseInt(interval_days, 10) || 30);
  return addDays(first_due_date, days);
}

async function buildCustomer(user, courseTitle) {
  const desc = courseTitle
    ? `${courseTitle}`
    : `${user.name}`;
  return {
    name: user.name,
    cpf: user.cpf,
    email: user.email,
    phone: user.phone,
    address: {
      street: user.address || 'Rua nao informada',
      number: user.address_number || 'S/N',
      neighborhood: user.neighborhood || user.city || 'Nao informado',
      zipcode: user.zip_code,
      city: user.city || 'Nao informado',
      state: user.state || 'XX',
      complement: '',
    },
    dueDate: null,
    description: desc,
  };
}

async function generateEfiBoleto({ user, courseTitle, amount, discount, dueDate, customId, description }) {
  const charge = await efibank.createBoleto({
    amount,
    description: description || `Mensalidade - ${courseTitle || 'Curso'}`,
    customerName: user.name,
    customerCpf: user.cpf,
    customerEmail: user.email,
    customerPhone: user.phone,
    address: {
      street: user.address || 'Rua nao informada',
      number: user.address_number || 'S/N',
      neighborhood: user.neighborhood || user.city || 'Nao informado',
      zipcode: user.zip_code,
      city: user.city || 'Nao informado',
      state: user.state || 'XX',
      complement: '',
    },
    dueDate,
    customId,
    discount,
    message: 'Boleto com PIX - Faculdade Diferencial EAD',
  });

  return {
    charge_id: charge.charge_id || charge.id || null,
    status: charge.status || null,
    boleto_url: charge.pdf?.charge || charge.billet_link || charge.link || null,
    barcode: charge.barcode || '',
    gateway_status: charge.status || null,
  };
}

async function getPlanTargetStudents({ type, turma_id, user_id }) {
  if (type === 'turma') {
    const [turmas] = await db.query(
      `SELECT t.id, t.course_id, c.title AS course_title
       FROM turmas t JOIN courses c ON c.id = t.course_id
       WHERE t.id = ?`,
      [turma_id]
    );
    if (turmas.length === 0) throw new Error('Turma não encontrada.');
    const turma = turmas[0];

    const [enrollments] = await db.query(
      `SELECT e.user_id FROM enrollments e
       WHERE e.turma_id = ? AND e.status IN ('active', 'pending')`,
      [turma_id]
    );

    const [users] = await db.query(
      `SELECT id, name, email, cpf, phone, address, address_number, neighborhood, city, state, zip_code FROM users WHERE id IN (?) AND role = 'student'`,
      [enrollments.map((e) => e.user_id)]
    );

    return { courseId: turma.course_id, courseTitle: turma.course_title, users };
  }

  if (!user_id) throw new Error('Aluno é obrigatório para boleto individual.');
  const [users] = await db.query(
    `SELECT id, name, email, cpf, phone, address, address_number, neighborhood, city, state, zip_code FROM users WHERE id = ? AND role = 'student'`,
    [user_id]
  );
  if (users.length === 0) throw new Error('Aluno não encontrado.');

  const [enrollments] = await db.query(
    `SELECT e.course_id, c.title AS course_title
     FROM enrollments e JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = ? AND e.status IN ('active', 'pending')
     ORDER BY e.id DESC LIMIT 1`,
    [user_id]
  );

  return {
    courseId: enrollments.length > 0 ? enrollments[0].course_id : null,
    courseTitle: enrollments.length > 0 ? enrollments[0].course_title : null,
    users,
  };
}

const listPlans = async (req, res) => {
  try {
    const [plans] = await db.query(
      `SELECT p.*,
              t.name AS turma_name,
              c.title AS course_title,
              u.name AS student_name,
              (SELECT COUNT(*) FROM boletos b WHERE b.plan_id = p.id) AS total_boletos,
              (SELECT COUNT(*) FROM boletos b WHERE b.plan_id = p.id AND b.status = 'paid') AS paid_boletos
       FROM billet_plans p
       LEFT JOIN turmas t ON t.id = p.turma_id
       LEFT JOIN courses c ON c.id = p.course_id
       LEFT JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC
       LIMIT 200`
    );
    res.json(plans);
  } catch (error) {
    console.error('Erro ao listar planos de boletos:', error);
    res.status(500).json({ error: 'Erro ao listar planos de boletos.' });
  }
};

const createPlan = async (req, res) => {
  try {
    const {
      name, type, turma_id, user_id,
      installments_total, installment_value, discount_value,
      first_due_date, due_day, interval_days, description,
    } = req.body;

    const planType = type === 'turma' ? 'turma' : 'individual';
    const totalInstallments = Math.max(1, parseInt(installments_total, 10) || 1);
    const value = parseFloat(installment_value) || 0;
    const discount = parseFloat(discount_value) || 0;
    const startDate = first_due_date || addDays(new Date().toISOString().split('T')[0], 30);
    const interval = parseInt(interval_days, 10) || 30;
    const fixedDay = due_day ? parseInt(due_day, 10) : null;

    if (value <= 0) return res.status(400).json({ error: 'Valor da parcela é obrigatório.' });
    if (planType === 'turma' && !turma_id) return res.status(400).json({ error: 'Turma é obrigatória.' });
    if (planType === 'individual' && !user_id) return res.status(400).json({ error: 'Aluno é obrigatório.' });

    const target = await getPlanTargetStudents({ type: planType, turma_id, user_id });
    if (target.users.length === 0) {
      return res.status(400).json({ error: 'Nenhum aluno encontrado para este plano.' });
    }

    const planName = name && name.trim()
      ? name.trim()
      : planType === 'turma'
        ? `Boletos ${target.courseTitle || 'Turma'}`
        : `Boletos ${target.users[0].name}`;

    const [planResult] = await db.query(
      `INSERT INTO billet_plans
         (name, type, turma_id, course_id, user_id, installments_total, installment_value,
          discount_value, first_due_date, due_day, interval_days, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [planName, planType, planType === 'turma' ? turma_id : null, target.courseId,
       planType === 'individual' ? user_id : null, totalInstallments, value, discount,
       startDate, fixedDay, interval, description || null, req.user.id]
    );
    const planId = planResult.insertId;

    let success = 0;
    const errors = [];

    for (const user of target.users) {
      for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = computeDueDate({ first_due_date: startDate, due_day: fixedDay, interval_days: interval, installmentNumber: i });
        const customId = `boleto-${planId}-${user.id}-${i}`;
        const boletoDescription = description
          ? `${description} ${i}/${totalInstallments}`
          : `Mensalidade ${i}/${totalInstallments}${target.courseTitle ? ` - ${target.courseTitle}` : ''}`;

        try {
          const charge = await generateEfiBoleto({
            user,
            courseTitle: target.courseTitle,
            amount: value,
            discount,
            dueDate,
            customId,
            description: boletoDescription,
          });

          await db.query(
            `INSERT INTO boletos
               (plan_id, user_id, turma_id, course_id, installment_number, installment_total,
                description, original_value, discount_value, due_date, status, gateway,
                charge_id, boleto_url, barcode, gateway_status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'efibank', ?, ?, ?, ?, ?)`,
            [planId, user.id, planType === 'turma' ? turma_id : null, target.courseId,
             i, totalInstallments, boletoDescription, value, discount, dueDate,
             charge.charge_id, charge.boleto_url, charge.barcode, charge.gateway_status, req.user.id]
          );
          success += 1;
        } catch (err) {
          errors.push({ student: user.name, installment: i, error: String(err.message || err).slice(0, 300) });
          await db.query(
            `INSERT INTO boletos
               (plan_id, user_id, turma_id, course_id, installment_number, installment_total,
                description, original_value, discount_value, due_date, status, gateway, error_message, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'error', 'efibank', ?, ?)`,
            [planId, user.id, planType === 'turma' ? turma_id : null, target.courseId,
             i, totalInstallments, boletoDescription, value, discount, dueDate,
             String(err.message || err).slice(0, 1000), req.user.id]
          );
        }
      }
    }

    res.status(201).json({
      message: `Plano criado. ${success} boleto(s) emitido(s).`,
      plan_id: planId,
      total: target.users.length * totalInstallments,
      success,
      errors: errors.slice(0, 50),
    });
  } catch (error) {
    console.error('Erro ao criar plano de boletos:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar plano de boletos.' });
  }
};

const listBoletos = async (req, res) => {
  try {
    const { status, turma_id, user_id, q } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) {
      where += ' AND b.status = ?';
      params.push(status);
    }
    if (turma_id) {
      where += ' AND b.turma_id = ?';
      params.push(turma_id);
    }
    if (user_id) {
      where += ' AND b.user_id = ?';
      params.push(user_id);
    }
    if (q) {
      where += ' AND (u.name LIKE ? OR b.description LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    const [boletos] = await db.query(
      `SELECT b.*, u.name AS student_name, u.email AS student_email,
              c.title AS course_title, t.name AS turma_name,
              p.name AS plan_name
       FROM boletos b
       JOIN users u ON b.user_id = u.id
       LEFT JOIN courses c ON b.course_id = c.id
       LEFT JOIN turmas t ON b.turma_id = t.id
       LEFT JOIN billet_plans p ON b.plan_id = p.id
       ${where}
       ORDER BY b.due_date DESC, b.id DESC
       LIMIT 500`,
      params
    );

    const [summaryRows] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN b.status = 'paid' THEN 1 ELSE 0 END) AS paid,
         SUM(CASE WHEN b.status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN b.status = 'overdue' THEN 1 ELSE 0 END) AS overdue,
         SUM(CASE WHEN b.status = 'error' THEN 1 ELSE 0 END) AS errors,
         SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
         COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.paid_value ELSE 0 END), 0) AS total_received
       FROM boletos b ${where}`,
      params
    );

    res.json({ boletos, summary: summaryRows[0] });
  } catch (error) {
    console.error('Erro ao listar boletos:', error);
    res.status(500).json({ error: 'Erro ao listar boletos.' });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const paidValue = parseFloat(req.body.paid_value);

    const [boletos] = await db.query('SELECT * FROM boletos WHERE id = ?', [id]);
    if (boletos.length === 0) return res.status(404).json({ error: 'Boleto não encontrado.' });
    if (boletos[0].status === 'paid') return res.status(400).json({ error: 'Boleto já está pago.' });

    const value = paidValue && paidValue > 0 ? paidValue : boletos[0].original_value;

    await db.query(
      `UPDATE boletos SET status = 'paid', paid_value = ?, paid_at = NOW(), confirmed_by = ?, error_message = NULL WHERE id = ?`,
      [value, req.user.id, id]
    );

    res.json({ message: 'Pagamento confirmado com sucesso.', paid_value: value });
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ error: 'Erro ao confirmar pagamento.' });
  }
};

const cancelBoleto = async (req, res) => {
  try {
    const { id } = req.params;
    const [boletos] = await db.query('SELECT * FROM boletos WHERE id = ?', [id]);
    if (boletos.length === 0) return res.status(404).json({ error: 'Boleto não encontrado.' });
    if (boletos[0].status === 'paid') return res.status(400).json({ error: 'Não é possível cancelar um boleto pago.' });

    if (boletos[0].charge_id) {
      try {
        await efibank.cancelBoleto(boletos[0].charge_id);
      } catch (e) {
        console.error('[Boletos] Falha ao cancelar no Efí:', e.message);
      }
    }

    await db.query(`UPDATE boletos SET status = 'cancelled' WHERE id = ?`, [id]);
    res.json({ message: 'Boleto cancelado.' });
  } catch (error) {
    console.error('Erro ao cancelar boleto:', error);
    res.status(500).json({ error: 'Erro ao cancelar boleto.' });
  }
};

const retryBoleto = async (req, res) => {
  try {
    const { id } = req.params;
    const [boletos] = await db.query('SELECT * FROM boletos WHERE id = ?', [id]);
    if (boletos.length === 0) return res.status(404).json({ error: 'Boleto não encontrado.' });

    const boleto = boletos[0];

    const [users] = await db.query(
      `SELECT id, name, email, cpf, phone, address, address_number, neighborhood, city, state, zip_code FROM users WHERE id = ?`,
      [boleto.user_id]
    );
    if (users.length === 0) return res.status(404).json({ error: 'Aluno não encontrado.' });

    const [courses] = await db.query('SELECT title FROM courses WHERE id = ?', [boleto.course_id]);

    const customId = `boleto-${boleto.plan_id || 0}-${boleto.user_id}-${boleto.installment_number}`;

    const charge = await generateEfiBoleto({
      user: users[0],
      courseTitle: courses.length > 0 ? courses[0].title : null,
      amount: boleto.original_value,
      discount: boleto.discount_value,
      dueDate: boleto.due_date,
      customId,
      description: boleto.description,
    });

    await db.query(
      `UPDATE boletos SET status = 'pending', charge_id = ?, boleto_url = ?, barcode = ?,
         gateway_status = ?, error_message = NULL WHERE id = ?`,
      [charge.charge_id, charge.boleto_url, charge.barcode, charge.gateway_status, id]
    );

    res.json({ message: 'Boleto reemitido com sucesso.', boleto_url: charge.boleto_url });
  } catch (error) {
    console.error('Erro ao reemitir boleto:', error);
    res.status(500).json({ error: error.message || 'Erro ao reemitir boleto.' });
  }
};

const listMyBoletos = async (req, res) => {
  try {
    const [boletos] = await db.query(
      `SELECT b.*, c.title AS course_title, t.name AS turma_name
       FROM boletos b
       LEFT JOIN courses c ON b.course_id = c.id
       LEFT JOIN turmas t ON b.turma_id = t.id
       WHERE b.user_id = ?
       ORDER BY b.due_date ASC, b.id ASC`,
      [req.user.id]
    );

    const [summaryRows] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid,
         SUM(CASE WHEN status IN ('pending','overdue') THEN 1 ELSE 0 END) AS open,
         SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue,
         COALESCE(SUM(CASE WHEN status = 'paid' THEN paid_value ELSE 0 END), 0) AS total_paid,
         COALESCE(SUM(CASE WHEN status IN ('pending','overdue') THEN original_value ELSE 0 END), 0) AS total_open
       FROM boletos WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({ boletos, summary: summaryRows[0] });
  } catch (error) {
    console.error('Erro ao listar boletos do aluno:', error);
    res.status(500).json({ error: 'Erro ao listar boletos.' });
  }
};

module.exports = {
  listPlans,
  createPlan,
  listBoletos,
  confirmPayment,
  cancelBoleto,
  retryBoleto,
  listMyBoletos,
};
