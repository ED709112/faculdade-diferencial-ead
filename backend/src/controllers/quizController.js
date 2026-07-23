const db = require('../config/database');

const getByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const [quizzes] = await db.query(
      `SELECT q.id, q.title, q.description, q.time_limit_minutes, q.passing_grade,
              q.max_attempts, q.shuffle_questions, q.show_answers_after, q.is_active,
              q.created_at, q.updated_at,
              (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as questions_count
       FROM quizzes q
       WHERE q.course_id = ? AND q.is_active = 1
       ORDER BY q.created_at DESC`,
      [courseId]
    );

    if (req.user) {
      for (const quiz of quizzes) {
        const [attempts] = await db.query(
          `SELECT COUNT(*) as total, MAX(score) as best_score, MAX(is_passed) as passed
           FROM quiz_attempts WHERE quiz_id = ? AND user_id = ?`,
          [quiz.id, req.user.id]
        );
        quiz.attempts = attempts[0];
      }
    }

    res.json(quizzes);
  } catch (error) {
    console.error('Erro ao listar provas:', error);
    res.status(500).json({ error: 'Erro ao listar provas.' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [quizzes] = await db.query(
      `SELECT q.*, c.title as course_title, c.slug as course_slug,
              (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as questions_count
       FROM quizzes q
       JOIN courses c ON q.course_id = c.id
       WHERE q.id = ?`,
      [id]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }

    const [questions] = await db.query(
      `SELECT id, question_text, question_type, options, points, sort_order, explanation
       FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC`,
      [id]
    );

    const shouldHideAnswers = quizzes[0].show_answers_after === 'never'
      || (quizzes[0].show_answers_after === 'after_submit' && !req.query.show_answers);

    const safeQuestions = questions.map(q => ({
      ...q,
      ...(shouldHideAnswers && !req.query.show_answers ? { correct_answer: undefined } : {})
    }));

    quizzes[0].questions = safeQuestions;

    res.json(quizzes[0]);
  } catch (error) {
    console.error('Erro ao buscar prova:', error);
    res.status(500).json({ error: 'Erro ao buscar prova.' });
  }
};

const create = async (req, res) => {
  try {
    const { course_id, lesson_id, title, description, time_limit_minutes, passing_grade, max_attempts, shuffle_questions, show_answers_after, questions } = req.body;

    const [courses] = await db.query('SELECT id, teacher_id FROM courses WHERE id = ?', [course_id]);
    if (courses.length === 0) {
      return res.status(404).json({ error: 'Curso não encontrado.' });
    }

    if (req.user.role !== 'admin' && courses[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    const [result] = await db.query(
      `INSERT INTO quizzes (course_id, lesson_id, title, description, time_limit_minutes, passing_grade, max_attempts, shuffle_questions, show_answers_after)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, lesson_id || null, title, description || null, time_limit_minutes || null, passing_grade || 60, max_attempts || 3, shuffle_questions !== false ? 1 : 0, show_answers_after || 'after_submit']
    );

    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let correctAnswer = q.correct_answer || null;

        if (q.question_type === 'true_false' && q.options && !correctAnswer) {
          try {
            const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            const correctOpt = opts.find(o => o.is_correct);
            if (correctOpt) correctAnswer = correctOpt.text;
          } catch {}
        }

        await db.query(
          `INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, explanation, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [result.insertId, q.question_text, q.question_type || 'multiple_choice',
            q.options ? JSON.stringify(q.options) : null, correctAnswer,
            q.points || 1, q.explanation || null, i + 1]
        );
      }
    }

    const [quiz] = await db.query('SELECT * FROM quizzes WHERE id = ?', [result.insertId]);

    res.status(201).json(quiz[0]);
    console.log(`Prova criada: "${title}" no curso ID ${course_id}`);
  } catch (error) {
    console.error('Erro ao criar prova:', error);
    res.status(500).json({ error: 'Erro ao criar prova.' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, time_limit_minutes, passing_grade, max_attempts, shuffle_questions, show_answers_after, is_active, questions } = req.body;

    const [quizzes] = await db.query(
      `SELECT q.*, c.teacher_id FROM quizzes q JOIN courses c ON q.course_id = c.id WHERE q.id = ?`,
      [id]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }

    if (req.user.role !== 'admin' && quizzes[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    const fields = [];
    const values = [];

    if (title !== undefined) { fields.push('title = ?'); values.push(title); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (time_limit_minutes !== undefined) { fields.push('time_limit_minutes = ?'); values.push(time_limit_minutes); }
    if (passing_grade !== undefined) { fields.push('passing_grade = ?'); values.push(passing_grade); }
    if (max_attempts !== undefined) { fields.push('max_attempts = ?'); values.push(max_attempts); }
    if (shuffle_questions !== undefined) { fields.push('shuffle_questions = ?'); values.push(shuffle_questions ? 1 : 0); }
    if (show_answers_after !== undefined) { fields.push('show_answers_after = ?'); values.push(show_answers_after); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (fields.length > 0) {
      values.push(id);
      await db.query(`UPDATE quizzes SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    if (questions && Array.isArray(questions)) {
      await db.query('DELETE FROM quiz_questions WHERE quiz_id = ?', [id]);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let correctAnswer = q.correct_answer || null;

        if (q.question_type === 'true_false' && q.options && !correctAnswer) {
          try {
            const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            const correctOpt = opts.find(o => o.is_correct);
            if (correctOpt) correctAnswer = correctOpt.text;
          } catch {}
        }

        await db.query(
          `INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, explanation, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, q.question_text, q.question_type || 'multiple_choice',
            q.options ? JSON.stringify(q.options) : null, correctAnswer,
            q.points || 1, q.explanation || null, i + 1]
        );
      }
    }

    const [updated] = await db.query('SELECT * FROM quizzes WHERE id = ?', [id]);

    res.json(updated[0]);
  } catch (error) {
    console.error('Erro ao atualizar prova:', error);
    res.status(500).json({ error: 'Erro ao atualizar prova.' });
  }
};

const delete_quiz = async (req, res) => {
  try {
    const { id } = req.params;

    const [quizzes] = await db.query(
      `SELECT q.id, q.title, c.teacher_id FROM quizzes q JOIN courses c ON q.course_id = c.id WHERE q.id = ?`,
      [id]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }

    if (req.user.role !== 'admin' && quizzes[0].teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão.' });
    }

    await db.query('DELETE FROM quizzes WHERE id = ?', [id]);

    res.json({ message: 'Prova removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover prova:', error);
    res.status(500).json({ error: 'Erro ao remover prova.' });
  }
};

const startAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;

    const [quizzes] = await db.query('SELECT * FROM quizzes WHERE id = ? AND is_active = 1', [quizId]);
    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Prova não encontrada.' });
    }

    const quiz = quizzes[0];

    const [enrollments] = await db.query(
      'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = \'active\'',
      [req.user.id, quiz.course_id]
    );

    if (enrollments.length === 0) {
      return res.status(403).json({ error: 'Você não está matriculado neste curso.' });
    }

    const [attemptCount] = await db.query(
      'SELECT COUNT(*) as total FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? AND status IN (\'submitted\', \'graded\')',
      [quizId, req.user.id]
    );

    if (parseInt(attemptCount[0].total) >= quiz.max_attempts) {
      return res.status(403).json({ error: 'Você atingiu o limite de tentativas.' });
    }

    const [existing] = await db.query(
      'SELECT id FROM quiz_attempts WHERE quiz_id = ? AND user_id = ? AND status = \'in_progress\'',
      [quizId, req.user.id]
    );

    if (existing.length > 0) {
      return res.json({ attempt_id: existing[0].id, message: 'Tentativa já em andamento.' });
    }

    const [result] = await db.query(
      'INSERT INTO quiz_attempts (quiz_id, user_id, enrollment_id, status) VALUES (?, ?, ?, \'in_progress\')',
      [quizId, req.user.id, enrollments[0].id]
    );

    const [questions] = await db.query(
      `SELECT id, question_text, question_type, options, points, sort_order
       FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC`,
      [quizId]
    );

    res.status(201).json({
      attempt_id: result.insertId,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        time_limit_minutes: quiz.time_limit_minutes,
        shuffle_questions: quiz.shuffle_questions
      },
      questions: quiz.shuffle_questions ? questions.sort(() => Math.random() - 0.5) : questions
    });
  } catch (error) {
    console.error('Erro ao iniciar tentativa:', error);
    res.status(500).json({ error: 'Erro ao iniciar tentativa.' });
  }
};

const submitAttempt = async (req, res) => {
  try {
    const { quizId } = req.params;
    const attemptId = req.params.attemptId || req.body.attempt_id;
    const { answers, time_spent_seconds } = req.body;

    if (!attemptId) {
      return res.status(400).json({ error: 'ID da tentativa é obrigatório.' });
    }

    const [attempts] = await db.query(
      'SELECT * FROM quiz_attempts WHERE id = ? AND quiz_id = ? AND user_id = ? AND status = \'in_progress\'',
      [attemptId, quizId, req.user.id]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ error: 'Tentativa não encontrada ou já finalizada.' });
    }

    const attempt = attempts[0];

    const [quiz] = await db.query('SELECT time_limit_minutes FROM quizzes WHERE id = ?', [quizId]);
    if (quiz.length > 0 && quiz[0].time_limit_minutes) {
      const startedAt = new Date(attempt.started_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startedAt) / 1000);
      const timeLimitSeconds = quiz[0].time_limit_minutes * 60;

      if (elapsedSeconds > timeLimitSeconds + 30) {
        await db.query(
          `UPDATE quiz_attempts SET status = 'submitted', submitted_at = NOW(),
           time_spent_seconds = ?, score = 0, total_points = 0, is_passed = 0
           WHERE id = ?`,
          [elapsedSeconds, attemptId]
        );
        return res.status(400).json({ error: 'Tempo esgotado. A tentativa foi finalizada automaticamente.' });
      }
    }

    const [questions] = await db.query(
      'SELECT id, question_type, correct_answer, options, points FROM quiz_questions WHERE quiz_id = ?',
      [quizId]
    );

    const questionMap = new Map(questions.map(q => [q.id, q]));
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = [];

    for (const answer of answers) {
      const question = questionMap.get(parseInt(answer.question_id));
      if (!question) continue;

      totalPoints += parseFloat(question.points);
      let isCorrect = false;

      if (question.question_type === 'essay') {
        isCorrect = false;
      } else if (question.question_type === 'true_false') {
        let correctValue = question.correct_answer;
        if (!correctValue && question.options) {
          try {
            const opts = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
            const correctOpt = opts.find(o => o.is_correct);
            if (correctOpt) correctValue = correctOpt.text;
          } catch {}
        }
        isCorrect = String(answer.answer).trim().toLowerCase() === String(correctValue).trim().toLowerCase();
        if (isCorrect) earnedPoints += parseFloat(question.points);
      } else {
        isCorrect = String(answer.answer).trim().toLowerCase() === String(question.correct_answer).trim().toLowerCase();
        if (isCorrect) earnedPoints += parseFloat(question.points);
      }

      let correctDisplay = question.correct_answer;
      if (!correctDisplay && question.question_type === 'true_false' && question.options) {
        try {
          const opts = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
          const correctOpt = opts.find(o => o.is_correct);
          if (correctOpt) correctDisplay = correctOpt.text;
        } catch {}
      }

      gradedAnswers.push({
        question_id: answer.question_id,
        answer: answer.answer,
        is_correct: isCorrect,
        points_earned: isCorrect ? parseFloat(question.points) : 0,
        correct_answer: question.question_type !== 'essay' ? correctDisplay : null
      });
    }

    if (totalPoints === 0) totalPoints = 1;

    const score = (earnedPoints / totalPoints) * 100;
    const passingGrade = (await db.query('SELECT passing_grade FROM quizzes WHERE id = ?', [quizId]))[0][0].passing_grade;
    const isPassed = score >= parseFloat(passingGrade);

    await db.query(
      `UPDATE quiz_attempts SET answers = ?, score = ?, total_points = ?, is_passed = ?,
        submitted_at = NOW(), time_spent_seconds = ?, status = 'submitted'
       WHERE id = ?`,
      [JSON.stringify(gradedAnswers), score, totalPoints, isPassed ? 1 : 0, time_spent_seconds || null, attemptId]
    );

    if (isPassed) {
      const [quiz] = await db.query('SELECT course_id FROM quizzes WHERE id = ?', [quizId]);
      if (quiz.length > 0) {
        await db.query(
          'UPDATE enrollments SET final_grade = ? WHERE user_id = ? AND course_id = ?',
          [score, req.user.id, quiz[0].course_id]
        );

        const [enrollment] = await db.query(
          'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
          [req.user.id, quiz[0].course_id]
        );

        if (enrollment.length > 0) {
          const eid = enrollment[0].id;
          const cid = quiz[0].course_id;

          const [totalLessons] = await db.query(
            'SELECT COUNT(*) as t FROM lessons l JOIN modules m ON l.module_id = m.id WHERE m.course_id = ?',
            [cid]
          );
          const [completedLessons] = await db.query(
            "SELECT COUNT(*) as t FROM lesson_progress WHERE enrollment_id = ? AND status = 'completed'",
            [eid]
          );
          const [totalQuizzes] = await db.query(
            'SELECT COUNT(*) as t FROM quizzes WHERE course_id = ? AND is_active = 1',
            [cid]
          );
          const [passedQuizzes] = await db.query(
            `SELECT COUNT(DISTINCT qa.quiz_id) as t FROM quiz_attempts qa
             JOIN quizzes q ON qa.quiz_id = q.id
             WHERE q.course_id = ? AND qa.user_id = ? AND qa.is_passed = 1`,
            [cid, req.user.id]
          );

          const total = parseInt(totalLessons[0].t) + parseInt(totalQuizzes[0].t);
          const done = parseInt(completedLessons[0].t) + parseInt(passedQuizzes[0].t);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          await db.query(
            'UPDATE enrollments SET progress_percentage = ?, last_accessed_at = NOW() WHERE id = ?',
            [pct, eid]
          );

          if (pct >= 100) {
            await db.query(
              "UPDATE enrollments SET status = 'completed', completed_at = NOW() WHERE id = ? AND status = 'active'",
              [eid]
            );
          }
        }
      }
    }

    res.json({
      attempt_id: parseInt(attemptId),
      score,
      total_points: totalPoints,
      earned_points: earnedPoints,
      is_passed: isPassed,
      passing_grade: parseFloat(passingGrade)
    });

    console.log(`Tentativa ${attemptId} submetida: ${score}% - ${isPassed ? 'Aprovado' : 'Reprovado'}`);
  } catch (error) {
    console.error('Erro ao submeter tentativa:', error);
    res.status(500).json({ error: 'Erro ao submeter tentativa.' });
  }
};

const getAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;

    const [attempts] = await db.query(
      `SELECT id, score, total_points, is_passed, started_at, submitted_at, time_spent_seconds, status
       FROM quiz_attempts
       WHERE quiz_id = ? AND user_id = ?
       ORDER BY created_at DESC`,
      [quizId, req.user.id]
    );

    res.json(attempts);
  } catch (error) {
    console.error('Erro ao listar tentativas:', error);
    res.status(500).json({ error: 'Erro ao listar tentativas.' });
  }
};

const getResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const attemptId = req.params.attemptId || req.query.attempt_id;

    if (!attemptId) {
      return res.status(400).json({ error: 'ID da tentativa é obrigatório.' });
    }

    const [attempts] = await db.query(
      `SELECT qa.*, q.title as quiz_title, q.passing_grade, q.show_answers_after
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.id = ? AND qa.quiz_id = ? AND qa.user_id = ?`,
      [attemptId, quizId, req.user.id]
    );

    if (attempts.length === 0) {
      return res.status(404).json({ error: 'Tentativa não encontrada.' });
    }

    const attempt = attempts[0];

    if (attempt.status === 'in_progress') {
      return res.json({ status: 'in_progress', message: 'Tentativa ainda em andamento.' });
    }

    const [questions] = await db.query(
      `SELECT id, question_text, question_type, options, correct_answer, points, explanation, sort_order
       FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC`,
      [quizId]
    );

    let answers = [];
    try {
      answers = typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers;
    } catch (e) {
      answers = [];
    }

    const showAnswers = attempt.show_answers_after === 'after_submit' || attempt.show_answers_after === 'after_deadline';

    const results = questions.map(q => {
      const userAnswer = answers.find(a => parseInt(a.question_id) === q.id);
      return {
        question: {
          id: q.id,
          text: q.question_text,
          type: q.question_type,
          options: q.options,
          points: q.points
        },
        user_answer: userAnswer ? userAnswer.answer : null,
        is_correct: userAnswer ? userAnswer.is_correct : null,
        points_earned: userAnswer ? userAnswer.points_earned : 0,
        correct_answer: showAnswers ? q.correct_answer : null,
        explanation: showAnswers ? q.explanation : null
      };
    });

    res.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        total_points: attempt.total_points,
        is_passed: attempt.is_passed,
        started_at: attempt.started_at,
        submitted_at: attempt.submitted_at,
        time_spent_seconds: attempt.time_spent_seconds
      },
      results
    });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    res.status(500).json({ error: 'Erro ao buscar resultados.' });
  }
};

module.exports = {
  getByCourse,
  getById,
  create,
  update,
  delete: delete_quiz,
  startAttempt,
  submitAttempt,
  getAttempts,
  getResults
};
