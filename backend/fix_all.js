const mysql = require('mysql2/promise');

(async () => {
  const pool = await mysql.createPool({
    host: 'localhost', port: 3306, user: 'root',
    database: 'faculdade_diferencial_ead', charset: 'utf8mb4'
  });

  await pool.query('UPDATE testimonials SET name = ? WHERE id = ?', ['João Santos', 2]);
  console.log('Fixed testimonial 2');

  const [all] = await pool.query('SELECT id, name, HEX(name) as hex_name, role, content FROM testimonials');
  for (const t of all) {
    console.log(`${t.id}: ${t.name} | role: ${t.role}`);
  }

  const [courses] = await pool.query('SELECT id, title, description FROM courses');
  for (const c of courses) {
    console.log(`Course ${c.id}: ${c.title}`);
  }

  const [categories] = await pool.query('SELECT id, name, description FROM categories');
  for (const c of categories) {
    console.log(`Category ${c.id}: ${c.name} | ${c.description}`);
  }

  await pool.end();
})();
