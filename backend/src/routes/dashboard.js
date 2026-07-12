const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const teacherController = require('../controllers/teacherController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    switch (req.user.role) {
      case 'admin':
        return adminController.getDashboardStats(req, res);
      case 'teacher':
        return teacherController.getDashboard(req, res);
      case 'student':
      default: {
        const db = require('../config/database');

        const [enrollments] = await db.query(
          `SELECT e.id, e.status, e.progress_percentage, e.started_at, e.last_accessed_at,
                  c.id as course_id, c.title as course_title, c.slug as course_slug,
                  c.image as course_image
           FROM enrollments e
           JOIN courses c ON e.course_id = c.id
           WHERE e.user_id = ?
           ORDER BY e.last_accessed_at DESC
           LIMIT 5`,
          [req.user.id]
        );

        const [totalEnrollments] = await db.query(
          'SELECT COUNT(*) as total FROM enrollments WHERE user_id = ?',
          [req.user.id]
        );

        const [completedCount] = await db.query(
          "SELECT COUNT(*) as total FROM enrollments WHERE user_id = ? AND status = 'completed'",
          [req.user.id]
        );

        const [certificates] = await db.query(
          `SELECT c.id, c.certificate_code, co.title as course_title
           FROM certificates c
           JOIN courses co ON c.course_id = co.id
           WHERE c.user_id = ?
           ORDER BY c.issued_at DESC
           LIMIT 5`,
          [req.user.id]
        );

        const [notifications] = await db.query(
          'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
          [req.user.id]
        );

        return res.json({
          recent_enrollments: enrollments,
          stats: {
            total_enrollments: totalEnrollments[0].total,
            completed_courses: completedCount[0].total,
            certificates: certificates.length,
            unread_notifications: notifications[0].count
          },
          recent_certificates: certificates
        });
      }
    }
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do dashboard.' });
  }
});

module.exports = router;
