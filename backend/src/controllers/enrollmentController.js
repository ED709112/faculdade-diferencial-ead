const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');

const generateEnrollmentCode = () => {
  return 'MAT-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();
};

const generatePaymentCode = () => {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
};

const enrollPublic = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      name, email, phone, cpf, birth_date, gender,
      course_id, payment_method, address, city, state, zip_code
    } = req.body;

    if (!name || !email || !course_id) {
      return res.status(400).json({ error: 'Nome, e-mail e curso são obrigatórios.' });
    }

    const [courses] = await conn.query(
      'SELECT id, price, is_free, title, status, enrollment_count FROM courses WHERE id = ?',
      [course_id]
    );
    if (courses.length === 0 || courses[0].status !== 'published') {
      return res.status(404).json({ error: 'Curso não encontrado ou indisponível.' });
    }
    const course = courses[0];

    let userId;
    let tempPassword = null;
    const [existingUser] = await conn.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      if (phone || cpf || birth_date || gender || address) {
        await conn.query(
          `UPDATE users SET
            phone = COALESCE(?, phone),
            cpf = COALESCE(?, cpf),
            birth_date = COALESCE(?, birth_date),
            gender = COALESCE(?, gender),
            address = COALESCE(?, address),
            city = COALESCE(?, city),
            state = COALESCE(?, state),
            zip_code = COALESCE(?, zip_code)
           WHERE id = ?`,
          [phone || null, cpf || null, birth_date || null, gender || null,
           address || null, city || null, state || null, zip_code || null, userId]
        );
      }
    } else {
      tempPassword = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      const [userResult] = await conn.query(
        `INSERT INTO users (name, email, password, phone, cpf, birth_date, gender, address, city, state, zip_code, role, lgpd_consent, lgpd_consent_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', 1, NOW())`,
        [name, email, hashedPassword, phone || null, cpf || null,
         birth_date || null, gender || null, address || null,
         city || null, state || null, zip_code || null]
      );
      userId = userResult.insertId;
    }

    const [existingEnrollment] = await conn.query(
      `SELECT id, status FROM enrollments WHERE user_id = ? AND course_id = ? AND status IN ('active','pending')`,
      [userId, course_id]
    );
    if (existingEnrollment.length > 0) {
      await conn.commit();
      conn.release();
      return res.status(409).json({ error: 'Você já possui uma matrícula ativa ou pendente neste curso.' });
    }

    const enrollmentCode = generateEnrollmentCode();
    const paymentCode = generatePaymentCode();
    const orderNumber = 'PED-' + Date.now().toString(36).toUpperCase();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, course_id, order_number, subtotal, discount_amount, total_amount, status, payment_method)
       VALUES (?, ?, ?, ?, 0, ?, 'pending', ?)`,
      [userId, course_id, orderNumber, course.price, course.price, payment_method || 'boleto']
    );

    const enrollmentStatus = (course.is_free || course.price === 0) ? 'active' : 'pending';
    const [enrollmentResult] = await conn.query(
      `INSERT INTO enrollments (user_id, course_id, order_id, status, started_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, course_id, orderResult.insertId, enrollmentStatus]
    );

    if (enrollmentStatus === 'active') {
      await conn.query(
        'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
        [course_id]
      );
      await conn.query(
        'UPDATE orders SET status = \'paid\', paid_at = NOW() WHERE id = ?',
        [orderResult.insertId]
      );
    }

    await conn.commit();
    conn.release();

    res.status(201).json({
      message: enrollmentStatus === 'active'
        ? 'Matrícula confirmada! Acesso liberado.'
        : 'Matrícula realizada. Aguardando pagamento.',
      enrollment_code: enrollmentCode,
      payment_code: paymentCode,
      order_number: orderNumber,
      enrollment_id: enrollmentResult.insertId,
      order_id: orderResult.insertId,
      course: { id: course.id, title: course.title, price: course.price },
      user: {
        id: userId,
        name,
        email,
        is_new_user: tempPassword !== null,
        temp_password: tempPassword
      },
      requires_payment: !(course.is_free || course.price === 0),
      payment_method: payment_method || 'boleto'
    });

    console.log(`Matrícula pública: ${email} -> ${course.title} (Código: ${enrollmentCode})`);
  } catch (error) {
    await conn.rollback();
    conn.release();
    console.error('Erro na matrícula pública:', error);
    res.status(500).json({ error: 'Erro ao processar matrícula.' });
  }
};

