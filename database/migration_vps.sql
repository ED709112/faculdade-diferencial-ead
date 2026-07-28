CREATE TABLE IF NOT EXISTS chatbot_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  contact_name VARCHAR(100),
  status ENUM('active','paused','bot','human','closed') DEFAULT 'active',
  lead_id INT,
  assigned_to INT,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS chatbot_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  direction ENUM('inbound','outbound') NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  content TEXT NOT NULL,
  is_bot TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversation (conversation_id),
  FOREIGN KEY (conversation_id) REFERENCES chatbot_conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  cpf VARCHAR(14),
  source VARCHAR(50),
  status ENUM('new','contacted','interested','enrolled','lost') DEFAULT 'new',
  course_interest VARCHAR(200),
  course_id INT,
  notes TEXT,
  assigned_to INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS lead_interactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  type ENUM('whatsapp','instagram','facebook','email','phone','meeting','note','system') NOT NULL,
  direction ENUM('inbound','outbound') DEFAULT 'outbound',
  subject VARCHAR(200),
  message TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lead_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6'
);

CREATE TABLE IF NOT EXISTS lead_tag_relation (
  lead_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (lead_id, tag_id),
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES lead_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS polos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  phone VARCHAR(20),
  email VARCHAR(100),
  responsible VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alumni (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(100),
  course VARCHAR(150),
  completion_year YEAR,
  photo_url VARCHAR(255),
  bio TEXT,
  linkedin VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alumni_testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alumni_id INT NOT NULL,
  title VARCHAR(200),
  content TEXT NOT NULL,
  rating INT DEFAULT 5,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumni_id) REFERENCES alumni(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alumni_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATETIME,
  location VARCHAR(200),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disciplines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  workload INT,
  titulacao VARCHAR(100),
  ementa TEXT,
  teacher_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discipline_materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  discipline_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  material_type ENUM('pdf','video','document','link') DEFAULT 'pdf',
  file_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_disciplines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  discipline_id INT NOT NULL,
  module_id INT,
  sort_order INT DEFAULT 0,
  UNIQUE KEY unique_link (course_id, module_id, discipline_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  discipline_id INT NOT NULL,
  file_url VARCHAR(500),
  status ENUM('submitted','approved','rejected') DEFAULT 'submitted',
  grade DECIMAL(5,2),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_gradebook (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  discipline_id INT NOT NULL,
  bimester INT DEFAULT 1,
  grade1 DECIMAL(5,2),
  grade2 DECIMAL(5,2),
  absences INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_grade (student_id, discipline_id, bimester),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS editais_portarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type ENUM('edital','portaria','resolucao','documento') DEFAULT 'edital',
  file_url VARCHAR(500),
  file_name VARCHAR(200),
  is_active TINYINT(1) DEFAULT 1,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
