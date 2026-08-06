-- Vincula as disciplinas existentes aos cursos via módulos
-- 1) Atribui o professor do curso (João Silva, id 2) às disciplinas dos cursos 1 e 2
UPDATE disciplines SET teacher_id = 2
WHERE id IN (2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25);

-- 2) Vincula disciplinas aos módulos de mesmo nome (curso 1: módulos 12-25,27; curso 2: módulos 4-10)
INSERT INTO course_disciplines (course_id, discipline_id, module_id, sort_order)
SELECT m.course_id, d.id, m.id, m.sort_order
FROM modules m
JOIN disciplines d ON TRIM(d.name) = TRIM(m.title)
WHERE m.course_id IN (1,2)
  AND NOT EXISTS (
    SELECT 1 FROM course_disciplines cd
    WHERE cd.course_id = m.course_id AND cd.discipline_id = d.id AND cd.module_id = m.id
  );

-- 3) Disciplina 24 (Sistemas de Informação em Saúde) não possui módulo: vincula sem módulo
INSERT INTO course_disciplines (course_id, discipline_id, module_id, sort_order)
SELECT 1, 24, NULL, 17
WHERE NOT EXISTS (
  SELECT 1 FROM course_disciplines cd WHERE cd.course_id = 1 AND cd.discipline_id = 24
);

-- Verificação
SELECT cd.course_id, c.title AS course_title, cd.discipline_id, d.name AS discipline_name,
       cd.module_id, m.title AS module_name
FROM course_disciplines cd
JOIN courses c ON c.id = cd.course_id
JOIN disciplines d ON d.id = cd.discipline_id
LEFT JOIN modules m ON m.id = cd.module_id
ORDER BY cd.course_id, cd.sort_order;
