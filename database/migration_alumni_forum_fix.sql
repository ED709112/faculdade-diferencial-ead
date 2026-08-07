-- Correção do módulo de Egressos (alumni) e criação do módulo de Fórum
-- Tabelas alumni / alumni_testimonials / alumni_events existiam com schema incompleto;
-- fórum (forum_posts / forum_replies) não existia. Controllers já esperavam este schema.

-- ==================== EGRESSOS (alumni) ====================

ALTER TABLE alumni
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) DEFAULT NULL AFTER email,
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(14) DEFAULT NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50) DEFAULT NULL AFTER cpf,
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(200) DEFAULT NULL AFTER completion_year,
  ADD COLUMN IF NOT EXISTS job_title VARCHAR(150) DEFAULT NULL AFTER company_name,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL AFTER job_title,
  ADD COLUMN IF NOT EXISTS state VARCHAR(2) DEFAULT NULL AFTER city,
  ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255) DEFAULT NULL AFTER linkedin,
  ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Migrar dados existentes (linkedin -> linkedin_url, is_active -> status)
UPDATE alumni SET linkedin_url = linkedin WHERE linkedin IS NOT NULL AND linkedin <> '' AND (linkedin_url IS NULL OR linkedin_url = '');
UPDATE alumni SET status = 'active' WHERE is_active = 1 AND status = 'inactive';

-- ==================== DEPOIMENTOS ====================

ALTER TABLE alumni_testimonials
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_url VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- ==================== EVENTOS ====================

ALTER TABLE alumni_events
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_participants INT DEFAULT NULL;

-- ==================== FÓRUM ====================

CREATE TABLE IF NOT EXISTS forum_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  module_id INT DEFAULT NULL,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  is_resolved TINYINT(1) NOT NULL DEFAULT 0,
  replies_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_course (course_id),
  KEY idx_module (module_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS forum_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  is_solution TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_post (post_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
