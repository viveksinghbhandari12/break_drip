import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';

// In the normal path, Checkout.jsx already calls /checkout/verify and only
// navigates here once that succeeds -- so status is usually already "paid".
// This poll is a safety net for the case where the browser tab closed or
// verify() failed but the Razorpay webhook still lands moments later.
export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('order_id');
  const [status, setStatus] = useState('checking'); // checking | paid | pending | error
  const attempts = useRef(0);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await api.get(`/orders/${orderId}/status`);
        if (cancelled) return;
        if (res.data.status === 'paid') {
          setStatus('paid');
          return;
        }
        attempts.current += 1;
        if (attempts.current < 8) {
          setTimeout(poll, 1500); // retry for up to ~12s
        } else {
          setStatus('pending'); // webhook is just slow -- not necessarily wrong
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <div className="max-w-md mx-auto px-5 py-24 text-center">
      {status === 'paid' && (
        <>
          <div className="font-display text-6xl text-accent mb-4">&#10003;</div>
          <h1 className="font-display text-2xl uppercase mb-3">Order confirmed</h1>
          <p className="text-dim font-mono text-sm mb-8">
            Order #{orderId} is paid and logged. You'll get a shipping notification once it leaves the warehouse.
          </p>
        </>
      )}

      {status === 'checking' && (
        <>
          <div className="font-display text-4xl text-dim mb-4">&hellip;</div>
          <h1 className="font-display text-2xl uppercase mb-3">Confirming payment</h1>
          <p className="text-dim font-mono text-sm mb-8">
            Finalizing your order -- this usually takes a couple of seconds.
          </p>
        </>
      )}

      {status === 'pending' && (
        <>
          <h1 className="font-display text-2xl uppercase mb-3">Almost there</h1>
          <p className="text-dim font-mono text-sm mb-8">
            Your payment may have gone through, but we're still waiting on final confirmation.
            Check your order page in a minute -- it'll update automatically.
          </p>
        </>
      )}

      {status === 'error' && (
        <p className="text-danger font-mono text-sm mb-8">
          Couldn't check order status. If you were charged, your order will still be recorded -- check your account.
        </p>
      )}

      <Link to={`/order/${orderId}`} className="text-accent underline font-mono text-xs uppercase tracking-widest">
        View order
      </Link>
    </div>
  );
}
