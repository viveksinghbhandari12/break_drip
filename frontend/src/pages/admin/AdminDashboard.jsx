import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => setStats(null));
  }, []);

  if (!stats) return <p className="text-dim font-mono text-sm">Loading…</p>;

  const cards = [
    { label: 'Revenue (paid orders)', value: `$${Number(stats.revenue).toFixed(2)}` },
    { label: 'Paid orders', value: stats.order_count },
    { label: 'Pending orders', value: stats.pending_count },
    { label: 'Active products', value: stats.product_count }
  ];

  return (
    <div>
      <h1 className="font-display text-3xl uppercase mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {cards.map(c => (
          <div key={c.label} className="border border-line p-4">
            <div className="font-mono text-xs uppercase tracking-widest text-dim mb-2">{c.label}</div>
            <div className="font-display text-2xl">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-lg uppercase mb-4">Low stock</h2>
          {stats.low_stock.length === 0 ? (
            <p className="text-dim font-mono text-sm">Nothing running low.</p>
          ) : (
            <ul className="divide-y divide-line border-t border-b border-line">
              {stats.low_stock.map(v => (
                <li key={v.id} className="py-3 flex justify-between text-sm">
                  <span>{v.product_name} — {v.size}</span>
                  <span className={`font-mono ${v.stock === 0 ? 'text-danger' : 'text-accent'}`}>{v.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-display text-lg uppercase mb-4">Recent orders</h2>
          <ul className="divide-y divide-line border-t border-b border-line">
            {stats.recent_orders.map(o => (
              <li key={o.id} className="py-3 flex justify-between text-sm">
                <Link to="/admin/orders" className="hover:text-accent focus-ring">#{o.id} — {o.customer_name}</Link>
                <span className="font-mono">${Number(o.total).toFixed(2)} <span className="text-dim uppercase text-xs ml-2">{o.status}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
