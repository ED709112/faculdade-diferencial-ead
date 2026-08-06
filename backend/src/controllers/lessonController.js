const db = require('../config/database');

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [lessons] = await db.query(
      `SELECT l.*, m.title as module_title, m.course_id,
              c.title as course_title, c.teacher_id
       FROM lessons l
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = ?`,
      [id]
    );

    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    const lesson = lessons[0];

    if (req.user) {
      const [enrollment] = await db.query(
        `SELECT id FROM enrollments
         WHERE user_id = ? AND course_id = ? AND status = 'active'`,
        [req.user.id, lesson.course_id]
      );

      if (enrollment.length > 0) {
        const [progress] = await db.query(
          `SELECT status, progress_percentage, watch_time_seconds, last_position_seconds,
                  started_at, completed_at
           FROM lesson_progress
           WHERE enrollment_id = ? AND lesson_id = ?`,
          [enrollment[0].id, id]
        );
        lesson.progress = progress.length > 0 ? progress[0] : null;
      }
    }

    const [comments] = await db.query(
      `SELECT lc.id, lc.comment, lc.created_at, lc.parent_id,
              u.id as user_id, u.name as user_name, u.avatar as user_avatar
       FROM lesson_comments lc
       JOIN users u ON lc.user_id = u.id
       WHERE lc.lesson_id = ? AND lc.is_active = 1
       ORDER BY lc.created_at ASC`,
      [id]
    );

    const commentTree = [];
    const commentMap = new Map();

    for (const comment of comments) {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    }

    for (const comment of comments) {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        commentMap.get(comment.parent_id).replies.push(comment);
      } else if (!comment.parent_id) {
        commentTree.push(comment);
      }
    }

    lesson.comments = commentTree;

    res.json(lesson);
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    res.status(500).json({ error: 'Erro ao buscar aula.' });
  }
};

const getByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const [module] = await db.query('SELECT id, course_id FROM modules WHERE id = ?', [moduleId]);
    if (module.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado.' });
    }

    const [lessons] = await db.query(
      `SELECT id, title, content_type, video_url, video_duration, sort_order, is_free, is_preview,
              workload_minutes, created_at, updated_at
       FROM lessons WHERE module_id = ?
       ORDER BY sort_order ASC`,
      [moduleId]
    );

    res.json(lessons);
  } catch (error) {
    console.error('Erro ao listar aulas:', error);
    res.status(500).json({ error: 'Erro ao listar aulas.' });
  }
};

