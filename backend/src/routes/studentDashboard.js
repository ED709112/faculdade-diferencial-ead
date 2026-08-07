const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [enrollments] = await db.query(
      `SELECT e.id, e.status, e.progress_percentage, e.started_at, e.completed_at,
              e.last_accessed_at, e.final_grade, e.certificate_issued,
              c.id as course_id, c.title as course_title, c.image as course_image,
              cat.name as category_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE e.user_id = ? AND e.status IN ('active', 'completed')
       ORDER BY e.last_accessed_at DESC`,
      [userId]
    );

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const inProgressCourses = enrollments.filter(e => e.status === 'active').length;
    const avgProgress = totalCourses > 0
      ? Math.round(enrollments.reduce((acc, e) => acc + parseFloat(e.progress_percentage || 0), 0) / totalCourses)
      : 0;

    let totalLessonsCompleted = 0;
    let totalLessons = 0;
    const enrollmentLessonCounts = {};
    for (const enr of enrollments) {
      const [lc] = await db.query(
        "SELECT COUNT(*) as t FROM lesson_progress WHERE enrollment_id = ? AND status = 'completed'",
        [enr.id]
      );
      totalLessonsCompleted += parseInt(lc[0].t);
      const [lt] = await db.query(
        `SELECT COUNT(*) as t FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?`,
        [enr.course_id]
      );
      totalLessons += parseInt(lt[0].t);
      enrollmentLessonCounts[enr.id] = {
        completed: parseInt(lc[0].t),
        total: parseInt(lt[0].t),
      };
    }

    const [quizStats] = await db.query(
      `SELECT COUNT(DISTINCT qa.quiz_id) as total_quizzes,
              COUNT(DISTINCT CASE WHEN qa.is_passed = 1 THEN qa.quiz_id END) as passed_quizzes,
              AVG(qa.score) as avg_score,
              MAX(qa.score) as best_score
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN courses c ON q.course_id = c.id
       JOIN enrollments e ON e.course_id = c.id AND e.user_id = qa.user_id
       WHERE qa.user_id = ? AND qa.status IN ('submitted', 'graded')`,
      [userId]
    );

    const [recentAttempts] = await db.query(
      `SELECT qa.score, qa.is_passed, qa.started_at, qa.submitted_at, qa.time_spent_seconds,
              q.title as quiz_title, c.title as course_title
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN courses c ON q.course_id = c.id
       WHERE qa.user_id = ? AND qa.status IN ('submitted', 'graded')
       ORDER BY qa.submitted_at DESC
       LIMIT 10`,
      [userId]
    );

    const [certificates] = await db.query(
      `SELECT COUNT(*) as total FROM certificates WHERE user_id = ?`,
      [userId]
    );

    const [badges] = await db.query(
      `SELECT COUNT(*) as total FROM user_badges WHERE user_id = ?`,
      [userId]
    );

    const [points] = await db.query(
      `SELECT COALESCE(SUM(points), 0) as total FROM user_points WHERE user_id = ?`,
      [userId]
    );

    const [notifications] = await db.query(
      `SELECT id, title, message, type, link, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      [userId]
    );

    const [unreadResult] = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    const [earnedBadges] = await db.query(
      `SELECT b.id, b.name, b.description, b.icon, b.points, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC
       LIMIT 6`,
      [userId]
    );

    const [badgeCountResult] = await db.query(
      'SELECT COUNT(*) as total FROM user_badges WHERE user_id = ?',
      [userId]
    );

    const [continueRows] = await db.query(
      `SELECT lp.lesson_id, COALESCE(lp.completed_at, lp.started_at) as last_touched,
              l.title AS lesson_title, l.content_type,
              m.id AS module_id, m.title AS module_title,
              c.id AS course_id, c.title AS course_title
       FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       JOIN enrollments e ON lp.enrollment_id = e.id
       WHERE e.user_id = ? AND e.status IN ('active', 'completed')
       ORDER BY last_touched DESC
       LIMIT 1`,
      [userId]
    );

    const nextSteps = [];
    if (enrollments.length === 0) {
      nextSteps.push({
        title: 'Matricule-se em um curso',
        description: 'Explore os cursos disponíveis e comece sua jornada.',
        href: '/cursos',
        icon: 'book',
      });
    }
    const activeEnrollments = enrollments
      .filter(e => e.status === 'active')
      .sort((a, b) => new Date(b.last_accessed_at || 0) - new Date(a.last_accessed_at || 0));
    for (const enr of activeEnrollments.slice(0, 3)) {
      const counts = enrollmentLessonCounts[enr.id];
      const done = counts ? counts.completed : 0;
      const total = counts ? counts.total : 0;
      const pct = Math.round(parseFloat(enr.progress_percentage || 0));
      nextSteps.push({
        title: `Continuar ${enr.course_title}`,
        description: total > 0 ? `${done} de ${total} aulas concluídas · ${pct}%` : `Progresso ${pct}%`,
        href: `/aluno/curso/${enr.course_id}`,
        icon: 'play',
      });
    }
    const completedWithoutCert = enrollments.filter(e => e.status === 'completed' && !e.certificate_issued);
    for (const enr of completedWithoutCert.slice(0, 2)) {
      nextSteps.push({
        title: 'Emitir certificado',
        description: enr.course_title,
        href: '/aluno/certificados',
        icon: 'award',
      });
    }

    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const [dayProgress] = await db.query(
        `SELECT COUNT(*) as lessons_completed
         FROM lesson_progress lp
         JOIN lessons l ON lp.lesson_id = l.id
         JOIN modules m ON l.module_id = m.id
         JOIN enrollments e ON lp.enrollment_id = e.id
         WHERE e.user_id = ? AND lp.status = 'completed'
         AND DATE(lp.completed_at) = ?`,
        [userId, dayStr]
      );
      weeklyProgress.push({
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        aulas: parseInt(dayProgress[0].lessons_completed),
      });
    }

    const quizScoreHistory = recentAttempts.reverse().map((a, i) => ({
      prova: `#${i + 1}`,
      nota: Math.round(parseFloat(a.score || 0)),
      aprovado: a.is_passed ? 1 : 0,
    }));

    const courseProgressData = enrollments.slice(0, 6).map(e => ({
      curso: e.course_title?.substring(0, 20) + (e.course_title?.length > 20 ? '...' : ''),
      progresso: Math.round(parseFloat(e.progress_percentage || 0)),
    }));

    res.json({
      stats: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        avgProgress,
        totalLessonsCompleted,
        totalLessons,
        totalQuizzes: parseInt(quizStats[0].total_quizzes) || 0,
        passedQuizzes: parseInt(quizStats[0].passed_quizzes) || 0,
        avgScore: Math.round(parseFloat(quizStats[0].avg_score) || 0),
        bestScore: Math.round(parseFloat(quizStats[0].best_score) || 0),
        certificates: parseInt(certificates[0].total),
        badges: parseInt(badges[0].total),
        points: parseInt(points[0].total),
      },
      weeklyProgress,
      quizScoreHistory,
      courseProgressData,
      recentActivity: recentAttempts.slice(-5).reverse(),
      notifications,
      unreadNotifications: parseInt(unreadResult[0].count) || 0,
      badges: earnedBadges,
      badgesCount: parseInt(badgeCountResult[0].total) || 0,
      continueLesson: continueRows.length > 0 ? continueRows[0] : null,
      nextSteps,
      enrollments: enrollments.map(e => ({
        id: e.id,
        course_id: e.course_id,
        course_title: e.course_title,
        course_image: e.course_image,
        progress: Math.round(parseFloat(e.progress_percentage || 0)),
        status: e.status,
        last_accessed: e.last_accessed_at,
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard do aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard.' });
  }
});

module.exports = router;
