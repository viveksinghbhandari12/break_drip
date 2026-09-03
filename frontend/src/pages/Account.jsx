import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data.orders)).catch(() => setOrders([]));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl uppercase mb-2">Account</h1>
      <p className="text-dim font-mono text-sm mb-10">{user.name} · {user.email}</p>

      <h2 className="font-display text-xl uppercase mb-4">Order history</h2>
      {orders.length === 0 ? (
        <p className="text-dim font-mono text-sm">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-b border-line">
          {orders.map(o => (
            <li key={o.id} className="py-4 flex items-center justify-between">
              <div>
                <Link to={`/order/${o.id}`} className="font-medium hover:text-accent focus-ring">Order #{o.id}</Link>
                <div className="text-dim text-xs font-mono">{new Date(o.created_at).toLocaleDateString()}</div>
              </div>
              <div className="text-right font-mono text-sm">
                <div>${Number(o.total).toFixed(2)}</div>
                <div className={`text-xs uppercase ${o.status === 'paid' ? 'text-accent' : 'text-dim'}`}>{o.status}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