const create = async (req, res) => {
  try {
    const {
      module_id, title, description, content_type, video_url, video_duration,
      text_content, pdf_url, attachment_url, attachment_name, is_free, is_preview, workload_minutes,
      ementa, objetivo, objetivo_especifico, conteudo_programatico, metodologia, avaliacao, bibliografia
    } = req.body;

    const [modules] = await db.query(
      `SELECT m.id, m.teacher_id, c.teacher_id as course_teacher_id
       FROM modules m JOIN courses c ON m.course_id = c.id WHERE m.id = ?`,
      [module_id]
    );

    if (modules.length === 0) {
      return res.status(404).json({ error: 'Módulo não encontrado.' });
    }

    if (req.user.role !== 'admin' && modules[0].teacher_id !== req.user.id && modules[0].course_teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para adicionar aulas neste módulo.' });
    }

    const [maxOrder] = await db.query(
      'SELECT MAX(sort_order) as max_order FROM lessons WHERE module_id = ?',
      [module_id]
    );
    const sortOrder = (maxOrder[0].max_order || 0) + 1;

    const [result] = await db.query(
      `INSERT INTO lessons (module_id, title, description, content_type, video_url, video_duration,
        text_content, pdf_url, attachment_url, attachment_name, sort_order, is_free, is_preview, workload_minutes,
        ementa, objetivo, objetivo_especifico, conteudo_programatico, metodologia, avaliacao, bibliografia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [module_id, title, description || null, content_type || 'video', video_url || null,
        video_duration || null, text_content || null, pdf_url || null, attachment_url || null,
        attachment_name || null, sortOrder, is_free ? 1 : 0, is_preview ? 1 : 0, workload_minutes || null,
        ementa || null, objetivo || null, objetivo_especifico || null, conteudo_programatico || null,
        metodologia || null, avaliacao || null, bibliografia || null]
    );

    const [lesson] = await db.query('SELECT * FROM lessons WHERE id = ?', [result.insertId]);

    res.status(201).json(lesson[0]);
    console.log(`Aula criada: "${title}" no módulo ID ${module_id}`);
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ error: 'Erro ao criar aula.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, content_type, video_url, video_duration,
      text_content, pdf_url, attachment_url, attachment_name, is_free, is_preview, workload_minutes,
      ementa, objetivo, objetivo_especifico, conteudo_programatico, metodologia, avaliacao, bibliografia
    } = req.body;

    const [lessons] = await db.query(
      `SELECT l.*, m.teacher_id, c.teacher_id as course_teacher_id FROM lessons l
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = ?`,
      [id]
    );

    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (req.user.role !== 'admin' && lessons[0].teacher_id !== req.user.id && lessons[0].course_teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar esta aula.' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (content_type !== undefined) { fields.push('content_type = ?'); values.push(content_type); }
    if (video_url !== undefined) { fields.push('video_url = ?'); values.push(video_url); }
    if (video_duration !== undefined) { fields.push('video_duration = ?'); values.push(video_duration); }
    if (text_content !== undefined) { fields.push('text_content = ?'); values.push(text_content); }
    if (pdf_url !== undefined) { fields.push('pdf_url = ?'); values.push(pdf_url); }
    if (attachment_url !== undefined) { fields.push('attachment_url = ?'); values.push(attachment_url); }
    if (attachment_name !== undefined) { fields.push('attachment_name = ?'); values.push(attachment_name); }
    if (is_free !== undefined) { fields.push('is_free = ?'); values.push(is_free ? 1 : 0); }
    if (is_preview !== undefined) { fields.push('is_preview = ?'); values.push(is_preview ? 1 : 0); }
    if (workload_minutes !== undefined) { fields.push('workload_minutes = ?'); values.push(workload_minutes); }
    if (ementa !== undefined) { fields.push('ementa = ?'); values.push(ementa); }
    if (objetivo !== undefined) { fields.push('objetivo = ?'); values.push(objetivo); }
    if (objetivo_especifico !== undefined) { fields.push('objetivo_especifico = ?'); values.push(objetivo_especifico); }
    if (conteudo_programatico !== undefined) { fields.push('conteudo_programatico = ?'); values.push(conteudo_programatico); }
    if (metodologia !== undefined) { fields.push('metodologia = ?'); values.push(metodologia); }
    if (avaliacao !== undefined) { fields.push('avaliacao = ?'); values.push(avaliacao); }
    if (bibliografia !== undefined) { fields.push('bibliografia = ?'); values.push(bibliografia); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    const [updated] = await db.query('SELECT * FROM lessons WHERE id = ?', [id]);

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    res.status(500).json({ error: 'Erro ao atualizar aula.' });
  }
};

const delete_lesson = async (req, res) => {
  try {
    const { id } = req.params;

    const [lessons] = await db.query(
      `SELECT l.id, l.title, m.teacher_id, c.teacher_id as course_teacher_id FROM lessons l
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = ?`,
      [id]
    );

    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (req.user.role !== 'admin' && lessons[0].teacher_id !== req.user.id && lessons[0].course_teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para remover esta aula.' });
    }

    await db.query('DELETE FROM lessons WHERE id = ?', [id]);

    res.json({ message: 'Aula removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover aula:', error);
    res.status(500).json({ error: 'Erro ao remover aula.' });
  }
};

const addComment = async (req, res) => {
  try {
    const lesson_id = req.params.id;
    const { comment, parent_id } = req.body;

    const [lessons] = await db.query('SELECT id FROM lessons WHERE id = ?', [lesson_id]);
    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (parent_id) {
      const [parentComment] = await db.query('SELECT id FROM lesson_comments WHERE id = ? AND lesson_id = ?', [parent_id, lesson_id]);
      if (parentComment.length === 0) {
        return res.status(400).json({ error: 'Comentário pai não encontrado.' });
      }
    }

    const [result] = await db.query(
      'INSERT INTO lesson_comments (lesson_id, user_id, comment, parent_id) VALUES (?, ?, ?, ?)',
      [lesson_id, req.user.id, comment, parent_id || null]
    );

    const [newComment] = await db.query(
      `SELECT lc.id, lc.comment, lc.parent_id, lc.created_at,
              u.id as user_id, u.name as user_name, u.avatar as user_avatar,
              u.role as user_role
       FROM lesson_comments lc
       JOIN users u ON lc.user_id = u.id
       WHERE lc.id = ?`,
      [result.insertId]
    );

    const [lessonInfo] = await db.query(
      `SELECT l.title, m.course_id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE l.id = ?`,
      [lesson_id]
    );

    const io = req.app.get('io');
    const courseId = lessonInfo.length > 0 ? lessonInfo[0].course_id : null;
    const lessonTitle = lessonInfo.length > 0 ? lessonInfo[0].title : 'aula';

    const notify = async (userId, title, message, link) => {
      if (!userId || userId === req.user.id) return;
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, ?, ?, 'info', ?)`,
        [userId, title, message, link]
      );
      if (io) {
        io.to(`user_${userId}`).emit('new_notification', { title, message, link });
      }
    };

    if (parent_id) {
      const [parentRows] = await db.query(
        'SELECT lc.user_id, u.name as user_name, u.role as user_role FROM lesson_comments lc JOIN users u ON lc.user_id = u.id WHERE lc.id = ?',
        [parent_id]
      );
      if (parentRows.length > 0) {
        const parent = parentRows[0];
        const link = parent.user_role === 'teacher' || parent.user_role === 'admin'
          ? `/professor/curso/${courseId}?tab=comentarios`
          : `/aluno/curso/${courseId}`;
        await notify(
          parent.user_id,
          'Nova resposta',
          `${newComment[0].user_name} respondeu seu comentário na aula "${lessonTitle}": "${String(comment).substring(0, 120)}"`,
          link
        );
      }
    } else if (req.user.role === 'student') {
      const [teachers] = await db.query(
        `SELECT DISTINCT u.id FROM users u
         WHERE u.role IN ('teacher', 'admin') AND u.id IN (
           SELECT c.teacher_id FROM courses c WHERE c.id = ? AND c.teacher_id IS NOT NULL
           UNION
           SELECT m.teacher_id FROM modules m WHERE m.course_id = ? AND m.teacher_id IS NOT NULL
           UNION
           SELECT d.teacher_id FROM course_disciplines cd JOIN disciplines d ON cd.discipline_id = d.id WHERE cd.course_id = ? AND d.teacher_id IS NOT NULL
         )`,
        [courseId, courseId, courseId]
      );
      for (const t of teachers) {
        await notify(
          t.id,
          'Novo comentário',
          `${newComment[0].user_name} comentou na aula "${lessonTitle}": "${String(comment).substring(0, 120)}"`,
          `/professor/curso/${courseId}?tab=comentarios`
        );
      }
    }

    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro ao adicionar comentário.' });
  }
};

