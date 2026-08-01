-- Adiciona coluna de referência/parcela nos registros de cobrança
ALTER TABLE billing_records
  ADD COLUMN reference VARCHAR(255) DEFAULT NULL AFTER course;
