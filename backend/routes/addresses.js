const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC',
    [req.user.id]
  );
  res.json({ addresses: rows });
});

router.post('/', async (req, res) => {
  try {
    const { line1, line2, city, state, postal_code, country, is_default } = req.body;
    if (!line1 || !city || !postal_code || !country) {
      return res.status(400).json({ error: 'line1, city, postal_code, and country are required' });
    }

    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [req.user.id]);
    }

    const [result] = await pool.query(
      `INSERT INTO addresses (user_id, line1, line2, city, state, postal_code, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, line1, line2 || null, city, state || null, postal_code, country, !!is_default]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save address' });
  }
});

router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
