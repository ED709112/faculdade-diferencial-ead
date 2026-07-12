# Documentação da API - Faculdade Diferencial EAD

## Visão Geral

- **Base URL:** `http://localhost:3001/api`
- **Formato:** JSON (`Content-Type: application/json`)
- **Autenticação:** JWT Bearer Token
- **Rate Limit:** 100 requisições / 15 minutos (geral), 10 / 15 min (auth)

---

## Autenticação

### Headers Necessários

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Obter Token

O token JWT é retornado nos endpoints de login e registro. O token expira em 7 dias. Use o refresh token para renovar.

### Papéis (Roles)

| Papel | Descrição |
|-------|-----------|
| `admin` | Acesso total ao sistema |
| `teacher` | Gestão de próprios cursos, módulos, aulas e visualização de alunos |
| `student` | Acesso a cursos matriculados, quizzes, certificados, mensagens |

---

## Módulos da API

---

### 1. Autenticação (`/api/auth`)

#### POST `/api/auth/register`
Registra um novo usuário (aluno).

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "phone": "(11) 99999-9999",
  "lgpd_consent": true
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "student",
    "avatar": null,
    "is_active": 1
  }
}
```

**Erros:** `409` E-mail já cadastrado | `400` Dados inválidos

---

#### POST `/api/auth/login`
Autentica um usuário.

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "student",
    "avatar": "url",
    "phone": "(11) 99999-9999",
    "is_active": 1,
    "email_verified_at": "2026-01-15T10:00:00.000Z"
  }
}
```

**Erros:** `401` Credenciais inválidas | `403` Conta desativada

---

#### POST `/api/auth/verify-email`
Verifica e-mail com token.

**Body:**
```json
{
  "token": "token_de_verificacao"
}
```

**Response 200:** `{ "message": "E-mail verificado com sucesso!" }`

---

#### POST `/api/auth/forgot-password`
Solicita recuperação de senha.

**Body:**
```json
{
  "email": "joao@email.com"
}
```

**Response 200:** `{ "message": "Se o e-mail existir, você receberá as instruções." }`

---

#### POST `/api/auth/reset-password`
Redefine a senha com token.

**Body:**
```json
{
  "token": "token_de_recuperacao",
  "password": "nova_senha123"
}
```

**Response 200:** `{ "message": "Senha alterada com sucesso!" }`

**Erros:** `400` Token inválido ou expirado

---

#### POST `/api/auth/logout`
Encerra a sessão. **Auth:** Sim.

**Response 200:** `{ "message": "Logout realizado com sucesso." }`

---

#### POST `/api/auth/refresh-token`
Renova o token de acesso.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response 200:**
```json
{
  "token": "novo_token",
  "refreshToken": "novo_refresh_token",
  "user": { ... }
}
```

---

### 2. Usuários (`/api/users`)

#### GET `/api/users/profile`
Obtém o perfil do usuário logado. **Auth:** Sim.

**Response 200:** Objeto completo do usuário (exceto password).

---

#### PUT `/api/users/profile`
Atualiza o perfil. **Auth:** Sim.

**Body (todos opcionais):**
```json
{
  "name": "João Silva",
  "phone": "(11) 98888-8888",
  "cpf": "123.456.789-00",
  "birth_date": "1990-05-15",
  "gender": "M",
  "address": "Rua A, 123",
  "city": "São Paulo",
  "state": "SP",
  "zip_code": "01234-567",
  "bio": "Estudante de TI"
}
```

**Response 200:** `{ "message": "Perfil atualizado.", "user": { ... } }`

---

#### PUT `/api/users/change-password`
Altera a senha. **Auth:** Sim.

**Body:**
```json
{
  "current_password": "senha_atual",
  "new_password": "nova_senha"
}
```

---

#### POST `/api/users/avatar`
Faz upload do avatar. **Auth:** Sim. **Content-Type:** multipart/form-data

**Field:** `avatar` (arquivo de imagem)

**Response 200:** `{ "avatar": "/uploads/avatars/filename.jpg" }`

---

#### POST `/api/documents`
Envia documento. **Auth:** Sim. **Content-Type:** multipart/form-data

**Field:** `document` (arquivo)

---

