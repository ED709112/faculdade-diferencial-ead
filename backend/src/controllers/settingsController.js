const nodemailer = require('nodemailer');
const db = require('../config/database');

const getAll = async (req, res) => {
  try {
    const [settings] = await db.query(
      `SELECT setting_key, setting_value, setting_type
       FROM settings
       WHERE setting_group IN ('general', 'visual', 'payment')`
    );

    const result = {};
    for (const s of settings) {
      if (s.setting_type === 'boolean') {
        result[s.setting_key] = s.setting_value === 'true';
      } else if (s.setting_type === 'number') {
        result[s.setting_key] = parseFloat(s.setting_value);
      } else if (s.setting_type === 'json') {
        try {
          result[s.setting_key] = JSON.parse(s.setting_value);
        } catch {
          result[s.setting_key] = s.setting_value;
        }
      } else {
        result[s.setting_key] = s.setting_value;
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
};

const getGroup = async (req, res) => {
  try {
    const { group } = req.params;

    const validGroups = ['general', 'visual', 'payment', 'email'];
    if (!validGroups.includes(group)) {
      return res.status(400).json({ error: 'Grupo inválido.' });
    }

    const [settings] = await db.query(
      `SELECT setting_key, setting_value, setting_type, setting_group, description
       FROM settings WHERE setting_group = ?
       ORDER BY id ASC`,
      [group]
    );

    const result = {};
    for (const s of settings) {
      if (s.setting_type === 'boolean') {
        result[s.setting_key] = s.setting_value === 'true';
      } else if (s.setting_type === 'number') {
        result[s.setting_key] = parseFloat(s.setting_value);
      } else if (s.setting_type === 'json') {
        try {
          result[s.setting_key] = JSON.parse(s.setting_value);
        } catch {
          result[s.setting_key] = s.setting_value;
        }
      } else {
        result[s.setting_key] = s.setting_value;
      }
    }

    res.json({
      group,
      settings: result,
      meta: settings.map(s => ({
        key: s.setting_key,
        type: s.setting_type,
        description: s.description
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar grupo de configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
};

const update = async (req, res) => {
  try {
    const settings = req.body.settings || req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Objeto de configurações é obrigatório.' });
    }

    const allowedKeys = [
      'site_name', 'site_description', 'site_email', 'site_phone', 'site_whatsapp', 'site_address',
      'logo', 'logo_url', 'favicon', 'favicon_url', 'primary_color', 'secondary_color', 'accent_color',
      'footer_text', 'lgpd_text', 'allow_registration', 'maintenance_mode',
      'payment_gateway', 'payment_api_key', 'payment_secret_key',
      'efibank_client_id', 'efibank_client_secret', 'efibank_pix_key',
      'efibank_certificate_path', 'efibank_certificate_password', 'efibank_environment',
      'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from',
      'lgpd_consent_text', 'lgpd_privacy_policy',
    ];

    for (const [key, value] of Object.entries(settings)) {
      if (!allowedKeys.includes(key)) continue;

      const stringValue = typeof value === 'boolean' ? (value ? 'true' : 'false')
        : typeof value === 'object' ? JSON.stringify(value)
        : String(value);

      if (key === 'smtp_from') {
        await db.query(
          `UPDATE settings SET setting_value = ? WHERE setting_key = ?`,
          [stringValue, 'smtp_from_email']
        );
      } else if (key === 'logo_url') {
        await db.query(
          `UPDATE settings SET setting_value = ? WHERE setting_key = ?`,
          [stringValue, 'logo']
        );
      } else if (key === 'favicon_url') {
        await db.query(
          `UPDATE settings SET setting_value = ? WHERE setting_key = ?`,
          [stringValue, 'favicon']
        );
      } else {
        await db.query(
          `UPDATE settings SET setting_value = ? WHERE setting_key = ?`,
          [stringValue, key]
        );
      }
    }

    console.log(`Configurações atualizadas por admin ID ${req.user.id}: ${Object.keys(settings).join(', ')}`);

    res.json({ message: 'Configurações atualizadas com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações.' });
  }
};

const getSiteConfig = async (req, res) => {
  try {
    const [settings] = await db.query(
      `SELECT setting_key, setting_value, setting_type
       FROM settings
       WHERE setting_group IN ('general', 'visual', 'email')`
    );

    const config = {};
    for (const s of settings) {
      if (s.setting_type === 'boolean') {
        config[s.setting_key] = s.setting_value === 'true';
      } else if (s.setting_type === 'number') {
        config[s.setting_key] = parseFloat(s.setting_value);
      } else if (s.setting_type === 'json') {
        try {
          config[s.setting_key] = JSON.parse(s.setting_value);
        } catch {
          config[s.setting_key] = s.setting_value;
        }
      } else {
        config[s.setting_key] = s.setting_value;
      }
    }

    res.json({
      site_name: config.site_name || 'Faculdade Diferencial EAD',
      site_description: config.site_description || '',
      site_email: config.site_email || '',
      site_phone: config.site_phone || '',
      site_whatsapp: config.site_whatsapp || '',
      site_address: config.site_address || '',
      logo_url: config.logo || null,
      favicon_url: config.favicon || null,
      primary_color: config.primary_color || '#1a56db',
      secondary_color: config.secondary_color || '#f97316',
      accent_color: config.accent_color || '#ffffff',
      footer_text: config.footer_text || '',
      lgpd_text: config.lgpd_text || '',
      allow_registration: config.allow_registration !== false,
      maintenance_mode: config.maintenance_mode === true,
      smtp_host: config.smtp_host || '',
      smtp_port: config.smtp_port || '587',
      smtp_user: config.smtp_user || '',
      smtp_password: config.smtp_password || '',
      smtp_from: config.smtp_from_email || '',
    });
  } catch (error) {
    console.error('Erro ao buscar configurações do site:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações.' });
  }
};

const testEmail = async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_from } = req.body;

    if (!smtp_host || !smtp_user || !smtp_password) {
      return res.status(400).json({ error: 'Host, usuário e senha SMTP são obrigatórios.' });
    }

    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: parseInt(smtp_port) || 587,
      secure: parseInt(smtp_port) === 465,
      auth: {
        user: smtp_user,
        pass: smtp_password,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"${smtp_from || 'Faculdade Diferencial EAD'}" <${smtp_user}>`,
      to: smtp_user,
      subject: 'Teste de E-mail - Faculdade Diferencial EAD',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1a56db; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">Faculdade Diferencial EAD</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
            <h2 style="color: #1e293b; margin-top: 0;">E-mail de teste enviado com sucesso!</h2>
            <p style="color: #475569; line-height: 1.6;">
              As configurações SMTP estão funcionando corretamente.
            </p>
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 5px 0; color: #64748b;"><strong>Host:</strong> ${smtp_host}</p>
              <p style="margin: 5px 0; color: #64748b;"><strong>Porta:</strong> ${smtp_port || '587'}</p>
              <p style="margin: 5px 0; color: #64748b;"><strong>Usuário:</strong> ${smtp_user}</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
              Este é um e-mail automático de teste. Não responda.
            </p>
          </div>
        </div>
      `,
    });

    console.log(`E-mail de teste enviado por admin ID ${req.user.id} para ${smtp_user}`);
    res.json({ message: 'E-mail de teste enviado com sucesso.' });
  } catch (error) {
    console.error('Erro ao enviar e-mail de teste:', error);
    const message = error.code === 'ECONNREFUSED'
      ? `Não foi possível conectar ao servidor SMTP: ${error.host}:${error.port}`
      : error.code === 'EAUTH'
        ? 'Credenciais SMTP inválidas. Verifique usuário e senha.'
        : `Erro ao enviar e-mail: ${error.message}`;
    res.status(500).json({ error: message });
  }
};

module.exports = {
  getAll,
  getGroup,
  update,
  getSiteConfig,
  testEmail
};
