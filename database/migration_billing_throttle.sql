-- =====================================================
-- RÉGUA DE COBRANÇA - CONTROLE DE ENVIO (anti-bloqueio)
-- Log de envios + limites de gotejamento
-- =====================================================

CREATE TABLE IF NOT EXISTS billing_send_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    record_id INT UNSIGNED DEFAULT NULL,
    phone VARCHAR(20) NOT NULL,
    type VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_billing_log_time (created_at)
) ENGINE=InnoDB;

INSERT INTO settings (setting_key, setting_value, setting_type, setting_group, description) VALUES
('billing_max_per_hour', '30', 'number', 'billing', 'Limite máximo de mensagens por hora (anti-bloqueio)'),
('billing_interval_seconds', '25', 'number', 'billing', 'Intervalo base em segundos entre cada envio')
ON DUPLICATE KEY UPDATE description = VALUES(description);
