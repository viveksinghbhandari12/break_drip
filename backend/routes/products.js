const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/products?category=hoodies&search=hoodie&sort=price_asc&page=1
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, page = 1, limit = 12 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = ['p.is_active = TRUE'];
    let params = [];

    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }
    if (search) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    if (sort === 'price_desc') orderBy = 'p.price DESC';
    if (sort === 'featured') orderBy = 'p.is_featured DESC, p.created_at DESC';

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, p.compare_at_price, p.image_url, p.drop_name, p.is_featured, c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`,
      params
    );

    res.json({ products: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.is_active = TRUE`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    const product = rows[0];
    const [variants] = await pool.query(
      'SELECT id, size, color, sku, stock FROM product_variants WHERE product_id = ?',
      [product.id]
    );

    const [[{ avg_rating, review_count }]] = await pool.query(
      'SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE product_id = ?',
      [product.id]
    );

    res.json({ product: { ...product, variants, avg_rating, review_count } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Admin CRUD
router.get('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });

    const [variants] = await pool.query('SELECT * FROM product_variants WHERE product_id = ?', [req.params.id]);
    res.json({ product: { ...rows[0], variants } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, price, compare_at_price, category_id, image_url, drop_name, is_featured } = req.body;

    // A soft-deleted product keeps its row (and its slug) forever, so a plain
    // INSERT would just throw a duplicate-key error with no useful message.
    // Check first so we can tell the admin what actually happened.
    const [[existing]] = await pool.query('SELECT id, is_active FROM products WHERE slug = ?', [slug]);
    if (existing) {
      if (existing.is_active) {
        return res.status(409).json({ error: 'A product with this slug already exists and is active.' });
      }
      return res.status(409).json({
        error: 'A deactivated product already uses this slug.',
        existing_product_id: existing.id,
        suggestion: 'restore'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO products (name, slug, description, price, compare_at_price, category_id, image_url, drop_name, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, price, compare_at_price || null, category_id || null, image_url, drop_name, !!is_featured]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const fields = req.body;
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'No fields to update' });

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE products SET ${setClause} WHERE id = ?`, [...keys.map(k => fields[k]), req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.put('/:id/restore', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active = TRUE WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to restore product' });
  }
});

router.get('/admin/deactivated/list', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.slug, p.price, c.name AS category_name
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = FALSE ORDER BY p.name`
    );
    res.json({ products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch deactivated products' });
  }
});

// Variant management (size/color/stock/sku) — separate from the product record
// itself since a product can have many variants.
router.post('/:id/variants', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { size, color, sku, stock } = req.body;
    if (!size) return res.status(400).json({ error: 'Size is required' });

    const [result] = await pool.query(
      'INSERT INTO product_variants (product_id, size, color, sku, stock) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, size, color || 'default', sku || null, stock || 0]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add variant' });
  }
});

router.put('/variants/:variantId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const fields = req.body;
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ error: 'No fields to update' });

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    await pool.query(`UPDATE product_variants SET ${setClause} WHERE id = ?`, [...keys.map(k => fields[k]), req.params.variantId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

router.delete('/variants/:variantId', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM product_variants WHERE id = ?', [req.params.variantId]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
});

module.exports = router;
