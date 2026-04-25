import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/format";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  shipping_phone: z.string().trim().regex(/^(?:\+?254|0)?7\d{8}$/, "Enter a valid Kenyan phone number"),
  shipping_address: z.string().trim().min(5, "Address too short").max(500),
  notes: z.string().trim().max(500).optional(),
});

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="container-x mx-auto py-20 text-center">
        <h1 className="font-display text-4xl mb-4">Cart is empty</h1>
        <Button onClick={() => navigate("/shop")}>Back to shop</Button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ shipping_phone: phone, shipping_address: address, notes });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: total,
        status: "PENDING_PAYMENT",
        shipping_phone: parsed.data.shipping_phone,
        shipping_address: parsed.data.shipping_address,
        notes: parsed.data.notes,
      })
      .select()
      .single();

    if (error || !order) {
      toast.error(error?.message || "Failed to create order");
      setSubmitting(false);
      return;
    }

    const orderItems = items.map((it) => {
      const unit = it.product.on_offer && it.product.discount_price
        ? Number(it.product.discount_price) : Number(it.product.price);
      return {
        order_id: order.id,
        product_id: it.product_id,
        variant_id: it.variant_id,
        product_name: it.product.name,
        variant_label: it.variant ? [it.variant.size, it.variant.color].filter(Boolean).join(" / ") : null,
        unit_price: unit,
        quantity: it.quantity,
      };
    });
    const { error: itemErr } = await supabase.from("order_items").insert(orderItems);
    if (itemErr) {
      toast.error(itemErr.message);
      setSubmitting(false);
      return;
    }
    await clearCart();
    navigate(`/payment/${order.id}`);
  };

  return (
    <div className="container-x mx-auto py-10 grid lg:grid-cols-3 gap-8">
      <form onSubmit={submit} className="lg:col-span-2 space-y-5">
        <h1 className="font-display text-5xl mb-4">Checkout</h1>
        <div>
          <Label htmlFor="phone">Delivery phone</Label>
          <Input id="phone" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="address">Delivery address</Label>
          <Textarea id="address" rows={4} placeholder="Estate, street, building, landmark" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="notes">Order notes (optional)</Label>
          <Textarea id="notes" rows={2} placeholder="Anything we should know?" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <Button type="submit" variant="hero" size="lg" disabled={submitting}>
          {submitting ? "Creating order…" : "Continue to payment"}
        </Button>
      </form>

      <aside className="bg-card border border-border rounded-sm p-6 h-fit">
        <h2 className="font-display text-2xl mb-4">Order summary</h2>
        <div className="space-y-2 text-sm mb-4 max-h-[300px] overflow-auto">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between gap-2">
              <span className="line-clamp-1">{it.quantity}× {it.product.name}</span>
              <span className="text-muted-foreground shrink-0">
                {formatKES((it.product.on_offer && it.product.discount_price ? Number(it.product.discount_price) : Number(it.product.price)) * it.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-4 flex justify-between">
          <span className="font-display text-lg">Total</span>
          <span className="font-display text-2xl text-primary">{formatKES(total)}</span>
        </div>
      </aside>
    </div>
  );
};

export default Checkout;
