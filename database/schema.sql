-- =====================================================
-- FACULDADE DIFERENCIAL EAD - SCHEMA COMPLETO DO BANCO DE DADOS
-- =====================================================

CREATE DATABASE IF NOT EXISTS faculdade_diferencial_ead
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE faculdade_diferencial_ead;

-- =====================================================
-- TABELAS DE USUÁRIOS E AUTENTICAÇÃO
-- =====================================================

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student',
    avatar VARCHAR(500) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    cpf VARCHAR(14) DEFAULT NULL,
    birth_date DATE DEFAULT NULL,
    gender ENUM('M', 'F', 'Outro') DEFAULT NULL,
    address TEXT DEFAULT NULL,
    city VARCHAR(100) DEFAULT NULL,
    state VARCHAR(2) DEFAULT NULL,
    zip_code VARCHAR(10) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    reset_password_token VARCHAR(255) DEFAULT NULL,
    reset_password_expires TIMESTAMP NULL DEFAULT NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    lgpd_consent TINYINT(1) NOT NULL DEFAULT 0,
    lgpd_consent_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_role (role),
    INDEX idx_users_email (email),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE user_documents (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    reviewed_by INT UNSIGNED DEFAULT NULL,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_documents_user (user_id),
    INDEX idx_user_documents_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE CURSOS
-- =====================================================

CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    icon VARCHAR(100) DEFAULT NULL,
    image VARCHAR(500) DEFAULT NULL,
    parent_id INT UNSIGNED DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE courses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED DEFAULT NULL,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    subtitle VARCHAR(500) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    content_program TEXT DEFAULT NULL,
    image VARCHAR(500) DEFAULT NULL,
    video_presentation VARCHAR(500) DEFAULT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    original_price DECIMAL(10, 2) DEFAULT NULL,
    discount_price DECIMAL(10, 2) DEFAULT NULL,
    workload INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Carga horária em horas',
    workload_certificate INT UNSIGNED DEFAULT NULL COMMENT 'Carga horária para certificado',
    is_free TINYINT(1) NOT NULL DEFAULT 0,
    has_certificate TINYINT(1) NOT NULL DEFAULT 1,
    certificate_template VARCHAR(500) DEFAULT NULL,
    enrollment_count INT UNSIGNED NOT NULL DEFAULT 0,
    rating_avg DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
    rating_count INT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    featured TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    meta_title VARCHAR(255) DEFAULT NULL,
    meta_description TEXT DEFAULT NULL,
    requirements TEXT DEFAULT NULL,
    target_audience TEXT DEFAULT NULL,
    what_you_learn TEXT DEFAULT NULL,
    max_students INT UNSIGNED DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    is_lifetime_access TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Acesso vitalício',
    max_installments INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Máximo de parcelas no cartão',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_courses_slug (slug),
    INDEX idx_courses_teacher (teacher_id),
    INDEX idx_courses_category (category_id),
    INDEX idx_courses_status (status),
    INDEX idx_courses_featured (featured),
    FULLTEXT INDEX ft_courses_search (title, subtitle, description)
) ENGINE=InnoDB;

