import { useEffect, useState } from 'react';
import api from '../api/client';
import ProductCard from '../components/ProductCard.jsx';

export default function Wishlist() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/wishlist').then(res => setItems(res.data.items)).catch(() => setItems([]));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl uppercase mb-8">Wishlist</h1>
      {items.length === 0 ? (
        <p className="text-dim font-mono text-sm">Nothing saved yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
