import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function AdminProducts() {
  const [view, setView] = useState('active'); // 'active' | 'deactivated'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function load() {
    setLoading(true);
    const endpoint = view === 'active' ? '/products?limit=100' : '/products/admin/deactivated/list';
    api.get(endpoint)
      .then(res => setProducts(res.data.products))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [view]);

  async function handleDelete(id) {
    if (!confirm('Deactivate this product? It will be hidden from the shop but stays in the database (order history keeps working).')) return;
    await api.delete(`/products/${id}`);
    load();
  }

  async function handleRestore(id) {
    await api.put(`/products/${id}/restore`);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl uppercase">Products</h1>
        <Link to="/admin/products/new" className="bg-accent text-bg font-mono uppercase text-xs tracking-widest px-5 py-2.5 hover:bg-ink focus-ring">
          + New product
        </Link>
      </div>

      <div className="flex gap-2 mb-6 font-mono text-xs uppercase tracking-widest">
        <button onClick={() => setView('active')} className={`px-3 py-1.5 border ${view === 'active' ? 'border-accent text-accent' : 'border-line text-dim'} focus-ring`}>
          Active
        </button>
        <button onClick={() => setView('deactivated')} className={`px-3 py-1.5 border ${view === 'deactivated' ? 'border-accent text-accent' : 'border-line text-dim'} focus-ring`}>
          Deactivated
        </button>
      </div>

      {loading ? (
        <p className="text-dim font-mono text-sm">Loading…</p>
      ) : products.length === 0 ? (
        <p className="text-dim font-mono text-sm">
          {view === 'active' ? 'No active products.' : 'Nothing deactivated.'}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-xs uppercase tracking-widest text-dim">
              <th className="py-2">Name</th>
              <th className="py-2">Category</th>
              <th className="py-2">Price</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map(p => (
              <tr key={p.id}>
                <td className="py-3">{p.name}</td>
                <td className="py-3 text-dim">{p.category_name || '—'}</td>
                <td className="py-3 font-mono">${Number(p.price).toFixed(2)}</td>
                <td className="py-3 text-right space-x-4">
                  {view === 'active' ? (
                    <>
                      <Link to={`/admin/products/${p.id}`} className="font-mono text-xs uppercase text-accent hover:underline focus-ring">Edit</Link>
                      <button onClick={() => handleDelete(p.id)} className="font-mono text-xs uppercase text-danger hover:underline focus-ring">Delete</button>
                    </>
                  ) : (
                    <>
                      <Link to={`/admin/products/${p.id}`} className="font-mono text-xs uppercase text-dim hover:underline focus-ring">View</Link>
                      <button onClick={() => handleRestore(p.id)} className="font-mono text-xs uppercase text-accent hover:underline focus-ring">Restore</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
