import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const onSale = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <Link to={`/product/${product.slug}`} className="group block focus-ring">
      <div className="relative aspect-[4/5] bg-surface border border-line overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dim font-mono text-xs">NO IMAGE</div>
        )}
        {product.drop_name && (
          <span className="absolute top-2 left-2 bg-bg/90 border border-accent text-accent text-[10px] font-mono uppercase tracking-widest px-2 py-1">
            {product.drop_name}
          </span>
        )}
        {onSale && (
          <span className="absolute top-2 right-2 bg-danger text-bg text-[10px] font-mono uppercase tracking-widest px-2 py-1">
            Sale
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-sm font-medium">{product.name}</h3>
      </div>
      <div className="mt-1 font-mono text-sm">
        <span className={onSale ? 'text-danger' : 'text-ink'}>${Number(product.price).toFixed(2)}</span>
        {onSale && <span className="ml-2 text-dim line-through">${Number(product.compare_at_price).toFixed(2)}</span>}
      </div>
    </Link>
  );
}
