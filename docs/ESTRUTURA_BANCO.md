# Documentação do Banco de Dados - Faculdade Diferencial EAD

Referência completa do schema do banco de dados MySQL.

---

## Visão Geral

- **Motor:** InnoDB (suporte a transações e chaves estrangeiras)
- **Charset:** utf8mb4 (suporte completo a Unicode e emojis)
- **Collation:** utf8mb4_unicode_ci
- **Banco:** `faculdade_diferencial_ead`

---

## Diagrama de Relacionamentos (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FACULDADE DIFERENCIAL EAD                         │
│                           Diagrama Entidade-Relacionamento                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    users     │───1:N───│  user_docs   │         │  categories  │
│              │         │              │         │              │
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ name         │         │ user_id (FK) │         │ name         │
│ email        │         │ doc_type     │         │ slug         │
│ password     │         │ doc_url      │         │ parent_id(FK)│
│ role         │         │ status       │         │ sort_order   │
│ ...          │         └──────────────┘         │ is_active    │
└──────┬───────┘                                  └──────┬───────┘
       │                                                  │
       │ 1:N                                             │ 1:N
       │                                                  │
       ▼                                                  ▼
┌──────────────┐    N:1    ┌──────────────┐    N:1    ┌──────────────┐
│   courses    │◄──────────│  courses     │◄──────────│  courses     │
│              │           │ (teacher_id) │           │ (category_id)│
│ id (PK)      │           │              │           │              │
│ teacher_id   │           └──────────────┘           └──────────────┘
│ category_id  │
│ title        │
│ slug         │
│ price        │
│ status       │
│ ...          │
└──┬───┬───┬───┘
   │   │   │
   │   │   │ 1:N
   │   │   └─────────────────────────────────────────────┐
   │   │                                                  │
   │   │ 1:N                  ┌──────────────┐            │
   │   │                      │  course_tags │            │
   │   └──────────────────────│              │            │
   │                          │ id (PK)      │            │
   │                          │ course_id(FK)│            │
   │                          │ tag          │            │
   │                          └──────────────┘            │
   │                                                      │
   ▼                                                      │
┌──────────────┐                                          │
│   modules    │                                          │
│              │                                          │
│ id (PK)      │                                          │
│ course_id(FK)│                                          │
│ title        │                                          │
│ sort_order   │                                          │
│ is_free      │                                          │
└──────┬───────┘                                          │
       │                                                  │
       │ 1:N                                              │
       ▼                                                  │
┌──────────────┐                                          │
│   lessons    │                                          │
│              │                                          │
│ id (PK)      │                                          │
│ module_id(FK)│                                          │
│ title        │                                          │
│ content_type │                                          │
│ video_url    │                                          │
│ text_content │                                          │
│ sort_order   │                                          │
│ is_free      │                                          │
│ is_preview   │                                          │
└──┬───┬───┬───┘                                          │
   │   │   │                                              │
   │   │   │ 1:N                                          │
   │   │   └──────────────┐                               │
   │   │                  │                               │
   │   │ 1:N    ┌─────────┴──────┐                       │
   │   │        │ lesson_comments│                       │
   │   │        │                │                       │
   │   │        │ id (PK)        │                       │
   │   │        │ lesson_id (FK) │                       │
   │   │        │ user_id (FK)───│───┐                   │
   │   │        │ parent_id (FK) │   │                   │
   │   │        │ comment        │   │                   │
   │   │        └────────────────┘   │                   │
   │   │                             │                   │
   │   │ 1:N                         │                   │
   │   ▼                             │                   │
┌───┴────────────┐                   │                   │
│    quizzes     │                   │                   │
│                │                   │                   │
│ id (PK)        │                   │                   │
│ lesson_id (FK) │                   │                   │
│ course_id (FK) │                   │                   │
│ title          │                   │                   │
│ time_limit     │                   │                   │
│ passing_grade  │                   │                   │
│ max_attempts   │                   │                   │
└────┬───────────┘                   │                   │
     │                               │                   │
     │ 1:N                           │                   │
     ▼                               │                   │
