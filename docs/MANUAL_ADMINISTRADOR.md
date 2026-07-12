# Manual do Administrador - Faculdade Diferencial EAD

Guia completo para uso do painel administrativo da plataforma.

---

## 1. Acesso ao Painel

### URL de Acesso
```
https://seu-dominio.com/admin
```

### Credenciais
Utilize o e-mail e senha de administrador fornecidos na instalação.

### Login
1. Acesse a página de login em `/auth/login`
2. Insira seu e-mail e senha
3. Clique em "Entrar"
4. Você será redirecionado para o painel administrativo

---

## 2. Dashboard (`/admin/dashboard`)

O dashboard é a primeira tela exibida após o login. Ele apresenta:

### Cards de Estatísticas
- **Total de Alunos** — Quantidade total de alunos cadastrados
- **Alunos (30 dias)** — Novos alunos nos últimos 30 dias
- **Cursos Publicados** — Cursos ativos na plataforma
- **Receita Total** — Soma de todos os pedidos pagos
- **Receita Mensal** — Receita dos últimos 30 dias
- **Matrículas Ativas** — Alunos com matrícula ativa
- **Certificados Emitidos** — Total de certificados gerados
- **Pedidos** — Total, pendentes e pagos
- **Professores Ativos** — Professores cadastrados

### Gráfico de Receita
Exibe a evolução da receita mensal ou anual. Use os filtros para alternar entre:
- **Mensal** — Receita mês a mês do ano selecionado
- **Anual** — Receita ano a ano

### Atividade Recente
Lista as últimas atividades da plataforma:
- Novas matrículas
- Novos pedidos
- Novos usuários cadastrados

---

## 3. Gestão de Cursos (`/admin/cursos`)

### Listar Cursos
A página mostra todos os cursos cadastrados com:
- Título e categoria
- Professor responsável
- Número de matrículas
- Avaliação média
- Receita gerada
- Status (rascunho, publicado, arquivado)

### Criar Curso
1. Clique em "Novo Curso"
2. Preencha os dados:
   - **Título** — Nome do curso (obrigatório)
   - **Subtítulo** — Descrição curta
   - **Categoria** — Selecione a categoria
   - **Professor** — Selecione o professor
   - **Descrição** — Descrição completa (suporta HTML)
   - **Programa do Curso** — Conteúdo programático
   - **Preço** — Valor do curso
   - **Preço Original** — Valor para exibir "de" (desconto visual)
   - **Carga Horária** — Total em horas
   - **Requisitos** — Pré-requisitos para o curso
   - **Público-alvo** — Para quem o curso é destinado
   - **O que aprenderá** — Benefícios do curso
3. Faça upload da imagem de capa
4. Opcionalmente, adicione vídeo de apresentação
5. Clique em "Salvar"

### Editar Curso
1. Clique no ícone de edição ao lado do curso
2. Altere os campos desejados
3. Clique em "Atualizar"

### Módulos e Aulas
Após criar o curso, acesse a gestão de módulos e aulas:

1. Clique no curso
2. Adicione módulos clicando em "Novo Módulo"
3. Dentro de cada módulo, adicione aulas
4. Para cada aula, defina:
   - Tipo (vídeo, texto, PDF, atividade)
   - URL do vídeo ou conteúdo
   - Se é uma aula gratuita/preview
   - Ordem de exibição

### Alterar Status
- **Rascunho** — Curso não visível publicamente
- **Publicado** — Curso ativo e visível
- **Arquivado** — Curso oculto

### Destacar Curso
Ative o toggle "Destacado" para exibir o curso na seção de destaque da página inicial.

---

## 4. Gestão de Categorias (`/admin/categorias`)

### Criar Categoria
1. Clique em "Nova Categoria"
2. Preencha:
   - **Nome** — Nome da categoria
   - **Descrição** — Descrição curta
   - **Ícone** — Ícone da biblioteca Lucide (ex: briefcase, book, code)
3. Clique em "Salvar"

### Reordenar Categorias
Arraste e solte as categorias para alterar a ordem de exibição no site.

### Editar/Excluir
Use os ícones de ação ao lado de cada categoria.

---

## 5. Gestão de Professores (`/admin/professores`)

### Listar Professores
Visualize todos os professores cadastrados com:
- Nome e e-mail
- Número de cursos
- Número de alunos
- Status (ativo/inativo)

### Desativar Professor
Para desativar um professor sem excluir seus dados:
1. Clique em "Desativar"
2. Confirme a ação

> **Nota:** Professores desativados não conseguem acessar a plataforma, mas seus cursos permanecem no sistema.

---

## 6. Gestão de Alunos (`/admin/alunos`)

### Listar Alunos
Visualize todos os alunos com:
- Nome e e-mail
- Data de cadastro
- Número de matrículas
- Último acesso
- Status

### Buscar Alunos
Use a barra de busca para filtrar por nome ou e-mail.

### Ver Perfil do Aluno
Clique em um aluno para ver:
- Dados pessoais
- Matrículas e progresso
- Certificados obtidos
- Histórico de pedidos

### Desativar Aluno
1. Acesse o perfil do aluno
2. Clique em "Desativar Conta"
3. Confirme a ação

---

## 7. Gestão de Usuários (`/admin/usuarios`)

### Listar Todos os Usuários
Página unificada com todos os usuários (alunos, professores e admin).

### Filtros Disponíveis
- **Busca** — Nome ou e-mail
- **Papel** — admin, teacher, student
- **Status** — ativo ou inativo

### Editar Usuário
1. Clique no ícone de edição
2. Altere dados como nome, e-mail, papel
3. Salve as alterações

### Ativar/Desativar
Alterne o status do usuário com o botão "Ativar/Desativar".

---

