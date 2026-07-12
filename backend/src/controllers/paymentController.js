const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../services/emailService');

const getAsaasClient = () => {
  const apiKey = process.env.ASAAS_API_KEY;
  const environment = process.env.ASAAS_ENVIRONMENT || 'sandbox';
  const baseURL = environment === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3';

  return axios.create({
    baseURL,
    headers: {
      'access_token': apiKey,
      'Content-Type': 'application/json'
    }
  });
};

const processPayment = async (req, res) => {
  try {
    const { order_id, payment_method } = req.body;

    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.cpf as user_cpf,
              u.phone as user_phone, c.title as course_title
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN courses c ON o.course_id = c.id
       WHERE o.id = ? AND o.user_id = ?`,
      [order_id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const order = orders[0];

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Pedido já processado.' });
    }

    await db.query('UPDATE orders SET payment_method = ? WHERE id = ?', [payment_method, order_id]);

    let result;
    switch (payment_method) {
      case 'pix':
        result = await generatePixPayment(order);
        break;
      case 'boleto':
        result = await generateBoletoPayment(order);
        break;
      case 'credit_card':
        const { creditCard, creditCardHolderInfo } = req.body;
        result = await processCreditCardPayment(order, creditCard, creditCardHolderInfo);
        break;
      default:
        return res.status(400).json({ error: 'Método de pagamento inválido.' });
    }

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, gateway, gateway_payment_id, gateway_status, gateway_response,
        pix_qr_code, pix_qr_code_base64, pix_copy_paste, pix_expires_at,
        boleto_url, boleto_barcode, card_brand, card_last_four)
       VALUES (?, ?, ?, 'asaas', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, payment_method, order.total_amount, result.id, result.status, JSON.stringify(result),
        result.pixQrCode || null, result.pixQrCodeBase64 || null, result.pixCopyPaste || null,
        result.pixExpiresAt || null, result.boletoUrl || null, result.boletoBarcode || null,
        result.cardBrand || null, result.cardLastFour || null]
    );

    await db.query(
      `UPDATE orders SET gateway_payment_id = ?, gateway_status = ?, gateway_response = ?,
        status = CASE WHEN ? = 'CONFIRMED' THEN 'paid' WHEN ? IN ('RECEIVED', 'PENDING') THEN 'processing' ELSE 'pending' END,
        paid_at = CASE WHEN ? = 'CONFIRMED' THEN NOW() ELSE NULL END
       WHERE id = ?`,
      [result.id, result.status, JSON.stringify(result), result.status, result.status, result.status, order_id]
    );

    if (result.status === 'CONFIRMED') {
      await handlePaymentSuccess(order_id, order);
    }

    res.json({
      success: true,
      payment_method,
      payment: result,
      order_id
    });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento.' });
  }
};

const generatePix = async (req, res) => {
  try {
    const { order_id } = req.body;

    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.cpf as user_cpf
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND o.user_id = ?`,
      [order_id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    await db.query('UPDATE orders SET payment_method = \'pix\' WHERE id = ?', [order_id]);
    const result = await generatePixPayment(orders[0]);

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, gateway, gateway_payment_id, gateway_status, gateway_response,
        pix_qr_code, pix_qr_code_base64, pix_copy_paste, pix_expires_at)
       VALUES (?, 'pix', ?, 'asaas', ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, orders[0].total_amount, result.id, result.status, JSON.stringify(result),
        result.pixQrCode, result.pixQrCodeBase64, result.pixCopyPaste, result.pixExpiresAt]
    );

    await db.query(
      'UPDATE orders SET gateway_payment_id = ?, gateway_status = ?, status = \'processing\' WHERE id = ?',
      [result.id, result.status, order_id]
    );

    res.json({
      success: true,
      pix: {
        qrCode: result.pixQrCode,
        qrCodeBase64: result.pixQrCodeBase64,
        copyPaste: result.pixCopyPaste,
        expiresAt: result.pixExpiresAt
      }
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    res.status(500).json({ error: 'Erro ao gerar PIX.' });
  }
};

const generateBoleto = async (req, res) => {
  try {
    const { order_id } = req.body;

    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.cpf as user_cpf
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND o.user_id = ?`,
      [order_id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    await db.query('UPDATE orders SET payment_method = \'boleto\' WHERE id = ?', [order_id]);
    const result = await generateBoletoPayment(orders[0]);

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, gateway, gateway_payment_id, gateway_status, gateway_response,
        boleto_url, boleto_barcode)
       VALUES (?, 'boleto', ?, 'asaas', ?, ?, ?, ?, ?)`,
      [order_id, orders[0].total_amount, result.id, result.status, JSON.stringify(result),
        result.boletoUrl, result.boletoBarcode]
    );

    await db.query(
      'UPDATE orders SET gateway_payment_id = ?, gateway_status = ?, status = \'processing\' WHERE id = ?',
      [result.id, result.status, order_id]
    );

    res.json({
      success: true,
      boleto: {
        url: result.boletoUrl,
        barcode: result.boletoBarcode,
        expiresAt: result.boletoExpiresAt
      }
    });
  } catch (error) {
    console.error('Erro ao gerar boleto:', error);
    res.status(500).json({ error: 'Erro ao gerar boleto.' });
  }
};

