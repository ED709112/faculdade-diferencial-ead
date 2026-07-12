# Faculdade Diferencial EAD

Plataforma de Ensino a Distância completa para a Faculdade Diferencial, desenvolvida com arquitetura moderna e escalável.

## Descrição

O Faculdade Diferencial EAD é uma plataforma robusta para venda e gestão de cursos online, oferecendo uma experiência completa para alunos, professores e administradores. O sistema inclui autenticação segura, pagamentos integrados (PIX, cartão de crédito e boleto), emissão de certificados, chat em tempo real e painel administrativo completo.

## Stack Tecnológica

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js 4.18
- **Banco de Dados:** MySQL 8 (via mysql2/promise)
- **Autenticação:** JWT (JSON Web Tokens)
- **Pagamento:** Asaas API (PIX, Cartão, Boleto)
- **Chat:** Socket.IO
- **E-mail:** Nodemailer (SMTP)
- **Segurança:** Helmet, CORS, Rate Limiting
- **Validação:** Express Validator
- **Upload:** Multer

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS
- **Animações:** Framer Motion
- **Gráficos:** Recharts
- **Ícones:** React Icons
- **Player:** React Player
- **Carousel:** Swiper

## Funcionalidades

### Áreas do Sistema
- **Público:** Catálogo de cursos, busca, avaliações, FAQ, depoimentos
- **Aluno:** Matrícula, acesso ao conteúdo, progresso, quizzes, certificados, mensagens, favoritos
- **Professor:** Dashboard, gestão de cursos/módulos/aulas, acompanhamento de alunos, emissão de certificados
- **Administrador:** Dashboard completo, gestão de usuários, cursos, categorias, cupons, relatórios financeiros, configurações, banners, logs de acesso

### Funcionalidades Principais
- Autenticação JWT com refresh token
- 3 métodos de pagamento (PIX, cartão de crédito, boleto)
- Webhook para confirmação automática de pagamentos
- Sistema de quizzes com múltiplos tipos de questão
- Emissão automática de certificados em PDF com QR Code
- Chat em tempo real (Socket.IO)
- Sistema de notificações
- Gamificação com badges e pontos
- Sistema de favoritos e avaliações de cursos
- Gestão de cupons de desconto
- Banners promocionais
- Controle de acesso por papéis (admin, professor, aluno)
- Rate limiting e proteção contra ataques
- Compliance com LGPD

## Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 (ou yarn)
- **MySQL** >= 8.0
- **Git**

## Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/faculdade-diferencial-ead.git
cd faculdade-diferencial-ead

# 2. Configure o banco de dados
mysql -u root -p < database/schema.sql

# 3. Configure o Backend
cd backend
cp .env.example .env
# Edite o arquivo .env com suas credenciais
npm install

# 4. Configure o Frontend
cd ../frontend
cp .env.example .env
# Edite o arquivo .env se necessário
npm install
```

## Configuração

### Variáveis de Ambiente do Backend (`backend/.env`)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente de execução | `development` |
| `PORT` | Porta do servidor | `3001` |
| `DB_HOST` | Host do MySQL | `localhost` |
| `DB_PORT` | Porta do MySQL | `3306` |
| `DB_USER` | Usuário do MySQL | `root` |
| `DB_PASSWORD` | Senha do MySQL | - |
| `DB_NAME` | Nome do banco | `faculdade_diferencial_ead` |
| `JWT_SECRET` | Chave secreta JWT | - |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | `7d` |
| `CORS_ORIGIN` | URL do frontend permitida | `http://localhost:3000` |
| `SMTP_HOST` | Host do servidor SMTP | - |
| `ASAAS_API_KEY` | Chave da API Asaas | - |
| `ASAAS_ENVIRONMENT` | Ambiente Asaas | `sandbox` |

### Variáveis de Ambiente do Frontend (`frontend/.env`)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NEXT_PUBLIC_API_URL` | URL da API Backend | `http://localhost:3001/api` |
| `NEXT_PUBLIC_SITE_URL` | URL do site | `http://localhost:3000` |
| `NEXT_PUBLIC_WHATSAPP` | Número do WhatsApp | `5511999999999` |

## Executando o Projeto

```bash
# Backend (porta 3001)
cd backend
npm run dev

# Frontend (porta 3000)
cd frontend
npm run dev
```

Acesse:
- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## Credenciais Padrão

| Papel | E-mail | Senha |
|-------|--------|-------|
| Administrador | admin@faculdadediferencial.edu.br | Definida no seed |

> **IMPORTANTE:** Altere a senha do administrador imediatamente após o primeiro acesso.

