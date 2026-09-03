import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const TICKER_ITEMS = [
  'STATIC HOODIE — 4 LEFT IN S',
  'VOIDSHELL JACKET — LOW STOCK',
  'DROP 004 — LIVE NOW',
  'RIOT TEE — RESTOCKED',
  'CARGO STATIC PANTS — 34 SELLING FAST'
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-line">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-xl tracking-tight">
          BREAK<span className="text-accent">&amp;</span>DRIP
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest">
          <Link to="/shop" className="hover:text-accent focus-ring">Shop</Link>
          <Link to="/shop?category=hoodies" className="hover:text-accent focus-ring">Hoodies</Link>
          <Link to="/shop?category=outerwear" className="hover:text-accent focus-ring">Outerwear</Link>
          {user && <Link to="/wishlist" className="hover:text-accent focus-ring">Wishlist</Link>}
        </nav>

        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-widest">
          {user ? (
            <>  
              <Link to="/account" className="hover:text-accent focus-ring">{user.name.split(' ')[0]}</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="hover:text-accent focus-ring">Admin</Link>
              )}
              <button onClick={() => { logout(); navigate('/'); }} className="hover:text-danger focus-ring">
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:text-accent focus-ring">Log in</Link>
          )}
          <Link to="/cart" className="relative hover:text-accent focus-ring">
            Cart
            {count > 0 && (
              <span className="absolute -top-3 -right-4 bg-accent text-bg text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="overflow-hidden border-t border-line bg-surface">
        <div className="flex whitespace-nowrap animate-ticker font-mono text-[11px] tracking-widest text-accent py-1.5">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} className="mx-6">{t}</span>
          ))}
        </div>
      </div>
    </header>
  );
}
