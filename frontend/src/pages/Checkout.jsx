import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { user } = useAuth();
  const { subtotal, refresh } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const couponCode = location.state?.couponCode || null;

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ line1: '', line2: '', city: '', state: '', postal_code: '', country: 'India' });
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api.get('/addresses').then(res => {
      setAddresses(res.data.addresses);
      const def = res.data.addresses.find(a => a.is_default) || res.data.addresses[0];
      if (def) setSelectedId(def.id);
      else setShowForm(true);
    });
  }, []);

  async function saveAddress(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/addresses', { ...form, is_default: addresses.length === 0 });
      const updated = await api.get('/addresses');
      setAddresses(updated.data.addresses);
      setSelectedId(res.data.id);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save address');
    }
  }

  async function handlePayment() {
    if (!selectedId) { setError('Select or add a shipping address first'); return; }
    setError('');
    setPlacing(true);

    try {
      // Step 1: ask our backend to create the order + a matching Razorpay order
      const { data } = await api.post('/checkout/create-order', {
        shipping_address_id: selectedId,
        coupon_code: couponCode
      });

      // Step 2: open Razorpay's hosted payment modal (loaded via index.html script tag)
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'BREAK & DRIP',
        description: `Order #${data.order_id}`,
        order_id: data.razorpay_order_id,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#D7FF3F' },
        handler: async function (response) {
          // Step 3: Razorpay's success callback only PROVES the modal closed successfully --
          // it is not proof of payment on its own. We must verify the signature server-side.
          try {
            const verifyRes = await api.post('/checkout/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            await refresh(); // cart was cleared server-side, sync local state
            navigate(`/order/success?order_id=${verifyRes.data.order_id}`);
          } catch {
            navigate(`/order/success?order_id=${data.order_id}`); // still poll for webhook confirmation
          }
        },
        modal: {
          ondismiss: function () {
            setPlacing(false); // user closed the modal without paying
          }
        }
      });

      rzp.on('payment.failed', function () {
        setError('Payment failed. You can try again.');
        setPlacing(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start checkout');
      setPlacing(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-10">
      <h1 className="font-display text-3xl uppercase mb-8">Checkout</h1>

      <h2 className="font-mono text-xs uppercase tracking-widest text-dim mb-3">Shipping address</h2>

      {addresses.length > 0 && !showForm && (
        <div className="space-y-3 mb-4">
          {addresses.map(a => (
            <label key={a.id} className={`block border px-4 py-3 cursor-pointer ${selectedId === a.id ? 'border-accent' : 'border-line'}`}>
              <input type="radio" name="address" className="mr-2" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} />
              <span className="text-sm">
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}{a.state ? `, ${a.state}` : ''} {a.postal_code}, {a.country}
              </span>
            </label>
          ))}
          <button onClick={() => setShowForm(true)} className="font-mono text-xs uppercase tracking-widest text-accent underline focus-ring">
            + Add a different address
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={saveAddress} className="space-y-3 mb-6">
          <input placeholder="Address line 1" required value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} className="w-full bg-surface border border-line px-3 py-2.5 focus-ring" />
          <input placeholder="Address line 2 (optional)" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} className="w-full bg-surface border border-line px-3 py-2.5 focus-ring" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="City" required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="bg-surface border border-line px-3 py-2.5 focus-ring" />
            <input placeholder="State" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="bg-surface border border-line px-3 py-2.5 focus-ring" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Postal code" required value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} className="bg-surface border border-line px-3 py-2.5 focus-ring" />
            <input placeholder="Country" required value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} className="bg-surface border border-line px-3 py-2.5 focus-ring" />
          </div>
          <button type="submit" className="border border-line font-mono uppercase text-xs tracking-widest px-5 py-2.5 hover:border-accent focus-ring">
            Save address
          </button>
        </form>
      )}

      <div className="font-mono text-sm space-y-1 border-t border-line pt-4 mb-6">
        <div className="flex justify-between"><span className="text-dim">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
        {couponCode && <div className="flex justify-between text-accent"><span>Coupon {couponCode}</span><span>applied at payment</span></div>}
        <p className="text-dim text-xs">Final total (after any discount) is confirmed on the payment screen.</p>
      </div>

      {error && <p className="text-danger font-mono text-xs mb-4">{error}</p>}

      <button
        onClick={handlePayment}
        disabled={placing || !selectedId}
        className="w-full bg-accent text-bg font-mono uppercase text-xs tracking-widest px-6 py-4 hover:bg-ink transition-colors disabled:opacity-50 focus-ring"
      >
        {placing ? 'Opening payment…' : 'Pay with Razorpay'}
      </button>
    </div>
  );
}
