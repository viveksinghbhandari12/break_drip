import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' }
];

export default function AdminLayout() {
  return (
    <div className="max-w-7xl mx-auto px-5 py-10 grid md:grid-cols-[180px_1fr] gap-10">
      <nav className="flex md:flex-col gap-2 font-mono text-xs uppercase tracking-widest">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `px-3 py-2 border-l-2 focus-ring ${isActive ? 'border-accent text-accent' : 'border-line text-dim hover:text-ink'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div>
        <Outlet />
      </div>
    </div>
  );
}
