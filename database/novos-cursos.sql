-- =====================================================
-- EXEMPLO: Como cadastrar novos cursos via SQL
-- Execute este arquivo no MySQL:
--   mysql -u root < database/novos-cursos.sql
-- =====================================================

USE faculdade_diferencial_ead;

--Primeiro, cadastre o professor (se ainda não existir):
INSERT INTO users (name, email, password, role, is_active, email_verified_at, lgpd_consent, lgpd_consent_at)
VALUES (
    'Professor João Silva',
    'joao@faculdadediferencial.edu.br',
    '$2a$10$L99AV9KjM9ebw5lcJ2QI0utQHGfChTOG4TfswvomMXl2I.u0CX34S',
    'teacher',
    1,
    NOW(),
    1,
    NOW()
);

-- Curso 1: Administração de Empresas
INSERT INTO courses (teacher_id, category_id, title, slug, subtitle, description, price, workload, is_free, has_certificate, status, featured)
VALUES (
    (SELECT id FROM users WHERE email = 'joao@faculdadediferencial.edu.br' LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'administracao' LIMIT 1),
    'Administração de Empresas',
    'administracao-de-empresas',
    'Aprenda a gerenciar empresas com eficiência',
    'Curso completo de administração com foco no mercado de trabalho brasileiro.',
    297.90,
    120,
    0,
    1,
    'published',
    1
);

-- Curso 2: Programação Web (gratuito)
INSERT INTO courses (teacher_id, category_id, title, slug, subtitle, description, price, workload, is_free, has_certificate, status, featured)
VALUES (
    (SELECT id FROM users WHERE email = 'joao@faculdadediferencial.edu.br' LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'ti' LIMIT 1),
    'Programação Web Completo',
    'programacao-web-completo',
    'Do zero ao avançado em HTML, CSS, JavaScript e React',
    'Aprenda a criar sites e aplicações web modernas.',
    0,
    80,
    1,
    1,
    'published',
    1
);

-- Curso 3: Marketing Digital
INSERT INTO courses (teacher_id, category_id, title, slug, subtitle, description, price, original_price, discount_price, workload, is_free, has_certificate, status, featured)
VALUES (
    (SELECT id FROM users WHERE email = 'joao@faculdadediferencial.edu.br' LIMIT 1),
    (SELECT id FROM categories WHERE slug = 'marketing' LIMIT 1),
    'Marketing Digital Completo',
    'marketing-digital-completo',
    'Domine todas as estratégias de marketing digital',
    'Curso completo com Google Ads, Facebook Ads, SEO, Email Marketing e muito mais.',
    397.90,
    497.90,
    297.90,
    100,
    0,
    1,
    'published',
    1
);

-- Criar módulos para o curso de Programação Web
INSERT INTO modules (course_id, title, description, sort_order)
VALUES (
    (SELECT id FROM courses WHERE slug = 'programacao-web-completo' LIMIT 1),
    'Módulo 1: HTML e CSS',
    'Aprenda a estruturar páginas web com HTML e estilizar com CSS',
    1
);

INSERT INTO modules (course_id, title, description, sort_order)
VALUES (
    (SELECT id FROM courses WHERE slug = 'programacao-web-completo' LIMIT 1),
    'Módulo 2: JavaScript',
    'Aprenda JavaScript do básico ao avançado',
    2
);

INSERT INTO modules (course_id, title, description, sort_order)
VALUES (
    (SELECT id FROM courses WHERE slug = 'programacao-web-completo' LIMIT 1),
    'Módulo 3: React.js',
    'Crie interfaces modernas com React',
    3
);

-- Criar aulas para o Módulo 1
INSERT INTO lessons (module_id, title, description, content_type, video_url, text_content, sort_order, is_free)
VALUES (
    (SELECT id FROM modules WHERE title = 'Módulo 1: HTML e CSS' AND course_id = (SELECT id FROM courses WHERE slug = 'programacao-web-completo' LIMIT 1) LIMIT 1),
    'Introdução ao HTML',
    'Aprenda os fundamentos do HTML',
    'text',
    NULL,
    '<h2>O que é HTML?</h2><p>HTML (HyperText Markup Language) é a linguagem padrão para criar páginas web.</p><p>Nesta aula você vai aprender:</p><ul><li>O que é HTML</li><li>Estrutura básica de uma página</li><li>Tags principais</li></ul>',
    1,
    1
);

INSERT INTO lessons (module_id, title, description, content_type, video_url, sort_order, is_free)
VALUES (
    (SELECT id FROM modules WHERE title = 'Módulo 1: HTML e CSS' AND course_id = (SELECT id FROM courses WHERE slug = 'programacao-web-completo' LIMIT 1) LIMIT 1),
    'CSS Básico',
    'Estilizando páginas web com CSS',
    'video',
    'https://www.youtube.com/watch?v=EXEMPLO',
    2,
    0
);

-- Mensagem de confirmação
SELECT 'Cursos criados com sucesso!' as resultado;
