const db = require('../config/database');

const getDashboard = async (req, res) => {
  try {
    const [courseStats] = await db.query(
      `SELECT COUNT(*) as total_courses,
              SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_courses,
              SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_courses,
              SUM(enrollment_count) as total_enrollments,
              COALESCE(AVG(rating_avg), 0) as avg_rating
       FROM courses WHERE teacher_id = ?`,
      [req.user.id]
    );

    const [recentEnrollments] = await db.query(
      `SELECT e.created_at, e.status, u.name as student_name,
              c.title as course_title
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       WHERE c.teacher_id = ?
       ORDER BY e.created_at DESC LIMIT 10`,
      [req.user.id]
    );

    const [recentStudents] = await db.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.avatar,
              e.created_at as enrolled_at, e.progress_percentage,
              c.title as course_title
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       WHERE c.teacher_id = ?
       ORDER BY e.created_at DESC LIMIT 10`,
      [req.user.id]
    );

    const [revenue] = await db.query(
      `SELECT COALESCE(SUM(o.total_amount), 0) as total_revenue
       FROM orders o
       JOIN courses c ON o.course_id = c.id
       WHERE c.teacher_id = ? AND o.status = 'paid'`,
      [req.user.id]
    );

    const [monthlyRevenue] = await db.query(
      `SELECT COALESCE(SUM(o.total_amount), 0) as total
       FROM orders o
       JOIN courses c ON o.course_id = c.id
       WHERE c.teacher_id = ? AND o.status = 'paid' AND o.paid_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [req.user.id]
    );

    res.json({
      stats: {
        total_courses: courseStats[0].total_courses,
        published_courses: courseStats[0].published_courses,
        draft_courses: courseStats[0].draft_courses,
        total_enrollments: courseStats[0].total_enrollments,
        avg_rating: parseFloat(courseStats[0].avg_rating).toFixed(2),
        total_revenue: parseFloat(revenue[0].total_revenue).toFixed(2),
        monthly_revenue: parseFloat(monthlyRevenue[0].total).toFixed(2)
      },
      recent_enrollments: recentEnrollments,
      recent_students: recentStudents
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard do professor:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard.' });
  }
};

const getMyCourses = async (req, res) => {
  try {
    const [courses] = await db.query(
      `SELECT c.*,
              cat.name as category_name,
              (SELECT COUNT(*) FROM modules WHERE course_id = c.id) as modules_count,
              (SELECT COUNT(*) FROM lessons l
               JOIN modules m ON l.module_id = m.id
               WHERE m.course_id = c.id) as lessons_count,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'active') as active_students,
              (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id AND status = 'completed') as completed_students
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.teacher_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    res.json(courses);
  } catch (error) {
    console.error('Erro ao listar meus cursos:', error);
    res.status(500).json({ error: 'Erro ao listar cursos.' });
  }
};

const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { course_id, search } = req.query;

    let where = 'WHERE c.teacher_id = ?';
    const params = [req.user.id];

    if (course_id) {
      where += ' AND e.course_id = ?';
      params.push(course_id);
    }

    if (search) {
      where += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(DISTINCT e.user_id) as total
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.user_id = u.id
       ${where}`,
      params
    );
    const total = countResult[0].total;

    const offset = (page - 1) * limit;

    const [students] = await db.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.avatar, u.phone,
              e.id as enrollment_id, e.status as enrollment_status,
              e.progress_percentage, e.started_at, e.last_accessed_at,
              c.title as course_title, c.id as course_id
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.user_id = u.id
       ${where}
       ORDER BY e.last_accessed_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      data: students,
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
    console.error('Erro ao listar alunos:', error);
    res.status(500).json({ error: 'Erro ao listar alunos.' });
  }
};

const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [enrollments] = await db.query(
      `SELECT e.*, c.title as course_title, c.id as course_id
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.user_id = ? AND c.teacher_id = ?`,
      [studentId, req.user.id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Aluno não encontrado ou não matriculado em seus cursos.' });
    }

    const result = [];

    for (const enrollment of enrollments) {
      const [modules] = await db.query(
        `SELECT m.id, m.title, m.sort_order,
                (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as total_lessons,
                (SELECT COUNT(*) FROM lesson_progress lp
                 JOIN lessons l ON lp.lesson_id = l.id
                 WHERE lp.enrollment_id = ? AND l.module_id = m.id AND lp.status = 'completed') as completed_lessons
         FROM modules m
         WHERE m.course_id = ?
         ORDER BY m.sort_order ASC`,
        [enrollment.id, enrollment.course_id]
      );

      result.push({
        enrollment_id: enrollment.id,
        course_title: enrollment.course_title,
        progress_percentage: enrollment.progress_percentage,
        status: enrollment.status,
        started_at: enrollment.started_at,
        completed_at: enrollment.completed_at,
        modules
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar progresso do aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso do aluno.' });
  }
};

module.exports = {
  getDashboard,
  getMyCourses,
  getStudents,
  getStudentProgress
};
