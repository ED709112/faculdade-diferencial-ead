const db = require('../config/database');
const efibank = require('../services/efibankService');

async function getOrderWithDescription(orderId, userId) {
  const [orders] = await db.query(
    `SELECT o.*, u.name as user_name, u.email as user_email, u.cpf as user_cpf,
            u.phone as user_phone, u.address as user_address, u.city as user_city,
            u.state as user_state, u.zip_code as user_zip,
            c.title as course_title,
            (SELECT GROUP_CONCAT(CONCAT(p.name, ' (', oi.quantity, 'x)') SEPARATOR ' + ')
             FROM order_items oi JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = o.id) as products_summary
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN courses c ON o.course_id = c.id
     WHERE o.id = ? AND o.user_id = ?`,
    [orderId, userId]
  );

  if (orders.length === 0) return null;

  const order = orders[0];
  if (!order.course_title && !order.products_summary) {
    const [items] = await db.query(
      `SELECT COALESCE(c.title, p.name) as title, oi.quantity
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN courses c ON oi.course_id = c.id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    order.products_summary = items.map(i => `${i.title} (${i.quantity}x)`).join(' + ');
  }

  return order;
}

const generatePix = async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id é obrigatório.' });
    }

    const order = await getOrderWithDescription(order_id, req.user.id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Pedido já foi pago.' });
    }

    const rawTxid = `FAD${order.id}${Date.now().toString(36)}`;
    const txid = rawTxid.slice(0, 35).padEnd(26, 'X');
    const description = `Pedido ${order.order_number} - ${order.course_title || order.products_summary}`;

    const pixResult = await efibank.generatePixQrCode({
      amount: parseFloat(order.total_amount),
      description,
      txid,
    });

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, gateway, gateway_payment_id, gateway_status, pix_qr_code, pix_copy_paste, pix_expires_at)
       VALUES (?, 'pix', ?, 'pending', 'efibank', ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [order.id, order.total_amount, pixResult.txid, pixResult.status, pixResult.pix_qr_code_base64, pixResult.pix_copia_cola]
    );

    await db.query(
      `UPDATE orders SET payment_gateway = 'efibank', gateway_payment_id = ? WHERE id = ?`,
      [pixResult.txid, order.id]
    );

    res.json({
      message: 'PIX gerado com sucesso!',
      payment: {
        txid: pixResult.txid,
        qr_code: pixResult.pix_qr_code_base64,
        copy_paste: pixResult.pix_copia_cola,
        amount: parseFloat(order.total_amount),
        expires_in: 3600,
        order_number: order.order_number,
      },
    });

    console.log(`[Efíbank] PIX gerado: txid=${pixResult.txid} para pedido ${order.order_number}`);
  } catch (error) {
    console.error('[Efíbank] Erro ao gerar PIX:', error.message);
    res.status(500).json({ error: 'Erro ao gerar PIX. Verifique as credenciais Efíbank.' });
  }
};

const generateBoleto = async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id é obrigatório.' });
    }

    const order = await getOrderWithDescription(order_id, req.user.id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Pedido já foi pago.' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const street = order.user_address || order.user_city || 'Sem endereco';

    const charge = await efibank.createBoleto({
      amount: parseFloat(order.total_amount),
      description: `Pedido ${order.order_number} - ${order.course_title || order.products_summary}`,
      customerName: order.user_name,
      customerCpf: order.user_cpf,
      customerEmail: order.user_email,
      customerPhone: order.user_phone,
      address: {
        street,
        number: 'S/N',
        neighborhood: order.user_city || 'Nao informado',
        zipcode: order.user_zip,
        city: order.user_city || 'Nao informado',
        state: order.user_state || 'XX',
        complement: '',
      },
      dueDate: dueDateStr,
      customId: `pedido-${order.order_number}`,
    });

    const boletoUrl = charge.pdf?.charge || charge.billet_link || charge.link || null;
    const barcode = charge.barcode || '';
    const pixCopyPaste = charge.pix?.qrcode || null;
    const pixQrBase64 = charge.pix?.qrcode_image || null;

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, gateway, gateway_payment_id, gateway_status,
        boleto_url, boleto_barcode, pix_copy_paste, pix_qr_code_base64, gateway_response)
       VALUES (?, 'boleto', ?, 'pending', 'efibank', ?, ?, ?, ?, ?, ?, ?)`,
      [order.id, order.total_amount, charge.charge_id, charge.status,
       boletoUrl, barcode, pixCopyPaste, pixQrBase64, JSON.stringify(charge)]
    );

    await db.query(
      `UPDATE orders SET payment_gateway = 'efibank', gateway_payment_id = ? WHERE id = ?`,
      [charge.charge_id, order.id]
    );

    res.json({
      message: 'Boleto gerado com sucesso!',
      payment: {
        charge_id: charge.charge_id,
        status: charge.status,
        due_date: dueDateStr,
        amount: parseFloat(order.total_amount),
        boleto_url: boletoUrl,
        barcode,
        pix_copy_paste: pixCopyPaste,
        pix_qr_code_base64: pixQrBase64,
        order_number: order.order_number,
      },
    });

    console.log(`[Efíbank] Boleto gerado: charge_id=${charge.charge_id} para pedido ${order.order_number}`);
  } catch (error) {
    console.error('[Efíbank] Erro ao gerar boleto:', error.message);
    res.status(500).json({ error: 'Erro ao gerar boleto. Verifique as credenciais Efíbank.' });
  }
};