┌────────────────┐                   │                   │
│quiz_questions  │                   │                   │
│                │                   │                   │
│ id (PK)        │                   │                   │
│ quiz_id (FK)   │                   │                   │
│ question_text  │                   │                   │
│ question_type  │                   │                   │
│ options (JSON) │                   │                   │
│ correct_answer │                   │                   │
│ points         │                   │                   │
└────────────────┘                   │                   │
                                     │                   │
┌────────────────┐                   │                   │
│ quiz_attempts  │                   │                   │
│                │                   │                   │
│ id (PK)        │                   │                   │
│ quiz_id (FK)   │                   │                   │
│ user_id (FK)───│───────────────────│───┐               │
│ enrollment_id  │                   │   │               │
│ answers (JSON) │                   │   │               │
│ score          │                   │   │               │
│ is_passed      │                   │   │               │
└────────────────┘                   │   │               │
                                     │   │               │
┌──────────────┐                     │   │               │
│ enrollments  │                     │   │               │
│              │                     │   │               │
│ id (PK)      │◄────────────────────│───┘               │
│ user_id (FK) │◄────────────────────────────────────────┘
│ course_id(FK)│
│ order_id(FK) │
│ status       │
│ progress_%   │
│ started_at   │
│ completed_at │
└──────┬───────┘
       │
       │ 1:N
       ▼
┌────────────────┐
│lesson_progress │
│                │
│ id (PK)        │
│ enrollment_id  │
│ lesson_id (FK) │
│ status         │
│ progress_%     │
│ watch_time     │
└────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   orders     │───1:N───│   payments   │         │   coupons    │
│              │         │              │         │              │
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ user_id (FK) │         │ order_id(FK) │         │ code         │
│ course_id(FK)│         │ method       │         │ discount_type│
│ order_number │         │ amount       │         │ discount_val │
│ subtotal     │         │ status       │         │ course_id(FK)│
│ total_amount │         │ gateway      │         │ max_uses     │
│ coupon_id(FK)│         │ pix_*        │         │ used_count   │
│ status       │         │ card_*       │         │ is_active    │
│ method       │         │ boleto_*     │         └──────────────┘
└──────────────┘         └──────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│certificates  │         │  favorites   │         │course_reviews│
│              │         │              │         │              │
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ user_id (FK) │         │ user_id (FK) │         │ user_id (FK) │
│ course_id(FK)│         │ course_id(FK)│         │ course_id(FK)│
│ enroll_id(FK)│         └──────────────┘         │ rating       │
│ cert_code    │                                  │ review       │
│ final_grade  │         ┌──────────────┐         └──────────────┘
│ workload_hrs │         │  messages    │
│ pdf_url      │         │              │         ┌──────────────┐
│ is_valid     │         │ id (PK)      │         │notifications │
└──────────────┘         │ conv_id (FK) │         │              │
                         │ sender_id(FK)│         │ id (PK)      │
┌──────────────┐         │ message      │         │ user_id (FK) │
│conversations │         │ is_read      │         │ title        │
│              │         └──────────────┘         │ message      │
│ id (PK)      │                                  │ type         │
│ course_id(FK)│         ┌──────────────┐         │ is_read      │
└──────────────┘         │conv_particip.│         └──────────────┘
       │                 │              │
       │                 │ conv_id (FK) │
       └────────────────│ user_id (FK) │
                         └──────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   badges     │         │  user_badges │         │  user_points │
│              │         │              │         │              │
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ name         │         │ user_id (FK) │         │ user_id (FK) │
│ description  │         │ badge_id(FK) │         │ points       │
│ points       │         │ earned_at    │         │ reason       │
└──────────────┘         └──────────────┘         └──────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   banners    │         │    faqs      │         │ testimonials │
│              │         │              │         │              │
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ title        │         │ question     │         │ user_id (FK) │
│ image        │         │ answer       │         │ name         │
│ position     │         │ category     │         │ content      │
│ is_active    │         │ sort_order   │         │ rating       │
└──────────────┘         └──────────────┘         └──────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  settings    │         │  page_views  │         │ access_logs  │
│              │         │              │         │              │
│ id (PK)      │         │ id (PK)      │         │ id (PK)      │
│ setting_key  │         │ page_url     │         │ user_id (FK) │
│ setting_value│         │ user_id (FK) │         │ action       │
│ setting_type │         │ ip_address   │         │ entity_type  │
│ setting_group│         │ created_at   │         │ entity_id    │
└──────────────┘         └──────────────┘         │ details(JSON)│
                                                  └──────────────┘