const getComments = async (req, res) => {
  try {
    const lessonId = req.params.id;

    const [comments] = await db.query(
      `SELECT lc.id, lc.comment, lc.parent_id, lc.created_at,
              u.id as user_id, u.name as user_name, u.avatar as user_avatar
       FROM lesson_comments lc
       JOIN users u ON lc.user_id = u.id
       WHERE lc.lesson_id = ? AND lc.is_active = 1
       ORDER BY lc.created_at ASC`,
      [lessonId]
    );

    const commentTree = [];
    const commentMap = new Map();

    for (const comment of comments) {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    }

    for (const comment of comments) {
      if (comment.parent_id && commentMap.has(comment.parent_id)) {
        commentMap.get(comment.parent_id).replies.push(comment);
      } else if (!comment.parent_id) {
        commentTree.push(comment);
      }
    }

    res.json(commentTree);
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ error: 'Erro ao buscar comentários.' });
  }
};

const getCourseComments = async (req, res) => {
  try {
    const { courseId } = req.params;

    const [courses] = await db.query(
      'SELECT id, teacher_id FROM courses WHERE id = ?',
      [courseId]
    );
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    const isAdmin = req.user.role === 'admin';
    const [scopeRows] = await db.query(
      `SELECT (c.teacher_id = ?) AS is_course_teacher,
              EXISTS(SELECT 1 FROM modules m WHERE m.course_id = ? AND m.teacher_id = ?) AS is_module_teacher,
              EXISTS(SELECT 1 FROM course_disciplines cd JOIN disciplines d ON cd.discipline_id = d.id WHERE cd.course_id = ? AND d.teacher_id = ?) AS is_discipline_teacher
       FROM courses c WHERE c.id = ?`,
      [req.user.id, courseId, req.user.id, courseId, req.user.id, courseId]
    );

    if (!isAdmin && !scopeRows[0].is_course_teacher && !scopeRows[0].is_module_teacher && !scopeRows[0].is_discipline_teacher) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const [lessons] = await db.query(
      `SELECT l.id, l.title, m.id AS module_id, m.title AS module_title
       FROM lessons l
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = ?
       ORDER BY m.sort_order ASC, l.sort_order ASC`,
      [courseId]
    );

    if (lessons.length === 0) {
      return res.json([]);
    }

    const lessonIds = lessons.map((l) => l.id);

    const [comments] = await db.query(
      `SELECT lc.id, lc.lesson_id, lc.comment, lc.parent_id, lc.created_at,
              u.id AS user_id, u.name AS user_name, u.role AS user_role, u.avatar AS user_avatar
       FROM lesson_comments lc
       JOIN users u ON lc.user_id = u.id
       WHERE lc.lesson_id IN (?) AND lc.is_active = 1
       ORDER BY lc.created_at ASC`,
      [lessonIds]
    );

    const result = lessons.map((lesson) => {
      const lessonComments = comments.filter((c) => c.lesson_id === lesson.id);
      const tree = [];
      const map = new Map();
      for (const c of lessonComments) {
        c.replies = [];
        map.set(c.id, c);
      }
      for (const c of lessonComments) {
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id).replies.push(c);
        } else if (!c.parent_id) {
          tree.push(c);
        }
      }
      return {
        id: lesson.id,
        title: lesson.title,
        module_id: lesson.module_id,
        module_title: lesson.module_title,
        comments: tree,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar comentários do curso:', error);
    res.status(500).json({ error: 'Erro ao buscar comentários do curso.' });
  }
};

const getMyComments = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const [comments] = await db.query(
      `SELECT lc.id, lc.lesson_id, lc.comment, lc.parent_id, lc.created_at,
              u.id AS user_id, u.name AS user_name, u.role AS user_role, u.avatar AS user_avatar,
              l.title AS lesson_title, m.title AS module_title,
              c.id AS course_id, c.title AS course_title,
              parent.comment AS parent_comment,
              pu.name AS parent_user_name, pu.role AS parent_user_role
       FROM lesson_comments lc
       JOIN lessons l ON lc.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       JOIN users u ON lc.user_id = u.id
       LEFT JOIN lesson_comments parent ON lc.parent_id = parent.id
       LEFT JOIN users pu ON parent.user_id = pu.id
       WHERE lc.is_active = 1
         AND u.role IN ('teacher', 'admin')
         AND c.id IN (
           SELECT e.course_id FROM enrollments e
           WHERE e.user_id = ? AND e.status IN ('active', 'completed')
         )
       ORDER BY lc.created_at DESC`,
      [req.user.id]
    );

    res.json(comments);
  } catch (error) {
    console.error('Erro ao buscar comentários do aluno:', error);
    res.status(500).json({ error: 'Erro ao buscar comentários.' });
  }
};

