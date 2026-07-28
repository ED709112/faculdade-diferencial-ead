const OpenAI = require('openai');
const db = require('../config/database');

class ChatGPTService {
  constructor() {
    this.client = null;
  }

  async getClient() {
    const [rows] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'openai_api_key'");
    const apiKey = rows[0]?.setting_value;

    if (!apiKey) throw new Error('API Key do OpenAI não configurada');

    if (!this.client || this._lastKey !== apiKey) {
      this.client = new OpenAI({ apiKey });
      this._lastKey = apiKey;
    }
    return this.client;
  }

  async getModel() {
    const [rows] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'openai_model'");
    return rows[0]?.setting_value || 'gpt-4o-mini';
  }

  async getSystemPrompt() {
    const [rows] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'bot_system_prompt'");
    return rows[0]?.setting_value || 'Você é um assistente virtual.';
  }

  async getMaxTokens() {
    const [rows] = await db.query("SELECT setting_value FROM chatbot_config WHERE setting_key = 'max_tokens'");
    return parseInt(rows[0]?.setting_value) || 300;
  }

  async getConversationHistory(conversationId, limit = 10) {
    const [messages] = await db.query(
      `SELECT direction, content FROM chatbot_messages
       WHERE conversation_id = ? AND message_type = 'text'
       ORDER BY created_at DESC LIMIT ?`,
      [conversationId, limit]
    );

    return messages.reverse().map(m => ({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: m.content,
    }));
  }

  async generateResponse(conversationId, userMessage) {
    try {
      const client = await this.getClient();
      const model = await this.getModel();
      const systemPrompt = await this.getSystemPrompt();
      const maxTokens = await this.getMaxTokens();

      const history = await this.getConversationHistory(conversationId);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
      ];

      const completion = await client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('ChatGPT Error:', error.message);
      throw error;
    }
  }
}

module.exports = new ChatGPTService();
