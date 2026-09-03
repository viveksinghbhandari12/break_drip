const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.image_url
     FROM wishlists w JOIN products p ON w.product_id = p.id
     WHERE w.user_id = ?`,
    [req.user.id]
  );
  res.json({ items: rows });
});

router.post('/:productId', async (req, res) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)',
      [req.user.id, req.params.productId]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

router.delete('/:productId', async (req, res) => {
  await pool.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.productId]);
  res.json({ ok: true });
});

module.exports = router;
