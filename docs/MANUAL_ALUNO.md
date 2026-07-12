# Manual do Aluno - Faculdade Diferencial EAD

Guia completo para os alunos da plataforma de ensino a distância.

---

## 1. Cadastro

### Como Criar sua Conta
1. Acesse a página inicial em `https://seu-dominio.com`
2. Clique em **"Cadastrar-se"** ou **"Criar Conta"**
3. Preencha os dados:
   - **Nome completo** (obrigatório)
   - **E-mail** (obrigatório)
   - **Senha** (mínimo 6 caracteres)
   - **Telefone** (opcional)
4. Marque o checkbox de **consentimento LGPD**
5. Clique em **"Criar Conta"**
6. Verifique seu e-mail para confirmar o cadastro

### Fazer Login
1. Acesse `/auth/login`
2. Insira seu e-mail e senha
3. Clique em **"Entrar"**

### Esqueceu a Senha?
1. Acesse `/auth/recuperar-senha`
2. Insira seu e-mail
3. Clique em **"Enviar Instruções"**
4. Verifique sua caixa de entrada (e spam)
5. Clique no link de redefinição
6. Defina sua nova senha

---

## 2. Navegando na Plataforma

### Página Inicial
A página inicial apresenta:
- **Banners promocionais** com ofertas
- **Cursos em destaque** — Os cursos mais populares
- **Categorias** — Navegue por área de conhecimento
- **Depoimentos** — Opiniões de outros alunos
- **Perguntas Frequentes (FAQ)**

### Catálogo de Cursos (`/cursos`)
- Navegue por todas as categorias
- Use a **barra de busca** para encontrar cursos específicos
- **Filtre por:** categoria, preço, avaliação
- **Ordene por:** mais recentes, mais populares, preço

### Detalhe do Curso (`/curso/[slug]`)
Ao clicar em um curso, você verá:
- Imagem e vídeo de apresentação
- Descrição completa do curso
- Programa do curso (módulos e aulas)
- Carga horária total
- Preço e condições de pagamento
- Avaliações de outros alunos
- Informações do professor
- Requisitos e público-alvo
- O que você aprenderá

---

## 3. Comprando um Curso

### Passo a Passo
1. Acesse a página do curso desejado
2. Clique em **"Comprar Curso"** ou **"Inscrever-se"**
3. Você será redirecionado para a tela de pedido
4. Revise os dados:
   - Curso selecionado
   - Valor a pagar
5. Opcionalmente, insira um **cupom de desconto**
6. Clique em **"Finalizar Compra"**
7. Selecione o método de pagamento:
   - **PIX** — QR Code gerado instantaneamente
   - **Cartão de Crédito** — Preencha os dados do cartão
   - **Boleto Bancário** — Boleto gerado para pagamento

### Métodos de Pagamento

#### PIX
1. Selecione "PIX"
2. Clique em "Gerar PIX"
3. Escaneie o QR Code com o app do seu banco
4. Ou copie e cole o código PIX
5. O pagamento é confirmado automaticamente

#### Cartão de Crédito
1. Selecione "Cartão de Crédito"
2. Preencha:
   - Nome no cartão
   - Número do cartão
   - Validade (MM/AAAA)
   - CVV
3. Escolha o número de parcelas (se disponível)
4. Confirme o pagamento

#### Boleto Bancário
1. Selecione "Boleto"
2. Clique em "Gerar Boleto"
3. Imprima ou copie o código de barras
4. Pague em qualquer agência bancária ou internet banking
5. Prazo de até 3 dias úteis para compensação

### Pagamento Confirmado
Após a confirmação do pagamento, você receberá:
- **E-mail de confirmação** com os detalhes do pedido
- **Acesso imediato** ao curso na sua área do aluno
- **Notificação** na plataforma

---

## 4. Acessando o Conteúdo

### Área do Aluno (`/aluno`)
Seu painel pessoal com:
- **Matrículas ativas** — Cursos em andamento
- **Cursos concluídos** — Cursos finalizados
- **Último acesso** — Acesso recente a cursos
- **Certificados** — Certificados obtidos
- **Notificações** — Mensagens e avisos

### Acessar um Curso
1. Vá para **"Meus Cursos"** (`/aluno/cursos`)
2. Clique no curso desejado
3. Você verá a lista de módulos e aulas
4. Clique em uma aula para assistir

### Tipos de Aula

#### Aula em Vídeo
- Player integrado na plataforma
- Controle de velocidade
- Modo tela cheia
- Progresso automático

#### Aula em Texto
- Conteúdo formatado
- Suporte a imagens e links

#### Aula em PDF
- Visualizador integrado
- Opção de download

#### Atividade Prática
- Instruções e materiais para download

### Aulas Gratuitas/Preview
Algumas aulas marcadas como **gratuitas** ou **preview** podem ser acessadas sem matrícula, para que você avalie o conteúdo antes de comprar.

---

## 5. Fazendo Quizzes/Provas

### Iniciar uma Prova
1. Acesse a aula do tipo "Quiz"
2. Clique em **"Iniciar Prova"**
3. Leia as instruções:
   - Número de perguntas
   - Tempo limite
   - Nota mínima para aprovação
   - Número máximo de tentativas
4. Clique em **"Começar"**