## 8. Gestão de Cupons (`/admin/cupons`)

### Criar Cupom
1. Clique em "Novo Cupom"
2. Preencha:
   - **Código** — Código do cupom (ex: VERAO2026)
   - **Descrição** — Descrição do desconto
   - **Tipo de Desconto** — Percentual ou Valor Fixo
   - **Valor do Desconto** — Porcentagem ou valor em R$
   - **Compra Mínima** — Valor mínimo para aplicar (opcional)
   - **Máximo de Usos** — Limite de utilizações (opcional)
   - **Curso Específico** — Aplicar apenas a um curso (opcional)
   - **Data de Início/Fim** — Período de validade
3. Clique em "Salvar"

### Exemplo de Configuração
| Cupom | Tipo | Valor | Mínimo | Usos |
|-------|------|-------|--------|------|
| VERAO2026 | Percentual | 20% | R$ 100 | 50 |
| FIXO50 | Fixo | R$ 50 | - | 100 |
| TI10 | Percentual | 10% | - | 200 (curso de TI) |

### Validar Cupom
O aluno pode validar o cupom durante a compra. O sistema verifica:
- Se o código existe e está ativo
- Se está dentro do período de validade
- Se não excedeu o limite de usos
- Se atende ao valor mínimo
- Se é aplicável ao curso selecionado

---

## 9. Gestão Financeira (`/admin/financeiro`)

### Relatório Financeiro
Visualize:
- **Total de Pedidos** — Quantidade de pedidos realizados
- **Receita Total** — Soma dos pedidos pagos
- **Ticket Médio** — Média valor por pedido
- **Pedidos Pagos/Pendentes/Reembolsados**

### Métodos de Pagamento
Veja a distribuição por método:
- PIX
- Cartão de Crédito
- Boleto

### Cursos Mais Lucrativos
Ranking dos cursos por receita gerada.

### Filtro por Período
Selecione um período específico para analisar os dados financeiros.

---

## 10. Relatórios (`/admin/relatorios`)

### Tipos de Relatório

#### Matrículas (30 dias)
Gráfico de matrículas diárias nos últimos 30 dias.

#### Novos Alunos (30 dias)
Gráfico de cadastros diários de novos alunos.

#### Certificados Emitidos (30 dias)
Gráfico de certificados gerados diariamente.

#### Taxa de Conclusão
Exibe a taxa de conclusão de cada curso:
- Total de matrículas
- Total de conclusões
- Percentual de conclusão

---

## 11. Configurações (`/admin/configuracoes`)

### Geral
- **Nome do Site** — Nome exibido no cabeçalho e footer
- **Descrição do Site** — Meta descrição
- **E-mail de Contato** — E-mail público
- **Telefone** — Telefone de contato
- **WhatsApp** — Número do WhatsApp (formato: 5511999999999)
- **Endereço** — Endereço da instituição
- **Texto do Rodapé** — Texto copyright
- **Texto LGPD** — Texto de consentimento

### Visual
- **Cor Primária** — Cor principal (hexadecimal)
- **Cor Secundária** — Cor secundária
- **Cor de Destaque** — Cor de destaque
- **Logo** — Upload da logo
- **Favicon** — Upload do favicon

### Pagamento
- **Gateway de Pagamento** — Asaas ou Mercado Pago
- **Chave API** — Chave do gateway
- **Ambiente** — Sandbox ou Produção

### E-mail (SMTP)
- **Host SMTP** — Servidor SMTP
- **Porta** — Porta do servidor
- **Usuário** — Usuário SMTP
- **Senha** — Senha SMTP
- **Nome do Remetente** — Nome exibido no e-mail
- **E-mail do Remetente** — E-mail de origem

### Sistema
- **Modo Manutenção** — Ative para exibir página de manutenção
- **Permitir Cadastro** — Ative/desative novos cadastros
- **Verificação de E-mail** — Torne obrigatória a verificação

---

## 12. Gestão de Banners (`/admin/banners`)

### Criar Banner
1. Clique em "Novo Banner"
2. Preencha:
   - **Título** — Texto principal
   - **Subtítulo** — Texto secundário
   - **Imagem** — Upload da imagem do banner
   - **Link** — URL de destino ao clicar
   - **Texto do Botão** — Texto do botão de ação
   - **Posição** — hero, sidebar ou footer
   - **Período** — Data de início e fim de exibição
3. Clique em "Salvar"

### Reordenar Banners
Arraste e solte para alterar a ordem de exibição.

---

## 13. Logs e Segurança (`/admin/logs`)

### Logs de Acesso
Visualize todas as ações realizadas na plataforma:
- Login/logout
- Acesso a páginas
- Alterações de dados
- Operações administrativas

### Informações Registradas
- **Usuário** — Quem realizou a ação
- **Ação** — Tipo de ação
- **Data/Hora** — Quando ocorreu
- **IP** — Endereço IP
- **Detalhes** — Informações adicionais

### Filtros
- Por data
- Por usuário
- Por tipo de ação

---

## 14. Boas Práticas

### Segurança
1. **Altere a senha** regularmente (a cada 90 dias)
2. **Não compartilhe** credenciais de administrador
3. **Revise os logs** de acesso periodicamente
4. **Mantenha o sistema** atualizado
5. **Faça backups** regulares do banco de dados

### Gestão de Conteúdo
1. **Revise os cursos** antes de publicar
2. **Mantenha as FAQs** atualizadas
3. **Responda avaliações** dos alunos
4. **Atualize banners** para promoções atuais
5. **Monitore a taxa de conclusão** dos cursos

### Financeiro
1. **Verifique pedidos pendentes** diariamente
2. **Analise relatórios** semanalmente
3. **Gerencie cupons** para evitar abusos
4. **Monitore reembolsos** e motive a permanência
