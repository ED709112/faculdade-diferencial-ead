const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'student'"
    );

    const [newStudentsMonth] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'student' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const [newStudentsPrevMonth] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'student' AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const [activeCourses] = await db.query(
      "SELECT COUNT(*) as total FROM courses WHERE status = 'published'"
    );

    const [totalRevenue] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid'"
    );

    const [prevMonthRevenue] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND paid_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const [prevMonthStudents] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'student' AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const [prevMonthCourses] = await db.query(
      "SELECT COUNT(*) as total FROM courses WHERE status = 'published' AND updated_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const [currentMonthCourses] = await db.query(
      "SELECT COUNT(*) as total FROM courses WHERE status = 'published' AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const studentsPrev = prevMonthStudents[0].total || 0;
    const studentsCurr = newStudentsMonth[0].total || 0;
    const studentsChange = studentsPrev > 0 ? Math.round(((studentsCurr - studentsPrev) / studentsPrev) * 100) : studentsCurr > 0 ? 100 : 0;

    const coursesPrev = prevMonthCourses[0].total || 0;
    const coursesCurr = currentMonthCourses[0].total || 0;
    const coursesChange = coursesPrev > 0 ? Math.round(((coursesCurr - coursesPrev) / coursesPrev) * 100) : coursesCurr > 0 ? 100 : 0;

    const revCurr = parseFloat(totalRevenue[0].total) || 0;
    const revPrev = parseFloat(prevMonthRevenue[0].total) || 0;
    const revenueChange = revPrev > 0 ? Math.round(((revCurr - revPrev) / revPrev) * 100) : revCurr > 0 ? 100 : 0;

    const [coursesByStatus] = await db.query(
      `SELECT status, COUNT(*) as count FROM courses GROUP BY status`
    );

    const statusColors = {
      published: '#10b981',
      draft: '#f59e0b',
      archived: '#6b7280'
    };

    const statusLabels = {
      published: 'Publicados',
      draft: 'Rascunho',
      archived: 'Arquivados'
    };

    const formattedStatus = coursesByStatus.map(c => ({
      status: statusLabels[c.status] || c.status,
      count: c.count,
      color: statusColors[c.status] || '#6b7280'
    }));

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const [enrollmentsByMonth] = await db.query(
      `SELECT MONTH(e.created_at) as month, YEAR(e.created_at) as year,
              COUNT(*) as enrollments,
              SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as completions
       FROM enrollments e
       WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY YEAR(e.created_at), MONTH(e.created_at)
       ORDER BY year ASC, month ASC`
    );

    const enrollmentTrends = enrollmentsByMonth.map(e => ({
      month: monthNames[e.month - 1],
      enrollments: e.enrollments,
      completions: parseInt(e.completions) || 0
    }));

    const [recentEnrollments] = await db.query(
      `SELECT e.id, e.created_at, u.name as user_name, c.title as course_title
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       ORDER BY e.created_at DESC LIMIT 6`
    );

    const [recentOrders] = await db.query(
      `SELECT o.id, o.created_at, o.total_amount, u.name as user_name, o.payment_method
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status = 'paid'
       ORDER BY o.created_at DESC LIMIT 6`
    );

    const [recentUsers] = await db.query(
      `SELECT id, created_at, name, email
       FROM users ORDER BY created_at DESC LIMIT 6`
    );

    const allActivities = [
      ...recentEnrollments.map(e => ({
        id: `e-${e.id}`,
        icon: 'FiUserPlus',
        color: 'text-emerald-500',
        message: `${e.user_name} matriculou-se em ${e.course_title}`,
        time: e.created_at
      })),
      ...recentOrders.map(o => ({
        id: `o-${o.id}`,
        icon: 'FiDollarSign',
        color: 'text-secondary-500',
        message: `${o.user_name} pagou R$ ${parseFloat(o.total_amount).toFixed(2)}`,
        time: o.created_at
      })),
      ...recentUsers.map(u => ({
        id: `u-${u.id}`,
        icon: 'FiUsers',
        color: 'text-primary-500',
        message: `${u.name} (${u.email}) criou uma conta`,
        time: u.created_at
      }))
    ];

    allActivities.sort((a, b) => new Date(b.time) - new Date(a.time));

    const recentActivity = allActivities.slice(0, 6).map(a => {
      const diff = Date.now() - new Date(a.time).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      let timeStr;
      if (minutes < 1) timeStr = 'agora';
      else if (minutes < 60) timeStr = `${minutes} min atrás`;
      else if (hours < 24) timeStr = `${hours}h atrás`;
      else timeStr = `${days}d atrás`;
      return { ...a, time: timeStr };
    });

    res.json({
      totalStudents: totalStudents[0].total,
      activeCourses: activeCourses[0].total,
      totalRevenue: revCurr,
      newStudentsMonth: newStudentsMonth[0].total,
      studentsChange,
      coursesChange,
      revenueChange,
      newStudentsChange: studentsChange,
      coursesByStatus: formattedStatus,
      recentActivity,
      enrollmentTrends
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
};

const getRevenueChart = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const [rows] = await db.query(
      `SELECT MONTH(paid_at) as month, SUM(total_amount) as total, COUNT(*) as count
       FROM orders WHERE status = 'paid' AND paid_at IS NOT NULL AND YEAR(paid_at) = ?
       GROUP BY MONTH(paid_at) ORDER BY month ASC`,
      [year]
    );

    const data = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const found = rows.find(r => r.month === month);
      const revenue = found ? parseFloat(found.total) : 0;
      return {
        month: monthNames[i],
        revenue,
        expenses: Math.round(revenue * 0.35)
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados do gráfico de receita:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de receita.' });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const [recentEnrollments] = await db.query(
      `SELECT 'enrollment' as type, e.id, e.created_at,
              u.name as user_name, c.title as course_title
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       ORDER BY e.created_at DESC LIMIT 10`
    );

    const [recentOrders] = await db.query(
      `SELECT 'order' as type, o.id, o.created_at,
              u.name as user_name, COALESCE(c.title, 'Produto') as course_title,
              o.total_amount, o.status
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN courses c ON o.course_id = c.id
       ORDER BY o.created_at DESC LIMIT 10`
    );

    const [newUsers] = await db.query(
      `SELECT 'user' as type, id, created_at, name, email, role
       FROM users ORDER BY created_at DESC LIMIT 10`
    );

    const activities = [
      ...recentEnrollments.map(e => ({ ...e, description: `${e.user_name} matriculou-se em ${e.course_title}` })),
      ...recentOrders.map(o => ({ ...o, description: `${o.user_name} - Pedido #${o.order_number || o.id} - ${o.course_title} (R$ ${parseFloat(o.total_amount).toFixed(2)})` })),
      ...newUsers.map(u => ({ ...u, description: `${u.name} (${u.email}) criou uma conta como ${u.role}` }))
    ];

    activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(activities.slice(0, 20));
  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    res.status(500).json({ error: 'Erro ao buscar atividades.' });
  }
};

