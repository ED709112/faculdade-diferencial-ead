const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ENVIRONMENT = process.env.EFIBANK_ENVIRONMENT || 'sandbox';

const EFBANK_URLS = {
  sandbox: {
    pix: 'https://pix-h.api.efipay.com.br',
    billings: 'https://cobrancas-h.api.efipay.com.br',
  },
  production: {
    pix: 'https://pix.api.efipay.com.br',
    billings: 'https://cobrancas.api.efipay.com.br',
  },
};

const BASE_URLS = EFBANK_URLS[ENVIRONMENT] || EFBANK_URLS.sandbox;

let pixAccessToken = null;
let pixTokenExpiresAt = 0;
let billingsAccessToken = null;
let billingsRefreshToken = null;
let billingsTokenExpiresAt = 0;

function getCertificateConfig() {
  const certPath = process.env.EFIBANK_CERTIFICATE_PATH;
  if (!certPath) return null;

  const resolvedPath = path.resolve(certPath);
  if (!fs.existsSync(resolvedPath)) {
    console.warn(`Certificado Efíbank não encontrado: ${resolvedPath}`);
    return null;
  }

  return {
    pfx: fs.readFileSync(resolvedPath),
    passphrase: process.env.EFIBANK_CERTIFICATE_PASSWORD || '',
  };
}

async function getPixAccessToken() {
  if (pixAccessToken && Date.now() < pixTokenExpiresAt) {
    return pixAccessToken;
  }

  const clientId = process.env.EFIBANK_CLIENT_ID;
  const clientSecret = process.env.EFIBANK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('EFIBANK_CLIENT_ID e EFIBANK_CLIENT_SECRET são obrigatórios.');
  }

  const certConfig = getCertificateConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const requestConfig = {
    method: 'POST',
    url: `${BASE_URLS.pix}/oauth/token`,
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    data: { grant_type: 'client_credentials' },
    timeout: 15000,
  };

  if (certConfig) {
    requestConfig.httpsAgent = new (require('https').Agent)({
      pfx: certConfig.pfx,
      passphrase: certConfig.passphrase,
    });
  }

  try {
    const { data } = await axios(requestConfig);
    pixAccessToken = data.access_token;
    pixTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    console.log(`[Efíbank] PIX token obtido (expira em ${data.expires_in}s)`);
    return pixAccessToken;
  } catch (error) {
    const msg = error.response?.data || error.message;
    console.error('[Efíbank] Erro ao obter PIX token:', msg);
    throw new Error(`Falha na autenticação PIX Efíbank: ${JSON.stringify(msg)}`);
  }
}

async function getBillingsAccessToken() {
  if (billingsAccessToken && Date.now() < billingsTokenExpiresAt) {
    return billingsAccessToken;
  }

  const clientId = process.env.EFIBANK_CLIENT_ID;
  const clientSecret = process.env.EFIBANK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('EFIBANK_CLIENT_ID e EFIBANK_CLIENT_SECRET são obrigatórios.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const { data } = await axios.post(
      `${BASE_URLS.billings}/v1/authorize`,
      { grant_type: 'client_credentials' },
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    billingsAccessToken = data.access_token;
    billingsRefreshToken = data.refresh_token;
    billingsTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    console.log(`[Efíbank] Billings token obtido (expira em ${data.expires_in}s)`);
    return billingsAccessToken;
  } catch (error) {
    const msg = error.response?.data || error.message;
    console.error('[Efíbank] Erro ao obter Billings token:', msg);
    throw new Error(`Falha na autenticação Billings Efíbank: ${JSON.stringify(msg)}`);
  }
}

async function pixApiRequest(method, endpoint, body = null) {
  const token = await getPixAccessToken();
  const certConfig = getCertificateConfig();

  const config = {
    method,
    url: `${BASE_URLS.pix}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  };

  if (body) config.data = body;
  if (certConfig) {
    config.httpsAgent = new (require('https').Agent)({
      pfx: certConfig.pfx,
      passphrase: certConfig.passphrase,
    });
  }

  const { data } = await axios(config);
  return data;
}

async function billingsApiRequest(method, endpoint, body = null) {
  const token = await getBillingsAccessToken();

  const config = {
    method,
    url: `${BASE_URLS.billings}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  };

  if (body) config.data = body;

  const { data } = await axios(config);
  return data;
}

