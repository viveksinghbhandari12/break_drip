import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard.jsx';

const CATEGORIES = ['hoodies', 'tees', 'outerwear', 'bottoms', 'accessories'];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = params.get('category') || '';
  const sort = params.get('sort') || '';
  const search = params.get('search') || '';

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (sort) query.set('sort', sort);
    if (search) query.set('search', search);

    api.get(`/products?${query.toString()}`)
      .then(res => setProducts(res.data.products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, sort, search]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl uppercase mb-8">Shop</h1>

      <div className="flex flex-wrap gap-3 mb-8 font-mono text-xs uppercase tracking-widest">
        <button onClick={() => updateParam('category', '')} className={`px-3 py-1.5 border ${!category ? 'border-accent text-accent' : 'border-line text-dim'} focus-ring`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => updateParam('category', c)} className={`px-3 py-1.5 border ${category === c ? 'border-accent text-accent' : 'border-line text-dim'} focus-ring`}>
            {c}
          </button>
        ))}
        <select
          value={sort}
          onChange={e => updateParam('sort', e.target.value)}
          className="ml-auto bg-surface border border-line px-3 py-1.5 text-ink focus-ring"
        >
          <option value="">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="featured">Featured</option>
        </select>
      </div>

      {loading ? (
        <p className="text-dim font-mono text-sm">Loading manifest…</p>
      ) : products.length === 0 ? (
        <p className="text-dim font-mono text-sm">No products found. Make sure the backend is running and seeded.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
