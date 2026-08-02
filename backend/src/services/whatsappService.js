const axios = require('axios');
const db = require('../config/database');

class WhatsAppService {
  constructor() {
    this.api = null;
  }

  async getClient() {
    const [rows] = await db.query(`SELECT setting_key, setting_value FROM chatbot_config WHERE setting_key IN ('whatsapp_api_url', 'whatsapp_api_key', 'whatsapp_instance')`);
    const config = {};
    rows.forEach(r => { config[r.setting_key] = r.setting_value; });

    if (!config.whatsapp_api_url || !config.whatsapp_api_key) {
      throw new Error('WhatsApp Evolution API não configurada');
    }

    this.api = axios.create({
      baseURL: config.whatsapp_api_url,
      headers: {
        'apikey': config.whatsapp_api_key,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.instance = config.whatsapp_instance || 'faculdade';
    return this.api;
  }

  async sendMessage(phone, message) {
    try {
      const client = await this.getClient();
      const cleanPhone = phone.replace(/\D/g, '');
      const number = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const response = await client.post(`/message/sendText/${this.instance}`, {
        number,
        text: message,
      });

      return response.data;
    } catch (error) {
      console.error('WhatsApp Send Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendImage(phone, imageUrl, caption = '') {
    try {
      const client = await this.getClient();
      const cleanPhone = phone.replace(/\D/g, '');
      const number = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      const response = await client.post(`/message/sendMedia/${this.instance}`, {
        number,
        mediatype: 'image',
        media: imageUrl,
        caption,
      });

      return response.data;
    } catch (error) {
      console.error('WhatsApp SendImage Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getInstanceStatus() {
    try {
      const client = await this.getClient();
      const response = await client.get(`/instance/connectionState/${this.instance}`);
      return response.data;
    } catch (error) {
      console.error('WhatsApp Status Error:', error.message);
      return { state: 'error' };
    }
  }

  async getQRCode() {
    try {
      const client = await this.getClient();
      const response = await client.get(`/instance/connect/${this.instance}`);
      return response.data;
    } catch (error) {
      console.error('WhatsApp QR Error:', error.message);
      return null;
    }
  }
}

module.exports = new WhatsAppService();