const processCreditCard = async (req, res) => {
  try {
    const { order_id, creditCard, creditCardHolderInfo } = req.body;

    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.cpf as user_cpf, u.phone as user_phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND o.user_id = ?`,
      [order_id, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    await db.query('UPDATE orders SET payment_method = \'credit_card\' WHERE id = ?', [order_id]);
    const result = await processCreditCardPayment(orders[0], creditCard, creditCardHolderInfo);

    const statusMap = { CONFIRMED: 'approved', RECEIVED: 'processing', PENDING: 'processing', DECLINED: 'declined' };

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, gateway, gateway_payment_id, gateway_status, gateway_response,
        card_brand, card_last_four, installment_number, installment_total)
       VALUES (?, 'credit_card', ?, 'asaas', ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, orders[0].total_amount, result.id, result.status, JSON.stringify(result),
        result.cardBrand, result.cardLastFour, creditCard.installmentCount || 1, creditCard.installmentCount || 1]
    );

    await db.query(
      `UPDATE orders SET gateway_payment_id = ?, gateway_status = ?, status = CASE WHEN ? IN ('CONFIRMED', 'RECEIVED') THEN 'paid' ELSE 'pending' END,
        paid_at = CASE WHEN ? IN ('CONFIRMED', 'RECEIVED') THEN NOW() ELSE NULL END
       WHERE id = ?`,
      [result.id, result.status, result.status, result.status, order_id]
    );

    if (result.status === 'CONFIRMED' || result.status === 'RECEIVED') {
      await handlePaymentSuccess(order_id, orders[0]);
    }

    res.json({
      success: true,
      status: statusMap[result.status] || 'pending',
      gateway_status: result.status,
      payment_id: result.id
    });
  } catch (error) {
    console.error('Erro ao processar cartão de crédito:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento com cartão.' });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const { event, payment } = req.body;

    if (!event || !payment || !payment.id) {
      return res.status(400).json({ error: 'Payload inválido.' });
    }

    console.log(`Webhook recebido: ${event} - Payment ID: ${payment.id}`);

    const [payments] = await db.query(
      'SELECT id, order_id FROM payments WHERE gateway_payment_id = ?',
      [payment.id]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado.' });
    }

    const statusMap = {
      PAYMENT_CONFIRMED: 'approved',
      PAYMENT_RECEIVED: 'approved',
      PAYMENT_OVERDUE: 'cancelled',
      PAYMENT_DECLINED: 'declined',
      PAYMENT_REFUNDED: 'refunded',
      PAYMENT_REFUND_REQUESTED: 'refunded',
      PAYMENT_CANCELLED: 'cancelled'
    };

    const orderStatusMap = {
      PAYMENT_CONFIRMED: 'paid',
      PAYMENT_RECEIVED: 'paid',
      PAYMENT_OVERDUE: 'cancelled',
      PAYMENT_DECLINED: 'failed',
      PAYMENT_REFUNDED: 'refunded',
      PAYMENT_CANCELLED: 'cancelled'
    };

    const newStatus = statusMap[event] || payments[0].gateway_status;

    await db.query(
      'UPDATE payments SET status = ?, gateway_status = ?, paid_at = CASE WHEN ? IN (\'PAYMENT_CONFIRMED\', \'PAYMENT_RECEIVED\') THEN NOW() ELSE paid_at END WHERE id = ?',
      [newStatus, event, event, payments[0].id]
    );

    const newOrderStatus = orderStatusMap[event];
    if (newOrderStatus) {
      await db.query(
        `UPDATE orders SET status = ?, gateway_status = ?, paid_at = CASE WHEN ? IN ('PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED') THEN NOW() ELSE paid_at END
         WHERE id = ?`,
        [newOrderStatus, event, event, payments[0].order_id]
      );

      if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
        const [order] = await db.query(
          `SELECT o.*, u.name as user_name, u.email, c.title as course_title
           FROM orders o
           JOIN users u ON o.user_id = u.id
           JOIN courses c ON o.course_id = c.id
           WHERE o.id = ?`,
          [payments[0].order_id]
        );

        if (order.length > 0) {
          await handlePaymentSuccess(payments[0].order_id, order[0]);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(200).json({ received: true });
  }
};

const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [orders] = await db.query(
      'SELECT gateway_payment_id, gateway_status, status, payment_method FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const order = orders[0];

    if (!order.gateway_payment_id) {
      return res.json({
        status: order.status,
        gateway_status: null,
        paid: order.status === 'paid'
      });
    }

    try {
      const asaas = getAsaasClient();
      const response = await asaas.get(`/payments/${order.gateway_payment_id}`);

      const statusMap = {
        CONFIRMED: 'paid',
        RECEIVED: 'paid',
        PENDING: 'processing',
        OVERDUE: 'failed',
        DECLINED: 'failed',
        REFUNDED: 'refunded',
        CANCELLED: 'cancelled'
      };

      const newStatus = statusMap[response.data.status] || order.status;

      if (newStatus !== order.status) {
        await db.query(
          `UPDATE orders SET status = ?, gateway_status = ?,
            paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END
           WHERE id = ?`,
          [newStatus, response.data.status, newStatus, orderId]
        );

        if (newStatus === 'paid' && order.status !== 'paid') {
          const [orderData] = await db.query(
            `SELECT o.*, u.name, u.email, c.title as course_title
             FROM orders o
             JOIN users u ON o.user_id = u.id
             JOIN courses c ON o.course_id = c.id
             WHERE o.id = ?`,
            [orderId]
          );
          if (orderData.length > 0) {
            await handlePaymentSuccess(orderId, orderData[0]);
          }
        }
      }

      res.json({
        status: newStatus,
        gateway_status: response.data.status,
        paid: newStatus === 'paid',
        payment_data: response.data
      });
    } catch (apiError) {
      res.json({
        status: order.status,
        gateway_status: order.gateway_status,
        paid: order.status === 'paid'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    res.status(500).json({ error: 'Erro ao verificar pagamento.' });
  }
};

async function generatePixPayment(order) {
  const asaas = getAsaasClient();

  const response = await asaas.post('/payments', {
    customer: order.customer_id || (await findOrCreateCustomer(order)),
    billingType: 'PIX',
    value: order.total_amount,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: `Curso: ${order.course_title}`,
    externalReference: order.id.toString(),
    notificationDisabled: false
  });

  const pixResponse = await asaas.get(`/payments/${response.data.id}/pixQrCode`);

  return {
    id: response.data.id,
    status: response.data.status,
    pixQrCode: pixResponse.data.encodedImage,
    pixQrCodeBase64: pixResponse.data.payload,
    pixCopyPaste: pixResponse.data.payload,
    pixExpiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  };
}

async function generateBoletoPayment(order) {
  const asaas = getAsaasClient();

  const response = await asaas.post('/payments', {
    customer: order.customer_id || (await findOrCreateCustomer(order)),
    billingType: 'BOLETO',
    value: order.total_amount,
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: `Curso: ${order.course_title}`,
    externalReference: order.id.toString(),
    notificationDisabled: false
  });

  return {
    id: response.data.id,
    status: response.data.status,
    boletoUrl: response.data.bankSlipUrl,
    boletoBarcode: response.data.barCode,
    boletoExpiresAt: response.data.dueDate
  };
}

async function processCreditCardPayment(order, creditCard, holderInfo) {
  const asaas = getAsaasClient();

  const response = await asaas.post('/payments', {
    customer: order.customer_id || (await findOrCreateCustomer(order)),
    billingType: 'CREDIT_CARD',
    value: order.total_amount,
    dueDate: new Date().toISOString().split('T')[0],
    description: `Curso: ${order.course_title}`,
    externalReference: order.id.toString(),
    creditCard: {
      holderName: creditCard.holderName,
      number: creditCard.number,
      expiryMonth: creditCard.expiryMonth,
      expiryYear: creditCard.expiryYear,
      ccv: creditCard.ccv
    },
    creditCardHolderInfo: {
      name: holderInfo.name,
      email: holderInfo.email || order.user_email,
      cpfCnpj: holderInfo.cpfCnpj || order.user_cpf,
      postalCode: holderInfo.postalCode,
      addressNumber: holderInfo.addressNumber,
      phone: holderInfo.phone || order.user_phone
    },
    notificationDisabled: false
  });

  const lastFour = creditCard.number ? creditCard.number.slice(-4) : null;

  return {
    id: response.data.id,
    status: response.data.status,
    cardBrand: response.data.creditCardBrand,
    cardLastFour: lastFour
  };
}

async function findOrCreateCustomer(order) {
  const asaas = getAsaasClient();

  try {
    const searchResponse = await asaas.get('/customers', {
      params: { email: order.user_email }
    });

    if (searchResponse.data.data && searchResponse.data.data.length > 0) {
      return searchResponse.data.data[0].id;
    }
  } catch (e) {}

  const response = await asaas.post('/customers', {
    name: order.user_name,
    email: order.user_email,
    cpfCnpj: order.user_cpf,
    phone: order.user_phone || null,
    notificationDisabled: false
  });

  return response.data.id;
}

async function handlePaymentSuccess(orderId, order) {
  const [existing] = await db.query(
    'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
    [order.user_id, order.course_id]
  );

  if (existing.length === 0) {
    await db.query(
      `INSERT INTO enrollments (user_id, course_id, order_id, status, started_at)
       VALUES (?, ?, ?, 'active', NOW())`,
      [order.user_id, order.course_id, orderId]
    );

    await db.query(
      'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
      [order.course_id]
    );
  }

  if (order.email) {
    await sendEmail({
      to: order.email,
      ...emailTemplates.paymentConfirmation(order.user_name, order.course_title, order.order_number)
    });
  }
}

module.exports = {
  processPayment,
  generatePix,
  generateBoleto,
  processCreditCard,
  handleWebhook,
  checkPaymentStatus
};