┌──────────────┐
│   backups    │
│              │
│ id (PK)      │
│ filename     │
│ file_size    │
│ status       │
│ created_by   │
└──────────────┘
```

---

## Descrição das Tabelas

### users
Tabela principal de usuários do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | Identificador único |
| `name` | VARCHAR(255) | Nome completo |
| `email` | VARCHAR(255) UNIQUE | E-mail (login) |
| `password` | VARCHAR(255) | Senha hasheada (bcrypt) |
| `role` | ENUM | Papel: admin, teacher, student |
| `avatar` | VARCHAR(500) | URL do avatar |
| `phone` | VARCHAR(20) | Telefone |
| `cpf` | VARCHAR(14) | CPF |
| `birth_date` | DATE | Data de nascimento |
| `gender` | ENUM | Gênero: M, F, Outro |
| `address` | TEXT | Endereço |
| `city` | VARCHAR(100) | Cidade |
| `state` | VARCHAR(2) | Estado (UF) |
| `zip_code` | VARCHAR(10) | CEP |
| `bio` | TEXT | Biografia |
| `email_verified_at` | TIMESTAMP | Data de verificação do e-mail |
| `reset_password_token` | VARCHAR(255) | Token de redefinição de senha |
| `reset_password_expires` | TIMESTAMP | Validade do token |
| `last_login` | TIMESTAMP | Último login |
| `is_active` | TINYINT(1) | Conta ativa (1=sim, 0=não) |
| `lgpd_consent` | TINYINT(1) | Consentimento LGPD |
| `lgpd_consent_at` | TIMESTAMP | Data do consentimento |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Última atualização |

---

### user_documents
Documentos enviados pelos usuários (para verificação).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `user_id` | INT UNSIGNED FK → users | Usuário dono |
| `document_type` | VARCHAR(50) | Tipo do documento |
| `document_url` | VARCHAR(500) | URL do arquivo |
| `original_name` | VARCHAR(255) | Nome original |
| `status` | ENUM | pending, approved, rejected |
| `reviewed_by` | INT UNSIGNED FK → users | Quem revisou |
| `reviewed_at` | TIMESTAMP | Data da revisão |
| `rejection_reason` | TEXT | Motivo da rejeição |

---

### categories
Categorias de cursos (suporta subcategorias via `parent_id`).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `name` | VARCHAR(255) | Nome da categoria |
| `slug` | VARCHAR(255) UNIQUE | Slug para URLs |
| `description` | TEXT | Descrição |
| `icon` | VARCHAR(100) | Ícone (nome Lucide) |
| `image` | VARCHAR(500) | Imagem da categoria |
| `parent_id` | INT UNSIGNED FK → categories | Categoria pai |
| `sort_order` | INT | Ordem de exibição |
| `is_active` | TINYINT(1) | Visível no site |

---

### courses
Tabela principal de cursos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `teacher_id` | INT UNSIGNED FK → users | Professor responsável |
| `category_id` | INT UNSIGNED FK → categories | Categoria |
| `title` | VARCHAR(500) | Título do curso |
| `slug` | VARCHAR(500) UNIQUE | Slug para URLs |
| `subtitle` | VARCHAR(500) | Subtítulo |
| `description` | TEXT | Descrição completa |
| `content_program` | TEXT | Programa do curso |
| `image` | VARCHAR(500) | Imagem de capa |
| `video_presentation` | VARCHAR(500) | Vídeo de apresentação |
| `price` | DECIMAL(10,2) | Preço de venda |
| `original_price` | DECIMAL(10,2) | Preço original (para desconto visual) |
| `discount_price` | DECIMAL(10,2) | Preço com desconto |
| `workload` | INT UNSIGNED | Carga horária total (horas) |
| `workload_certificate` | INT UNSIGNED | Carga horária para certificado |
| `is_free` | TINYINT(1) | Curso gratuito |
| `has_certificate` | TINYINT(1) | Gera certificado |
| `certificate_template` | VARCHAR(500) | Template do certificado |
| `enrollment_count` | INT UNSIGNED | Contador de matrículas |
| `rating_avg` | DECIMAL(3,2) | Média de avaliações |
| `rating_count` | INT UNSIGNED | Quantidade de avaliações |
| `status` | ENUM | draft, published, archived |
| `featured` | TINYINT(1) | Curso em destaque |
| `sort_order` | INT | Ordem de exibição |
| `meta_title` | VARCHAR(255) | Título SEO |
| `meta_description` | TEXT | Descrição SEO |
| `requirements` | TEXT | Requisitos |
| `target_audience` | TEXT | Público-alvo |
| `what_you_learn` | TEXT | O que aprenderá |
| `max_students` | INT UNSIGNED | Limite de vagas |
| `start_date` | DATE | Data de início |
| `end_date` | DATE | Data de término |

**Índices:**
- `idx_courses_slug` — Busca por slug
- `idx_courses_teacher` — Filtrar por professor
- `idx_courses_category` — Filtrar por categoria
- `idx_courses_status` — Filtrar por status
- `idx_courses_featured` — Filtrar destaque
- `ft_courses_search` — FULLTEXT (title, subtitle, description)

---

### course_tags
Tags para busca e organização de cursos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `course_id` | INT UNSIGNED FK → courses | Curso |
| `tag` | VARCHAR(100) | Tag |

---

### course_images
Imagens adicionais dos cursos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `course_id` | INT UNSIGNED FK → courses | Curso |
| `image_url` | VARCHAR(500) | URL da imagem |
| `alt_text` | VARCHAR(255) | Texto alternativo |
| `sort_order` | INT | Ordem |

---

### modules
Módulos dos cursos (divisão do conteúdo).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `course_id` | INT UNSIGNED FK → courses | Curso |
| `title` | VARCHAR(500) | Título do módulo |
| `description` | TEXT | Descrição |
| `sort_order` | INT | Ordem de exibição |
| `is_free` | TINYINT(1) | Módulo gratuito |

---

### lessons
Aulas dos módulos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `module_id` | INT UNSIGNED FK → modules | Módulo |
| `title` | VARCHAR(500) | Título da aula |
| `description` | TEXT | Descrição |
| `content_type` | ENUM | video, text, pdf, quiz, activity |
| `video_url` | VARCHAR(500) | URL do vídeo |
| `video_duration` | INT UNSIGNED | Duração em segundos |
| `text_content` | LONGTEXT | Conteúdo em texto |
| `pdf_url` | VARCHAR(500) | URL do PDF |
| `attachment_url` | VARCHAR(500) | URL do anexo |
| `attachment_name` | VARCHAR(255) | Nome do anexo |
| `sort_order` | INT | Ordem |
| `is_free` | TINYINT(1) | Aula gratuita |
| `is_preview` | TINYINT(1) | Aula de preview (acesso público) |
| `workload_minutes` | INT UNSIGNED | Carga horária em minutos |

---

### lesson_comments
Comentários nas aulas (suporta respostas aninhadas via `parent_id`).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `lesson_id` | INT UNSIGNED FK → lessons | Aula |
| `user_id` | INT UNSIGNED FK → users | Autor |
| `parent_id` | INT UNSIGNED FK → lesson_comments | Comentário pai (resposta) |
| `comment` | TEXT | Texto do comentário |
| `is_active` | TINYINT(1) | Visível |

---

### enrollments
Matrículas de alunos em cursos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `user_id` | INT UNSIGNED FK → users | Aluno |
| `course_id` | INT UNSIGNED FK → courses | Curso |
| `order_id` | INT UNSIGNED FK → orders | Pedido relacionado |
| `status` | ENUM | active, inactive, completed, expired, cancelled |
| `progress_percentage` | DECIMAL(5,2) | Progresso (0-100) |
| `started_at` | TIMESTAMP | Data de início |
| `completed_at` | TIMESTAMP | Data de conclusão |
| `expires_at` | TIMESTAMP | Data de expiração |
| `last_accessed_at` | TIMESTAMP | Último acesso |
| `certificate_issued` | TINYINT(1) | Certificado emitido |
| `certificate_issued_at` | TIMESTAMP | Data de emissão do certificado |
| `final_grade` | DECIMAL(5,2) | Nota final |

**Índices únicos:** `(user_id, course_id)` — Um aluno não pode se matricular duas vezes no mesmo curso.

---

### lesson_progress
Progresso individual de cada aula por matrícula.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `enrollment_id` | INT UNSIGNED FK → enrollments | Matrícula |
| `lesson_id` | INT UNSIGNED FK → lessons | Aula |
| `status` | ENUM | not_started, in_progress, completed |
| `progress_percentage` | DECIMAL(5,2) | Progresso da aula |
| `watch_time_seconds` | INT UNSIGNED | Tempo assistido (vídeos) |
| `last_position_seconds` | INT UNSIGNED | Última posição (vídeos) |
| `started_at` | TIMESTAMP | Início |
| `completed_at` | TIMESTAMP | Conclusão |

**Índice único:** `(enrollment_id, lesson_id)`

---

### quizzes
Provas/avaliações dos cursos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `lesson_id` | INT UNSIGNED FK → lessons | Aula vinculada |
| `course_id` | INT UNSIGNED FK → courses | Curso |
| `title` | VARCHAR(500) | Título da prova |
| `description` | TEXT | Descrição/instruções |
| `time_limit_minutes` | INT UNSIGNED | Tempo limite (minutos) |
| `passing_grade` | DECIMAL(5,2) | Nota mínima para aprovação |
| `max_attempts` | INT UNSIGNED | Máximo de tentativas |
| `shuffle_questions` | TINYINT(1) | Embaralhar perguntas |
| `show_answers_after` | ENUM | never, after_submit, after_deadline |
| `is_active` | TINYINT(1) | Ativo |

---

### quiz_questions
Perguntas dos quizzes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `quiz_id` | INT UNSIGNED FK → quizzes | Quiz |
| `question_text` | TEXT | Enunciado da pergunta |
| `question_type` | ENUM | multiple_choice, true_false, essay |
| `options` | JSON | Opções de resposta (múltipla escolha) |
| `correct_answer` | TEXT | Resposta correta |
| `points` | DECIMAL(5,2) | Pontos da questão |
| `explanation` | TEXT | Explicação |
| `sort_order` | INT | Ordem |

---

### quiz_attempts
Tentativas de quizzes pelos alunos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `quiz_id` | INT UNSIGNED FK → quizzes | Quiz |
| `user_id` | INT UNSIGNED FK → users | Aluno |
| `enrollment_id` | INT UNSIGNED FK → enrollments | Matrícula |
| `answers` | JSON | Respostas do aluno |
| `score` | DECIMAL(5,2) | Nota obtida |
| `total_points` | DECIMAL(5,2) | Total de pontos possíveis |
| `is_passed` | TINYINT(1) | Aprovado |
| `started_at` | TIMESTAMP | Início |
| `submitted_at` | TIMESTAMP | Envio |
| `time_spent_seconds` | INT UNSIGNED | Tempo gasto |
| `status` | ENUM | in_progress, submitted, graded |

---

### orders
Pedidos de compra.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `user_id` | INT UNSIGNED FK → users | Comprador |
| `course_id` | INT UNSIGNED FK → courses | Curso |
| `order_number` | VARCHAR(50) UNIQUE | Número do pedido |
| `subtotal` | DECIMAL(10,2) | Subtotal |
| `discount_amount` | DECIMAL(10,2) | Desconto aplicado |
| `total_amount` | DECIMAL(10,2) | Total a pagar |
| `coupon_id` | INT UNSIGNED FK → coupons | Cupom utilizado |
| `status` | ENUM | pending, processing, paid, failed, cancelled, refunded, partial_refund |
| `payment_method` | ENUM | pix, credit_card, boleto, free |
| `payment_gateway` | VARCHAR(50) | Gateway utilizado |
| `gateway_payment_id` | VARCHAR(255) | ID no gateway |
| `gateway_status` | VARCHAR(100) | Status no gateway |
| `gateway_response` | JSON | Resposta completa do gateway |
| `paid_at` | TIMESTAMP | Data do pagamento |
| `expires_at` | TIMESTAMP | Data de expiração |
| `notes` | TEXT | Observações |

---

### payments
Registros de pagamentos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `order_id` | INT UNSIGNED FK → orders | Pedido |
| `payment_method` | ENUM | pix, credit_card, boleto |
| `amount` | DECIMAL(10,2) | Valor pago |
| `status` | ENUM | pending, processing, approved, declined, refunded, cancelled |
| `gateway` | VARCHAR(50) | Gateway (ex: asaas) |
| `gateway_payment_id` | VARCHAR(255) | ID no gateway |
| `pix_qr_code` | TEXT | QR Code PIX (base64) |
| `pix_copy_paste` | VARCHAR(500) | Código PIX copia e cola |
| `pix_expires_at` | TIMESTAMP | Validade do PIX |
| `boleto_url` | VARCHAR(500) | URL do boleto |
| `boleto_barcode` | VARCHAR(100) | Código de barras |
| `card_brand` | VARCHAR(50) | Bandeira do cartão |
| `card_last_four` | VARCHAR(4) | Últimos 4 dígitos |
| `paid_at` | TIMESTAMP | Data do pagamento |
| `refund_amount` | DECIMAL(10,2) | Valor reembolsado |
| `refund_reason` | TEXT | Motivo do reembolso |

---

### coupons
Cupons de desconto.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `code` | VARCHAR(50) UNIQUE | Código do cupom |
| `description` | TEXT | Descrição |
| `discount_type` | ENUM | percentage, fixed |
| `discount_value` | DECIMAL(10,2) | Valor do desconto |
| `min_purchase` | DECIMAL(10,2) | Compra mínima |
| `max_uses` | INT UNSIGNED | Máximo de usos |
| `used_count` | INT UNSIGNED | Usos realizados |
| `course_id` | INT UNSIGNED FK → courses | Curso específico (null = todos) |
| `start_date` | TIMESTAMP | Data de início |
| `end_date` | TIMESTAMP | Data de término |
| `is_active` | TINYINT(1) | Ativo |

---

### certificates
Certificados emitidos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `user_id` | INT UNSIGNED FK → users | Aluno |
| `course_id` | INT UNSIGNED FK → courses | Curso |
| `enrollment_id` | INT UNSIGNED FK → enrollments | Matrícula |
| `certificate_code` | VARCHAR(100) UNIQUE | Código único de verificação |
| `qr_code` | VARCHAR(500) | QR Code |
| `final_grade` | DECIMAL(5,2) | Nota final |
| `workload_hours` | INT UNSIGNED | Carga horária |
| `issued_at` | TIMESTAMP | Data de emissão |
| `pdf_url` | VARCHAR(500) | URL do PDF |
| `is_valid` | TINYINT(1) | Certificado válido |

---

### favorites
Cursos favoritos dos alunos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `user_id` | INT UNSIGNED FK → users | Aluno |
| `course_id` | INT UNSIGNED FK → courses | Curso |

**Índice único:** `(user_id, course_id)`

---

### course_reviews
Avaliações de cursos pelos alunos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `user_id` | INT UNSIGNED FK → users | Aluno |
| `course_id` | INT UNSIGNED FK → courses | Curso |
| `rating` | TINYINT UNSIGNED | Nota (1-5) |
| `review` | TEXT | Comentário |
| `is_visible` | TINYINT(1) | Visível publicamente |
| `admin_response` | TEXT | Resposta do admin |
| `admin_responded_at` | TIMESTAMP | Data da resposta |

**Índice único:** `(user_id, course_id)` — Uma avaliação por curso por aluno.

---

### conversations / conversation_participants / messages
Sistema de mensagens e chat.

| Tabela | Campos Principais | Descrição |
|--------|-------------------|-----------|
| `conversations` | id, course_id | Conversas (opcionalmente vinculadas a um curso) |
| `conversation_participants` | id, conversation_id, user_id, last_read_at | Participantes da conversa |
| `messages` | id, conversation_id, sender_id, message, attachment_url, is_read, read_at | Mensagens |

---

### notifications
Notificações do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `user_id` | INT UNSIGNED FK → users | Destinatário |
| `title` | VARCHAR(255) | Título |
| `message` | TEXT | Mensagem |
| `type` | ENUM | info, success, warning, error |
| `link` | VARCHAR(500) | Link de navegação |
| `is_read` | TINYINT(1) | Lida |
| `read_at` | TIMESTAMP | Data de leitura |

---

### badges / user_badges / user_points
Sistema de gamificação.

| Tabela | Descrição |
|--------|-----------|
| `badges` | Conquistas disponíveis (nome, descrição, pontos) |
| `user_badges` | Badges conquistados por cada usuário |
| `user_points` | Histórico de pontos ganhos |

---

### banners
Banners promocionais do site.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `title` | VARCHAR(255) | Título |
| `subtitle` | VARCHAR(500) | Subtítulo |
| `image` | VARCHAR(500) | Imagem |
| `link` | VARCHAR(500) | Link de destino |
| `button_text` | VARCHAR(100) | Texto do botão |
| `position` | ENUM | hero, sidebar, footer |
| `sort_order` | INT | Ordem |
| `is_active` | TINYINT(1) | Visível |
| `start_date` | TIMESTAMP | Data de início |
| `end_date` | TIMESTAMP | Data de término |

---

### faqs
Perguntas frequentes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `question` | VARCHAR(500) | Pergunta |
| `answer` | TEXT | Resposta |
| `category` | VARCHAR(100) | Categoria da pergunta |
| `sort_order` | INT | Ordem |
| `is_active` | TINYINT(1) | Visível |

---

### testimonials
Depoimentos de alunos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `user_id` | INT UNSIGNED FK → users | Usuário (opcional) |
| `name` | VARCHAR(255) | Nome |
| `role` | VARCHAR(100) | Cargo/função |
| `avatar` | VARCHAR(500) | Foto |
| `content` | TEXT | Depoimento |
| `rating` | TINYINT UNSIGNED | Nota (1-5) |
| `is_visible` | TINYINT(1) | Visível |
| `sort_order` | INT | Ordem |

---

### settings
Configurações do sistema (key-value).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `setting_key` | VARCHAR(100) UNIQUE | Chave da configuração |
| `setting_value` | TEXT | Valor |
| `setting_type` | ENUM | text, textarea, number, boolean, json, image |
| `setting_group` | VARCHAR(50) | Grupo: general, visual, payment, email |
| `description` | TEXT | Descrição |

---

### news
Notícias/artigos do blog.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `title` | VARCHAR(500) | Título |
| `slug` | VARCHAR(500) UNIQUE | Slug |
| `content` | LONGTEXT | Conteúdo |
| `excerpt` | TEXT | Resumo |
| `image` | VARCHAR(500) | Imagem |
| `author_id` | INT UNSIGNED FK → users | Autor |
| `status` | ENUM | draft, published, archived |
| `published_at` | TIMESTAMP | Data de publicação |
| `views` | INT UNSIGNED | Visualizações |

---

### page_views
Registro de visualizações de páginas (analytics).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | BIGINT UNSIGNED PK | ID |
| `page_url` | VARCHAR(500) | URL da página |
| `user_id` | INT UNSIGNED FK → users | Usuário (opcional) |
| `ip_address` | VARCHAR(45) | IP |
| `user_agent` | TEXT | Navegador |
| `referrer` | VARCHAR(500) | URL de origem |
| `created_at` | TIMESTAMP | Data/hora |

---

### access_logs
Logs de auditoria do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | BIGINT UNSIGNED PK | ID |
| `user_id` | INT UNSIGNED FK → users | Usuário |
| `action` | VARCHAR(100) | Ação realizada |
| `entity_type` | VARCHAR(50) | Tipo da entidade |
| `entity_id` | INT UNSIGNED | ID da entidade |
| `details` | JSON | Detalhes adicionais |
| `ip_address` | VARCHAR(45) | IP |
| `user_agent` | TEXT | Navegador |
| `created_at` | TIMESTAMP | Data/hora |

---

### backups
Registro de backups do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT UNSIGNED PK | ID |
| `filename` | VARCHAR(255) | Nome do arquivo |
| `file_size` | BIGINT UNSIGNED | Tamanho em bytes |
| `status` | ENUM | processing, completed, failed |
| `created_by` | INT UNSIGNED FK → users | Quem criou |
| `created_at` | TIMESTAMP | Data de criação |
| `completed_at` | TIMESTAMP | Data de conclusão |

---

## Índices Principais

| Tabela | Índice | Tipo | Campos |
|--------|--------|------|--------|
| `users` | `idx_users_email` | BTREE | email |
| `users` | `idx_users_role` | BTREE | role |
| `users` | `idx_users_active` | BTREE | is_active |
| `courses` | `idx_courses_slug` | BTREE | slug |
| `courses` | `idx_courses_teacher` | BTREE | teacher_id |
| `courses` | `idx_courses_category` | BTREE | category_id |
| `courses` | `idx_courses_status` | BTREE | status |
| `courses` | `ft_courses_search` | FULLTEXT | title, subtitle, description |
| `enrollments` | `uk_enrollments_user_course` | UNIQUE | user_id, course_id |
| `lesson_progress` | `uk_lesson_progress` | UNIQUE | enrollment_id, lesson_id |
| `orders` | `idx_orders_number` | BTREE | order_number |
| `coupons` | `idx_coupons_code` | BTREE | code |
| `certificates` | `uk_certificates_code` | UNIQUE | certificate_code |
| `favorites` | `uk_favorites` | UNIQUE | user_id, course_id |
| `course_reviews` | `uk_course_reviews` | UNIQUE | user_id, course_id |
| `notifications` | `idx_notifications_user` | BTREE | user_id, is_read |

---

## Consultas Comuns

### Cursos mais vendidos
```sql
SELECT c.title, c.enrollment_count, c.rating_avg
FROM courses c
WHERE c.status = 'published'
ORDER BY c.enrollment_count DESC
LIMIT 10;
```

### Receita mensal
```sql
SELECT
  DATE_FORMAT(paid_at, '%Y-%m') AS month,
  SUM(total_amount) AS revenue,
  COUNT(*) AS orders_count