const markComplete = async (req, res) => {
  try {
    const lessonId = req.params.id;

    const [lessons] = await db.query(
      `SELECT l.id, m.course_id FROM lessons l JOIN modules m ON l.module_id = m.id WHERE l.id = ?`,
      [lessonId]
    );

    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    const [enrollments] = await db.query(
      `SELECT id FROM enrollments
       WHERE user_id = ? AND course_id = ? AND status = 'active'`,
      [req.user.id, lessons[0].course_id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({ error: 'Você não está matriculado neste curso.' });
    }

    const enrollmentId = enrollments[0].id;

    await db.query(
      `INSERT INTO lesson_progress (enrollment_id, lesson_id, status, completed_at, started_at)
       VALUES (?, ?, 'completed', NOW(), NOW())
       ON DUPLICATE KEY UPDATE status = 'completed', completed_at = NOW()`,
      [enrollmentId, lessonId]
    );

    const [totalLessons] = await db.query(
      `SELECT COUNT(*) as total FROM lessons l
       JOIN modules m ON l.module_id = m.id
       WHERE m.course_id = ?`,
      [lessons[0].course_id]
    );

    const [completedLessons] = await db.query(
      `SELECT COUNT(*) as total FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       JOIN modules m ON l.module_id = m.id
       WHERE lp.enrollment_id = ? AND m.course_id = ? AND lp.status = 'completed'`,
      [enrollmentId, lessons[0].course_id]
    );

    const total = parseInt(totalLessons[0].total);
    const completed = parseInt(completedLessons[0].total);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    await db.query(
      `UPDATE enrollments SET progress_percentage = ?, last_accessed_at = NOW()
       WHERE id = ?`,
      [percentage, enrollmentId]
    );

    if (percentage >= 100) {
      const [prev] = await db.query(
        `SELECT status FROM enrollments WHERE id = ?`,
        [enrollmentId]
      );
      const wasActive = prev.length > 0 && prev[0].status === 'active';

      await db.query(
        `UPDATE enrollments SET status = 'completed', completed_at = NOW()
         WHERE id = ? AND status = 'active'`,
        [enrollmentId]
      );

      // Award points for course completion (+50 pts)
      if (wasActive) {
        await db.query(
          'INSERT INTO user_points (user_id, points, reason, reference_type, reference_id) VALUES (?, 50, ?, ?, ?)',
          [req.user.id, 'Curso concluído', 'course', lessons[0].course_id]
        );
      }
    }

    // Award points for lesson completion (+10 pts)
    if (completed > 0) {
      const [existingPoints] = await db.query(
        `SELECT id FROM user_points WHERE user_id = ? AND reference_type = 'lesson' AND reference_id = ?`,
        [req.user.id, lessonId]
      );
      if (existingPoints.length === 0) {
        await db.query(
          'INSERT INTO user_points (user_id, points, reason, reference_type, reference_id) VALUES (?, 10, ?, ?, ?)',
          [req.user.id, 'Aula concluída', 'lesson', lessonId]
        );
      }
    }

    res.json({
      message: 'Progresso atualizado.',
      progress_percentage: percentage,
      completed_lessons: completed,
      total_lessons: total
    });
  } catch (error) {
    console.error('Erro ao marcar aula como concluída:', error);
    res.status(500).json({ error: 'Erro ao atualizar progresso.' });
  }
};

const uploadFile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const [lessons] = await db.query(
      `SELECT l.id, m.teacher_id, c.teacher_id as course_teacher_id FROM lessons l
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = ?`,
      [id]
    );

    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (req.user.role !== 'admin' && lessons[0].teacher_id !== req.user.id && lessons[0].course_teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar esta aula.' });
    }

    const url = `/uploads/attachments/${req.file.filename}`;
    const isPdf = req.file.mimetype === 'application/pdf';

    await db.query(
      'UPDATE lessons SET pdf_url = ?, attachment_url = ?, attachment_name = ? WHERE id = ?',
      [isPdf ? url : null, url, req.file.originalname, id]
    );

    const [updated] = await db.query('SELECT * FROM lessons WHERE id = ?', [id]);

    console.log(`Arquivo enviado para a aula ${id}: ${req.file.originalname}`);
    res.json({ message: 'Arquivo enviado com sucesso.', file_url: url, lesson: updated[0] });
  } catch (error) {
    console.error('Erro ao fazer upload de arquivo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload de arquivo.' });
  }
};

