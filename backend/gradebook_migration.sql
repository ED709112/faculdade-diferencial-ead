-- Migracao: correcoes no diario de notas (student_gradebook)
-- 1) Adiciona colunas usadas pelo submissionController (observations, created_by)
ALTER TABLE student_gradebook
  ADD COLUMN observations TEXT DEFAULT NULL AFTER absences,
  ADD COLUMN created_by INT DEFAULT NULL AFTER observations;

-- 2) Chave unica (student_id, discipline_id, bimester) para ON DUPLICATE KEY UPDATE funcionar
--    (evita linhas duplicadas ao salvar a mesma nota do mesmo bimestre)
ALTER TABLE student_gradebook
  ADD UNIQUE KEY uk_gradebook_student_discipline_bimester (student_id, discipline_id, bimester);

-- Verificacao
SHOW COLUMNS FROM student_gradebook;
