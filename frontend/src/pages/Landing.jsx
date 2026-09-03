import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard.jsx';

export default function Landing() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/products?sort=featured&limit=8')
      .then(res => setFeatured(res.data.products))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <div>
      {/* Hero — drop sheet, not a template hero */}
      <section className="border-b border-line">
        <div className="max-w-7xl mx-auto px-5 py-10 md:py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
              Manifest — Drop 004 / Released 08.2026
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] uppercase">
              Break the
              <br />
              pattern.
            </h1>
            <p className="mt-6 text-dim max-w-md">
              Twelve pieces. No restock. Every drop ships numbered and logged —
              once it's gone from the manifest, it's gone.
            </p>
            <div className="mt-8 flex gap-4">
              <Link to="/shop" className="bg-accent text-bg font-mono uppercase text-xs tracking-widest px-6 py-3 hover:bg-ink transition-colors focus-ring">
                Shop the drop
              </Link>
              <Link to="/shop?category=hoodies" className="border border-line font-mono uppercase text-xs tracking-widest px-6 py-3 hover:border-accent transition-colors focus-ring">
                Hoodies
              </Link>
            </div>
          </div>
          <div className="aspect-[4/5] bg-surface border border-line flex items-center justify-center relative overflow-hidden">
            <span className="font-display text-[10rem] text-line select-none">04</span>
            <span className="absolute bottom-4 right-4 font-mono text-xs text-dim uppercase tracking-widest">
              Drop 004 / Static Series
            </span>
          </div>
        </div>
      </section>

      {/* Manifest strip — real info, not decoration */}
      <section className="border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs uppercase tracking-widest text-dim">
          <div>Pieces released <span className="text-ink">12</span></div>
          <div>Shipping <span className="text-ink">Worldwide</span></div>
          <div>Restocks <span className="text-ink">Never</span></div>
          <div>Returns <span className="text-ink">14 Days</span></div>
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-5 py-14">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-display text-2xl uppercase">Currently on the manifest</h2>
          <Link to="/shop" className="font-mono text-xs uppercase tracking-widest text-accent hover:underline focus-ring">
            View all →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="text-dim font-mono text-sm">
            No products loaded — start the backend and seed the database to see live inventory here.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
