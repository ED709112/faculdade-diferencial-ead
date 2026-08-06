const teacherScope = (teacherId, dAlias = '') => {
  const p = dAlias ? `${dAlias}.` : '';
  return {
    sql: `(${p}teacher_id = ?
      OR EXISTS (
        SELECT 1 FROM course_disciplines cd
        WHERE cd.discipline_id = ${p}id
          AND cd.module_id IN (SELECT id FROM modules WHERE teacher_id = ?)
      )
      OR EXISTS (
        SELECT 1 FROM course_disciplines cd
        JOIN courses c ON c.id = cd.course_id
        WHERE cd.discipline_id = ${p}id AND c.teacher_id = ?
      ))`,
    params: [teacherId, teacherId, teacherId],
  };
};

const courseScope = (teacherId, cAlias = '') => {
  const p = cAlias ? `${cAlias}.` : '';
  return {
    sql: `(${p}teacher_id = ?
      OR EXISTS (
        SELECT 1 FROM modules m
        WHERE m.course_id = ${p}id AND m.teacher_id = ?
      )
      OR EXISTS (
        SELECT 1 FROM course_disciplines cd
        JOIN disciplines d ON cd.discipline_id = d.id
        WHERE cd.course_id = ${p}id AND d.teacher_id = ?
      ))`,
    params: [teacherId, teacherId, teacherId],
  };
};

module.exports = { teacherScope, courseScope };
