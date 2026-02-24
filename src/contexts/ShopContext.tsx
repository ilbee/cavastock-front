import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useShops } from '../api/shops';
import { useAuth } from './AuthContext';
import type { Shop } from '../types';

interface ShopContextValue {
  shops: Shop[];
  selectedShop: Shop | null;
  selectShop: (shopId: string) => void;
  isLoading: boolean;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { data: shops = [], isLoading } = useShops(isAuthenticated);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(
    () => localStorage.getItem('selectedShopId'),
  );

  const selectedShop = shops.find((s) => s.id === selectedShopId) ?? shops[0] ?? null;

  useEffect(() => {
    if (shops.length > 0 && !selectedShopId) {
      setSelectedShopId(shops[0].id);
      localStorage.setItem('selectedShopId', shops[0].id);
    }
  }, [shops, selectedShopId]);

  const selectShop = useCallback((shopId: string) => {
    setSelectedShopId(shopId);
    localStorage.setItem('selectedShopId', shopId);
  }, []);

  return (
    <ShopContext.Provider value={{ shops, selectedShop, selectShop, isLoading }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
