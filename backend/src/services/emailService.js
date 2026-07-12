const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error.message);
    return { success: false, error: error.message };
  }
};

const emailTemplates = {
  welcome: (name, verificationUrl) => ({
    subject: 'Bem-vindo à Faculdade Diferencial EAD!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a56db; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Faculdade Diferencial EAD</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Bem-vindo, ${name}!</h2>
          <p>Sua conta foi criada com sucesso. Para começar a usar a plataforma, confirme seu e-mail:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Confirmar E-mail
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Se você não criou esta conta, ignore este e-mail.</p>
        </div>
        <div style="padding: 20px; text-align: center; background: #1a56db; color: white;">
          <p style="margin: 0;">© 2026 Faculdade Diferencial. Todos os direitos reservados.</p>
        </div>
      </div>
    `
  }),

  resetPassword: (name, resetUrl) => ({
    subject: 'Recuperação de Senha - Faculdade Diferencial EAD',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a56db; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Faculdade Diferencial EAD</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Olá, ${name}</h2>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #1a56db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Redefinir Senha
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Este link expira em 1 hora. Se você não solicitou, ignore este e-mail.</p>
        </div>
        <div style="padding: 20px; text-align: center; background: #1a56db; color: white;">
          <p style="margin: 0;">© 2026 Faculdade Diferencial. Todos os direitos reservados.</p>
        </div>
      </div>
    `
  }),

  paymentConfirmation: (name, courseName, orderNumber) => ({
    subject: 'Pagamento Confirmado - Faculdade Diferencial EAD',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a56db; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Faculdade Diferencial EAD</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Pagamento Confirmado! 🎉</h2>
          <p>Olá ${name},</p>
          <p>Seu pagamento foi confirmado com sucesso!</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Pedido:</strong> #${orderNumber}</p>
            <p><strong>Curso:</strong> ${courseName}</p>
          </div>
          <p>Acesse a plataforma para começar seus estudos:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/aluno/cursos" 
               style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Acessar Meus Cursos
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; background: #1a56db; color: white;">
          <p style="margin: 0;">© 2026 Faculdade Diferencial. Todos os direitos reservados.</p>
        </div>
      </div>
    `
  }),

  newMessage: (senderName, courseName, messagePreview) => ({
    subject: `Nova mensagem de ${senderName} - Faculdade Diferencial EAD`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a56db; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Faculdade Diferencial EAD</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Nova Mensagem</h2>
          <p>Você recebeu uma nova mensagem de <strong>${senderName}</strong></p>
          ${courseName ? `<p><strong>Curso:</strong> ${courseName}</p>` : ''}
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #1a56db;">
            <p style="margin: 0; color: #666;">${messagePreview}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/aluno/mensagens" 
               style="background: #1a56db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver Mensagem
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; background: #1a56db; color: white;">
          <p style="margin: 0;">© 2026 Faculdade Diferencial. Todos os direitos reservados.</p>
        </div>
      </div>
    `
  }),

  certificateReady: (name, courseName) => ({
    subject: 'Certificado Disponível - Faculdade Diferencial EAD',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a56db; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Faculdade Diferencial EAD</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Parabéns! 🎓</h2>
          <p>Olá ${name},</p>
          <p>Você concluiu o curso <strong>${courseName}</strong> e seu certificado está pronto!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/aluno/certificados" 
               style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Baixar Certificado
            </a>
          </div>
        </div>
        <div style="padding: 20px; text-align: center; background: #1a56db; color: white;">
          <p style="margin: 0;">© 2026 Faculdade Diferencial. Todos os direitos reservados.</p>
        </div>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