### Respondendo
- Selecione a resposta para cada pergunta
- Para questões dissertativas, digite sua resposta
- O cronômetro é exibido no topo
- Você pode navegar entre as perguntas
- Clique em **"Enviar"** quando terminar

### Resultado
Após enviar, você verá:
- **Nota obtida** (de 0 a 10)
- **Aprovação ou reprovação**
- **Respostas corretas** (conforme configuração)
- **Explicações** das respostas

### Tentativas
- Se reprovou, pode tentar novamente (dentro do limite)
- Sua melhor nota é considerada
- O histórico de tentativas fica registrado

---

## 6. Acompanhando seu Progresso

### Página de Progresso
Acesse o progresso do curso em **"Meus Cursos" > [Curso] > Progresso**

### O que é Exibido
- **Percentual geral** de conclusão
- **Módulos concluídos** vs total
- **Aulas assistidas** vs total
- **Última aula acessada** — Continue de onde parou
- **Tempo total de estudo**

### Como o Progresso é Calculado
- Cada aula concluída contribui para o progresso
- O progresso é atualizado automaticamente ao concluir aulas
- Quiz/prova aprovado conta para o progresso
- 100% de progresso + nota mínima = elegível para certificado

### Marcar Aula como Concluída
- Aulas de vídeo: marcada automaticamente ao assistir até o final
- Aulas de texto/PDF: clique em **"Marcar como Concluída"**
- Quiz: marcada ao ser aprovado

---

## 7. Baixando Certificados

### Requisitos
Para emitir o certificado, você precisa:
- Ter **100% de progresso** no curso
- Ter **nota mínima** nas provas (conforme configuração do curso)

### Gerar Certificado
1. Acesse **"Meus Certificados"** (`/aluno/certificados`)
2. Se houver curso elegível, clique em **"Gerar Certificado"**
3. O sistema gera automaticamente:
   - Código único de verificação
   - QR Code de autenticação
   - PDF do certificado

### Download
1. Clique em **"Baixar PDF"** ao lado do certificado
2. O PDF será baixado com:
   - Nome do aluno
   - Nome do curso
   - Carga horária
   - Nota final
   - Data de emissão
   - Código de verificação
   - QR Code

### Verificação de Certificado
Qualquer pessoa pode verificar a autenticidade:
1. Acesse a página de verificação
2. Insira o código do certificado
3. O sistema confirma se é válido

---

## 8. Gerenciando seu Perfil

### Acessar Perfil
1. Clique no seu nome/avatar no cabeçalho
2. Selecione **"Meu Perfil"** ou acesse `/aluno/perfil`

### Editar Dados
Você pode alterar:
- **Nome** — Nome completo
- **Telefone** — Número de contato
- **CPF** — Documento
- **Data de Nascimento**
- **Gênero**
- **Endereço** — Rua, cidade, estado, CEP
- **Biografia** — Breve descrição

### Alterar Avatar
1. Clique no avatar atual
2. Faça upload de uma nova foto
3. Recorte se necessário
4. Salve

### Alterar Senha
1. Vá em **"Configurações"** ou **"Alterar Senha"**
2. Insira a senha atual
3. Insira a nova senha
4. Confirme a nova senha
5. Clique em **"Salvar"**

---

## 9. Mensagens

### Acessar Mensagens
Clique no ícone de mensagens no cabeçalho ou acesse `/aluno/mensagens`

### Enviar Mensagem
1. Clique em **"Nova Mensagem"**
2. Selecione o destinatário (professor ou suporte)
3. Digite sua mensagem
4. Opcionalmente, anexe um arquivo
5. Clique em **"Enviar"**

### Chat em Tempo Real
- As mensagens são entregues instantaneamente
- Você pode ver quando o outro está digitando
- As conversas são organizadas por curso
- O histórico fica salvo

### Notificações
- Badge de mensagens não lidas
- Notificação sonora (se habilitado)
- E-mail de nova mensagem (se configurado)

---

## 10. Favoritos

### Adicionar aos Favoritos
- Na página do curso, clique no ícone de **coração** ❤️
- O curso será adicionado à sua lista de favoritos

### Ver Favoritos
Acesse **"Favoritos"** (`/aluno/favoritos`) para ver todos os cursos salvos.

### Remover dos Favoritos
- Clique novamente no ícone de coração para remover

---

## 11. Notificações

### Ver Notificações
Clique no sino 🔔 no cabeçalho para ver suas notificações.

### Tipos de Notificação
- **Novo curso publicado** em sua área de interesse
- **Atualização de curso** que você está matriculado
- **Resposta** do professor em um comentário
- **Certificado** emitido
- **Pagamento** confirmado
- **Mensagem** recebida

### Marcar como Lida
- Clique em uma notificação para marcá-la como lida
- Use "Marcar todas como lidas" para limpar

---

## 12. Dicas

- **Estude regularmente** — Defina uma rotina de estudos
- **Aproveite as aulas preview** — Avalie antes de comprar
- **Use os favoritos** — Salve cursos de interesse para depois
- **Interaja com professores** — Tire dúvidas nos comentários e mensagens
- **Faça as provas** — São essenciais para o certificado
- **Acompanhe o progresso** — Verifique regularmente seu desempenho
- **Baixe os certificados** — Guarde suas conquistas
- **Avalie os cursos** — Ajude outros alunos com sua opinião
