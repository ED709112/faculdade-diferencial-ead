-- Migracao: Modulo de Turmas + historico escolar
-- Tabela de turmas (classes/turmas por curso, polo, periodo e turno)

CREATE TABLE IF NOT EXISTS turmas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  polo_id INT DEFAULT NULL,
  teacher_id INT UNSIGNED DEFAULT NULL,
  period VARCHAR(50) DEFAULT NULL COMMENT 'Periodo/semestre, ex: 2026.1',
  shift ENUM('matutino','vespertino','noturno','ead') NOT NULL DEFAULT 'ead',
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  max_students INT UNSIGNED DEFAULT NULL,
  status ENUM('active','inactive','closed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_turmas_course (course_id),
  KEY idx_turmas_polo (polo_id),
  KEY idx_turmas_teacher (teacher_id),
  KEY idx_turmas_status (status),
  CONSTRAINT turmas_ibfk_1 FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT turmas_ibfk_2 FOREIGN KEY (polo_id) REFERENCES polos(id) ON DELETE SET NULL,
  CONSTRAINT turmas_ibfk_3 FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vincula a matricula a uma turma
ALTER TABLE enrollments ADD COLUMN turma_id INT UNSIGNED DEFAULT NULL AFTER course_id;
ALTER TABLE enrollments ADD KEY idx_enrollments_turma (turma_id);
ALTER TABLE enrollments ADD CONSTRAINT enrollments_ibfk_turma FOREIGN KEY (turma_id) REFERENCES turmas(id) ON DELETE SET NULL;
