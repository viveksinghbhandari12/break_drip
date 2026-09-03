const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Step 1: create a pending order in our DB + a matching Razorpay order.
// Razorpay's "order" is just a payment intent with an amount -- it does NOT
// collect shipping info, so the address must already exist (created via
// /api/addresses before this is called) and is passed in as shipping_address_id.
router.post('/create-order', requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { coupon_code, shipping_address_id } = req.body;

    if (!shipping_address_id) {
      return res.status(400).json({ error: 'A shipping address is required' });
    }
    const [[address]] = await conn.query(
      'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
      [shipping_address_id, req.user.id]
    );
    if (!address) return res.status(400).json({ error: 'Invalid shipping address' });

    const [items] = await conn.query(
      `SELECT ci.quantity, pv.id AS variant_id, pv.size, pv.stock, p.id AS product_id, p.name, p.price
       FROM cart_items ci
       JOIN product_variants pv ON ci.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    if (!items.length) return res.status(400).json({ error: 'Cart is empty' });

    for (const item of items) {
      if (item.stock < item.quantity) {
        return res.status(400).json({ error: `${item.name} (${item.size}) is out of stock` });
      }
    }

    const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

    let discount = 0;
    let appliedCode = null;
    if (coupon_code) {
      const [[coupon]] = await conn.query(
        'SELECT * FROM coupons WHERE code = ? AND active = TRUE AND (expires_at IS NULL OR expires_at >= CURDATE())',
        [coupon_code]
      );
      if (coupon) {
        discount = coupon.discount_percent ? (subtotal * coupon.discount_percent) / 100 : Number(coupon.discount_flat || 0);
        appliedCode = coupon.code;
      }
    }

    const total = Math.max(subtotal - discount, 0);

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, status, subtotal, discount, total, coupon_code, shipping_address_id)
       VALUES (?, 'pending', ?, ?, ?, ?, ?)`,
      [req.user.id, subtotal, discount, total, appliedCode, shipping_address_id]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO order_items (order_id, variant_id, product_name, size, quantity, unit_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.variant_id, item.name, item.size, item.quantity, item.price]
      );
    }

    // Razorpay amounts are in the smallest currency unit (paise for INR), integer only.
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `order_${orderId}`,
      notes: { order_id: String(orderId), user_id: String(req.user.id) }
    });

    await conn.query('UPDATE orders SET razorpay_order_id = ? WHERE id = ?', [razorpayOrder.id, orderId]);

    res.json({
      order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    conn.release();
  }
});

// Step 2: the frontend calls this immediately after Razorpay's modal returns a
// successful payment. We must verify the signature ourselves -- a client-side
// "success" callback firing is NOT proof of payment, it's just a claim.
router.post('/verify', requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing verification fields' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  await finalizeOrder(razorpay_order_id, razorpay_payment_id);
  const [[order]] = await pool.query('SELECT id, status FROM orders WHERE razorpay_order_id = ?', [razorpay_order_id]);
  res.json({ ok: true, order_id: order?.id, status: order?.status });
});

// Step 3 (belt-and-braces): Razorpay also sends server-to-server webhooks.
// This is the authoritative path if the user closes the tab before the
// client-side verify() call completes, or on async events like refunds.
router.webhookHandler = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body) // raw body, see server.js
    .digest('hex');

  if (signature !== expected) {
    console.error('Razorpay webhook signature mismatch');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(req.body);

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    await finalizeOrder(payment.order_id, payment.id);
  }

  if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity;
    await pool.query('UPDATE orders SET status = "cancelled" WHERE razorpay_order_id = ? AND status = "pending"', [payment.order_id]);
  }

  res.json({ received: true });
};

// Shared finalize logic used by both the client-verify path and the webhook path.
// Idempotent: if the order is already paid, does nothing.
async function finalizeOrder(razorpayOrderId, paymentId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[order]] = await conn.query(
      'SELECT id, user_id, status, coupon_code FROM orders WHERE razorpay_order_id = ? FOR UPDATE',
      [razorpayOrderId]
    );
    if (!order || order.status === 'paid') {
      await conn.commit();
      return;
    }

    await conn.query(
      'UPDATE orders SET status = "paid", razorpay_payment_id = ? WHERE id = ?',
      [paymentId, order.id]
    );

    const [items] = await conn.query('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [order.id]);
    for (const item of items) {
      await conn.query('UPDATE product_variants SET stock = GREATEST(stock - ?, 0) WHERE id = ?', [item.quantity, item.variant_id]);
    }

    if (order.coupon_code) {
      await conn.query('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?', [order.coupon_code]);
    }
    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [order.user_id]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('Failed to finalize order', err);
  } finally {
    conn.release();
  }
}

module.exports = router;
