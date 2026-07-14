"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Snapshot of a product at the moment it entered the cart (display only —
 * the server re-prices everything from the database at checkout). */
export interface CartItem {
  slug: string;
  nameAr: string;
  nameEn: string;
  priceBaisa: number;
  image: string;
  stock: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalBaisa: number;
  isOpen: boolean;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "shalwani-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const skipPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // corrupted storage — start clean
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/unavailable — cart still works in memory
    }
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === item.slug);
      if (existing) {
        return prev.map((i) =>
          i.slug === item.slug
            ? { ...i, ...item, quantity: Math.min(i.quantity + quantity, item.stock) }
            : i,
        );
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.stock) }];
    });
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((prev) =>
      quantity < 1
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) =>
            i.slug === slug ? { ...i, quantity: Math.min(quantity, i.stock) } : i,
          ),
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotalBaisa = items.reduce((n, i) => n + i.priceBaisa * i.quantity, 0);
    return {
      items,
      count,
      subtotalBaisa,
      isOpen,
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      clear,
      openCart,
      closeCart,
    };
  }, [items, isOpen, hydrated, addItem, setQuantity, removeItem, clear, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