const getAllUsers = async (req, res) => {
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

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM users ${where}`,
      params
    );
    const total = countResult[0].total;

    const offset = (page - 1) * limit;

    const [users] = await db.query(
      `SELECT id, name, email, role, avatar, phone, is_active, email_verified_at, last_login, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários.' });
  }
};

const getCoursesStats = async (req, res) => {
  try {
    const [courseStats] = await db.query(
      `SELECT c.id, c.title, c.slug, c.status, c.featured, c.enrollment_count,
              c.rating_avg, c.rating_count, c.price, c.is_free, c.created_at,
              u.name as teacher_name,
              cat.name as category_name,
              (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as modules_count,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as active_enrollments,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'completed') as completed_enrollments,
              (SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o WHERE o.course_id = c.id AND o.status = 'paid') as revenue
       FROM courses c
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       ORDER BY c.enrollment_count DESC`
    );

    res.json(courseStats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de cursos:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de cursos.' });
  }
};

const getFinancialReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date) {
      dateFilter += ' AND o.paid_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      dateFilter += ' AND o.paid_at <= ?';
      params.push(end_date);
    }

    const [summary] = await db.query(
      `SELECT COUNT(*) as total_orders,
              COALESCE(SUM(o.total_amount), 0) as total_revenue,
              COALESCE(AVG(o.total_amount), 0) as avg_ticket,
              COUNT(CASE WHEN o.status = 'paid' THEN 1 END) as paid_orders,
              COUNT(CASE WHEN o.status = 'refunded' THEN 1 END) as refunded_orders,
              COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders
       FROM orders o WHERE 1=1 ${dateFilter}`,
      params
    );

    const [paymentMethods] = await db.query(
      `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
       FROM orders WHERE 1=1 ${dateFilter} GROUP BY payment_method`,
      params
    );

    const [topCourses] = await db.query(
      `SELECT COALESCE(c.title, 'Produto') as title, COUNT(o.id) as orders_count, COALESCE(SUM(o.total_amount), 0) as revenue
       FROM orders o
       LEFT JOIN courses c ON o.course_id = c.id
       WHERE o.status = 'paid' ${dateFilter}
       GROUP BY c.id, c.title
       ORDER BY revenue DESC LIMIT 10`,
      params
    );

    res.json({
      summary: {
        total_orders: summary[0].total_orders,
        total_revenue: parseFloat(summary[0].total_revenue).toFixed(2),
        avg_ticket: parseFloat(summary[0].avg_ticket).toFixed(2),
        paid_orders: summary[0].paid_orders,
        refunded_orders: summary[0].refunded_orders,
        pending_orders: summary[0].pending_orders
      },
      payment_methods: paymentMethods,
      top_courses: topCourses
    });
  } catch (error) {
    console.error('Erro ao buscar relatório financeiro:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório financeiro.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, address, city, state, zip_code } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password, phone, role, address, city, state, zip_code, is_active, email_verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
      [name, email, hashedPassword, phone || null, role || 'student', address || null, city || null, state || null, zip_code || null]
    );

    res.status(201).json({
      message: 'Aluno criado com sucesso!',
      user: {
        id: result.insertId,
        name,
        email,
        phone: phone || null,
        role: role || 'student',
        is_active: 1
      }
    });

    console.log(`Aluno criado por admin: ${email} (ID: ${result.insertId})`);
  } catch (error) {
    console.error('Erro ao criar aluno:', error);
    res.status(500).json({ error: 'Erro ao criar aluno.' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      `SELECT id, name, email, role, avatar, phone, cpf, birth_date, gender,
              address, city, state, zip_code, bio, is_active, email_verified_at,
              last_login, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const [enrollments] = await db.query(
      `SELECT e.id, e.status, e.enrolled_at, c.title as course_title
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = ?
       ORDER BY e.enrolled_at DESC`,
      [id]
    );

    res.json({ ...users[0], enrollments });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, is_active, password } = req.body;

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
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      values.push(hashed);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar.' });
    }

    values.push(id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

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

const adminEnrollStudent = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { user_id, course_id } = req.body;

    if (!user_id || !course_id) {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: 'Aluno e curso são obrigatórios.' });
    }

    const [users] = await conn.query('SELECT id, name, email FROM users WHERE id = ? AND role = ?', [user_id, 'student']);
    if (users.length === 0) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }

    const [courses] = await conn.query(
      'SELECT id, title, price, is_free, enrollment_count, status FROM courses WHERE id = ?',
      [course_id]
    );
    if (courses.length === 0 || courses[0].status !== 'published') {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Curso não encontrado ou indisponível.' });
    }

    const course = courses[0];

    const [existing] = await conn.query(
      `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status IN ('active','pending')`,
      [user_id, course_id]
    );
    if (existing.length > 0) {
      await conn.rollback(); conn.release();
      return res.status(409).json({ error: 'Este aluno já está matriculado neste curso.' });
    }

    const orderNumber = 'PED-' + Date.now().toString(36).toUpperCase();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, course_id, order_number, subtotal, discount_amount, total_amount, status, payment_method)
       VALUES (?, ?, ?, ?, 0, ?, 'paid', 'free')`,
      [user_id, course_id, orderNumber, course.price, course.price]
    );

    const enrollmentStatus = (course.is_free || course.price === 0) ? 'active' : 'active';

    const [enrollmentResult] = await conn.query(
      `INSERT INTO enrollments (user_id, course_id, order_id, status, started_at)
       VALUES (?, ?, ?, 'active', NOW())`,
      [user_id, course_id, orderResult.insertId]
    );

    await conn.query(
      'UPDATE orders SET paid_at = NOW() WHERE id = ?',
      [orderResult.insertId]
    );

    await conn.query(
      'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
      [course_id]
    );

    await conn.commit();
    conn.release();

    res.status(201).json({
      message: `Aluno "${users[0].name}" matriculado no curso "${course.title}" com sucesso!`,
      enrollment: {
        id: enrollmentResult.insertId,
        user: users[0],
        course: { id: course.id, title: course.title },
        order_number: orderNumber,
        status: 'active',
      }
    });

    console.log(`Matrícula admin: ${users[0].email} -> ${course.title} (por admin ID ${req.user.id})`);
  } catch (error) {
    await conn.rollback(); conn.release();
    console.error('Erro ao matricular aluno (admin):', error);
    res.status(500).json({ error: 'Erro ao processar matrícula.' });
  }
};

