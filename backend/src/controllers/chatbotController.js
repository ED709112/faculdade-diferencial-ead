const db = require('../config/database');
const chatgptService = require('../services/chatgptService');
const whatsappService = require('../services/whatsappService');

async function ensureLead(phone, contactName) {
  try {
    const [existingLeads] = await db.query(
      'SELECT id FROM leads WHERE whatsapp = ? OR phone = ? LIMIT 1',
      [phone, phone]
    );
    if (existingLeads.length > 0) return existingLeads[0].id;
    const [leadResult] = await db.query(
      'INSERT INTO leads (name, phone, whatsapp, source, status) VALUES (?, ?, ?, ?, ?)',
      [contactName, phone, phone, 'whatsapp', 'new']
    );
    return leadResult.insertId;
  } catch (leadError) {
    console.error('Erro ao criar lead no CRM:', leadError.message);
    return null;
  }
}

// =====================================================
// CONFIG
// =====================================================

exports.getConfig = async (req, res) => {
  try {
    const [config] = await db.query('SELECT * FROM chatbot_config ORDER BY id');
    const obj = {};
    config.forEach(c => { obj[c.setting_key] = c.setting_value; });
    res.json(obj);
  } catch (error) {
    console.error('getConfig error:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await db.query(
        'INSERT INTO chatbot_config (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }
    res.json({ message: 'Configurações atualizadas' });
  } catch (error) {
    console.error('updateConfig error:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
};

// =====================================================
// CONVERSATIONS
// =====================================================

exports.listConversations = async (req, res) => {
  try {
    const { status, search } = req.query;
    let where = [];
    let params = [];

    if (status) { where.push('c.status = ?'); params.push(status); }
    if (search) {
      where.push('(c.phone LIKE ? OR c.contact_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const [conversations] = await db.query(
      `SELECT c.*,
        (SELECT content FROM chatbot_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM chatbot_messages WHERE conversation_id = c.id AND direction = 'inbound') as unread_count,
        (SELECT COUNT(*) FROM chatbot_messages WHERE conversation_id = c.id) as message_count
       FROM chatbot_conversations c
       ${whereClause}
       ORDER BY c.last_message_at DESC`,
      params
    );

    res.json(conversations);
  } catch (error) {
    console.error('listConversations error:', error);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const [convs] = await db.query('SELECT * FROM chatbot_conversations WHERE id = ?', [req.params.id]);
    if (convs.length === 0) return res.status(404).json({ error: 'Conversa não encontrada' });

    const [messages] = await db.query(
      'SELECT * FROM chatbot_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ ...convs[0], messages });
  } catch (error) {
    console.error('getConversation error:', error);
    res.status(500).json({ error: 'Erro ao buscar conversa' });
  }
};

exports.updateConversation = async (req, res) => {
  try {
    const { status, contact_name, assigned_to } = req.body;
    await db.query(
      'UPDATE chatbot_conversations SET status = COALESCE(?, status), contact_name = COALESCE(?, contact_name), assigned_to = COALESCE(?, assigned_to) WHERE id = ?',
      [status || null, contact_name || null, assigned_to || null, req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM chatbot_conversations WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('updateConversation error:', error);
    res.status(500).json({ error: 'Erro ao atualizar conversa' });
  }
};

// =====================================================
// MESSAGES
// =====================================================

exports.sendMessage = async (req, res) => {
  try {
    const { conversation_id, content } = req.body;
    if (!conversation_id || !content) return res.status(400).json({ error: 'conversation_id e content são obrigatórios' });

    const [convs] = await db.query('SELECT * FROM chatbot_conversations WHERE id = ?', [conversation_id]);
    if (convs.length === 0) return res.status(404).json({ error: 'Conversa não encontrada' });

    const conv = convs[0];

    await db.query(
      'INSERT INTO chatbot_messages (conversation_id, direction, message_type, content, is_bot) VALUES (?, ?, ?, ?, ?)',
      [conversation_id, 'outbound', 'text', content, 1]
    );
    await db.query('UPDATE chatbot_conversations SET last_message_at = NOW() WHERE id = ?', [conversation_id]);

    try {
      await whatsappService.sendMessage(conv.phone, content);
    } catch (waError) {
      console.error('WhatsApp send failed (message saved):', waError.message);
    }

    res.status(201).json({ message: 'Mensagem enviada' });
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};

// =====================================================
// WEBHOOK (recebe mensagens do WhatsApp)
// =====================================================

exports.webhook = async (req, res) => {
  try {
    const body = req.body;

    // Ignora mensagens enviadas pela própria instância (outbound) e eventos sem texto
    if (body.data?.key?.fromMe === true) {
      return res.status(200).json({ ok: true });
    }

    const phone = body.data?.key?.remoteJid?.replace('@s.whatsapp.net', '')?.replace('@lid', '') || body.phone;
    const messageContent = body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text || body.content;
    const contactName = body.data?.pushName || body.contactName || 'Desconhecido';

    if (!phone || !messageContent) {
      return res.status(200).json({ ok: true });
    }

    const [autoReplyRows] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'auto_reply'");
    const autoReply = autoReplyRows[0]?.setting_value === 'true';

    const [workingHoursStart] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'working_hours_start'");
    const [workingHoursEnd] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'working_hours_end'");
    const [takeoverKeyword] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'human_takeover_keyword'");

    const now = new Date();
    const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Fortaleza' }));
    const currentHour = brTime.getHours();
    const currentMin = brTime.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    const startTime = workingHoursStart[0]?.setting_value || '08:00';
    const endTime = workingHoursEnd[0]?.setting_value || '22:00';
    const isWorkingHours = currentTime >= startTime && currentTime <= endTime;

    let [convs] = await db.query('SELECT * FROM chatbot_conversations WHERE phone = ?', [phone]);
    let conv;

    if (convs.length === 0) {
      // Criar lead no CRM e vincular à conversa
      const leadId = await ensureLead(phone, contactName);

      const [result] = await db.query(
        'INSERT INTO chatbot_conversations (phone, contact_name, status, lead_id) VALUES (?, ?, ?, ?)',
        [phone, contactName, 'active', leadId]
      );
      conv = { id: result.insertId, phone, contact_name: contactName, status: 'active', lead_id: leadId };

      const [welcomeMsg] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'bot_welcome_message'");
      const welcome = welcomeMsg[0]?.setting_value || 'Olá! Como posso ajudar?';

      await db.query(
        'INSERT INTO chatbot_messages (conversation_id, direction, content, is_bot) VALUES (?, ?, ?, ?)',
        [conv.id, 'outbound', welcome, 1]
      );
      try { await whatsappService.sendMessage(phone, welcome); } catch {}
    } else {
      conv = convs[0];
      // Conversas legadas (criadas antes do vínculo com lead): faz o back-fill do lead
      if (!conv.lead_id) {
        const leadId = await ensureLead(phone, contactName);
        if (leadId) {
          await db.query('UPDATE chatbot_conversations SET lead_id = ? WHERE id = ?', [leadId, conv.id]);
          conv.lead_id = leadId;
        }
      }
    }

    await db.query(
      'INSERT INTO chatbot_messages (conversation_id, direction, message_type, content, is_bot) VALUES (?, ?, ?, ?, ?)',
      [conv.id, 'inbound', 'text', messageContent, 0]
    );
    await db.query('UPDATE chatbot_conversations SET last_message_at = NOW(), contact_name = COALESCE(?, contact_name) WHERE id = ?', [contactName, conv.id]);

    // Funil: registra interação no lead e atualiza o status
    if (conv.lead_id) {
      try {
        await db.query(
          'INSERT INTO lead_interactions (lead_id, type, direction, subject, message) VALUES (?, ?, ?, ?, ?)',
          [conv.lead_id, 'whatsapp', 'inbound', null, String(messageContent).slice(0, 1000)]
        );
        const [leadRows] = await db.query('SELECT status FROM leads WHERE id = ?', [conv.lead_id]);
        const lower = messageContent.toLowerCase();
        const interestKeywords = ['quero', 'matrícula', 'matricula', 'matricular', 'valor', 'quanto', 'curso', 'inscri', 'gostaria', 'me interessa', 'começar', 'comecar'];
        const interested = interestKeywords.some((k) => lower.includes(k));
        if (leadRows[0]) {
          const current = leadRows[0].status;
          const next = interested && current !== 'interested' && current !== 'enrolled' && current !== 'lost'
            ? 'interested'
            : (current === 'new' ? 'contacted' : current);
          if (next !== current) {
            await db.query('UPDATE leads SET status = ? WHERE id = ?', [next, conv.lead_id]);
            await db.query(
              'INSERT INTO lead_interactions (lead_id, type, direction, subject, message) VALUES (?, ?, ?, ?, ?)',
              [conv.lead_id, 'system', 'inbound', 'status', `Status atualizado para ${next}`]
            );
          }
        }
        // Para campanhas de divulgação: marca o registro como respondido (interrompe a sequência)
        await db.query(
          `UPDATE promo_campaign_records r
           JOIN promo_campaigns c ON c.id = r.campaign_id
           SET r.replied_at = NOW()
           WHERE r.whatsapp = ? AND r.replied_at IS NULL AND c.status IN ('active','paused')`,
          [phone]
        );
      } catch (funnelError) {
        console.error('Erro no funil do lead:', funnelError.message);
      }
    }

    if (takeoverKeyword[0]?.setting_value && messageContent.toLowerCase().includes(takeoverKeyword[0].setting_value.toLowerCase())) {
      await db.query("UPDATE chatbot_conversations SET status = 'human' WHERE id = ?", [conv.id]);
      const msg = 'Um atendente humano será redirecionado para esta conversa. Para falar com um atendente, chame no WhatsApp (86) 99493-4404. Aguarde um momento.';
      await db.query('INSERT INTO chatbot_messages (conversation_id, direction, content, is_bot) VALUES (?, ?, ?, ?)', [conv.id, 'outbound', msg, 1]);
      try { await whatsappService.sendMessage(phone, msg); } catch {}
      return res.status(200).json({ ok: true });
    }

    if (conv.status === 'human' || conv.status === 'closed') {
      return res.status(200).json({ ok: true });
    }

    if (!autoReply || !isWorkingHours) {
      const [outsideMsg] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'outside_hours_message'");
      const msg = outsideMsg[0]?.setting_value || 'Fora do horário de atendimento.';
      await db.query('INSERT INTO chatbot_messages (conversation_id, direction, content, is_bot) VALUES (?, ?, ?, ?)', [conv.id, 'outbound', msg, 1]);
      try { await whatsappService.sendMessage(phone, msg); } catch {}
      return res.status(200).json({ ok: true });
    }

    const [apiKeyRows] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'openai_api_key'");
    if (!apiKeyRows[0]?.setting_value) {
      const msg = 'Estamos momentaneamente sem atendimento automático. Um atendente entrará em contato em breve.';
      await db.query('INSERT INTO chatbot_messages (conversation_id, direction, content, is_bot) VALUES (?, ?, ?, ?)', [conv.id, 'outbound', msg, 1]);
      try { await whatsappService.sendMessage(phone, msg); } catch {}
      return res.status(200).json({ ok: true });
    }

    try {
      const aiResponse = await chatgptService.generateResponse(conv.id, messageContent);

      await db.query(
        'INSERT INTO chatbot_messages (conversation_id, direction, content, is_bot) VALUES (?, ?, ?, ?)',
        [conv.id, 'outbound', aiResponse, 1]
      );
      await db.query('UPDATE chatbot_conversations SET last_message_at = NOW() WHERE id = ?', [conv.id]);

      try { await whatsappService.sendMessage(phone, aiResponse); } catch {}
    } catch (aiError) {
      console.error('AI Error:', aiError.message);
      const msg = 'Desculpe, estou com dificuldades técnicas. Um atendente entrará em contato.';
      await db.query('INSERT INTO chatbot_messages (conversation_id, direction, content, is_bot) VALUES (?, ?, ?, ?)', [conv.id, 'outbound', msg, 1]);
      try { await whatsappService.sendMessage(phone, msg); } catch {}
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ ok: true });
  }
};

// =====================================================
// WHATSAPP STATUS
// =====================================================

exports.whatsappStatus = async (req, res) => {
  try {
    const status = await whatsappService.getInstanceStatus();
    res.json(status);
  } catch (error) {
    res.json({ state: 'disconnected', error: error.message });
  }
};

exports.whatsappQR = async (req, res) => {
  try {
    const qr = await whatsappService.getQRCode();
    res.json(qr);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =====================================================
// STATS
// =====================================================

exports.getStats = async (req, res) => {
  try {
    const [total] = await db.query('SELECT COUNT(*) as total FROM chatbot_conversations');
    const [active] = await db.query("SELECT COUNT(*) as total FROM chatbot_conversations WHERE status = 'active'");
    const [human] = await db.query("SELECT COUNT(*) as total FROM chatbot_conversations WHERE status = 'human'");
    const [today] = await db.query('SELECT COUNT(*) as total FROM chatbot_messages WHERE DATE(created_at) = CURDATE()');
    const [botMessages] = await db.query("SELECT COUNT(*) as total FROM chatbot_messages WHERE is_bot = 1 AND DATE(created_at) = CURDATE()");
    const [humanMessages] = await db.query("SELECT COUNT(*) as total FROM chatbot_messages WHERE is_bot = 0 AND DATE(created_at) = CURDATE()");

    res.json({
      totalConversations: total[0].total,
      activeConversations: active[0].total,
      humanConversations: human[0].total,
      todayMessages: today[0].total,
      todayBotMessages: botMessages[0].total,
      todayHumanMessages: humanMessages[0].total,
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
};

// =====================================================
// TEST AI (simulate)
// =====================================================

exports.testAI = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem é obrigatória' });

    const response = await chatgptService.generateResponse(0, message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
