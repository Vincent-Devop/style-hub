import { useEffect, useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatKES, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STAGES = ["PENDING_PAYMENT","PAYMENT_UNDER_REVIEW","PAID","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("ALL");

  const refresh = useCallback(async () => {
    let q = supabase
      .from("orders")
      .select("*, order_items(*), profile:profiles!orders_user_id_fkey(display_name, phone)")
      .order("created_at", { ascending: false });
    if (filter !== "ALL") q = q.eq("status", filter as any);
    const { data } = await q;
    setOrders(data || []);
  }, [filter]);

  useEffect(() => {
    document.title = "Admin · Orders";
    refresh();
    const t = setInterval(refresh, 8000);
    return () => clearInterval(t);
  }, [refresh]);

  const updateStatus = async (id: string, status: typeof STAGES[number]) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked ${status.split("_").join(" ")}`); refresh(); }
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-4xl mb-6">Orders</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {["ALL", ...STAGES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1.5 text-xs font-display tracking-wider uppercase border",
              filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"
            )}
          >
            {s.split("_").join(" ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {orders.length === 0 && <div className="text-center py-10 text-muted-foreground">No orders.</div>}
        {orders.map((o) => (
          <div key={o.id} className={cn(
            "bg-card border rounded-sm p-5",
            o.status === "PAYMENT_UNDER_REVIEW" ? "border-primary shadow-neon" : "border-border"
          )}>
            <div className="flex flex-wrap justify-between gap-3 mb-3">
              <div>
                <div className="font-display text-lg">#{o.id.slice(0,8).toUpperCase()}</div>
                <div className="text-xs text-muted-foreground">{formatDateTime(o.created_at)}</div>
                <div className="text-sm mt-1">{o.profile?.display_name} · {o.shipping_phone}</div>
              </div>
              <div className="text-right">
                <div className="text-primary font-bold text-lg">{formatKES(Number(o.total_amount))}</div>
                <div className="text-xs uppercase tracking-widest font-display">{o.status.replaceAll("_", " ")}</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1 mb-3">
              {o.order_items?.map((it: any) => (
                <div key={it.id}>· {it.quantity}× {it.product_name}{it.variant_label ? ` (${it.variant_label})` : ""}</div>
              ))}
              {o.shipping_address && <div className="mt-1 italic">Ship to: {o.shipping_address}</div>}
            </div>

            {o.transaction_code && (
              <div className="bg-secondary p-3 rounded-sm text-sm mb-3">
                <span className="text-muted-foreground">M-Pesa code: </span>
                <span className="font-mono text-primary">{o.transaction_code}</span>
                <span className="text-muted-foreground"> · phone: {o.payment_phone}</span>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {o.status === "PAYMENT_UNDER_REVIEW" && (
                <Button size="sm" variant="hero" onClick={() => updateStatus(o.id, "PAID")}>
                  <CheckCircle2 className="size-4" /> Confirm payment
                </Button>
              )}
              {o.status === "PAID" && <Button size="sm" onClick={() => updateStatus(o.id, "PROCESSING")}>Mark processing</Button>}
              {o.status === "PROCESSING" && <Button size="sm" onClick={() => updateStatus(o.id, "SHIPPED")}>Mark shipped</Button>}
              {o.status === "SHIPPED" && <Button size="sm" onClick={() => updateStatus(o.id, "DELIVERED")}>Mark delivered</Button>}
              {!["DELIVERED","CANCELLED"].includes(o.status) && (
                <Button size="sm" variant="ghost" onClick={() => updateStatus(o.id, "CANCELLED")}>Cancel</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrders;
