-- Cadastro completo do aluno: RG, número do endereço, bairro e filiação (nome do pai e da mãe)
-- Dados necessários para o boleto sair com o sacado completo para cobrança (SPC/Serasa)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS rg VARCHAR(20) DEFAULT NULL AFTER cpf,
  ADD COLUMN IF NOT EXISTS address_number VARCHAR(20) DEFAULT NULL AFTER address,
  ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100) DEFAULT NULL AFTER address_number,
  ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150) DEFAULT NULL AFTER gender,
  ADD COLUMN IF NOT EXISTS father_name VARCHAR(150) DEFAULT NULL AFTER mother_name;

-- Matrículas de cursos pagos criadas com status 'pending' (enrollPublic), mas o ENUM não aceitava.
ALTER TABLE enrollments
  MODIFY COLUMN status ENUM('active','pending','inactive','completed','expired','cancelled') NOT NULL DEFAULT 'active';
