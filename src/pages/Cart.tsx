import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatKES } from "@/lib/format";

const Cart = () => {
  const { items, total, count, updateQty, removeItem, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="container-x mx-auto py-20 text-center text-muted-foreground">Loading cart…</div>;
  }

  if (!user) {
    return (
      <div className="container-x mx-auto py-20 text-center">
        <h1 className="font-display text-4xl mb-4">Login required</h1>
        <p className="text-muted-foreground mb-6">Sign in to view your cart and check out.</p>
        <Button asChild variant="hero"><Link to="/login">Login</Link></Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-x mx-auto py-20 text-center">
        <ShoppingBag className="size-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="font-display text-4xl mb-4">Your cart is empty</h1>
        <Button asChild variant="hero"><Link to="/shop">Start shopping</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-x mx-auto py-10">
      <h1 className="font-display text-5xl mb-8">Your Cart ({count})</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {items.map((it) => {
            const price = it.product.on_offer && it.product.discount_price
              ? Number(it.product.discount_price) : Number(it.product.price);
            return (
              <div key={it.id} className="flex gap-4 bg-card border border-border rounded-sm p-3">
                <Link to={`/product/${it.product.id}`} className="w-24 h-24 bg-secondary shrink-0">
                  {it.product.images[0] && (
                    <img src={it.product.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${it.product.id}`} className="font-display text-lg tracking-wide line-clamp-1">
                    {it.product.name}
                  </Link>
                  {it.variant && (
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {[it.variant.size, it.variant.color].filter(Boolean).join(" / ")}
                    </div>
                  )}
                  <div className="text-primary font-bold mt-1">{formatKES(price)}</div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeItem(it.id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                  <div className="flex border border-border rounded-sm">
                    <button onClick={() => updateQty(it.id, it.quantity - 1)} className="px-3 py-1 hover:bg-secondary">−</button>
                    <div className="px-3 py-1 border-x border-border min-w-[40px] text-center">{it.quantity}</div>
                    <button onClick={() => updateQty(it.id, it.quantity + 1)} className="px-3 py-1 hover:bg-secondary">+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="bg-card border border-border rounded-sm p-6 h-fit sticky top-24">
          <h2 className="font-display text-2xl mb-4">Summary</h2>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatKES(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">Calculated next</span>
            </div>
          </div>
          <div className="border-t border-border pt-4 flex justify-between mb-4">
            <span className="font-display text-lg">Total</span>
            <span className="font-display text-2xl text-primary">{formatKES(total)}</span>
          </div>
          <Button variant="hero" size="lg" className="w-full" onClick={() => navigate("/checkout")}>
            Checkout
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
