const db = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'student'"
    );

    const [newStudents] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'student' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const [totalCourses] = await db.query(
      "SELECT COUNT(*) as total FROM courses WHERE status = 'published'"
    );

    const [totalRevenue] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid'"
    );

    const [monthlyRevenue] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );

    const [activeEnrollments] = await db.query(
      "SELECT COUNT(*) as total FROM enrollments WHERE status = 'active'"
    );

    const [completedEnrollments] = await db.query(
      "SELECT COUNT(*) as total FROM enrollments WHERE status = 'completed'"
    );

    const [totalOrders] = await db.query("SELECT COUNT(*) as total FROM orders");
    const [pendingOrders] = await db.query("SELECT COUNT(*) as total FROM orders WHERE status = 'pending'");
    const [paidOrders] = await db.query("SELECT COUNT(*) as total FROM orders WHERE status = 'paid'");

    const [totalTeachers] = await db.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'teacher' AND is_active = 1"
    );

    const [totalCertificates] = await db.query("SELECT COUNT(*) as total FROM certificates");

    res.json({
      students: totalStudents[0].total,
      new_students_30d: newStudents[0].total,
      courses: totalCourses[0].total,
      revenue: parseFloat(totalRevenue[0].total),
      monthly_revenue: parseFloat(monthlyRevenue[0].total),
      active_enrollments: activeEnrollments[0].total,
      completed_enrollments: completedEnrollments[0].total,
      orders: {
        total: totalOrders[0].total,
        pending: pendingOrders[0].total,
        paid: paidOrders[0].total
      },
      teachers: totalTeachers[0].total,
      certificates: totalCertificates[0].total
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
};

const getRevenueChart = async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let data;

    if (period === 'yearly') {
      const [rows] = await db.query(
        `SELECT YEAR(paid_at) as year, SUM(total_amount) as total, COUNT(*) as count
         FROM orders WHERE status = 'paid' AND paid_at IS NOT NULL
         GROUP BY YEAR(paid_at) ORDER BY year ASC`
      );
      data = rows;
    } else {
      const [rows] = await db.query(
        `SELECT MONTH(paid_at) as month, SUM(total_amount) as total, COUNT(*) as count
         FROM orders WHERE status = 'paid' AND paid_at IS NOT NULL AND YEAR(paid_at) = ?
         GROUP BY MONTH(paid_at) ORDER BY month ASC`,
        [year]
      );

      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const found = rows.find(r => r.month === month);
        return {
          month,
          total: found ? parseFloat(found.total) : 0,
          count: found ? found.count : 0,
          label: new Date(2000, month - 1, 1).toLocaleString('pt-BR', { month: 'short' })
        };
      });

      data = monthlyData;
    }

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
              u.name as user_name, c.title as course_title,
              o.total_amount, o.status
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN courses c ON o.course_id = c.id
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
      `SELECT c.title, COUNT(o.id) as orders_count, COALESCE(SUM(o.total_amount), 0) as revenue
       FROM orders o
       JOIN courses c ON o.course_id = c.id
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

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getRecentActivity,
  getAllUsers,
  getCoursesStats,
  getFinancialReport,
  getReports
};