const processCreditCard = async (req, res) => {
  try {
    const { order_id, card_data, installments } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id é obrigatório.' });
    }

    const order = await getOrderWithDescription(order_id, req.user.id);

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const numInstallments = Math.min(installments || 1, order.max_installments || 1);

    const result = await efibank.processCreditCard({
      amount: parseFloat(order.total_amount),
      description: `Pedido ${order.order_number} - ${order.course_title || order.products_summary}`,
      customerName: order.user_name,
      customerCpf: order.user_cpf,
      installments: numInstallments,
    });

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, gateway, gateway_payment_id, gateway_status, installment_number, installment_total)
       VALUES (?, 'credit_card', ?, 'pending', 'efibank', ?, ?, ?, ?)`,
      [order.id, order.total_amount, result.charge_id, result.status, 1, numInstallments]
    );

    await db.query(
      `UPDATE orders SET payment_gateway = 'efibank', gateway_payment_id = ? WHERE id = ?`,
      [result.charge_id, order.id]
    );

    res.json({
      message: 'Pagamento processado com sucesso!',
      payment: {
        charge_id: result.charge_id,
        status: result.status,
        amount: parseFloat(order.total_amount),
        installments: numInstallments,
        order_number: order.order_number,
      },
    });

    console.log(`[Efíbank] Cartão processado: charge_id=${result.charge_id} para pedido ${order.order_number}`);
  } catch (error) {
    console.error('[Efíbank] Erro ao processar cartão:', error.message);
    res.status(500).json({ error: 'Erro ao processar pagamento. Verifique as credenciais Efíbank.' });
  }
};

async function markPaymentApproved({ payment, gatewayStatus, rawResponse }) {
  if (payment.status === 'approved') return false;

  await db.query(
    `UPDATE payments SET status = 'approved', paid_at = NOW(), gateway_status = ?, gateway_response = ? WHERE id = ?`,
    [gatewayStatus, rawResponse, payment.id]
  );

  await db.query(
    `UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?`,
    [payment.order_id]
  );

  const [existingEnrollment] = await db.query(
    `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?`,
    [payment.user_id, payment.course_id]
  );

  if (existingEnrollment.length === 0) {
    await db.query(
      `INSERT INTO enrollments (user_id, course_id, order_id, status, started_at)
       VALUES (?, ?, ?, 'active', NOW())`,
      [payment.user_id, payment.course_id, payment.order_id]
    );
  } else {
    await db.query(
      `UPDATE enrollments SET status = 'active', started_at = NOW() WHERE user_id = ? AND course_id = ? AND status != 'active'`,
      [payment.user_id, payment.course_id]
    );
  }

  await db.query(
    'UPDATE courses SET enrollment_count = enrollment_count + 1 WHERE id = ?',
    [payment.course_id]
  );

  return true;
}

async function findPaymentByGatewayId(gatewayPaymentId) {
  const [payments] = await db.query(
    `SELECT p.*, o.user_id, o.course_id, o.id as order_id
     FROM payments p
     JOIN orders o ON p.order_id = o.id
     WHERE p.gateway_payment_id = ? AND p.gateway = 'efibank'`,
    [gatewayPaymentId]
  );
  return payments[0] || null;
}

const handleWebhook = async (req, res) => {
  try {
    const payload = req.body;

    console.log('[Efíbank] Webhook recebido:', JSON.stringify(payload).substring(0, 800));

    let handled = false;

    if (payload.pix && Array.isArray(payload.pix)) {
      for (const pixEvent of payload.pix) {
        const { txid, status: pixStatus } = pixEvent;

        if (!txid) continue;

        const payment = await findPaymentByGatewayId(txid);

        if (!payment) {
          console.log(`[Efíbank] Webhook: pagamento não encontrado para txid=${txid}`);
          continue;
        }

        const approved = await markPaymentApproved({
          payment,
          gatewayStatus: pixStatus || 'RECEBIDO',
          rawResponse: JSON.stringify(pixEvent),
        });

        if (approved) {
          console.log(`[Efíbank] Webhook PIX processado: txid=${txid}, pedido=${payment.order_id}`);
        }
        handled = true;
      }
    }

    if (payload.notification) {
      try {
        const notifResult = await efibank.getNotificationDetails(payload.notification);
        const notifData = (notifResult && notifResult.data) || notifResult;
        const events = Array.isArray(notifData) ? notifData : [notifData];

        for (const evt of events) {
          const chargeId = evt.identifiers?.charge_id || evt.charge_id || evt.id || evt.payment_id;
          const evtStatus = evt.status?.current || evt.status || evt.event || '';

          if (!chargeId) continue;

          const payment = await findPaymentByGatewayId(String(chargeId));

          if (!payment) {
            console.log(`[Efíbank] Webhook notificação: pagamento não encontrado para charge=${chargeId}`);
            continue;
          }

          if (evtStatus === 'paid' || evtStatus === 'settled' || evtStatus === 'confirmed' || evtStatus === 'CONCLUIDA') {
            const approved = await markPaymentApproved({
              payment,
              gatewayStatus: evtStatus,
              rawResponse: JSON.stringify(evt),
            });

            if (approved) {
              console.log(`[Efíbank] Webhook notificação processada: charge=${chargeId}, pedido=${payment.order_id}`);
            }
          }
          handled = true;
        }
      } catch (e) {
        console.error('[Efíbank] Erro ao buscar notificação:', e.message);
      }
    }

    if (payload.type === 'charge' || payload.charge_id) {
      const chargeData = payload.data || payload;
      const chargeId = chargeData.charge_id || payload.charge_id;

      if (chargeId) {
        const payment = await findPaymentByGatewayId(chargeId);

        if (payment) {
          const chargeStatus = chargeData.status || chargeData.event || '';

          if (chargeStatus === 'paid' || chargeStatus === 'settled') {
            const approved = await markPaymentApproved({
              payment,
              gatewayStatus: chargeStatus,
              rawResponse: JSON.stringify(payload),
            });

            if (approved) {
              console.log(`[Efíbank] Webhook boleto processado: charge=${chargeId}, pedido=${payment.order_id}`);
            }
          }
          handled = true;
        }
      }
    }

    if (!handled) {
      console.log('[Efíbank] Webhook: formato não reconhecido, ignorado.');
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[Efíbank] Erro no webhook:', error.message);
    res.status(200).json({ ok: true });
  }
};

const checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [orders] = await db.query(
      `SELECT o.* FROM orders o WHERE o.id = ? AND o.user_id = ?`,
      [orderId, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const order = orders[0];

    const [payments] = await db.query(
      `SELECT p.gateway_payment_id, p.status as payment_status, p.payment_method
       FROM payments p
       WHERE p.order_id = ? AND p.gateway = 'efibank'
       ORDER BY p.id DESC LIMIT 1`,
      [order.id]
    );

    const payment = payments[0] || null;

    if (!payment || !payment.gateway_payment_id) {
      return res.json({ status: order.status, payment_status: payment?.payment_status || null });
    }

    try {
      const method = payment.payment_method;

      let details;
      if (method === 'boleto') {
        details = await efibank.getBoletoDetails(payment.gateway_payment_id);
        const data = details && details.data ? details.data : details;
        const newStatus = data.status === 'paid' ? 'approved' : 'pending';

        if (newStatus === 'approved' && payment.payment_status !== 'approved') {
          await db.query(`UPDATE payments SET status = 'approved', paid_at = NOW() WHERE order_id = ? AND gateway = 'efibank'`, [order.id]);
          await db.query(`UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?`, [order.id]);
        }

        return res.json({
          status: data.status,
          payment_status: newStatus,
          details: data,
        });
      }

      const pixStatus = await efibank.getPixChargeStatus(payment.gateway_payment_id);
      const newStatus = pixStatus.status === 'CONCLUIDA' ? 'approved' : 'pending';

      if (newStatus === 'approved' && payment.payment_status !== 'approved') {
        await db.query(`UPDATE payments SET status = 'approved', paid_at = NOW() WHERE order_id = ? AND gateway = 'efibank'`, [order.id]);
        await db.query(`UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?`, [order.id]);
      }

      return res.json({
        status: pixStatus.status,
        payment_status: newStatus,
        details: pixStatus,
      });
    } catch {
      return res.json({ status: order.status, payment_status: payment?.payment_status || null });
    }
  } catch (error) {
    console.error('[Efíbank] Erro ao verificar status:', error.message);
    res.status(500).json({ error: 'Erro ao verificar status do pagamento.' });
  }
};

module.exports = {
  generatePix,
  generateBoleto,
  processCreditCard,
  handleWebhook,
  checkPaymentStatus,
};
