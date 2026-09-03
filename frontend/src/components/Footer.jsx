export default function Footer() {
  return (
    <footer className="border-t border-line mt-20">
      <div className="max-w-7xl mx-auto px-5 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="font-display text-lg mb-3">BREAK&amp;DRIP</div>
          <p className="text-dim text-sm">Independent streetwear. Small drops, no restocks.</p>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-dim mb-3">Shop</div>
          <ul className="space-y-2 text-sm">
            <li>Hoodies</li>
            <li>Tees</li>
            <li>Outerwear</li>
            <li>Accessories</li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-dim mb-3">Support</div>
          <ul className="space-y-2 text-sm">
            <li>Shipping</li>
            <li>Returns</li>
            <li>Size guide</li>
            <li>Contact</li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-dim mb-3">Follow</div>
          <ul className="space-y-2 text-sm">
            <li>Instagram</li>
            <li>TikTok</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-dim font-mono">
        © {new Date().getFullYear()} BREAK &amp; DRIP. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}
