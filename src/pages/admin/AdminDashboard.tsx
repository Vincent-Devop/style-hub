import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/format";
import { Package, ShoppingCart, Clock, Users } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ orders: 0, pending: 0, revenue: 0, users: 0 });

  useEffect(() => {
    document.title = "Admin · Jo Collections";
    (async () => {
      const [{ count: orders }, { count: pending }, { data: paid }, { count: users }] = await Promise.all([
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "PAYMENT_UNDER_REVIEW"),
        supabase.from("orders").select("total_amount").in("status", ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        orders: orders || 0,
        pending: pending || 0,
        revenue: (paid || []).reduce((s, r) => s + Number(r.total_amount), 0),
        users: users || 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Total orders", value: stats.orders, Icon: ShoppingCart },
    { label: "Pending verification", value: stats.pending, Icon: Clock, accent: true },
    { label: "Revenue", value: formatKES(stats.revenue), Icon: Package },
    { label: "Customers", value: stats.users, Icon: Users },
  ];

  return (
    <div className="p-8">
      <h1 className="font-display text-4xl mb-8">Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-card border rounded-sm p-5 ${c.accent ? "border-primary shadow-neon" : "border-border"}`}
          >
            <c.Icon className={`size-5 mb-3 ${c.accent ? "text-primary" : "text-muted-foreground"}`} />
            <div className="text-2xl font-display">{c.value}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 p-5 bg-card border border-border rounded-sm">
        <h2 className="font-display text-xl mb-2">Quick actions</h2>
        <p className="text-sm text-muted-foreground">
          Use the sidebar to manage products, verify M-Pesa payments, update order status, moderate the community feed and respond to customer chats.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
