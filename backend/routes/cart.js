const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ci.id AS cart_item_id, ci.quantity, pv.id AS variant_id, pv.size, pv.color, pv.stock,
              p.id AS product_id, p.name, p.slug, p.price, p.image_url
       FROM cart_items ci
       JOIN product_variants pv ON ci.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE ci.user_id = ?`,
      [req.user.id]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { variant_id, quantity = 1 } = req.body;
    const [[variant]] = await pool.query('SELECT stock FROM product_variants WHERE id = ?', [variant_id]);
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    if (variant.stock < quantity) return res.status(400).json({ error: 'Not enough stock' });

    await pool.query(
      `INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [req.user.id, variant_id, quantity]
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

router.put('/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });
    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, req.params.itemId, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
});

router.delete('/:itemId', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [req.params.itemId, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

module.exports = router;
