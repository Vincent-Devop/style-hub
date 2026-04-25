import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Package, Clock, CheckCircle2, Truck, Home as HomeIcon, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatKES, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; color: string; Icon: any }> = {
  PENDING_PAYMENT:       { label: "Pending Payment",        color: "text-warning",     Icon: Clock },
  PAYMENT_UNDER_REVIEW:  { label: "Payment Under Review",   color: "text-info",        Icon: Clock },
  PAID:                  { label: "Paid",                   color: "text-primary",     Icon: CheckCircle2 },
  PROCESSING:            { label: "Processing",             color: "text-primary",     Icon: Package },
  SHIPPED:               { label: "Shipped",                color: "text-primary",     Icon: Truck },
  DELIVERED:             { label: "Delivered",              color: "text-primary",     Icon: HomeIcon },
  CANCELLED:             { label: "Cancelled",              color: "text-destructive", Icon: XCircle },
};

const STAGES = ["PENDING_PAYMENT","PAYMENT_UNDER_REVIEW","PAID","PROCESSING","SHIPPED","DELIVERED"];

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    document.title = "My Orders · Jo Collections";
    refresh();
    const t = setInterval(refresh, 10000); // poll for updates
    return () => clearInterval(t);
  }, [refresh]);

  if (!user) {
    return (
      <div className="container-x mx-auto py-20 text-center">
        <p className="mb-4">Please log in to view your orders.</p>
        <Button asChild><Link to="/login">Login</Link></Button>
      </div>
    );
  }

  if (loading) return <div className="container-x mx-auto py-20 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="container-x mx-auto py-10">
      <h1 className="font-display text-5xl mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm">
          <Package className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No orders yet.</p>
          <Button asChild variant="hero"><Link to="/shop">Start shopping</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const meta = STATUS_META[o.status];
            const stageIdx = STAGES.indexOf(o.status);
            return (
              <div key={o.id} className="bg-card border border-border rounded-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="font-display text-lg tracking-wide">
                      Order #{o.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className={cn("font-display tracking-widest text-sm uppercase flex items-center gap-2", meta.color)}>
                      <meta.Icon className="size-4" /> {meta.label}
                    </div>
                    <div className="text-primary font-bold text-lg">{formatKES(Number(o.total_amount))}</div>
                  </div>
                </div>

                {/* progress bar */}
                {o.status !== "CANCELLED" && (
                  <div className="flex gap-1 mb-4">
                    {STAGES.map((s, i) => (
                      <div
                        key={s}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i <= stageIdx ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                )}

                <div className="text-sm space-y-1 mb-3">
                  {o.order_items?.map((it: any) => (
                    <div key={it.id} className="flex justify-between text-muted-foreground">
                      <span>{it.quantity}× {it.product_name}{it.variant_label ? ` (${it.variant_label})` : ""}</span>
                      <span>{formatKES(Number(it.unit_price) * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                {o.status === "PAYMENT_UNDER_REVIEW" && (
                  <div className="bg-info/10 border border-info/30 text-sm p-3 rounded-sm">
                    Awaiting admin confirmation of M-Pesa code <span className="font-mono">{o.transaction_code}</span>.
                  </div>
                )}
                {o.status === "PENDING_PAYMENT" && (
                  <Button asChild variant="hero" size="sm">
                    <Link to={`/payment/${o.id}`}>Complete payment</Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