const getReports = async (req, res) => {
  try {
    const { type } = req.query;

    switch (type) {
      case 'enrollments': {
        const [data] = await db.query(
          `SELECT DATE(e.created_at) as date, COUNT(*) as count
           FROM enrollments e
           WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           GROUP BY DATE(e.created_at) ORDER BY date ASC`
        );
        return res.json(data);
      }

      case 'students': {
        const [data] = await db.query(
          `SELECT DATE(created_at) as date, COUNT(*) as count
           FROM users WHERE role = 'student' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           GROUP BY DATE(created_at) ORDER BY date ASC`
        );
        return res.json(data);
      }

      case 'certificates': {
        const [data] = await db.query(
          `SELECT DATE(issued_at) as date, COUNT(*) as count
           FROM certificates
           WHERE issued_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           GROUP BY DATE(issued_at) ORDER BY date ASC`
        );
        return res.json(data);
      }

      case 'completion_rate': {
        const [data] = await db.query(
          `SELECT c.title, c.enrollment_count,
                  (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'completed') as completed_count,
                  CASE WHEN c.enrollment_count > 0
                    THEN ROUND((SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'completed') / c.enrollment_count * 100, 1)
                    ELSE 0 END as completion_rate
           FROM courses c WHERE c.status = 'published' ORDER BY completion_rate DESC`
        );
        return res.json(data);
      }

      default: {
        return res.status(400).json({ error: 'Tipo de relatório inválido. Tipos: enrollments, students, certificates, completion_rate' });
      }
    }
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    res.status(500).json({ error: 'Erro ao buscar relatório.' });
  }
};

