const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const [[{ revenue }]] = await pool.query(
      "SELECT COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status IN ('paid','shipped','delivered')"
    );
    const [[{ order_count }]] = await pool.query(
      "SELECT COUNT(*) AS order_count FROM orders WHERE status IN ('paid','shipped','delivered')"
    );
    const [[{ pending_count }]] = await pool.query(
      "SELECT COUNT(*) AS pending_count FROM orders WHERE status = 'pending'"
    );
    const [[{ product_count }]] = await pool.query(
      'SELECT COUNT(*) AS product_count FROM products WHERE is_active = TRUE'
    );
    const [lowStock] = await pool.query(
      `SELECT pv.id, pv.size, pv.stock, p.name AS product_name
       FROM product_variants pv JOIN products p ON pv.product_id = p.id
       WHERE pv.stock <= 5 AND p.is_active = TRUE
       ORDER BY pv.stock ASC LIMIT 10`
    );
    const [recentOrders] = await pool.query(
      `SELECT o.id, o.total, o.status, o.created_at, u.name AS customer_name
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 5`
    );
    res.json({ revenue, order_count, pending_count, product_count, low_stock: lowStock, recent_orders: recentOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

module.exports = router;