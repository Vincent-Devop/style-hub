import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    discount_price: number | null;
    on_offer: boolean;
    images: string[];
  };
  variant: { id: string; size: string | null; color: string | null } | null;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  addToCart: (productId: string, variantId: string | null, qty?: number) => Promise<void>;
  updateQty: (cartItemId: string, qty: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `id, product_id, variant_id, quantity,
         product:products(id, name, price, discount_price, on_offer, images),
         variant:product_variants(id, size, color)`
      )
      .eq("user_id", user.id);
    if (!error && data) setItems(data as any);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = async (productId: string, variantId: string | null, qty = 1) => {
    if (!user) {
      toast.error("Please log in to add to cart");
      return;
    }
    // upsert-ish: if same product+variant exists, bump quantity
    const existing = items.find(
      (i) => i.product_id === productId && i.variant_id === variantId
    );
    if (existing) {
      await updateQty(existing.id, existing.quantity + qty);
    } else {
      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: productId,
        variant_id: variantId,
        quantity: qty,
      });
      if (error) toast.error(error.message);
      else {
        toast.success("Added to cart");
        await refresh();
      }
    }
  };

  const updateQty = async (cartItemId: string, qty: number) => {
    if (qty < 1) return removeItem(cartItemId);
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: qty })
      .eq("id", cartItemId);
    if (error) toast.error(error.message);
    else await refresh();
  };

  const removeItem = async (cartItemId: string) => {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
    if (error) toast.error(error.message);
    else await refresh();
  };

  const clearCart = async () => {
    if (!user) return;
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    setItems([]);
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => {
    const price = i.product.on_offer && i.product.discount_price
      ? Number(i.product.discount_price)
      : Number(i.product.price);
    return s + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ items, count, total, loading, addToCart, updateQty, removeItem, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
