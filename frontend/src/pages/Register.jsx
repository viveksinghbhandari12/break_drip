import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/account');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="max-w-sm mx-auto px-5 py-16">
      <h1 className="font-display text-2xl uppercase mb-8">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Name" required
          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full bg-surface border border-line px-3 py-2.5 focus-ring"
        />
        <input
          type="email" placeholder="Email" required
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="w-full bg-surface border border-line px-3 py-2.5 focus-ring"
        />
        <input
          type="password" placeholder="Password (min 8 characters)" required minLength={8}
          value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="w-full bg-surface border border-line px-3 py-2.5 focus-ring"
        />
        {error && <p className="text-danger font-mono text-xs">{error}</p>}
        <button type="submit" className="w-full bg-accent text-bg font-mono uppercase text-xs tracking-widest px-6 py-3 hover:bg-ink transition-colors focus-ring">
          Create account
        </button>
      </form>
      <p className="text-dim font-mono text-xs mt-6">
        Already have an account? <Link to="/login" className="text-accent underline">Log in</Link>
      </p>
    </div>
  );
}
