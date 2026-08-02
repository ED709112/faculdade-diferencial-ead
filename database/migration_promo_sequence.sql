-- Sequência de 3 mensagens nas campanhas de divulgação
ALTER TABLE promo_campaigns
  ADD COLUMN message_reminder TEXT DEFAULT NULL AFTER message,
  ADD COLUMN message_urgency TEXT DEFAULT NULL AFTER message_reminder,
  ADD COLUMN reminder_days INT NOT NULL DEFAULT 3 AFTER message_urgency,
  ADD COLUMN urgency_days INT NOT NULL DEFAULT 6 AFTER reminder_days;

ALTER TABLE promo_campaign_records
  ADD COLUMN msg_reminder_sent_at DATETIME DEFAULT NULL AFTER sent_at,
  ADD COLUMN msg_urgency_sent_at DATETIME DEFAULT NULL AFTER msg_reminder_sent_at,
  ADD COLUMN replied_at DATETIME DEFAULT NULL AFTER msg_urgency_sent_at;