#### GET `/api/documents`
Lista documentos do usuário. **Auth:** Sim.

---

#### GET `/api/users`
Lista todos os usuários. **Auth:** Admin.

**Query params:** `page`, `limit`, `search`, `role`, `is_active`

**Response 200:**
```json
{
  "data": [ { "id": 1, "name": "...", "email": "...", ... } ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

#### GET `/api/users/:id`
Obtém usuário por ID. **Auth:** Admin.

---

#### PUT `/api/users/:id`
Atualiza usuário. **Auth:** Admin.

---

#### PUT `/api/users/:id/toggle-active`
Ativa/desativa usuário. **Auth:** Admin.

---

### 3. Cursos (`/api/courses`)

#### GET `/api/courses`
Lista cursos publicados. **Auth:** Opcional (autenticado vê preço com desconto).

**Query params:** `page`, `limit`, `category`, `search`, `sort` (recent, popular, price_asc, price_desc)

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Curso de Administração",
      "slug": "curso-de-administracao",
      "subtitle": "Aprenda gestão empresarial",
      "image": "/uploads/courses/img.jpg",
      "price": 197.00,
      "original_price": 297.00,
      "discount_price": 197.00,
      "is_free": false,
      "rating_avg": 4.80,
      "rating_count": 120,
      "enrollment_count": 500,
      "workload": 40,
      "teacher_name": "Prof. Maria",
      "category_name": "Administração"
    }
  ],
  "pagination": { ... }
}
```

---

#### GET `/api/courses/featured`
Lista cursos em destaque.

**Response 200:** Array de cursos destacados.

---

#### GET `/api/courses/category/:categoryId`
Lista cursos por categoria.

---

#### GET `/api/courses/slug/:slug`
Obtém curso por slug (para página pública).

**Response 200:** Curso completo com módulos, aulas e informações do professor.

---

#### GET `/api/courses/:id`
Obtém curso por ID.

---

#### POST `/api/courses`
Cria um curso. **Auth:** Admin ou Teacher.

**Body:**
```json
{
  "title": "Novo Curso",
  "subtitle": "Subtítulo do curso",
  "description": "Descrição completa...",
  "content_program": "Programa do curso...",
  "category_id": 1,
  "price": 197.00,
  "original_price": 297.00,
  "workload": 40,
  "is_free": false,
  "has_certificate": true,
  "requirements": "Conhecimentos básicos...",
  "target_audience": "Profissionais de TI",
  "what_you_learn": "Aprenderá X, Y, Z"
}
```

**Response 201:** Curso criado com ID e slug.

---

#### PUT `/api/courses/:id`
Atualiza curso. **Auth:** Admin ou Teacher (próprio curso).

---

#### DELETE `/api/courses/:id`
Exclui curso. **Auth:** Admin.

---

#### PUT `/api/courses/:id/featured`
Alterna destaque do curso. **Auth:** Admin.

---

#### GET `/api/courses/:id/students`
Lista alunos matriculados. **Auth:** Admin ou Teacher. **Query:** `page`, `limit`.

---

### 4. Categorias (`/api/categories`)