const getFinancialData = async () => {
  const [summary] = await db.query(
    `SELECT COUNT(*) as total_orders,
            COALESCE(SUM(o.total_amount), 0) as total_revenue,
            COALESCE(AVG(o.total_amount), 0) as avg_ticket,
            COUNT(CASE WHEN o.status = 'paid' THEN 1 END) as paid_orders,
            COUNT(CASE WHEN o.status = 'refunded' THEN 1 END) as refunded_orders,
            COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending_orders
     FROM orders o WHERE 1=1`
  );

  const [paymentMethods] = await db.query(
    `SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
     FROM orders WHERE 1=1 GROUP BY payment_method`
  );

  const [topCourses] = await db.query(
    `SELECT COALESCE(c.title, 'Produto') as title, COUNT(o.id) as orders_count, COALESCE(SUM(o.total_amount), 0) as revenue
     FROM orders o
     LEFT JOIN courses c ON o.course_id = c.id
     WHERE o.status = 'paid'
     GROUP BY c.id, c.title
     ORDER BY revenue DESC LIMIT 10`
  );

  const [recentTransactions] = await db.query(
    `SELECT o.id, o.order_number, o.total_amount, o.payment_method, o.status, o.created_at,
            u.name as user_name, COALESCE(c.title, 'Produto') as item_name
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN courses c ON o.course_id = c.id
     ORDER BY o.created_at DESC LIMIT 50`
  );

  return {
    summary: summary[0],
    paymentMethods,
    topCourses,
    recentTransactions
  };
};

