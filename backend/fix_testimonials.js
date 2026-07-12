const mysql = require('mysql2/promise');

(async () => {
  const pool = await mysql.createPool({
    host: 'localhost', port: 3306, user: 'root',
    database: 'faculdade_diferencial_ead', charset: 'utf8mb4'
  });

  const testimonialFixes = [
    { name: 'Maria Silva', role: 'Estudante de Enfermagem', content: 'Excelente plataforma! Os professores são muito dedicados e o material é de excelente qualidade. Recomendo a todos que desejam uma educação de qualidade à distância.' },
    { name: 'João Santos', role: 'Estudante de Administração', content: 'Conciliar trabalho e estudo ficou muito mais fácil com a Faculdade Diferencial. O conteúdo é prático e aplicável ao mercado de trabalho.' },
    { name: 'Ana Oliveira', role: 'Estudante de TI', content: 'O curso de Tecnologia da Informação superou minhas expectativas. A grade curricular é atualizada e focada nas necessidades do mercado.' },
  ];

  for (const t of testimonialFixes) {
    await pool.query('UPDATE testimonials SET name = ?, role = ?, content = ? WHERE name LIKE ?', [t.name, t.role, t.content, `%${t.name.substring(0,4)}%`]);
    console.log(`Testimonial: ${t.name}`);
  }

  const [testimonials] = await pool.query('SELECT id, name FROM testimonials');
  for (const t of testimonials) {
    console.log(`  ${t.id}: ${t.name}`);
  }

  console.log('Done!');
  await pool.end();
})();
