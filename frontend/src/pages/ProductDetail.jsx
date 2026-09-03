import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [status, setStatus] = useState('');
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    api.get(`/products/${slug}`).then(res => {
      setProduct(res.data.product);
      setSelectedVariant(res.data.product.variants?.[0] || null);
    });
    api.get(`/reviews/${slug}`).catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (product) {
      api.get(`/reviews/${product.id}`).then(res => setReviews(res.data.reviews)).catch(() => {});
    }
  }, [product]);

  async function handleAddToCart() {
    if (!user) return navigate('/login');
    if (!selectedVariant || selectedVariant.stock < 1) return;
    setStatus('adding');
    try {
      await addItem(selectedVariant.id, 1);
      setStatus('added');
    } catch {
      setStatus('error');
    }
  }

  async function toggleWishlist() {
    if (!user) return navigate('/login');
    try {
      if (inWishlist) {
        await api.delete(`/wishlist/${product.id}`);
        setInWishlist(false);
      } else {
        await api.post(`/wishlist/${product.id}`);
        setInWishlist(true);
      }
    } catch {}
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      await api.post(`/reviews/${product.id}`, reviewForm);
      const res = await api.get(`/reviews/${product.id}`);
      setReviews(res.data.reviews);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    }
  }

  if (!product) return <div className="max-w-7xl mx-auto px-5 py-16 text-dim font-mono text-sm">Loading…</div>;

  const onSale = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 grid md:grid-cols-2 gap-12">
      <div className="aspect-[4/5] bg-surface border border-line overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dim font-mono text-xs">NO IMAGE</div>
        )}
      </div>

      <div>
        {product.drop_name && (
          <div className="font-mono text-xs uppercase tracking-widest text-accent mb-2">{product.drop_name}</div>
        )}
        <h1 className="font-display text-3xl uppercase mb-3">{product.name}</h1>
        <div className="font-mono text-lg mb-6">
          <span className={onSale ? 'text-danger' : ''}>${Number(product.price).toFixed(2)}</span>
          {onSale && <span className="ml-3 text-dim line-through">${Number(product.compare_at_price).toFixed(2)}</span>}
        </div>
        <p className="text-dim mb-8">{product.description}</p>

        <div className="mb-6">
          <div className="font-mono text-xs uppercase tracking-widest text-dim mb-2">Size / Variant</div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map(v => (
              <button
                key={v.id}
                disabled={v.stock < 1}
                onClick={() => setSelectedVariant(v)}
                className={`px-4 py-2 border font-mono text-xs uppercase focus-ring
                  ${selectedVariant?.id === v.id ? 'border-accent text-accent' : 'border-line'}
                  ${v.stock < 1 ? 'opacity-30 cursor-not-allowed line-through' : 'hover:border-accent'}`}
              >
                {v.size}
              </button>
            ))}
          </div>
          {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
            <p className="text-danger font-mono text-xs mt-2">Only {selectedVariant.stock} left</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock < 1}
            className="flex-1 bg-accent text-bg font-mono uppercase text-xs tracking-widest px-6 py-3 hover:bg-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-ring"
          >
            {selectedVariant?.stock < 1 ? 'Sold out' : status === 'added' ? 'Added ✓' : 'Add to cart'}
          </button>
          <button onClick={toggleWishlist} className="border border-line px-4 hover:border-accent focus-ring font-mono text-xs uppercase">
            {inWishlist ? '♥' : '♡'}
          </button>
        </div>

        {/* Reviews */}
        <div className="mt-14 border-t border-line pt-8">
          <h2 className="font-display text-xl uppercase mb-4">
            Reviews {product.review_count > 0 && `(${product.review_count} · ${Number(product.avg_rating).toFixed(1)}★)`}
          </h2>

          {reviews.length === 0 ? (
            <p className="text-dim font-mono text-sm mb-6">No reviews yet.</p>
          ) : (
            <ul className="space-y-4 mb-8">
              {reviews.map(r => (
                <li key={r.id} className="border-b border-line pb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-accent">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    <span className="font-medium">{r.user_name}</span>
                  </div>
                  {r.comment && <p className="text-dim text-sm mt-1">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}

          {user ? (
            <form onSubmit={submitReview} className="space-y-3">
              <select
                value={reviewForm.rating}
                onChange={e => setReviewForm(f => ({ ...f, rating: Number(e.target.value) }))}
                className="bg-surface border border-line px-3 py-2 focus-ring"
              >
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
              </select>
              <textarea
                placeholder="Write a review…"
                value={reviewForm.comment}
                onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                className="w-full bg-surface border border-line px-3 py-2 focus-ring"
                rows={3}
              />
              <button type="submit" className="border border-line font-mono uppercase text-xs tracking-widest px-5 py-2.5 hover:border-accent focus-ring">
                Submit review
              </button>
            </form>
          ) : (
            <p className="text-dim font-mono text-sm">
              <button onClick={() => navigate('/login')} className="underline">Log in</button> to leave a review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