const uploadVideo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const [lessons] = await db.query(
      `SELECT l.id, m.teacher_id, c.teacher_id as course_teacher_id FROM lessons l
       JOIN modules m ON l.module_id = m.id
       JOIN courses c ON m.course_id = c.id
       WHERE l.id = ?`,
      [id]
    );

    if (lessons.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada.' });
    }

    if (req.user.role !== 'admin' && lessons[0].teacher_id !== req.user.id && lessons[0].course_teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para editar esta aula.' });
    }

    const videoUrl = `/uploads/courses/${req.file.filename}`;

    await db.query('UPDATE lessons SET video_url = ?, content_type = ? WHERE id = ?', [videoUrl, 'video', id]);

    const [updated] = await db.query('SELECT * FROM lessons WHERE id = ?', [id]);

    console.log(`Video uploaded for lesson ${id}: ${req.file.filename}`);
    res.json({ message: 'Vídeo enviado com sucesso.', video_url: videoUrl, lesson: updated[0] });
  } catch (error) {
    console.error('Erro ao fazer upload de vídeo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload de vídeo.' });
  }
};

module.exports = {
  getById,
  getByModule,
  create,
  update,
  delete: delete_lesson,
  addComment,
  getComments,
  getCourseComments,
  getMyComments,
  markComplete,
  uploadVideo,
  uploadFile
};
