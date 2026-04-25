import { Outlet, NavLink, Link } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, MessageSquare, Users, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { to: "/admin/feed", label: "Feed", Icon: MessageSquare },
  { to: "/admin/chats", label: "Chats", Icon: Users },
];

export const AdminLayout = () => (
  <div className="min-h-screen flex">
    <aside className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col">
      <Link to="/" className="p-5 border-b border-sidebar-border">
        <div className="font-display text-xl tracking-wider text-sidebar-foreground">
          JO <span className="text-primary">ADMIN</span>
        </div>
      </Link>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-sm font-display tracking-wider text-sm uppercase",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )
            }
          >
            <n.Icon className="size-4" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <Link
        to="/"
        className="p-4 border-t border-sidebar-border text-sm text-sidebar-foreground hover:bg-sidebar-accent flex items-center gap-2"
      >
        <Home className="size-4" /> Back to store
      </Link>
    </aside>
    <main className="flex-1 overflow-x-hidden bg-background">
      <Outlet />
    </main>
  </div>
);
