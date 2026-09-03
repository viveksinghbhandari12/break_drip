import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setItems(res.data.items);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  async function addItem(variantId, quantity = 1) {
    await api.post('/cart', { variant_id: variantId, quantity });
    await refresh();
  }

  async function updateItem(cartItemId, quantity) {
    await api.put(`/cart/${cartItemId}`, { quantity });
    await refresh();
  }

  async function removeItem(cartItemId) {
    await api.delete(`/cart/${cartItemId}`);
    await refresh();
  }

  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, loading, subtotal, count, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