FROM orders
WHERE status = 'paid'
GROUP BY month
ORDER BY month DESC;
```

### Alunos mais ativos
```sql
SELECT
  u.name, u.email,
  COUNT(e.id) AS enrollments,
  SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed
FROM users u
JOIN enrollments e ON u.id = e.user_id
WHERE u.role = 'student'
GROUP BY u.id
ORDER BY completed DESC
LIMIT 20;
```

### Progresso médio por curso
```sql
SELECT
  c.title,
  COUNT(e.id) AS total_enrollments,
  ROUND(AVG(e.progress_percentage), 2) AS avg_progress,
  SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.status = 'published'
GROUP BY c.id
ORDER BY avg_progress DESC;
```

### Certificados emitidos no mês
```sql
SELECT
  DATE(issued_at) AS date,
  COUNT(*) AS certificates_count
FROM certificates
WHERE issued_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
GROUP BY date
ORDER BY date;
```

### Notificações pendentes por usuário
```sql
SELECT
  u.name, u.email,
  COUNT(n.id) AS unread_count
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id AND n.is_read = 0
WHERE u.is_active = 1
GROUP BY u.id
HAVING unread_count > 0
ORDER BY unread_count DESC;
```

### Taxa de conclusão por curso
```sql
SELECT
  c.title,
  c.enrollment_count AS total,
  SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) AS completed,
  ROUND(
    SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) / c.enrollment_count * 100,
    1
  ) AS completion_rate
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.status = 'published' AND c.enrollment_count > 0
ORDER BY completion_rate DESC;
```