CREATE TABLE course_tags (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    tag VARCHAR(100) NOT NULL,

    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_tags_course (course_id),
    INDEX idx_course_tags_tag (tag)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE DISCIPLINAS
-- =====================================================

CREATE TABLE disciplines (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    workload INT NOT NULL DEFAULT 0,
    titulacao VARCHAR(100) DEFAULT NULL,
    ementa TEXT DEFAULT NULL,
    objetivo TEXT DEFAULT NULL,
    conteudo_programatico TEXT DEFAULT NULL,
    metodologia TEXT DEFAULT NULL,
    metodologia_ensino TEXT DEFAULT NULL,
    avaliacao TEXT DEFAULT NULL,
    recursos_didaticos TEXT DEFAULT NULL,
    referencias TEXT DEFAULT NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_disciplines_teacher (teacher_id),
    KEY idx_disciplines_status (status),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE discipline_materials (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    discipline_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    material_type ENUM('apostila','atividade','video','documento','link','outro') DEFAULT 'documento',
    file_url VARCHAR(500) DEFAULT NULL,
    external_url VARCHAR(500) DEFAULT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_dm_discipline (discipline_id),
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE course_disciplines (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    discipline_id INT UNSIGNED NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_course_discipline (course_id, discipline_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE course_images (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE MÓDULOS E AULAS
-- =====================================================

CREATE TABLE modules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT NULL,
    period INT DEFAULT NULL,
    workload INT DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    is_free TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_modules_course (course_id)
) ENGINE=InnoDB;

CREATE TABLE lessons (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    module_id INT UNSIGNED NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT NULL,
    content_type ENUM('video', 'text', 'pdf', 'quiz', 'activity') NOT NULL DEFAULT 'video',
    video_url VARCHAR(500) DEFAULT NULL,
    video_duration INT UNSIGNED DEFAULT NULL COMMENT 'Duração em segundos',
    text_content LONGTEXT DEFAULT NULL,
    pdf_url VARCHAR(500) DEFAULT NULL,
    attachment_url VARCHAR(500) DEFAULT NULL,
    attachment_name VARCHAR(255) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_free TINYINT(1) NOT NULL DEFAULT 0,
    is_preview TINYINT(1) NOT NULL DEFAULT 0,
    workload_minutes INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    INDEX idx_lessons_module (module_id),
    INDEX idx_lessons_type (content_type)
) ENGINE=InnoDB;

CREATE TABLE lesson_comments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    parent_id INT UNSIGNED DEFAULT NULL,
    comment TEXT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES lesson_comments(id) ON DELETE CASCADE,
    INDEX idx_lesson_comments_lesson (lesson_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE MATRÍCULA E PROGRESSO
-- =====================================================

CREATE TABLE enrollments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    order_id INT UNSIGNED DEFAULT NULL,
    status ENUM('active', 'inactive', 'completed', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
    progress_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    last_accessed_at TIMESTAMP NULL DEFAULT NULL,
    certificate_issued TINYINT(1) NOT NULL DEFAULT 0,
    certificate_issued_at TIMESTAMP NULL DEFAULT NULL,
    final_grade DECIMAL(5, 2) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE INDEX uk_enrollments_user_course (user_id, course_id),
    INDEX idx_enrollments_course (course_id),
    INDEX idx_enrollments_status (status)
) ENGINE=InnoDB;

CREATE TABLE lesson_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT UNSIGNED NOT NULL,
    lesson_id INT UNSIGNED NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
    progress_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    watch_time_seconds INT UNSIGNED DEFAULT NULL COMMENT 'Para vídeos: tempo assistido',
    last_position_seconds INT UNSIGNED DEFAULT NULL COMMENT 'Para vídeos: última posição',
    started_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE INDEX uk_lesson_progress (enrollment_id, lesson_id),
    INDEX idx_lesson_progress_lesson (lesson_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE AVALIAÇÕES (QUIZ/PROVAS)
-- =====================================================

CREATE TABLE quizzes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT UNSIGNED DEFAULT NULL,
    course_id INT UNSIGNED NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT NULL,
    time_limit_minutes INT UNSIGNED DEFAULT NULL,
    passing_grade DECIMAL(5, 2) NOT NULL DEFAULT 60.00,
    max_attempts INT UNSIGNED NOT NULL DEFAULT 3,
    shuffle_questions TINYINT(1) NOT NULL DEFAULT 1,
    show_answers_after ENUM('never', 'after_submit', 'after_deadline') NOT NULL DEFAULT 'after_submit',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_quizzes_course (course_id)
) ENGINE=InnoDB;

CREATE TABLE quiz_questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT UNSIGNED NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'essay') NOT NULL DEFAULT 'multiple_choice',
    options JSON DEFAULT NULL,
    correct_answer TEXT DEFAULT NULL,
    points DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    explanation TEXT DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz_questions_quiz (quiz_id)
) ENGINE=InnoDB;

CREATE TABLE quiz_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    enrollment_id INT UNSIGNED NOT NULL,
    answers JSON DEFAULT NULL,
    score DECIMAL(5, 2) DEFAULT NULL,
    total_points DECIMAL(5, 2) DEFAULT NULL,
    is_passed TINYINT(1) DEFAULT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL DEFAULT NULL,
    time_spent_seconds INT UNSIGNED DEFAULT NULL,
    status ENUM('in_progress', 'submitted', 'graded') NOT NULL DEFAULT 'in_progress',

    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    INDEX idx_quiz_attempts_quiz (quiz_id),
    INDEX idx_quiz_attempts_user (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE PEDIDOS E PAGAMENTOS
-- =====================================================

CREATE TABLE orders (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    coupon_id INT UNSIGNED DEFAULT NULL,
    status ENUM('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'partial_refund') NOT NULL DEFAULT 'pending',
    payment_method ENUM('pix', 'credit_card', 'boleto', 'free') NOT NULL DEFAULT 'pix',
    payment_gateway VARCHAR(50) DEFAULT NULL,
    gateway_payment_id VARCHAR(255) DEFAULT NULL,
    gateway_status VARCHAR(100) DEFAULT NULL,
    gateway_response JSON DEFAULT NULL,
    paid_at TIMESTAMP NULL DEFAULT NULL,
    expires_at TIMESTAMP NULL DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_number (order_number)
) ENGINE=InnoDB;

CREATE TABLE payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNSIGNED NOT NULL,
    payment_method ENUM('pix', 'credit_card', 'boleto') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'approved', 'declined', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
    gateway VARCHAR(50) NOT NULL,
    gateway_payment_id VARCHAR(255) DEFAULT NULL,
    gateway_status VARCHAR(100) DEFAULT NULL,
    gateway_response JSON DEFAULT NULL,
    installment_number INT UNSIGNED DEFAULT NULL,
    installment_total INT UNSIGNED DEFAULT NULL,
    pix_qr_code TEXT DEFAULT NULL,
    pix_qr_code_base64 TEXT DEFAULT NULL,
    pix_copy_paste VARCHAR(500) DEFAULT NULL,
    pix_expires_at TIMESTAMP NULL DEFAULT NULL,
    boleto_url VARCHAR(500) DEFAULT NULL,
    boleto_barcode VARCHAR(100) DEFAULT NULL,
    card_brand VARCHAR(50) DEFAULT NULL,
    card_last_four VARCHAR(4) DEFAULT NULL,
    paid_at TIMESTAMP NULL DEFAULT NULL,
    refunded_at TIMESTAMP NULL DEFAULT NULL,
    refund_amount DECIMAL(10, 2) DEFAULT NULL,
    refund_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_status (status),
    INDEX idx_payments_gateway (gateway)
) ENGINE=InnoDB;

CREATE TABLE coupons (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT NULL,
    max_uses INT UNSIGNED DEFAULT NULL,
    used_count INT UNSIGNED NOT NULL DEFAULT 0,
    course_id INT UNSIGNED DEFAULT NULL,
    start_date TIMESTAMP NULL DEFAULT NULL,
    end_date TIMESTAMP NULL DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    INDEX idx_coupons_code (code),
    INDEX idx_coupons_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE CERTIFICADOS
-- =====================================================

CREATE TABLE certificates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    enrollment_id INT UNSIGNED NOT NULL,
    certificate_code VARCHAR(100) NOT NULL UNIQUE,
    qr_code VARCHAR(500) DEFAULT NULL,
    final_grade DECIMAL(5, 2) DEFAULT NULL,
    workload_hours INT UNSIGNED DEFAULT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pdf_url VARCHAR(500) DEFAULT NULL,
    is_valid TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    UNIQUE INDEX uk_certificates_code (certificate_code),
    INDEX idx_certificates_user (user_id),
    INDEX idx_certificates_course (course_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE FAVORITOS E AVALIAÇÕES DE CURSOS
-- =====================================================

CREATE TABLE favorites (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE INDEX uk_favorites (user_id, course_id)
) ENGINE=InnoDB;

CREATE TABLE course_reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    course_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT DEFAULT NULL,
    is_visible TINYINT(1) NOT NULL DEFAULT 1,
    admin_response TEXT DEFAULT NULL,
    admin_responded_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE INDEX uk_course_reviews (user_id, course_id),
    INDEX idx_course_reviews_course (course_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE MENSAGENS E CHAT
-- =====================================================

CREATE TABLE conversations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE conversation_participants (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    last_read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE INDEX uk_conv_participants (conversation_id, user_id)
) ENGINE=InnoDB;

CREATE TABLE messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT UNSIGNED NOT NULL,
    sender_id INT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    attachment_url VARCHAR(500) DEFAULT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_messages_conversation (conversation_id),
    INDEX idx_messages_sender (sender_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE NOTIFICAÇÕES
-- =====================================================

CREATE TABLE notifications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') NOT NULL DEFAULT 'info',
    link VARCHAR(500) DEFAULT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE GAMIFICAÇÃO
-- =====================================================

CREATE TABLE badges (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    icon VARCHAR(500) DEFAULT NULL,
    criteria TEXT DEFAULT NULL,
    points INT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_badges (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    badge_id INT UNSIGNED NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE INDEX uk_user_badges (user_id, badge_id)
) ENGINE=InnoDB;

CREATE TABLE user_points (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    points INT UNSIGNED NOT NULL DEFAULT 0,
    reason VARCHAR(255) NOT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    reference_id INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_points_user (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS ADMINISTRATIVAS
-- =====================================================

CREATE TABLE banners (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500) DEFAULT NULL,
    image VARCHAR(500) NOT NULL,
    link VARCHAR(500) DEFAULT NULL,
    button_text VARCHAR(100) DEFAULT NULL,
    position ENUM('hero', 'sidebar', 'footer') NOT NULL DEFAULT 'hero',
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    start_date TIMESTAMP NULL DEFAULT NULL,
    end_date TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_banners_active (is_active),
    INDEX idx_banners_position (position)
) ENGINE=InnoDB;

CREATE TABLE news (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    content LONGTEXT NOT NULL,
    excerpt TEXT DEFAULT NULL,
    image VARCHAR(500) DEFAULT NULL,
    author_id INT UNSIGNED DEFAULT NULL,
    status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP NULL DEFAULT NULL,
    views INT UNSIGNED NOT NULL DEFAULT 0,
    meta_title VARCHAR(255) DEFAULT NULL,
    meta_description TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_news_slug (slug),
    INDEX idx_news_status (status)
) ENGINE=InnoDB;

CREATE TABLE testimonials (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    content TEXT NOT NULL,
    rating TINYINT UNSIGNED DEFAULT NULL,
    is_visible TINYINT(1) NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE faqs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT DEFAULT NULL,
    setting_type ENUM('text', 'textarea', 'number', 'boolean', 'json', 'image') NOT NULL DEFAULT 'text',
    setting_group VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE page_views (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_url VARCHAR(500) NOT NULL,
    user_id INT UNSIGNED DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    referrer VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_page_views_url (page_url),
    INDEX idx_page_views_date (created_at)
) ENGINE=InnoDB;

CREATE TABLE access_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) DEFAULT NULL,
    entity_id INT UNSIGNED DEFAULT NULL,
    details JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_access_logs_user (user_id),
    INDEX idx_access_logs_action (action),
    INDEX idx_access_logs_date (created_at)
) ENGINE=InnoDB;

CREATE TABLE backups (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT UNSIGNED DEFAULT NULL,
    status ENUM('processing', 'completed', 'failed') NOT NULL DEFAULT 'processing',
    created_by INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- DADOS INICIAIS (SEEDS)
-- =====================================================

-- Administrador padrão
INSERT INTO users (name, email, password, role, is_active, email_verified_at, lgpd_consent, lgpd_consent_at)
VALUES (
    'Administrador',
    'admin@faculdadediferencial.edu.br',
    '$2b$10$placeholder_hash_here', -- Será gerado pelo bcrypt na aplicação
    'admin',
    1,
    NOW(),
    1,
    NOW()
);

-- Configurações padrão
INSERT INTO settings (setting_key, setting_value, setting_type, setting_group, description) VALUES
('site_name', 'Faculdade Diferencial EAD', 'text', 'general', 'Nome do site'),
('site_description', 'Plataforma de Ensino a Distância da Faculdade Diferencial', 'textarea', 'general', 'Descrição do site'),
('site_email', 'contato@faculdadediferencial.edu.br', 'text', 'general', 'E-mail de contato'),
('site_phone', '(11) 99999-9999', 'text', 'general', 'Telefone de contato'),
('site_whatsapp', '5511999999999', 'text', 'general', 'Número do WhatsApp'),
('site_address', 'Rua Example, 123 - São Paulo, SP', 'text', 'general', 'Endereço'),
('primary_color', '#1a56db', 'text', 'visual', 'Cor primária (Azul)'),
('secondary_color', '#f97316', 'text', 'visual', 'Cor secundária (Laranja)'),
('accent_color', '#ffffff', 'text', 'visual', 'Cor de destaque (Branco)'),
('logo', '/images/logo.png', 'image', 'visual', 'Logo da instituição'),
('favicon', '/images/favicon.ico', 'image', 'visual', 'Favicon'),
('footer_text', '© 2026 Faculdade Diferencial. Todos os direitos reservados.', 'textarea', 'general', 'Texto do rodapé'),
('lgpd_text', 'Ao utilizar nossa plataforma, você concorda com nossa Política de Privacidade e os termos da LGPD.', 'textarea', 'general', 'Texto LGPD'),
('maintenance_mode', 'false', 'boolean', 'general', 'Modo manutenção'),
('allow_registration', 'true', 'boolean', 'general', 'Permitir cadastro'),
('email_verification', 'true', 'boolean', 'general', 'Verificação de e-mail obrigatória'),
('default_currency', 'BRL', 'text', 'payment', 'Moeda padrão'),
('payment_gateway', 'asaas', 'text', 'payment', 'Gateway de pagamento'),
('asaas_api_key', '', 'text', 'payment', 'Chave API Asaas'),
('asaas_environment', 'sandbox', 'text', 'payment', 'Ambiente Asaas'),
('mercadopago_public_key', '', 'text', 'payment', 'Chave pública Mercado Pago'),
('mercadopago_access_token', '', 'text', 'payment', 'Token de acesso Mercado Pago'),
('smtp_host', '', 'text', 'email', 'Host SMTP'),
('smtp_port', '587', 'text', 'email', 'Porta SMTP'),
('smtp_user', '', 'text', 'email', 'Usuário SMTP'),
('smtp_password', '', 'text', 'email', 'Senha SMTP'),
('smtp_from_name', 'Faculdade Diferencial EAD', 'text', 'email', 'Nome do remetente'),
('smtp_from_email', 'noreply@faculdadediferencial.edu.br', 'text', 'email', 'E-mail do remetente');

-- Categorias padrão
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
('Administração', 'administracao', 'Cursos de gestão e administração', 'briefcase', 1),
('Direito', 'direito', 'Cursos jurídicos e legislação', 'scale', 2),
('Educação', 'educacao', 'Licenciaturas e pedagogia', 'book', 3),
('Enfermagem', 'enfermagem', 'Cursos da área de saúde', 'heart', 4),
('Engenharia', 'engenharia', 'Engenharia civil e de software', 'cog', 5),
('Tecnologia da Informação', 'ti', 'Programação, dados e infraestrutura', 'code', 6),
('Marketing Digital', 'marketing', 'Marketing, vendas e comunicação', 'trending-up', 7),
('Saúde', 'saude', 'Nutrição, fisioterapia e áreas correlatas', 'activity', 8);

-- Badges padrão
INSERT INTO badges (name, description, icon, points) VALUES
('Primeiro Passo', 'Completou a primeira aula', 'award', 10),
('Estudante Dedicado', 'Completou 5 aulas seguidas', 'star', 25),
('Mestre do Conhecimento', 'Completou 10 aulas seguidas', 'crown', 50),
('Primeiro Certificado', 'Recebeu o primeiro certificado', 'badge', 100),
('Explorador', 'Favoritou 5 cursos', 'heart', 15),
('Comentarista', 'Deixou 10 comentários em aulas', 'message-circle', 20),
('Perfeccionista', 'Tirou nota 10 em uma prova', 'target', 75),
('Graduado', 'Completou 3 cursos', 'graduation-cap', 150),
('Participante Ativo', 'Criou 5 posts no fórum', 'message-square', 30),
('Colaborador', 'Respondeu 10 posts no fórum', 'users', 25),
('Maratonista', 'Completou 20 aulas', 'zap', 60),
('Estrela Ascendente', 'Alcançou 100 pontos', 'trending-up', 20),
('Lenda do Conhecimento', 'Alcançou 500 pontos', 'award', 200);

-- Depoimentos padrão
INSERT INTO testimonials (name, role, content, rating, sort_order) VALUES
('Maria Silva', 'Aluna de Administração', 'A plataforma é incrível! Os professores são muito capacitados e o conteúdo é extremamente relevante para o mercado de trabalho.', 5, 1),
('João Santos', 'Aluno de TI', 'Consegui mudar de carreira graços aos cursos da Faculdade Diferencial. A plataforma é fácil de usar e o suporte é excelente.', 5, 2),
('Ana Oliveira', 'Aluna de Enfermagem', 'Os cursos na área de saúde são muito completos. As aulas práticas e os materiais são de excelente qualidade.', 5, 3);

-- FAQs padrão
INSERT INTO faqs (question, answer, category, sort_order) VALUES
('Como faço para me inscrever em um curso?', 'Basta criar uma conta, navegar até o curso desejado e clicar em "Comprar Curso" ou "Inscrever-se" se for gratuito.', 'Geral', 1),
('Os cursos têm certificado?', 'Sim! Após concluir 100% do curso e ser aprovado nas avaliações, o certificado é gerado automaticamente em PDF.', 'Certificados', 2),
('Qual a forma de pagamento?', 'Aceitamos PIX, cartão de crédito e boleto bancário. Os pagamentos são processados com segurança.', 'Pagamentos', 3),
('Posso acessar o curso em qualquer dispositivo?', 'Sim! A plataforma é responsiva e funciona em computadores, tablets e smartphones.', 'Acesso', 4),
('Como funciona o acesso aos materiais?', 'Após a confirmação do pagamento, todos os materiais (vídeos, apostilas, PDFs) são liberados automaticamente.', 'Acesso', 5),
('Posso solicitar reembolso?', 'Sim, dentro do prazo de 7 dias após a compra, conforme o Código de Defesa do Consumidor.', 'Pagamentos', 6),
('Como entro em contato com o professor?', 'Acesse a aula desejada e utilize a seção de comentários, ou envie uma mensagem pela área do aluno.', 'Suporte', 7),
('Os cursos têm prazo para conclusão?', 'Não! Você tem acesso vitalício ao curso e pode estudar no seu próprio ritmo.', 'Acesso', 8);

-- =====================================================
-- TABELAS DE ATIVIDADES E DIÁRIO
-- =====================================================

CREATE TABLE activity_submissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    discipline_id INT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    file_url VARCHAR(500) DEFAULT NULL,
    status ENUM('pending','graded','rejected') NOT NULL DEFAULT 'pending',
    grade DECIMAL(5,2) DEFAULT NULL,
    max_grade DECIMAL(5,2) DEFAULT 10.00,
    feedback TEXT DEFAULT NULL,
    graded_by INT UNSIGNED DEFAULT NULL,
    graded_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_as_student (student_id),
    KEY idx_as_discipline (discipline_id),
    KEY idx_as_status (status),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE student_gradebook (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    discipline_id INT UNSIGNED NOT NULL,
    bimester TINYINT UNSIGNED NOT NULL DEFAULT 1,
    grade1 DECIMAL(5,2) DEFAULT NULL,
    grade2 DECIMAL(5,2) DEFAULT NULL,
    grade3 DECIMAL(5,2) DEFAULT NULL,
    grade4 DECIMAL(5,2) DEFAULT NULL,
    absences INT UNSIGNED DEFAULT 0,
    observations TEXT DEFAULT NULL,
    created_by INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_gradebook (student_id, discipline_id, bimester),
    KEY idx_sg_student (student_id),
    KEY idx_sg_discipline (discipline_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- TABELAS DE FÓRUM DE DÚVIDAS
-- =====================================================

CREATE TABLE forum_posts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT UNSIGNED NOT NULL,
    module_id INT UNSIGNED DEFAULT NULL,
    user_id INT UNSIGNED NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    is_pinned TINYINT(1) DEFAULT 0,
    is_resolved TINYINT(1) DEFAULT 0,
    view_count INT UNSIGNED DEFAULT 0,
    replies_count INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_fp_course (course_id),
    KEY idx_fp_module (module_id),
    KEY idx_fp_user (user_id),
    KEY idx_fp_pinned (is_pinned, created_at),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE forum_replies (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    is_solution TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_fr_post (post_id),
    KEY idx_fr_user (user_id),
    FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
