import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then(res => setOrder(res.data.order)).catch(() => setOrder(null));
  }, [id]);

  if (!order) return <div className="max-w-3xl mx-auto px-5 py-16 text-dim font-mono text-sm">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl uppercase mb-2">Order #{order.id}</h1>
      <p className={`font-mono text-xs uppercase tracking-widest mb-8 ${order.status === 'paid' ? 'text-accent' : 'text-dim'}`}>
        {order.status}
      </p>

      <ul className="divide-y divide-line border-t border-b border-line mb-8">
        {order.items.map(item => (
          <li key={item.id} className="py-4 flex justify-between">
            <div>
              <div className="font-medium">{item.product_name}</div>
              <div className="text-dim text-xs font-mono">Size {item.size} · Qty {item.quantity}</div>
            </div>
            <div className="font-mono text-sm">${(Number(item.unit_price) * item.quantity).toFixed(2)}</div>
          </li>
        ))}
      </ul>

      <div className="font-mono text-sm space-y-1 mb-8">
        <div className="flex justify-between"><span className="text-dim">Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
        {order.discount > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>-${Number(order.discount).toFixed(2)}</span></div>}
        <div className="flex justify-between text-lg pt-2 border-t border-line"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
      </div>

      <div className="border-t border-line pt-6">
        <h2 className="font-mono text-xs uppercase tracking-widest text-dim mb-3">Shipping to</h2>
        {order.address ? (
          <address className="not-italic text-sm leading-relaxed">
            {order.address.line1}<br />
            {order.address.line2 && <>{order.address.line2}<br /></>}
            {order.address.city}{order.address.state ? `, ${order.address.state}` : ''} {order.address.postal_code}<br />
            {order.address.country}
          </address>
        ) : (
          <p className="text-dim font-mono text-sm">
            {order.status === 'paid' ? 'No shipping address on file.' : 'Shipping address will appear here once payment is confirmed.'}
          </p>
        )}
      </div>
    </div>
  );
}