async function createPixCharge({ txid, amount, description, pixKey, expirationSeconds = 3600 }) {
  const body = {
    calendario: { expiracao: expirationSeconds },
    valor: { original: amount.toFixed(2) },
    chave: pixKey || process.env.EFIBANK_PIX_KEY,
    solicitacaoPagador: description || '',
  };

  if (txid) {
    return await pixApiRequest('PUT', `/v2/cob/${txid}`, body);
  }
  return await pixApiRequest('POST', '/v2/cob', body);
}

async function getPixChargeQrCode(txid) {
  return await pixApiRequest('GET', `/v2/cob/${txid}`);
}

async function getPixLocation(locId) {
  return await pixApiRequest('GET', `/v2/cob/${locId}/loc`);
}

async function generatePixQrCode({ amount, description, txid }) {
  const pixKey = process.env.EFIBANK_PIX_KEY;
  if (!pixKey) {
    throw new Error('EFIBANK_PIX_KEY é obrigatória para gerar PIX.');
  }

  const charge = await createPixCharge({
    txid,
    amount,
    description,
    pixKey,
    expirationSeconds: 3600,
  });

  const txidFinal = charge.loc?.id || charge.txid;

  const qrData = await pixApiRequest('GET', `/v2/loc/${txidFinal}/qrcode`);
  return {
    txid: charge.txid,
    charge_id: charge.loc?.id,
    status: charge.status,
    pix_copia_cola: qrData.imagemQrcode || qrData.pixCopiaECola,
    pix_qr_code_base64: qrData.imagemQrcode,
    expiration: charge.calendario?.expiracao,
    valor: amount,
  };
}

async function getPixChargeStatus(txid) {
  return await pixApiRequest('GET', `/v2/cob/${txid}`);
}

async function createBoleto({ amount, description, customerName, customerCpf, dueDate }) {
  const body = {
    calendario: {
      dataDeVencimento: dueDate || getDefaultDueDate(),
      dataLimiteNegativacao: getDefaultDueDate(),
    },
    valor: { original: amount.toFixed(2) },
    devedor: {
      cpf: customerCpf ? customerCpf.replace(/\D/g, '') : '',
      nome: customerName || '',
    },
    chave: process.env.EFIBANK_PIX_KEY || '',
  };

  return await billingsApiRequest('POST', '/v1/charge/create', body);
}

async function generateBoletoPdf(chargeId) {
  return await billingsApiRequest('POST', `/v1/charge/one-step/${chargeId}/billet`);
}

async function processCreditCard({ amount, description, customerName, customerCpf, installments = 1 }) {
  const body = {
    calendario: {
      dataDeVencimento: getDefaultDueDate(),
    },
    valor: {
      original: amount.toFixed(2),
    },
    devedor: {
      cpf: customerCpf ? customerCpf.replace(/\D/g, '') : '',
      nome: customerName || '',
    },
    descricao: description || '',
    parcelas: installments,
  };

  return await billingsApiRequest('POST', '/v1/charge/create', body);
}

async function getChargeDetails(chargeId) {
  return await billingsApiRequest('GET', `/v1/charge/${chargeId}`);
}

async function getNotifications() {
  return await billingsApiRequest('GET', '/v1/notification');
}

async function getBalance() {
  return await pixApiRequest('GET', '/v2/gn/saldo');
}

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().split('T')[0];
}

function generateTxId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 30; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  getPixAccessToken,
  getBillingsAccessToken,
  createPixCharge,
  getPixChargeQrCode,
  getPixLocation,
  generatePixQrCode,
  getPixChargeStatus,
  createBoleto,
  generateBoletoPdf,
  processCreditCard,
  getChargeDetails,
  getNotifications,
  getBalance,
  generateTxId,
  BASE_URLS,
  ENVIRONMENT,
};
