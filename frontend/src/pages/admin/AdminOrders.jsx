import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

function formatAddress(o) {
  if (!o.line1) return null;
  const parts = [
    o.line1,
    o.line2,
    [o.city, o.state].filter(Boolean).join(', '),
    o.postal_code,
    o.country
  ].filter(Boolean);
  return parts.join(', ');
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/orders/admin/all').then(res => setOrders(res.data.orders)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(orderId, status) {
    await api.put(`/orders/${orderId}/status`, { status });
    setOrders(o => o.map(x => x.id === orderId ? { ...x, status } : x));
  }

  return (
    <div>
      <h1 className="font-display text-3xl uppercase mb-8">Orders</h1>

      {loading ? (
        <p className="text-dim font-mono text-sm">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-dim font-mono text-sm">No orders yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-xs uppercase tracking-widest text-dim">
              <th className="py-2">Order</th>
              <th className="py-2">Customer</th>
              <th className="py-2">Shipping to</th>
              <th className="py-2">Total</th>
              <th className="py-2">Date</th>
              <th className="py-2">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map(o => {
              const address = formatAddress(o);
              return (
                <tr key={o.id}>
                  <td className="py-3">#{o.id}</td>
                  <td className="py-3">
                    <div>{o.customer_name}</div>
                    <div className="text-dim text-xs">{o.customer_email}</div>
                  </td>
                  <td className="py-3 max-w-[220px]">
                    {address ? (
                      <span className="text-dim text-xs" title={address}>
                        {o.city}{o.state ? `, ${o.state}` : ''}, {o.country}
                      </span>
                    ) : (
                      <span className="text-dim text-xs italic">
                        {o.status === 'pending' ? 'awaiting payment' : 'no address on file'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-mono">${Number(o.total).toFixed(2)}</td>
                  <td className="py-3 text-dim text-xs font-mono">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <select
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                      className="bg-surface border border-line px-2 py-1.5 font-mono text-xs uppercase focus-ring"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-3 text-right">
                    <Link to={`/order/${o.id}`} className="font-mono text-xs uppercase text-accent hover:underline focus-ring">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}