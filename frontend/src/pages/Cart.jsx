import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Cart() {
  const { items, subtotal, updateItem, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  async function applyCoupon() {
    setCouponError('');
    try {
      const res = await api.post('/coupons/validate', { code: couponInput, subtotal });
      setCoupon(res.data);
    } catch (err) {
      setCoupon(null);
      setCouponError(err.response?.data?.error || 'Invalid coupon');
    }
  }

  function handleCheckout() {
    if (!user) return navigate('/login');
    // Razorpay's modal doesn't collect a shipping address the way Stripe's hosted
    // page did, so address selection now happens on our own /checkout page first.
    navigate('/checkout', { state: { couponCode: coupon?.code || null } });
  }

  const discount = coupon?.discount || 0;
  const total = Math.max(subtotal - discount, 0);

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <h1 className="font-display text-3xl uppercase mb-8">Cart</h1>

      {items.length === 0 ? (
        <p className="text-dim font-mono text-sm">
          Your cart is empty. <Link to="/shop" className="text-accent underline">Go shopping →</Link>
        </p>
      ) : (
        <>
          <ul className="divide-y divide-line border-t border-b border-line mb-8">
            {items.map(item => (
              <li key={item.cart_item_id} className="py-4 flex items-center gap-4">
                <div className="w-20 h-24 bg-surface border border-line flex-shrink-0 overflow-hidden">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-dim text-sm font-mono">Size {item.size}</div>
                  <div className="font-mono text-sm mt-1">${Number(item.price).toFixed(2)}</div>
                </div>
                <input
                  type="number"
                  min={1}
                  max={item.stock}
                  value={item.quantity}
                  onChange={e => updateItem(item.cart_item_id, Number(e.target.value))}
                  className="w-16 bg-surface border border-line px-2 py-1 text-center focus-ring"
                />
                <button onClick={() => removeItem(item.cart_item_id)} className="text-dim hover:text-danger font-mono text-xs uppercase focus-ring">
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className="flex gap-3 mb-6">
            <input
              placeholder="Coupon code"
              value={couponInput}
              onChange={e => setCouponInput(e.target.value.toUpperCase())}
              className="flex-1 bg-surface border border-line px-3 py-2 focus-ring font-mono text-sm"
            />
            <button onClick={applyCoupon} className="border border-line px-5 font-mono text-xs uppercase tracking-widest hover:border-accent focus-ring">
              Apply
            </button>
          </div>
          {couponError && <p className="text-danger font-mono text-xs mb-4">{couponError}</p>}
          {coupon && <p className="text-accent font-mono text-xs mb-4">Coupon {coupon.code} applied — -${discount.toFixed(2)}</p>}

          <div className="font-mono text-sm space-y-1 mb-8">
            <div className="flex justify-between"><span className="text-dim">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discount > 0 && <div className="flex justify-between text-accent"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-lg pt-2 border-t border-line"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full bg-accent text-bg font-mono uppercase text-xs tracking-widest px-6 py-4 hover:bg-ink transition-colors focus-ring"
          >
            Continue to checkout
          </button>
        </>
      )}
    </div>
  );
}