## Estrutura do Projeto

```
faculdade-diferencial-ead/
├── backend/                    # API REST em Node.js
│   ├── src/
│   │   ├── server.js           # Ponto de entrada do servidor
│   │   ├── config/             # Configurações (database)
│   │   ├── controllers/        # 22 controllers (lógica de negócio)
│   │   ├── middleware/          # Auth, validação, tratamento de erros
│   │   ├── models/             # (vazio - usa SQL direto)
│   │   ├── routes/             # 24 arquivos de rotas
│   │   ├── services/           # Serviço de e-mail
│   │   └── utils/              # Upload, slug, paginação
│   ├── uploads/                # Arquivos enviados
│   ├── logs/                   # Logs de acesso
│   ├── package.json
│   └── .env.example
├── frontend/                   # Next.js 14 App Router
│   ├── src/
│   │   ├── app/                # Páginas (App Router)
│   │   │   ├── page.tsx        # Página inicial
│   │   │   ├── cursos/         # Listagem de cursos
│   │   │   ├── curso/[slug]/   # Detalhe do curso
│   │   │   ├── auth/           # Login, cadastro, recuperação
│   │   │   ├── aluno/          # Área do aluno (8 páginas)
│   │   │   ├── professor/      # Área do professor (7 páginas)
│   │   │   └── admin/          # Painel admin (13 páginas)
│   │   ├── components/         # Componentes React
│   │   │   ├── layout/         # Header, Footer, Sidebar, DashboardLayout
│   │   │   ├── ui/             # Loading, Pagination, EmptyState
│   │   │   └── courses/        # CourseCard, CategoryCard, FAQAccordion
│   │   ├── hooks/              # useAuth
│   │   ├── lib/                # Cliente API (Axios)
│   │   └── styles/             # Estilos globais (Tailwind)
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
├── database/
│   └── schema.sql              # Schema completo do MySQL (30+ tabelas)
├── docs/                       # Documentação
│   ├── INSTALACAO.md
│   ├── API.md
│   ├── MANUAL_ADMINISTRADOR.md
│   ├── MANUAL_ALUNO.md
│   ├── MANUAL_PROFESSOR.md
│   └── ESTRUTURA_BANCO.md
└── README.md
```

## Visão Geral da API

A API REST segue o padrão `/api/[recurso]` com os seguintes módulos:

| Módulo | Rota | Descrição |
|--------|------|-----------|
| Autenticação | `/api/auth` | Registro, login, verificação, recuperação de senha |
| Usuários | `/api/users` | Perfil, CRUD (admin) |
| Cursos | `/api/courses` | CRUD, listagem pública, destaque |
| Categorias | `/api/categories` | CRUD de categorias |
| Módulos | `/api/modules` | CRUD de módulos do curso |
| Aulas | `/api/lessons` | CRUD, comentários, progresso |
| Matrículas | `/api/enrollments` | Matrícula, progresso, cancelamento |
| Pedidos | `/api/orders` | Criação, listagem, status |
| Pagamentos | `/api/payments` | PIX, cartão, boleto, webhook |
| Provas/Quiz | `/api/quizzes` | CRUD, tentativas, correção |
| Certificados | `/api/certificates` | Geração, verificação, download |
| Avaliações | `/api/reviews` | CRUD de avaliações |
| Mensagens | `/api/messages` | Conversas, envio em tempo real |
| Notificações | `/api/notifications` | Listagem, leitura |
| Admin | `/api/admin` | Dashboard, relatórios, gestão |
| Professor | `/api/teacher` | Dashboard, cursos, alunos |
| Cupons | `/api/coupons` | CRUD de cupons de desconto |
| Banners | `/api/banners` | CRUD de banners |
| FAQs | `/api/faqs` | CRUD de perguntas frequentes |
| Depoimentos | `/api/testimonials` | CRUD de depoimentos |
| Configurações | `/api/settings` | Configurações do site |
| Busca | `/api/search` | Busca de cursos e sugestões |
| Uploads | `/api/uploads` | Upload de imagens, vídeos, documentos |
| Dashboard | `/api/dashboard` | Dados do painel (por papel) |

Documentação detalhada da API: [docs/API.md](docs/API.md)

## Contribuindo

1. Crie um branch (`git checkout -b feature/nova-funcionalidade`)
2. Faça suas alterações
3. Commit (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Convenções
- Commits em português ou inglês descritivos
- Seguir o padrão de código existente
- Testar alterações antes de submeter

## Licença

Todos os direitos reservados - Faculdade Diferencial
