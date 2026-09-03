const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const [rows] = await pool.query(
      'SELECT * FROM coupons WHERE code = ? AND active = TRUE AND (expires_at IS NULL OR expires_at >= CURDATE())',
      [code]
    );
    if (!rows.length) return res.status(404).json({ error: 'Invalid or expired coupon' });

    const coupon = rows[0];
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    let discount = 0;
    if (coupon.discount_percent) discount = (subtotal * coupon.discount_percent) / 100;
    else if (coupon.discount_flat) discount = Number(coupon.discount_flat);

    res.json({ valid: true, code: coupon.code, discount: Math.round(discount * 100) / 100 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;
