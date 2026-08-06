ALTER TABLE lessons
  ADD COLUMN ementa TEXT NULL AFTER description,
  ADD COLUMN objetivo TEXT NULL AFTER ementa,
  ADD COLUMN objetivo_especifico TEXT NULL AFTER objetivo,
  ADD COLUMN conteudo_programatico LONGTEXT NULL AFTER objetivo_especifico,
  ADD COLUMN metodologia TEXT NULL AFTER conteudo_programatico,
  ADD COLUMN avaliacao TEXT NULL AFTER metodologia,
  ADD COLUMN bibliografia TEXT NULL AFTER avaliacao;
