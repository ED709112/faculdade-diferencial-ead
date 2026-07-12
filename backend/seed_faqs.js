const mysql = require('mysql2/promise');

(async () => {
  const pool = await mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'faculdade_diferencial_ead',
    charset: 'utf8mb4'
  });

  const faqs = [
    ['Como faço para me inscrever em um curso?', 'Basta criar uma conta, navegar até o curso desejado e clicar em "Comprar Curso" ou "Inscrever-se" se for gratuito.', 'Geral', 1],
    ['Os cursos têm certificado?', 'Sim! Após concluir 100% do curso e ser aprovado nas avaliações, o certificado é gerado automaticamente em PDF.', 'Certificados', 2],
    ['Qual a forma de pagamento?', 'Aceitamos PIX, cartão de crédito e boleto bancário. Os pagamentos são processados com segurança.', 'Pagamentos', 3],
    ['Posso acessar o curso em qualquer dispositivo?', 'Sim! A plataforma é responsiva e funciona em computadores, tablets e smartphones.', 'Acesso', 4],
    ['Como funciona o acesso aos materiais?', 'Após a confirmação do pagamento, todos os materiais (vídeos, apostilas, PDFs) são liberados automaticamente.', 'Acesso', 5],
    ['Posso solicitar reembolso?', 'Sim, dentro do prazo de 7 dias após a compra, conforme o Código de Defesa do Consumidor.', 'Pagamentos', 6],
    ['Como entro em contato com o professor?', 'Acesse a aula desejada e utilize a seção de comentários, ou envie uma mensagem pela área do aluno.', 'Suporte', 7],
    ['Os cursos têm prazo para conclusão?', 'Não! Você tem acesso vitalício ao curso e pode estudar no seu próprio ritmo.', 'Acesso', 8],
  ];

  for (const [question, answer, category, sort_order] of faqs) {
    await pool.query(
      'INSERT INTO faqs (question, answer, category, sort_order, is_active) VALUES (?, ?, ?, ?, 1)',
      [question, answer, category, sort_order]
    );
  }

  const [rows] = await pool.query('SELECT id, question, HEX(question) as hex_q FROM faqs ORDER BY id');
  for (const row of rows) {
    console.log(`${row.id}: ${row.question} | HEX: ${row.hex_q.substring(0, 40)}...`);
  }

  await pool.end();
})();
