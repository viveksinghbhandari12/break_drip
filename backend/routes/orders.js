const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const [orders] = await pool.query(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ orders });
});

router.get('/:id', requireAuth, async (req, res) => {
  const [[order]] = await pool.query(
    'SELECT * FROM orders WHERE id = ? AND (user_id = ? OR ? = "admin")',
    [req.params.id, req.user.id, req.user.role]
  );
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);

  let address = null;
  if (order.shipping_address_id) {
    const [[addr]] = await pool.query('SELECT * FROM addresses WHERE id = ?', [order.shipping_address_id]);
    address = addr || null;
  }

  res.json({ order: { ...order, items, address } });
});

// Lightweight status check for polling right after checkout, before the webhook has landed
router.get('/:id/status', requireAuth, async (req, res) => {
  const [[order]] = await pool.query(
    'SELECT id, status FROM orders WHERE id = ? AND (user_id = ? OR ? = "admin")',
    [req.params.id, req.user.id, req.user.role]
  );
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ status: order.status });
});

router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  const [orders] = await pool.query(
    `SELECT o.*, u.name AS customer_name, u.email AS customer_email,
            a.line1, a.line2, a.city, a.state, a.postal_code, a.country
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN addresses a ON o.shipping_address_id = a.id
     ORDER BY o.created_at DESC`
  );
  res.json({ orders });
});

router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