const exportFinancialExcel = async (req, res) => {
  try {
    const data = await getFinancialData();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Faculdade Diferencial EAD';
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet('Resumo');
    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 30 },
      { header: 'Valor', key: 'value', width: 25 },
    ];
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56DB' } };

    const s = data.summary;
    summarySheet.addRow({ metric: 'Total de Pedidos', value: s.total_orders });
    summarySheet.addRow({ metric: 'Receita Total', value: `R$ ${parseFloat(s.total_revenue).toLocaleString('pt-BR')}` });
    summarySheet.addRow({ metric: 'Ticket Médio', value: `R$ ${parseFloat(s.avg_ticket).toLocaleString('pt-BR')}` });
    summarySheet.addRow({ metric: 'Pedidos Pagos', value: s.paid_orders });
    summarySheet.addRow({ metric: 'Pedidos Estornados', value: s.refunded_orders });
    summarySheet.addRow({ metric: 'Pedidos Pendentes', value: s.pending_orders });
    summarySheet.addRow({ metric: 'Data do Relatório', value: new Date().toLocaleDateString('pt-BR') });

    const methodsSheet = workbook.addWorksheet('Métodos de Pagamento');
    methodsSheet.columns = [
      { header: 'Método', key: 'method', width: 20 },
      { header: 'Quantidade', key: 'count', width: 15 },
      { header: 'Total', key: 'total', width: 25 },
    ];
    methodsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    methodsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56DB' } };
    data.paymentMethods.forEach(pm => {
      methodsSheet.addRow({ method: pm.payment_method || 'N/D', count: pm.count, total: `R$ ${parseFloat(pm.total).toLocaleString('pt-BR')}` });
    });

    const topSheet = workbook.addWorksheet('Top Cursos');
    topSheet.columns = [
      { header: 'Curso', key: 'title', width: 40 },
      { header: 'Pedidos', key: 'orders_count', width: 15 },
      { header: 'Receita', key: 'revenue', width: 25 },
    ];
    topSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    topSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56DB' } };
    data.topCourses.forEach(tc => {
      topSheet.addRow({ title: tc.title, orders_count: tc.orders_count, revenue: `R$ ${parseFloat(tc.revenue).toLocaleString('pt-BR')}` });
    });

    const txSheet = workbook.addWorksheet('Transações');
    txSheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Nº Pedido', key: 'order_number', width: 20 },
      { header: 'Aluno', key: 'user_name', width: 30 },
      { header: 'Item', key: 'item_name', width: 35 },
      { header: 'Valor', key: 'amount', width: 18 },
      { header: 'Método', key: 'payment_method', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Data', key: 'created_at', width: 20 },
    ];
    txSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    txSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A56DB' } };
    data.recentTransactions.forEach(tx => {
      txSheet.addRow({
        id: tx.id,
        order_number: tx.order_number,
        user_name: tx.user_name,
        item_name: tx.item_name,
        amount: `R$ ${parseFloat(tx.total_amount).toLocaleString('pt-BR')}`,
        payment_method: tx.payment_method || 'N/D',
        status: tx.status,
        created_at: new Date(tx.created_at).toLocaleDateString('pt-BR'),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-financeiro-${new Date().toISOString().split('T')[0]}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    res.status(500).json({ error: 'Erro ao gerar planilha.' });
  }
};

const exportFinancialPDF = async (req, res) => {
  try {
    const data = await getFinancialData();
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).fillColor('#1a56db').text('Relatório Financeiro', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666').text(`Faculdade Diferencial EAD - ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#1a56db').text('Resumo');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333333');
    const s = data.summary;
    doc.text(`Total de Pedidos: ${s.total_orders}`);
    doc.text(`Receita Total: R$ ${parseFloat(s.total_revenue).toLocaleString('pt-BR')}`);
    doc.text(`Ticket Médio: R$ ${parseFloat(s.avg_ticket).toLocaleString('pt-BR')}`);
    doc.text(`Pedidos Pagos: ${s.paid_orders}`);
    doc.text(`Pedidos Estornados: ${s.refunded_orders}`);
    doc.text(`Pedidos Pendentes: ${s.pending_orders}`);
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#1a56db').text('Métodos de Pagamento');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333333');
    data.paymentMethods.forEach(pm => {
      doc.text(`  ${pm.payment_method || 'N/D'}: ${pm.count} pedidos - R$ ${parseFloat(pm.total).toLocaleString('pt-BR')}`);
    });
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#1a56db').text('Top 10 Cursos por Receita');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333333');
    data.topCourses.forEach((tc, i) => {
      doc.text(`  ${i + 1}. ${tc.title} - ${tc.orders_count} pedidos - R$ ${parseFloat(tc.revenue).toLocaleString('pt-BR')}`);
    });
    doc.moveDown(1);

    doc.fontSize(14).fillColor('#1a56db').text('Últimas Transações');
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#333333');
    data.recentTransactions.forEach(tx => {
      const date = new Date(tx.created_at).toLocaleDateString('pt-BR');
      doc.text(`  ${date} | ${tx.user_name} | ${tx.item_name} | R$ ${parseFloat(tx.total_amount).toLocaleString('pt-BR')} | ${tx.status}`);
    });

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999999').text('Documento gerado automaticamente pela Faculdade Diferencial EAD.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    res.status(500).json({ error: 'Erro ao gerar PDF.' });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getRecentActivity,
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  adminEnrollStudent,
  getCoursesStats,
  getFinancialReport,
  getReports,
  exportFinancialExcel,
  exportFinancialPDF
};