const getPublicEnrollment = async (req, res) => {
  try {
    const { code } = req.params;

    const [enrollments] = await db.query(
      `SELECT e.id, e.status, e.created_at, e.progress_percentage,
              c.title as course_title, c.image as course_image, c.price,
              u.name, u.email
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.user_id = u.id
       WHERE e.id = (SELECT id FROM enrollments WHERE id = ?)`,
      [code]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }

    res.json(enrollments[0]);
  } catch (error) {
    console.error('Erro ao buscar matrícula pública:', error);
    res.status(500).json({ error: 'Erro ao buscar matrícula.' });
  }
};

const getAllEnrollments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '1=1';
    const params = [];

    if (status && status !== 'all') {
      where += ' AND e.status = ?';
      params.push(status);
    }
    if (search) {
      where += ' AND (u.name LIKE ? OR u.email LIKE ? OR c.title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       WHERE ${where}`,
      params
    );

    const [enrollments] = await db.query(
      `SELECT e.id, e.status, e.progress_percentage, e.started_at, e.completed_at,
              e.certificate_issued, e.final_grade, e.created_at,
              u.id as user_id, u.name as user_name, u.email as user_email,
              c.id as course_id, c.title as course_title, c.max_installments,
              o.id as order_id, o.order_number, o.total_amount, o.payment_method, o.status as order_status, o.paid_at
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN orders o ON e.order_id = o.id
       WHERE ${where}
       ORDER BY e.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      data: enrollments,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao listar matrículas (admin):', error);
    res.status(500).json({ error: 'Erro ao listar matrículas.' });
  }
};

const confirmPayment = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;

    const [enrollments] = await conn.query(
      `SELECT e.id, e.user_id, e.course_id, e.order_id, e.status
       FROM enrollments e WHERE e.id = ?`,
      [id]
    );
    if (enrollments.length === 0) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }

    const enrollment = enrollments[0];
    if (enrollment.status === 'active') {
      await conn.rollback(); conn.release();
      return res.status(400).json({ error: 'Matrícula já está ativa.' });
    }

    await conn.query(
      `UPDATE enrollments SET status = 'active', started_at = NOW() WHERE id = ?`,
      [id]
    );

    if (enrollment.order_id) {
      await conn.query(
        `UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?`,
        [enrollment.order_id]
      );
    }

    await conn.query(
      'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
      [enrollment.course_id]
    );

    await conn.commit();
    conn.release();

    res.json({ message: 'Pagamento confirmado. Acesso liberado.' });
    console.log(`Pagamento confirmado: Matrícula ${id} por admin ID ${req.user.id}`);
  } catch (error) {
    await conn.rollback(); conn.release();
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ error: 'Erro ao confirmar pagamento.' });
  }
};

const enroll = async (req, res) => {
  try {
    const { course_id, coupon_code } = req.body;

    const [courses] = await db.query(
      'SELECT id, price, is_free, title, status FROM courses WHERE id = ?',
      [course_id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const course = courses[0];

    if (course.status !== 'published') {
      return res.status(400).json({ error: 'Curso não está disponível.' });
    }

    const [existing] = await db.query(
      'SELECT id, status FROM enrollments WHERE user_id = ? AND course_id = ?',
      [req.user.id, course_id]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'active' || existing[0].status === 'completed') {
        return res.status(409).json({ error: 'Você já está matriculado neste curso.' });
      }
    }

    if (course.is_free || course.price === 0) {
      const [result] = await db.query(
        `INSERT INTO enrollments (user_id, course_id, status, started_at)
         VALUES (?, ?, 'active', NOW())`,
        [req.user.id, course_id]
      );

      await db.query(
        'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
        [course_id]
      );

      const [enrollment] = await db.query(
        `SELECT e.*, c.title as course_title, c.image as course_image
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.id = ?`,
        [result.insertId]
      );

      return res.status(201).json(enrollment[0]);
    }

    let discountAmount = 0;
    let couponId = null;

    if (coupon_code) {
      const [coupons] = await db.query(
        `SELECT id, discount_type, discount_value, min_purchase, max_uses, used_count
         FROM coupons
         WHERE code = ? AND is_active = 1
           AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW())
           AND (max_uses IS NULL OR used_count < max_uses)`,
        [coupon_code]
      );

      if (coupons.length > 0) {
        const coupon = coupons[0];
        if (!coupon.min_purchase || course.price >= coupon.min_purchase) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (course.price * coupon.discount_value) / 100;
          } else {
            discountAmount = Math.min(coupon.discount_value, course.price);
          }
          couponId = coupon.id;
        }
      }
    }

    const totalAmount = Math.max(0, course.price - discountAmount);

    const [orderResult] = await db.query(
      `INSERT INTO orders (user_id, course_id, subtotal, discount_amount, total_amount, coupon_id, status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'free')`,
      [req.user.id, course_id, course.price, discountAmount, totalAmount, couponId]
    );

    if (couponId) {
      await db.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [couponId]);
    }

    if (totalAmount === 0) {
      const [enrResult] = await db.query(
        `INSERT INTO enrollments (user_id, course_id, order_id, status, started_at)
         VALUES (?, ?, ?, 'active', NOW())`,
        [req.user.id, course_id, orderResult.insertId]
      );

      await db.query(
        'UPDATE orders SET status = \'paid\', paid_at = NOW() WHERE id = ?',
        [orderResult.insertId]
      );

      await db.query(
        'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
        [course_id]
      );

      const [enrollment] = await db.query(
        `SELECT e.*, c.title as course_title, c.image as course_image
         FROM enrollments e
         JOIN courses c ON e.course_id = c.id
         WHERE e.id = ?`,
        [enrResult.insertId]
      );

      return res.status(201).json(enrollment[0]);
    }

    res.status(201).json({
      message: 'Pedido criado. Aguardando pagamento.',
      order_id: orderResult.insertId,
      total_amount: totalAmount,
      requires_payment: true
    });
  } catch (error) {
    console.error('Erro ao matricular:', error);
    res.status(500).json({ error: 'Erro ao processar matrícula.' });
  }
};

const getMyEnrollments = async (req, res) => {
  try {
    const [enrollments] = await db.query(
      `SELECT e.id, e.status, e.progress_percentage, e.started_at, e.completed_at,
              e.last_accessed_at, e.certificate_issued, e.final_grade,
              c.id as course_id, c.title as course_title, c.slug as course_slug,
              c.image as course_image, c.workload, c.has_certificate,
              cat.name as category_name
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE e.user_id = ?
       ORDER BY e.last_accessed_at DESC, e.started_at DESC`,
      [req.user.id]
    );

    res.json(enrollments);
  } catch (error) {
    console.error('Erro ao listar matrículas:', error);
    res.status(500).json({ error: 'Erro ao listar matrículas.' });
  }
};

const getEnrollmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [enrollments] = await db.query(
      `SELECT e.*, c.title as course_title, c.slug as course_slug, c.image as course_image,
              c.workload, c.has_certificate, c.teacher_id,
              u.name as teacher_name, u.avatar as teacher_avatar
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN users u ON c.teacher_id = u.id
       WHERE e.id = ? AND (e.user_id = ? OR ? IN (SELECT id FROM users WHERE role = 'admin'))`,
      [id, req.user.id, req.user.id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }

    const [modules] = await db.query(
      `SELECT m.id, m.title, m.sort_order,
              (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as total_lessons,
              (SELECT COUNT(*) FROM lesson_progress lp
               JOIN lessons l ON lp.lesson_id = l.id
               WHERE lp.enrollment_id = ? AND l.module_id = m.id AND lp.status = 'completed') as completed_lessons
       FROM modules m
       WHERE m.course_id = ?
       ORDER BY m.sort_order ASC`,
      [enrollments[0].id, enrollments[0].course_id]
    );

    enrollments[0].modules = modules;

    res.json(enrollments[0]);
  } catch (error) {
    console.error('Erro ao buscar matrícula:', error);
    res.status(500).json({ error: 'Erro ao buscar matrícula.' });
  }
};

const getProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const [enrollments] = await db.query(
      'SELECT id, user_id, course_id FROM enrollments WHERE id = ?',
      [enrollmentId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }

    if (enrollments[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    const [progress] = await db.query(
      `SELECT lp.id, lp.lesson_id, lp.status, lp.progress_percentage,
              lp.watch_time_seconds, lp.last_position_seconds, lp.started_at, lp.completed_at,
              l.title as lesson_title, l.content_type, l.video_duration,
              m.title as module_title, m.id as module_id
       FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       WHERE lp.enrollment_id = ?
       ORDER BY m.sort_order ASC, l.sort_order ASC`,
      [enrollmentId]
    );

    res.json(progress);
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso.' });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { lesson_id, status, watch_time_seconds, last_position_seconds, progress_percentage } = req.body;

    const [enrollments] = await db.query(
      'SELECT id, user_id, course_id FROM enrollments WHERE id = ?',
      [enrollmentId]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }

    if (enrollments[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    await db.query(
      `INSERT INTO lesson_progress (enrollment_id, lesson_id, status, watch_time_seconds, last_position_seconds, progress_percentage, started_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         status = COALESCE(?, status),
         watch_time_seconds = COALESCE(?, watch_time_seconds),
         last_position_seconds = COALESCE(?, last_position_seconds),
         progress_percentage = COALESCE(?, progress_percentage),
         completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END`,
      [enrollmentId, lesson_id, status || 'in_progress', watch_time_seconds || null,
        last_position_seconds || null, progress_percentage || 0,
        status || null, watch_time_seconds || null, last_position_seconds || null,
        progress_percentage || null, status]
    );

    const [totalLessons] = await db.query(
      `SELECT COUNT(*) as total FROM lessons l
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = ?`,
      [enrollments[0].course_id]
    );

    const [completedLessons] = await db.query(
      `SELECT COUNT(*) as total FROM lesson_progress lp
       WHERE lp.enrollment_id = ? AND lp.status = 'completed'`,
      [enrollmentId]
    );

    const total = parseInt(totalLessons[0].total);
    const completed = parseInt(completedLessons[0].total);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    await db.query(
      'UPDATE enrollments SET progress_percentage = ?, last_accessed_at = NOW() WHERE id = ?',
      [percentage, enrollmentId]
    );

    if (percentage >= 100) {
      await db.query(
        `UPDATE enrollments SET status = 'completed', completed_at = NOW()
         WHERE id = ? AND status = 'active'`,
        [enrollmentId]
      );
    }

    res.json({
      message: 'Progresso atualizado.',
      progress_percentage: percentage,
      completed_lessons: completed,
      total_lessons: total
    });
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error);
    res.status(500).json({ error: 'Erro ao atualizar progresso.' });
  }
};

const getCourseProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const [enrollments] = await db.query(
      `SELECT e.id, e.user_id, e.course_id, e.progress_percentage, e.status
       FROM enrollments e WHERE e.id = ?`,
      [id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }

    if (enrollments[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    const enrollmentId = enrollments[0].id;
    const courseId = enrollments[0].course_id;

    const [totalLessons] = await db.query(
      `SELECT COUNT(*) as total FROM lessons l
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = ?`,
      [courseId]
    );

    const [completedLessons] = await db.query(
      `SELECT COUNT(*) as total FROM lesson_progress lp
       WHERE lp.enrollment_id = ? AND lp.status = 'completed'`,
      [enrollmentId]
    );

    const [totalQuizzes] = await db.query(
      'SELECT COUNT(*) as total FROM quizzes WHERE course_id = ? AND is_active = 1',
      [courseId]
    );

    const [passedQuizzes] = await db.query(
      `SELECT COUNT(DISTINCT qa.quiz_id) as total
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE q.course_id = ? AND qa.user_id = ? AND qa.is_passed = 1`,
      [courseId, req.user.id]
    );

    const [currentLesson] = await db.query(
      `SELECT lp.lesson_id FROM lesson_progress lp
       WHERE lp.enrollment_id = ? AND lp.status != 'completed'
       ORDER BY lp.started_at ASC LIMIT 1`,
      [enrollmentId]
    );

    const total = parseInt(totalLessons[0].total);
    const completed = parseInt(completedLessons[0].total);
    const totalQuiz = parseInt(totalQuizzes[0].total);
    const passed = parseInt(passedQuizzes[0].total);
    const totalItems = total + totalQuiz;
    const completedItems = completed + passed;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    await db.query(
      'UPDATE enrollments SET progress_percentage = ?, last_accessed_at = NOW() WHERE id = ?',
      [percentage, enrollmentId]
    );

    if (percentage >= 100) {
      await db.query(
        `UPDATE enrollments SET status = 'completed', completed_at = NOW()
         WHERE id = ? AND status = 'active'`,
        [enrollmentId]
      );
    }

    res.json({
      progress: percentage,
      completed: percentage >= 100,
      current_lesson_id: currentLesson.length > 0 ? currentLesson[0].lesson_id : null,
      completed_lessons: completed,
      total_lessons: total,
      quizzes_total: totalQuiz,
      quizzes_passed: passed,
    });
  } catch (error) {
    console.error('Erro ao buscar progresso do curso:', error);
    res.status(500).json({ error: 'Erro ao buscar progresso.' });
  }
};

const cancelEnrollment = async (req, res) => {
  try {
    const { id } = req.params;

    const [enrollments] = await db.query('SELECT id, user_id, course_id FROM enrollments WHERE id = ?', [id]);
    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }

    await db.query('UPDATE enrollments SET status = \'cancelled\' WHERE id = ?', [id]);

    await db.query(
      'UPDATE courses SET enrollment_count = GREATEST(0, enrollment_count - 1) WHERE id = ?',
      [enrollments[0].course_id]
    );

    res.json({ message: 'Matrícula cancelada com sucesso.' });
    console.log(`Matrícula ${id} cancelada por admin ID ${req.user.id}`);
  } catch (error) {
    console.error('Erro ao cancelar matrícula:', error);
    res.status(500).json({ error: 'Erro ao cancelar matrícula.' });
  }
};

const generateBoleto = async (req, res) => {
  try {
    const { id } = req.params;

    const [enrollments] = await db.query(
      `SELECT e.id, e.user_id, e.course_id, e.order_id, e.status,
              o.total_amount, o.payment_method
       FROM enrollments e
       JOIN orders o ON e.order_id = o.id
       WHERE e.id = ?`,
      [id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }

    const enrollment = enrollments[0];

    if (enrollment.status === 'active') {
      return res.status(400).json({ error: 'Matrícula já está ativa.' });
    }

    const [existingPayments] = await db.query(
      `SELECT id, boleto_url, boleto_barcode, status FROM payments WHERE order_id = ? AND payment_method = 'boleto'`,
      [enrollment.order_id]
    );

    if (existingPayments.length > 0 && existingPayments[0].boleto_url) {
      return res.json({
        payment_id: existingPayments[0].id,
        boleto_url: existingPayments[0].boleto_url,
        boleto_barcode: existingPayments[0].boleto_barcode,
        status: existingPayments[0].status,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    const boletoNumber = 'BOL' + Date.now().toString(36).toUpperCase();
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const barcode = generatePaymentCode() + Date.now().toString().slice(-10);

    const boletoUrl = `https://boletos.faculdadediferencial.edu.br/pagamento/${boletoNumber}`;

    await db.query(
      `UPDATE orders SET payment_method = 'boleto' WHERE id = ?`,
      [enrollment.order_id]
    );

    const [result] = await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, gateway, boleto_url, boleto_barcode, created_at)
       VALUES (?, 'boleto', ?, 'pending', 'manual', ?, ?, NOW())`,
      [enrollment.order_id, enrollment.total_amount, boletoUrl, barcode]
    );

    console.log(`Boleto gerado: ${boletoNumber} para matrícula ${id}`);

    res.json({
      payment_id: result.insertId,
      boleto_url: boletoUrl,
      boleto_barcode: barcode,
      boleto_number: boletoNumber,
      amount: enrollment.total_amount,
      due_date: dueDate.toISOString(),
      status: 'pending',
    });
  } catch (error) {
    console.error('Erro ao gerar boleto:', error);
    res.status(500).json({ error: 'Erro ao gerar boleto.' });
  }
};

const getPayments = async (req, res) => {
  try {
    const { id } = req.params;

    const [payments] = await db.query(
      `SELECT p.* FROM payments p
       JOIN orders o ON p.order_id = o.id
       JOIN enrollments e ON e.order_id = o.id
       WHERE e.id = ?
       ORDER BY p.installment_number ASC, p.created_at ASC`,
      [id]
    );

    res.json(payments);
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar pagamentos.' });
  }
};

const confirmPaymentById = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { paymentId } = req.params;

    const [payments] = await conn.query(
      `SELECT p.*, o.user_id, o.course_id, e.id as enrollment_id
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       JOIN enrollments e ON e.order_id = o.id
       WHERE p.id = ?`,
      [paymentId]
    );

    if (payments.length === 0) {
      await conn.rollback(); conn.release();
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    const payment = payments[0];

    await conn.query(
      `UPDATE payments SET status = 'approved', paid_at = NOW() WHERE id = ?`,
      [paymentId]
    );

    const [allPayments] = await conn.query(
      `SELECT id, status FROM payments WHERE order_id = ?`,
      [payment.order_id]
    );

    const allApproved = allPayments.every(p => p.status === 'approved');

    if (allApproved) {
      await conn.query(
        `UPDATE enrollments SET status = 'active', started_at = NOW() WHERE id = ? AND status != 'active'`,
        [payment.enrollment_id]
      );

      await conn.query(
        `UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?`,
        [payment.order_id]
      );

      await conn.query(
        'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
        [payment.course_id]
      );
    } else {
      await conn.query(
        `UPDATE orders SET status = 'processing' WHERE id = ? AND status = 'pending'`,
        [payment.order_id]
      );

      await conn.query(
        `UPDATE enrollments SET status = 'active', started_at = NOW() WHERE id = ? AND status = 'pending'`,
        [payment.enrollment_id]
      );
    }

    await conn.commit();
    conn.release();

    res.json({
      message: allApproved
        ? 'Pagamento confirmado. Acesso liberado.'
        : 'Parcela confirmada. Aguardando demais parcelas.',
      all_paid: allApproved,
    });
    console.log(`Pagamento ${paymentId} confirmado por admin ID ${req.user.id}`);
  } catch (error) {
    await conn.rollback(); conn.release();
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({ error: 'Erro ao confirmar pagamento.' });
  }
};

const generateInstallments = async (req, res) => {
  try {
    const { id } = req.params;
    const { installment_count } = req.body;

    const [enrollments] = await db.query(
      `SELECT e.id, e.user_id, e.course_id, e.order_id, e.status,
              o.total_amount, c.max_installments
       FROM enrollments e
       JOIN orders o ON e.order_id = o.id
       JOIN courses c ON e.course_id = c.id
       WHERE e.id = ?`,
      [id]
    );

    if (enrollments.length === 0) {
      return res.status(404).json({ error: 'Matrícula não encontrada.' });
    }

    const enrollment = enrollments[0];

    if (enrollment.status === 'active') {
      return res.status(400).json({ error: 'Matrícula já está ativa.' });
    }

    if (installment_count < 1 || installment_count > (enrollment.max_installments || 1)) {
      return res.status(400).json({
        error: `Parcelas deve ser entre 1 e ${enrollment.max_installments || 1}.`
      });
    }

    const [existingPayments] = await db.query(
      'SELECT id FROM payments WHERE order_id = ?',
      [enrollment.order_id]
    );

    if (existingPayments.length > 0) {
      await db.query('DELETE FROM payments WHERE order_id = ?', [enrollment.order_id]);
    }

    const installmentValue = Math.ceil((enrollment.total_amount / installment_count) * 100) / 100;
    const paymentIds = [];

    for (let i = 1; i <= installment_count; i++) {
      const amount = i === installment_count
        ? Math.round((enrollment.total_amount - installmentValue * (installment_count - 1)) * 100) / 100
        : installmentValue;

      const [result] = await db.query(
        `INSERT INTO payments (order_id, payment_method, amount, status, gateway, installment_number, installment_total, created_at)
         VALUES (?, 'credit_card', ?, 'pending', 'manual', ?, ?, NOW())`,
        [enrollment.order_id, amount, i, installment_count]
      );
      paymentIds.push(result.insertId);
    }

    console.log(`Parcelas geradas: ${installment_count}x para matrícula ${id}`);

    res.json({
      message: `${installment_count} parcela(s) gerada(s).`,
      installments: installment_count,
      installment_value: installmentValue,
      total: enrollment.total_amount,
      payment_ids: paymentIds,
    });
  } catch (error) {
    console.error('Erro ao gerar parcelas:', error);
    res.status(500).json({ error: 'Erro ao gerar parcelas.' });
  }
};

module.exports = {
  enrollPublic,
  getPublicEnrollment,
  getAllEnrollments,
  confirmPayment,
  enroll,
  getMyEnrollments,
  getEnrollmentById,
  getProgress,
  updateProgress,
  getCourseProgress,
  cancelEnrollment,
  generateBoleto,
  getPayments,
  confirmPaymentById,
  generateInstallments,
};
