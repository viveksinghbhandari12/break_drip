import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';

const EMPTY_PRODUCT = {
  name: '', slug: '', description: '', price: '', compare_at_price: '',
  category_id: '', image_url: '', drop_name: '', is_featured: false
};

export default function AdminProductForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({ size: '', color: '', sku: '', stock: 0 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data.categories));
    if (!isNew) {
      api.get(`/products/admin/${id}`).then(res => {
        const { variants: v, ...rest } = res.data.product;
        setForm(rest);
        setVariants(v);
      });
    }
  }, [id, isNew]);

  function updateField(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
  name: form.name,
  slug: form.slug,
  description: form.description,
  price: Number(form.price),
  compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
  category_id: form.category_id || null,
  image_url: form.image_url,
  drop_name: form.drop_name,
  is_featured: !!form.is_featured
};

      if (isNew) {
        const res = await api.post('/products', payload);
        navigate(`/admin/products/${res.data.id}`);
      } else {
        await api.put(`/products/${id}`, payload);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.suggestion === 'restore') {
        const goRestore = confirm(
          `${data.error} Would you like to restore and edit that product instead of creating a new one?`
        );
        if (goRestore) {
          await api.put(`/products/${data.existing_product_id}/restore`);
          navigate(`/admin/products/${data.existing_product_id}`);
          return;
        }
      }
      setError(data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  async function addVariant() {
    if (!newVariant.size) return;
    const res = await api.post(`/products/${id}/variants`, newVariant);
    setVariants(v => [...v, { id: res.data.id, ...newVariant }]);
    setNewVariant({ size: '', color: '', sku: '', stock: 0 });
  }

  async function updateVariantStock(variantId, stock) {
    await api.put(`/products/variants/${variantId}`, { stock: Number(stock) });
    setVariants(v => v.map(x => x.id === variantId ? { ...x, stock: Number(stock) } : x));
  }

  async function removeVariant(variantId) {
    await api.delete(`/products/variants/${variantId}`);
    setVariants(v => v.filter(x => x.id !== variantId));
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl uppercase mb-8">{isNew ? 'New product' : 'Edit product'}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-12">
        <input placeholder="Name" required value={form.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-surface border border-line px-3 py-2.5 focus-ring" />
        <input placeholder="Slug (url-friendly, e.g. static-hoodie)" required value={form.slug} onChange={e => updateField('slug', e.target.value)} className="w-full bg-surface border border-line px-3 py-2.5 focus-ring font-mono text-sm" />
        <textarea placeholder="Description" rows={3} value={form.description || ''} onChange={e => updateField('description', e.target.value)} className="w-full bg-surface border border-line px-3 py-2.5 focus-ring" />

        <div className="grid grid-cols-2 gap-3">
          <input type="number" step="0.01" placeholder="Price" required value={form.price} onChange={e => updateField('price', e.target.value)} className="bg-surface border border-line px-3 py-2.5 focus-ring" />
          <input type="number" step="0.01" placeholder="Compare-at price (optional)" value={form.compare_at_price || ''} onChange={e => updateField('compare_at_price', e.target.value)} className="bg-surface border border-line px-3 py-2.5 focus-ring" />
        </div>

        <select value={form.category_id || ''} onChange={e => updateField('category_id', e.target.value)} className="w-full bg-surface border border-line px-3 py-2.5 focus-ring">
          <option value="">No category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input placeholder="Image URL" value={form.image_url || ''} onChange={e => updateField('image_url', e.target.value)} className="w-full bg-surface border border-line px-3 py-2.5 focus-ring" />
        <input placeholder="Drop name (e.g. DROP 004)" value={form.drop_name || ''} onChange={e => updateField('drop_name', e.target.value)} className="w-full bg-surface border border-line px-3 py-2.5 focus-ring" />

        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
          <input type="checkbox" checked={!!form.is_featured} onChange={e => updateField('is_featured', e.target.checked)} />
          Featured on landing page
        </label>

        {error && <p className="text-danger font-mono text-xs">{error}</p>}

        <button type="submit" disabled={saving} className="bg-accent text-bg font-mono uppercase text-xs tracking-widest px-6 py-3 hover:bg-ink transition-colors disabled:opacity-50 focus-ring">
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </button>
      </form>

      {!isNew && (
        <div>
          <h2 className="font-display text-xl uppercase mb-4">Variants (size / stock)</h2>
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-line text-left font-mono text-xs uppercase tracking-widest text-dim">
                <th className="py-2">Size</th>
                <th className="py-2">Color</th>
                <th className="py-2">SKU</th>
                <th className="py-2">Stock</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {variants.map(v => (
                <tr key={v.id}>
                  <td className="py-2">{v.size}</td>
                  <td className="py-2 text-dim">{v.color}</td>
                  <td className="py-2 font-mono text-xs text-dim">{v.sku}</td>
                  <td className="py-2">
                    <input
                      type="number" defaultValue={v.stock}
                      onBlur={e => updateVariantStock(v.id, e.target.value)}
                      className="w-20 bg-surface border border-line px-2 py-1 focus-ring"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => removeVariant(v.id)} className="font-mono text-xs uppercase text-danger hover:underline focus-ring">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-2">
            <input placeholder="Size (e.g. M)" value={newVariant.size} onChange={e => setNewVariant(v => ({ ...v, size: e.target.value }))} className="w-24 bg-surface border border-line px-2 py-2 focus-ring text-sm" />
            <input placeholder="Color" value={newVariant.color} onChange={e => setNewVariant(v => ({ ...v, color: e.target.value }))} className="w-28 bg-surface border border-line px-2 py-2 focus-ring text-sm" />
            <input placeholder="SKU" value={newVariant.sku} onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))} className="w-28 bg-surface border border-line px-2 py-2 focus-ring text-sm" />
            <input type="number" placeholder="Stock" value={newVariant.stock} onChange={e => setNewVariant(v => ({ ...v, stock: e.target.value }))} className="w-20 bg-surface border border-line px-2 py-2 focus-ring text-sm" />
            <button onClick={addVariant} className="border border-line font-mono uppercase text-xs tracking-widest px-4 hover:border-accent focus-ring">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}
