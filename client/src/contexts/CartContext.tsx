import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type CartItem = {
  cartId: string;
  productId: number;
  productName: string;
  imageUrl?: string;
  variationId?: number | null;
  variationName?: string | null;
  variationPrice?: number;
  addonIds: number[];
  addonNames: string[];
  addonPrices: number[];
  accompanimentSelections: { accompanimentId: number; label: string; selected: string[] }[];
  quantity: number;
  unitPrice: number;
  notes?: string;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, "cartId">) => void;
  remove: (cartId: string) => void;
  setQuantity: (cartId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "churraspaoo-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const add = (item: Omit<CartItem, "cartId">) => {
      const newItem: CartItem = { ...item, cartId: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
      setItems((prev) => [...prev, newItem]);
      toast.success("Adicionado ao seu Churraspão 🔥", {
        description: item.productName,
      });
    };
    const remove = (cartId: string) => setItems((prev) => prev.filter((i) => i.cartId !== cartId));
    const setQuantity = (cartId: string, qty: number) =>
      setItems((prev) =>
        qty <= 0 ? prev.filter((i) => i.cartId !== cartId) : prev.map((i) => (i.cartId === cartId ? { ...i, quantity: qty } : i)),
      );
    const clear = () => setItems([]);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = Math.round(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 100) / 100;
    return { items, add, remove, setQuantity, clear, count, subtotal };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/** Preço final unitário do item considerando variação e adicionais. */
export function itemUnitPrice(item: Pick<CartItem, "unitPrice" | "variationPrice" | "addonPrices">): number {
  const addons = item.addonPrices.reduce((s, p) => s + p, 0);
  const base = item.variationPrice != null ? item.variationPrice : item.unitPrice;
  return Math.round((base + addons) * 100) / 100;
}