#### GET `/api/categories`
Lista todas as categorias. **Auth:** Não.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Administração",
    "slug": "administracao",
    "description": "Cursos de gestão...",
    "icon": "briefcase",
    "course_count": 15
  }
]
```

---

#### GET `/api/categories/:id`
Obtém categoria por ID.

---

#### POST `/api/categories`
Cria categoria. **Auth:** Admin.

**Body:** `{ "name": "Nova Categoria", "description": "...", "icon": "book" }`

---

#### PUT `/api/categories/:id`
Atualiza categoria. **Auth:** Admin.

---

#### DELETE `/api/categories/:id`
Exclui categoria. **Auth:** Admin.

---

#### PUT `/api/categories/reorder`
Reordena categorias. **Auth:** Admin.

**Body:** `{ "orders": [{ "id": 1, "sort_order": 0 }, { "id": 2, "sort_order": 1 }] }`

---

### 5. Módulos (`/api/modules`)

#### GET `/api/modules/course/:courseId`
Lista módulos de um curso. **Auth:** Admin ou Teacher.

---

#### POST `/api/modules`
Cria módulo. **Auth:** Admin ou Teacher.

**Body:**
```json
{
  "course_id": 1,
  "title": "Módulo 1 - Introdução",
  "description": "Visão geral do curso",
  "is_free": false,
  "sort_order": 0
}
```

---

#### PUT `/api/modules/:id`
Atualiza módulo. **Auth:** Admin ou Teacher.

---

#### DELETE `/api/modules/:id`
Exclui módulo. **Auth:** Admin ou Teacher.

---

#### PUT `/api/modules/reorder`
Reordena módulos. **Auth:** Admin ou Teacher.

---

### 6. Aulas (`/api/lessons`)

#### GET `/api/lessons/module/:moduleId`
Lista aulas de um módulo. **Auth:** Sim.

---

#### GET `/api/lessons/:id`
Obtém aula por ID. **Auth:** Sim.

---

#### POST `/api/lessons`
Cria aula. **Auth:** Admin ou Teacher.

**Body:**
```json
{
  "module_id": 1,
  "title": "Aula 1 - Apresentação",
  "description": "Introdução ao módulo",
  "content_type": "video",
  "video_url": "https://youtube.com/watch?v=...",
  "video_duration": 1200,
  "is_free": false,
  "is_preview": true,
  "workload_minutes": 20,
  "sort_order": 0
}
```

**Tipos de conteúdo:** `video`, `text`, `pdf`, `quiz`, `activity`

---

#### PUT `/api/lessons/:id`
Atualiza aula. **Auth:** Admin ou Teacher.

---

#### DELETE `/api/lessons/:id`
Exclui aula. **Auth:** Admin ou Teacher.

---

#### POST `/api/lessons/:id/comment`
Adiciona comentário. **Auth:** Sim.

**Body:** `{ "comment": "Ótima aula!" }`

---

#### GET `/api/lessons/:id/comments`
Lista comentários. **Auth:** Sim.

---

#### POST `/api/lessons/:id/complete`
Marca aula como concluída. **Auth:** Sim.

---

### 7. Matrículas (`/api/enrollments`)

#### POST `/api/enrollments`
Matricula o aluno em um curso. **Auth:** Sim.

**Body:** `{ "course_id": 1 }`

**Response 201:** `{ "message": "Matrícula realizada!", "enrollment": { ... } }`

---

#### GET `/api/enrollments/my`
Lista matrículas do aluno logado. **Auth:** Sim.

**Response 200:**
```json
[
  {
    "id": 1,
    "course_id": 1,
    "course_title": "Curso de Administração",
    "course_slug": "curso-de-administracao",
    "course_image": "/uploads/...",
    "status": "active",
    "progress_percentage": 45.50,
    "started_at": "2026-01-15T10:00:00.000Z",
    "last_accessed_at": "2026-01-20T15:30:00.000Z"
  }
]
```

---

#### GET `/api/enrollments/:id`
Obtém matrícula por ID. **Auth:** Sim.

---

#### GET `/api/enrollments/:enrollmentId/progress`
Obtém progresso detalhado. **Auth:** Sim.

**Response 200:**
```json
{
  "enrollment": { "progress_percentage": 45.50, "status": "active" },
  "modules": [
    {
      "id": 1,
      "title": "Módulo 1",
      "lessons": [
        {
          "id": 1,
          "title": "Aula 1",
          "status": "completed",
          "progress_percentage": 100
        }
      ]
    }
  ]
}
```

---

#### PUT `/api/enrollments/:enrollmentId/progress`
Atualiza progresso. **Auth:** Sim.

---

#### PUT `/api/enrollments/:id/cancel`
Cancela matrícula. **Auth:** Admin.

---

### 8. Pedidos (`/api/orders`)

#### POST `/api/orders`
Cria um pedido. **Auth:** Sim.

**Body:**
```json
{
  "course_id": 1,
  "coupon_code": "DESCONTO10"
}
```

**Response 201:**
```json
{
  "id": 1,
  "order_number": "PED-20260115-001",
  "subtotal": 297.00,
  "discount_amount": 29.70,
  "total_amount": 267.30,
  "status": "pending",
  "payment_method": "pix"
}
```

---

#### GET `/api/orders/my`
Lista pedidos do aluno. **Auth:** Sim.

---

#### GET `/api/orders`
Lista todos os pedidos. **Auth:** Admin. **Query:** `page`, `limit`, `status`.

---

#### GET `/api/orders/user/:userId`
Lista pedidos de um usuário. **Auth:** Admin.

---

#### GET `/api/orders/:id`
Obtém pedido por ID. **Auth:** Admin.

---

#### PUT `/api/orders/:id/status`
Atualiza status do pedido. **Auth:** Admin.

**Body:** `{ "status": "paid" }`

---

### 9. Pagamentos (`/api/payments`)

#### POST `/api/payments/process`
Processa pagamento. **Auth:** Sim.

**Body (genérico):**
```json
{
  "order_id": 1,
  "payment_method": "pix"
}
```

---

#### POST `/api/payments/pix`
Gera pagamento PIX. **Auth:** Sim.

**Body:** `{ "order_id": 1 }`

**Response 200:**
```json
{
  "success": true,
  "pix": {
    "qrCode": "base64_do_qrcode",
    "qrCodeBase64": "payload_pix",
    "copyPaste": "00020126580014br.gov.bcb.pix...",
    "expiresAt": "2026-01-18T10:00:00.000Z"
  }
}
```

---

#### POST `/api/payments/boleto`
Gera boleto. **Auth:** Sim.

**Body:** `{ "order_id": 1 }`

**Response 200:**
```json
{
  "success": true,
  "boleto": {
    "url": "https://...",
    "barcode": "23793.38128 60000.000003 00000.000400 1 84340000026730",
    "expiresAt": "2026-01-20"
  }
}
```

---

#### POST `/api/payments/credit-card`
Processa cartão de crédito. **Auth:** Sim.

**Body:**
```json
{
  "order_id": 1,
  "creditCard": {
    "holderName": "JOAO SILVA",
    "number": "4111111111111111",
    "expiryMonth": "12",
    "expiryYear": "2027",
    "ccv": "123",
    "installmentCount": 1
  },
  "creditCardHolderInfo": {
    "name": "João Silva",
    "cpfCnpj": "12345678900",
    "postalCode": "01234567",
    "addressNumber": "123"
  }
}
```

---

#### POST `/api/payments/webhook`
Webhook de notificação do gateway. **Auth:** Não (verificação externa).

**Body:**
```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_abc123"
  }
}
```

---

#### GET `/api/payments/status/:orderId`
Verifica status do pagamento. **Auth:** Sim.

---

### 10. Quizzes/Provas (`/api/quizzes`)

#### GET `/api/quizzes/course/:courseId`
Lista quizzes do curso. **Auth:** Sim.

---

#### GET `/api/quizzes/:id`
Obtém quiz com perguntas. **Auth:** Sim.

---

#### POST `/api/quizzes`
Cria quiz. **Auth:** Admin ou Teacher.

**Body:**
```json
{
  "course_id": 1,
  "title": "Prova do Módulo 1",
  "description": "Avaliação sobre o conteúdo",
  "time_limit_minutes": 30,
  "passing_grade": 60.00,
  "max_attempts": 3,
  "shuffle_questions": true,
  "show_answers_after": "after_submit",
  "questions": [
    {
      "question_text": "Qual é a capital do Brasil?",
      "question_type": "multiple_choice",
      "options": ["São Paulo", "Brasília", "Rio de Janeiro", "Salvador"],
      "correct_answer": "Brasília",
      "points": 1.00,
      "explanation": "Brasília é a capital desde 1960."
    }
  ]
}
```

**Tipos de questão:** `multiple_choice`, `true_false`, `essay`

---

#### PUT `/api/quizzes/:id`
Atualiza quiz. **Auth:** Admin ou Teacher.

---

#### DELETE `/api/quizzes/:id`
Exclui quiz. **Auth:** Admin ou Teacher.

---

#### POST `/api/quizzes/:id/start`
Inicia tentativa. **Auth:** Sim.

**Response 201:** `{ "attempt_id": 1, "started_at": "...", "time_limit_minutes": 30 }`

---

#### POST `/api/quizzes/:id/submit`
Envia respostas. **Auth:** Sim.

**Body:**
```json
{
  "attempt_id": 1,
  "answers": {
    "1": "Brasília",
    "2": "Verdadeiro",
    "3": "Resposta dissertativa..."
  }
}
```

**Response 200:**
```json
{
  "score": 8.50,
  "total_points": 10.00,
  "is_passed": true,
  "answers_review": [ ... ]
}
```

---

#### GET `/api/quizzes/:id/attempts`
Lista tentativas do usuário. **Auth:** Sim.

---

#### GET `/api/quizzes/:id/results`
Obtém resultados das tentativas. **Auth:** Sim.

---

### 11. Certificados (`/api/certificates`)

#### POST `/api/certificates/generate`
Gera certificado. **Auth:** Sim.

**Body:** `{ "enrollment_id": 1 }`

**Response 201:**
```json
{
  "certificate_code": "CERT-2026-ABC123",
  "pdf_url": "/uploads/certificates/CERT-2026-ABC123.pdf",
  "final_grade": 9.20,
  "workload_hours": 40
}
```

---

#### GET `/api/certificates/my`
Lista certificados do aluno. **Auth:** Sim.

---

#### GET `/api/certificates/verify/:code`
Verifica autenticidade do certificado. **Auth:** Não.

**Response 200:**
```json
{
  "valid": true,
  "certificate": {
    "student_name": "João Silva",
    "course_title": "Curso de Administração",
    "workload_hours": 40,
    "issued_at": "2026-01-15T10:00:00.000Z",
    "final_grade": 9.20
  }
}
```

---

#### GET `/api/certificates/:id/download`
Baixa certificado em PDF. **Auth:** Sim.

---

#### GET `/api/certificates`
Lista todos os certificados. **Auth:** Admin. **Query:** `page`, `limit`.

---

### 12. Avaliações (`/api/reviews`)

#### GET `/api/reviews/course/:courseId`
Lista avaliações de um curso. **Auth:** Não. **Query:** `page`, `limit`.

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "user_name": "Maria S.",
      "rating": 5,
      "review": "Excelente curso!",
      "admin_response": "Obrigado!",
      "created_at": "2026-01-15T10:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

#### POST `/api/reviews`
Cria avaliação. **Auth:** Sim.

**Body:** `{ "course_id": 1, "rating": 5, "review": "Muito bom!" }`

**Restrição:** Avaliar apenas cursos matriculados, 1 avaliação por curso por usuário.

---

#### PUT `/api/reviews/:id`
Atualiza avaliação. **Auth:** Sim (própria avaliação).

---

#### DELETE `/api/reviews/:id`
Exclui avaliação. **Auth:** Sim (própria avaliação).

---

#### GET `/api/reviews`
Lista todas as avaliações. **Auth:** Admin.

---

#### PUT `/api/reviews/:id/respond`
Admin responde a avaliação. **Auth:** Admin.

**Body:** `{ "admin_response": "Obrigado pelo feedback!" }`

---

### 13. Mensagens (`/api/messages`)

#### GET `/api/messages/conversations`
Lista conversas do usuário. **Auth:** Sim.

---

#### GET `/api/messages/:conversationId`
Lista mensagens de uma conversa. **Auth:** Sim. **Query:** `page`, `limit`.

---

#### POST `/api/messages`
Envia mensagem. **Auth:** Sim.

**Body:**
```json
{
  "conversation_id": 1,
  "message": "Olá, professor!"
}
```

---

#### POST `/api/messages/conversation`
Cria nova conversa. **Auth:** Sim.

**Body:**
```json
{
  "recipient_id": 5,
  "message": "Olá!",
  "course_id": 1
}
```

---

#### PUT `/api/messages/:conversationId/read`
Marca conversa como lida. **Auth:** Sim.

---

### 14. Notificações (`/api/notifications`)

#### GET `/api/notifications`
Lista notificações. **Auth:** Sim.

---

#### PUT `/api/notifications/:id/read`
Marca notificação como lida. **Auth:** Sim.

---

#### PUT `/api/notifications/read-all`
Marca todas como lidas. **Auth:** Sim.

---

#### GET `/api/notifications/unread-count`
Conta não lidas. **Auth:** Sim.

**Response 200:** `{ "count": 5 }`

---

### 15. Dashboard (`/api/dashboard`)

#### GET `/api/dashboard`
Retorna dados do dashboard baseado no papel do usuário. **Auth:** Sim.

**Admin:** Estatísticas gerais (alunos, receita, pedidos, certificados)
**Teacher:** Dashboard do professor (cursos, alunos, receita)
**Student:** Últimas matrículas, progresso, certificados recentes

---

### 16. Admin (`/api/admin`)

Todas as rotas requerem autenticação de **Admin**.

#### GET `/api/admin/dashboard`
Estatísticas do painel.

**Response 200:**
```json
{
  "students": 1500,
  "new_students_30d": 120,
  "courses": 25,
  "revenue": 150000.00,
  "monthly_revenue": 25000.00,
  "active_enrollments": 3000,
  "completed_enrollments": 800,
  "orders": { "total": 2000, "pending": 50, "paid": 1800 },
  "teachers": 15,
  "certificates": 750
}
```

---

#### GET `/api/admin/revenue-chart`
Dados do gráfico de receita.

**Query:** `period` (monthly|yearly), `year`

---

#### GET `/api/admin/recent-activity`
Atividades recentes (matrículas, pedidos, novos usuários).

---

#### GET `/api/admin/users`
Lista todos os usuários com paginação e filtros.

**Query:** `page`, `limit`, `search`, `role`, `is_active`

---

#### GET `/api/admin/courses-stats`
Estatísticas detalhadas dos cursos.

---

#### GET `/api/admin/financial-report`
Relatório financeiro.

**Query:** `start_date`, `end_date`

**Response 200:**
```json
{
  "summary": {
    "total_orders": 500,
    "total_revenue": "75000.00",
    "avg_ticket": "150.00",
    "paid_orders": 450,
    "refunded_orders": 10,
    "pending_orders": 40
  },
  "payment_methods": [
    { "payment_method": "pix", "count": 300, "total": 45000 }
  ],
  "top_courses": [ ... ]
}
```

---

#### GET `/api/admin/reports`
Relatórios variados.

**Query:** `type` — `enrollments`, `students`, `certificates`, `completion_rate`

---

### 17. Professor (`/api/teacher`)

Todas as rotas requerem autenticação de **Teacher**.

#### GET `/api/teacher/dashboard`
Dashboard do professor.

**Response 200:**
```json
{
  "total_courses": 5,
  "total_students": 200,
  "total_revenue": 30000.00,
  "recent_enrollments": [ ... ],
  "courses": [ ... ]
}
```

---

#### GET `/api/teacher/courses`
Lista cursos do professor.

---

#### GET `/api/teacher/students`
Lista alunos dos cursos do professor. **Query:** `page`, `limit`, `search`.

---

#### GET `/api/teacher/students/:studentId`
Progresso de um aluno específico.

---

### 18. Cupons (`/api/coupons`)

#### POST `/api/coupons/validate`
Valida cupom. **Auth:** Sim.

**Body:** `{ "code": "DESCONTO10", "course_id": 1 }`

**Response 200:**
```json
{
  "valid": true,
  "discount_type": "percentage",
  "discount_value": 10,
  "discount_amount": 19.70
}
```

---

#### GET `/api/coupons`
Lista cupons. **Auth:** Admin.

---

#### POST `/api/coupons`
Cria cupom. **Auth:** Admin.

**Body:**
```json
{
  "code": "DESCONTO10",
  "description": "10% de desconto",
  "discount_type": "percentage",
  "discount_value": 10,
  "min_purchase": 100.00,
  "max_uses": 100,
  "course_id": null,
  "start_date": "2026-01-01T00:00:00.000Z",
  "end_date": "2026-12-31T23:59:59.000Z"
}
```

---

#### PUT `/api/coupons/:id`
Atualiza cupom. **Auth:** Admin.

---

#### DELETE `/api/coupons/:id`
Exclui cupom. **Auth:** Admin.

---

### 19. Banners (`/api/banners`)

#### GET `/api/banners`
Lista banners ativos. **Auth:** Não.

---

#### POST `/api/banners`
Cria banner. **Auth:** Admin.

**Body:**
```json
{
  "title": "Promoção de Verão",
  "subtitle": "Até 50% OFF",
  "image": "/uploads/banners/promo.jpg",
  "link": "/cursos",
  "button_text": "Ver Cursos",
  "position": "hero",
  "sort_order": 0,
  "start_date": "2026-01-01",
  "end_date": "2026-02-28"
}
```

**Posições:** `hero`, `sidebar`, `footer`

---

#### PUT `/api/banners/:id`
Atualiza banner. **Auth:** Admin.

---

#### DELETE `/api/banners/:id`
Exclui banner. **Auth:** Admin.

---

#### PUT `/api/banners/reorder`
Reordena banners. **Auth:** Admin.

---

### 20. FAQs (`/api/faqs`)

#### GET `/api/faqs`
Lista FAQs. **Auth:** Não.

---

#### POST `/api/faqs`
Cria FAQ. **Auth:** Admin.

**Body:** `{ "question": "Como me inscrever?", "answer": "...", "category": "Geral" }`

---

#### PUT `/api/faqs/:id`
Atualiza FAQ. **Auth:** Admin.

---

#### DELETE `/api/faqs/:id`
Exclui FAQ. **Auth:** Admin.

---

### 21. Depoimentos (`/api/testimonials`)

#### GET `/api/testimonials`
Lista depoimentos visíveis. **Auth:** Não.

---

#### POST `/api/testimonials`
Cria depoimento. **Auth:** Admin.

**Body:**
```json
{
  "name": "Maria Silva",
  "role": "Aluna de Administração",
  "content": "Excelente plataforma!",
  "rating": 5,
  "avatar": "/uploads/avatars/maria.jpg"
}
```

---

#### PUT `/api/testimonials/:id`
Atualiza depoimento. **Auth:** Admin.

---

#### DELETE `/api/testimonials/:id`
Exclui depoimento. **Auth:** Admin.

---

### 22. Configurações (`/api/settings`)

#### GET `/api/settings`
Obtém configurações públicas do site. **Auth:** Não.

**Response 200:**
```json
{
  "site_name": "Faculdade Diferencial EAD",
  "primary_color": "#1a56db",
  "logo": "/images/logo.png",
  "footer_text": "© 2026...",
  ...
}
```

---

#### GET `/api/settings/:group`
Obtém configurações de um grupo. **Auth:** Admin.

**Grupos:** `general`, `visual`, `payment`, `email`

---

#### PUT `/api/settings`
Atualiza configurações. **Auth:** Admin.

**Body:**
```json
{
  "settings": [
    { "key": "site_name", "value": "Novo Nome" },
    { "key": "primary_color", "value": "#ff0000" }
  ]
}
```

---

### 23. Busca (`/api/search`)

#### GET `/api/search`
Busca cursos. **Auth:** Não.

**Query:** `q` (termo), `category`, `page`, `limit`

---

#### GET `/api/search/suggestions`
Sugestões de busca. **Auth:** Não.

**Query:** `q` (termo, mínimo 2 caracteres)

---

### 24. Uploads (`/api/uploads`)

Todas as rotas requerem autenticação e `Content-Type: multipart/form-data`.

#### POST `/api/uploads/image`
Upload de imagem. **Field:** `image`. **Aceitos:** jpg, png, webp. **Máx:** 5MB.

---

#### POST `/api/uploads/video`
Upload de vídeo. **Field:** `video`. **Aceitos:** mp4, webm, avi. **Máx:** 200MB.

---

#### POST `/api/uploads/document`
Upload de documento. **Field:** `document`. **Aceitos:** pdf, doc, docx. **Máx:** 10MB.

---

#### POST `/api/uploads/avatar`
Upload de avatar. **Field:** `avatar`. **Aceitos:** jpg, png. **Máx:** 2MB.

---

## Códigos de Resposta HTTP

| Código | Significado |
|--------|-------------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Dados inválidos |
| `401` | Não autenticado |
| `403` | Sem permissão |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: e-mail duplicado) |
| `429` | Rate limit excedido |
| `500` | Erro interno do servidor |

---

## Formato de Erro

Todos os erros retornam:

```json
{
  "error": "Mensagem descritiva do erro"
}
```

---

## Paginação

Endpoints com paginação aceitam `page` e `limit` como query params. Resposta padrão:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```
