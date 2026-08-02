-- Campanhas de divulgação (novos cursos) via WhatsApp para leads do CRM
CREATE TABLE IF NOT EXISTS promo_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  poster_url VARCHAR(500) DEFAULT NULL,
  course_id INT DEFAULT NULL,
  course_name VARCHAR(150) DEFAULT NULL,
  enrollment_link VARCHAR(500) DEFAULT NULL,
  total_records INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  status ENUM('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS promo_campaign_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  lead_id INT NOT NULL,
  name VARCHAR(150) DEFAULT NULL,
  whatsapp VARCHAR(20) DEFAULT NULL,
  status ENUM('pending','sent','skipped','error') NOT NULL DEFAULT 'pending',
  sent_at DATETIME DEFAULT NULL,
  last_error VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_campaign (campaign_id),
  KEY idx_campaign_status (campaign_id, status),
  KEY idx_lead (lead_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Log de envios de divulgação (throttle compartilhado com a régua de cobrança)
CREATE TABLE IF NOT EXISTS promo_send_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_id INT DEFAULT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_created (created_at),
  KEY idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Configurações padrão de divulgação
INSERT INTO settings (setting_key, setting_value, setting_type, setting_group) VALUES
  ('promo_active', '1', 'text', 'promo'),
  ('promo_send_start', '8', 'text', 'promo'),
  ('promo_send_end', '20', 'text', 'promo'),
  ('promo_max_per_hour', '20', 'text', 'promo'),
  ('promo_interval_seconds', '25', 'text', 'promo'),
  ('site_url', 'https://fadead.com.br', 'text', 'site')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
