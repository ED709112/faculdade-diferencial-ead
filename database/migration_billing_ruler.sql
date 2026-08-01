-- =====================================================
-- RÉGUA DE COBRANÇA VIA WHATSAPP
-- Tabelas de campanhas, registros, templates e config
-- =====================================================

CREATE TABLE IF NOT EXISTS billing_campaigns (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) DEFAULT NULL,
    total_records INT UNSIGNED NOT NULL DEFAULT 0,
    status ENUM('pending','processing','completed') NOT NULL DEFAULT 'pending',
    created_by INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS billing_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT UNSIGNED DEFAULT NULL,
    student_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    course VARCHAR(255) DEFAULT NULL,
    amount DECIMAL(10,2) DEFAULT NULL,
    due_date DATE NOT NULL,
    status ENUM('pending','paid','skipped') NOT NULL DEFAULT 'pending',
    msg_t2_sent_at DATETIME DEFAULT NULL,
    msg_due_sent_at DATETIME DEFAULT NULL,
    msg_overdue_sent_at DATETIME DEFAULT NULL,
    last_error TEXT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_billing_records_due (due_date),
    INDEX idx_billing_records_status (status),
    INDEX idx_billing_records_campaign (campaign_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS billing_templates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_key VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(100) DEFAULT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO billing_templates (template_key, title, message) VALUES
('t2', '2 dias antes do vencimento', 'Olá, {nome}! 😊 Seu boleto da Faculdade Diferencial referente ao curso {curso}, no valor de R$ {valor}, vence em 2 dias ({vencimento}). Já pode realizar o pagamento para evitar atrasos. Qualquer dúvida, estamos à disposição!'),
('due', 'Dia do vencimento', 'Olá, {nome}! 👋 Lembramos que hoje ({vencimento}) vence o boleto de R$ {valor} do curso {curso}. Faça o pagamento hoje para não acumular juros. Se já pagou, desconsidere esta mensagem. Obrigado!'),
('overdue', 'Após o vencimento', 'Olá, {nome}! Identificamos que o boleto de R$ {valor} do curso {curso} venceu em {vencimento}. Para regularizar sua situação e evitar bloqueios, realize o pagamento o quanto antes. Caso já tenha pago, desconsidere esta mensagem. Estamos à disposição!')
ON DUPLICATE KEY UPDATE title = VALUES(title), message = VALUES(message);

INSERT INTO settings (setting_key, setting_value, setting_type, setting_group, description) VALUES
('billing_active', '1', 'text', 'billing', 'Ativa/desativa o envio automático da régua de cobrança'),
('billing_send_start', '8', 'number', 'billing', 'Hora inicial para envio das mensagens'),
('billing_send_end', '20', 'number', 'billing', 'Hora final para envio das mensagens')
ON DUPLICATE KEY UPDATE description = VALUES(description);
