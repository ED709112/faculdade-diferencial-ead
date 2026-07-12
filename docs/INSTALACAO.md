# Manual de Instalação - Faculdade Diferencial EAD

Guia completo de instalação e configuração da plataforma.

---

## 1. Requisitos do Sistema

### Hardware Mínimo
- **Processador:** 2 núcleos (2.0 GHz+)
- **Memória RAM:** 4 GB
- **Armazenamento:** 20 GB livres
- **Conexão:** Internet estável

### Software Necessário

| Software | Versão Mínima | Versão Recomendada | Onde Baixar |
|----------|---------------|-------------------|-------------|
| Node.js | 18.0.0 | 20 LTS | https://nodejs.org |
| npm | 9.0.0 | 10+ | Vem com Node.js |
| MySQL | 8.0 | 8.0+ | https://dev.mysql.com |
| Git | 2.30 | 2.40+ | https://git-scm.com |

### Verificar Versões

```bash
node --version    # Deve mostrar v18+
npm --version     # Deve mostrar 9+
mysql --version   # Deve mostrar 8+
git --version
```

---

## 2. Instalação Passo a Passo

### 2.1. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/faculdade-diferencial-ead.git
cd faculdade-diferencial-ead
```

### 2.2. Configurar o Banco de Dados

#### Criar o banco e tabelas

```bash
# Acesse o MySQL como root
mysql -u root -p

# Execute o schema completo
mysql -u root -p < database/schema.sql
```

Ou manualmente:

```sql
-- Dentro do MySQL
SOURCE /caminho/para/faculdade-diferencial-ead/database/schema.sql;
```

#### Verificar criação

```sql
SHOW DATABASES;
USE faculdade_diferencial_ead;
SHOW TABLES;
-- Deve listar 30+ tabelas
```

### 2.3. Configurar o Backend

```bash
cd backend

# Copiar template de variáveis de ambiente
cp .env.example .env

# Editar o arquivo .env (veja seção 3)
# Instalar dependências
npm install
```

### 2.4. Configurar o Frontend

```bash
cd ../frontend

# Copiar template de variáveis de ambiente
cp .env.example .env

# Editar o arquivo .env (veja seção 3)
# Instalar dependências
npm install
```

---

## 3. Configuração de Variáveis de Ambiente

### Backend (`backend/.env`)

```env
# ============================================
# SERVIDOR
# ============================================
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# ============================================
# BANCO DE DADOS
# ============================================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql_aqui
DB_NAME=faculdade_diferencial_ead

# ============================================
# JWT (Autenticação)
# ============================================
JWT_SECRET=troque_por_uma_chave_forte_aqui_minimo_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ============================================
# CORS
# ============================================
CORS_ORIGIN=http://localhost:3000

# ============================================
# UPLOAD
# ============================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800

# ============================================
# E-MAIL (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app_gmail
SMTP_FROM_NAME=Faculdade Diferencial EAD
SMTP_FROM_EMAIL=noreply@faculdadediferencial.edu.br

# ============================================
# ASAAS (Gateway de Pagamento)
# ============================================
ASAAS_API_KEY=sua_chave_api_aqui
ASAAS_ENVIRONMENT=sandbox
ASAAS_API_URL=https://sandbox.asaas.com/api/v3

# ============================================
# MERCADO PAGO (Alternativo)
# ============================================
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_ACCESS_TOKEN=

# ============================================
# FRONTEND URL
# ============================================
FRONTEND_URL=http://localhost:3000

# ============================================
# WHATSAPP
# ============================================
WHATSAPP_NUMBER=5511999999999

# ============================================
# LOGS
# ============================================
LOG_LEVEL=info
LOG_DIR=./logs

# ============================================
# BACKUP
# ============================================
BACKUP_DIR=./backups
```

### Frontend (`frontend/.env`)

```env
# URL da API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# URL do site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Número do WhatsApp (código do país + número)
NEXT_PUBLIC_WHATSAPP=5511999999999
```

---

## 4. Gerar Senha do Administrador

O schema.sql cria o usuário administrador com uma senha placeholder. Para gerar a senha real, execute o script de seed:

```bash
cd backend
npm run seed
```

Ou manualmente no Node.js:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('sua_senha', 10).then(h => console.log(h));"
```

Em seguida, atualize o registro no banco:

```sql
UPDATE users SET password = 'HASH_GERADO_AQUI'
WHERE email = 'admin@faculdadediferencial.edu.br';
```

---

## 5. Iniciar os Servidores

### Em Desenvolvimento

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Em Produção

**Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

### Verificar Funcionamento

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

Resposta esperada do health check:

```json
{
  "status": "ok",
  "timestamp": "2026-01-15T10:00:00.000Z",
  "uptime": 123.456
}
```

---

## 6. Solução de Problemas Comuns

### Erro: "ER_ACCESS_DENIED_ERROR" ao conectar no MySQL

```bash
# Verificar se o MySQL está rodando
sudo systemctl status mysql

# Reiniciar o MySQL
sudo systemctl restart mysql

# Verificar credenciais
mysql -u root -p
```

### Erro: "EADDRINUSE" (porta já em uso)

```bash
# Encontrar processo usando a porta
netstat -ano | findstr :3001
# ou no Linux/Mac:
lsof -i :3001

# Matar o processo ou mudar a porta no .env
```

### Erro: "MODULE_NOT_FOUND" (módulo não encontrado)

```bash
# Reinstalar dependências
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

### Erro de Conexão com o Banco

```bash
# Verificar se o banco existe
mysql -u root -p -e "SHOW DATABASES;"

# Recriar o banco se necessário
mysql -u root -p < database/schema.sql

# Verificar variáveis de ambiente
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
```

### Erro: Upload de Arquivo falha

```bash
# Criar diretórios de upload
mkdir -p backend/uploads/courses
mkdir -p backend/uploads/avatars
mkdir -p backend/uploads/attachments

# Verificar permissões (Linux/Mac)
chmod -R 755 backend/uploads/
```

### Erro: E-mail não é enviado

1. Verifique as credenciais SMTP no `.env`
2. Para Gmail, use uma **Senha de App** (não a senha normal)
3. Habilite "Acesso a apps menos seguros" ou configure OAuth2
4. Verifique o firewall/proxy

### Erro de CORS

```bash
# Verificar se CORS_ORIGIN no backend/.env
# corresponde à URL do frontend
CORS_ORIGIN=http://localhost:3000
```

### Erro: Token JWT inválido/expirado

1. Verifique se `JWT_SECRET` está definido no `.env`
2. Limpe os cookies/localStorage do navegador
3. Faça login novamente

---

## 7. Comandos Úteis

```bash
# Backend
npm run dev          # Iniciar em modo desenvolvimento (hot reload)
npm run start        # Iniciar em produção
npm run migrate      # Executar migrações
npm run seed         # Popular dados iniciais
npm run lint         # Verificar código
npm run test         # Executar testes

# Frontend
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Gerar build de produção
npm start            # Iniciar servidor de produção
npm run lint         # Verificar código
```

---

## 8. Próximos Passos

Após a instalação bem-sucedida:

1. **Acesse o painel administrativo** em http://localhost:3000/admin
2. **Altere a senha do administrador**
3. **Configure as credenciais de pagamento** (Asaas)
4. **Configure o servidor SMTP** para envio de e-mails
5. **Crie as primeiras categorias e cursos**
6. **Personalize as configurações** do site (nome, logo, cores)
7. **Configure os banners** da página inicial
8. **Teste o fluxo completo** de compra e acesso ao curso
