const mysql = require('mysql2/promise');

(async () => {
  const pool = await mysql.createPool({
    host: 'localhost', port: 3306, user: 'root',
    database: 'faculdade_diferencial_ead', charset: 'utf8mb4'
  });

  const categoryFixes = [
    { id: 3, name: 'Educação', description: 'Licenciaturas e pedagogia' },
    { id: 4, name: 'Enfermagem', description: 'Cursos da área de saúde' },
    { id: 6, name: 'Tecnologia da Informação', description: 'Programação, dados e infraestrutura' },
    { id: 7, name: 'Marketing Digital', description: 'Marketing, vendas e comunicação' },
    { id: 8, name: 'Saúde', description: 'Nutrição, fisioterapia e áreas correlatas' },
  ];

  for (const c of categoryFixes) {
    await pool.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [c.name, c.description, c.id]);
    console.log(`Category ${c.id}: ${c.name}`);
  }

  const courseFixes = [
    { id: 1, title: 'Administração de Empresas', description: 'Curso completo de administração com foco no mercado de trabalho brasileiro.' },
  ];

  for (const c of courseFixes) {
    await pool.query('UPDATE courses SET title = ?, description = ? WHERE id = ?', [c.title, c.description, c.id]);
    console.log(`Course ${c.id}: ${c.title}`);
  }

  const [testimonials] = await pool.query('SELECT id, name, content FROM testimonials');
  for (const t of testimonials) {
    const hasBad = /\?\?/.test(t.name) || /\?\?/.test(t.content);
    if (hasBad) {
      console.log(`Testimonial ${t.id}: has broken encoding - "${t.name}"`);
    }
  }

  const [settings] = await pool.query('SELECT setting_key, setting_value FROM site_settings');
  for (const s of settings) {
    if (/\?\?/.test(s.setting_value || '')) {
      console.log(`Setting: ${s.setting_key} has broken encoding`);
    }
  }

  console.log('Done!');
  await pool.end();
})();
