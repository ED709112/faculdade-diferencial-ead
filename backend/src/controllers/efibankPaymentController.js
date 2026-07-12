const db = require('../config/database');
const efibank = require('../services/efibankService');

const generatePix = async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id é obrigatório.' });
    }

    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, c.title as course_title
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

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Pedido já foi pago.' });
    }

    const txid = `FAD${order.id}${Date.now().toString(36)}`.substring(0, 30);
    const description = `Pedido ${order.order_number} - ${order.course_title}`;

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

    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, c.title as course_title
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

    if (order.status === 'paid') {
      return res.status(400).json({ error: 'Pedido já foi pago.' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const charge = await efibank.createBoleto({
      amount: parseFloat(order.total_amount),
      description: `Pedido ${order.order_number} - ${order.course_title}`,
      customerName: order.user_name,
      dueDate: dueDateStr,
    });

    let boletoPdf = null;
    try {
      boletoPdf = await efibank.generateBoletoPdf(charge.charge_id);
    } catch (e) {
      console.log('[Efíbank] Não foi possível gerar PDF do boleto:', e.message);
    }

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, gateway, gateway_payment_id, gateway_status, boleto_url, boleto_barcode)
       VALUES (?, 'boleto', ?, 'pending', 'efibank', ?, ?, ?, ?)`,
      [order.id, order.total_amount, charge.charge_id, charge.status,
       boletoPdf?.linkBillet || charge.status, boletoPdf?.barcode || '']
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
        boleto_url: boletoPdf?.linkBillet || null,
        barcode: boletoPdf?.barcode || null,
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

    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, c.title as course_title, c.max_installments
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
    const numInstallments = Math.min(installments || 1, order.max_installments || 1);

    const result = await efibank.processCreditCard({
      amount: parseFloat(order.total_amount),
      description: `Pedido ${order.order_number} - ${order.course_title}`,
      customerName: order.user_name,
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

const handleWebhook = async (req, res) => {
  try {
    const payload = req.body;

    console.log('[Efíbank] Webhook recebido:', JSON.stringify(payload).substring(0, 500));

    if (payload.pix && Array.isArray(payload.pix)) {
      for (const pixEvent of payload.pix) {
        const { txid, valor, endToEndId, status: pixStatus } = pixEvent;

        if (!txid) continue;

        const [payments] = await db.query(
          `SELECT p.*, o.user_id, o.course_id, o.id as order_id
           FROM payments p
           JOIN orders o ON p.order_id = o.id
           WHERE p.gateway_payment_id = ? AND p.gateway = 'efibank'`,
          [txid]
        );

        if (payments.length === 0) {
          console.log(`[Efíbank] Webhook: pagamento não encontrado para txid=${txid}`);
          continue;
        }

        const payment = payments[0];

        if (payment.status === 'approved') {
          continue;
        }

        await db.query(
          `UPDATE payments SET status = 'approved', paid_at = NOW(), gateway_status = ?, gateway_response = ? WHERE id = ?`,
          [pixStatus || 'RECEBIDO', JSON.stringify(pixEvent), payment.id]
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

        console.log(`[Efíbank] Webhook PIX processado: txid=${txid}, pedido=${payment.order_id}`);
      }
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
      `SELECT o.*, p.gateway_payment_id, p.status as payment_status
       FROM orders o
       LEFT JOIN payments p ON o.id = p.order_id AND p.gateway = 'efibank'
       WHERE o.id = ? AND o.user_id = ?`,
      [orderId, req.user.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const order = orders[0];

    if (!order.gateway_payment_id) {
      return res.json({ status: order.status, payment_status: order.payment_status });
    }

    try {
      const pixStatus = await efibank.getPixChargeStatus(order.gateway_payment_id);
      const newStatus = pixStatus.status === 'CONCLUIDA' ? 'approved' : 'pending';

      if (newStatus === 'approved' && order.payment_status !== 'approved') {
        await db.query(`UPDATE payments SET status = 'approved', paid_at = NOW() WHERE order_id = ? AND gateway = 'efibank'`, [order.id]);
        await db.query(`UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ?`, [order.id]);
      }

      return res.json({
        status: pixStatus.status,
        payment_status: newStatus,
        details: pixStatus,
      });
    } catch {
      return res.json({ status: order.status, payment_status: order.payment_status });
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
