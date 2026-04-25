import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ShoppingBag, User, Menu, X, LogOut, LayoutDashboard, Package, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/feed", label: "Feed" },
  { to: "/contact", label: "Contact" },
];

export const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
      {/* announcement bar */}
      <div className="bg-primary text-primary-foreground text-xs font-display uppercase tracking-widest py-1.5 text-center">
        Free delivery in Nairobi · M-Pesa accepted · Ships countrywide
      </div>

      <div className="container-x mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 bg-primary text-primary-foreground grid place-items-center font-display text-xl group-hover:shadow-neon transition-shadow">
            JC
          </div>
          <div className="font-display text-2xl tracking-wider hidden sm:block">
            JO <span className="text-primary">COLLECTIONS</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "font-display uppercase tracking-wider text-sm transition-colors",
                  isActive ? "text-primary" : "text-foreground hover:text-primary"
                )
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Button
                  variant="ghost_neon"
                  size="sm"
                  className="hidden md:inline-flex"
                  onClick={() => navigate("/admin")}
                >
                  <LayoutDashboard className="size-4" /> Admin
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => navigate("/orders")} aria-label="Orders">
                <Package className="size-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")} aria-label="Profile">
                <User className="size-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="size-5" />
              </Button>
            </>
          ) : (
            <Button variant="ghost_neon" size="sm" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
          <Button
            variant="default"
            size="icon"
            className="relative"
            onClick={() => navigate("/cart")}
            aria-label="Cart"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-background text-primary text-xs font-bold w-5 h-5 grid place-items-center rounded-full border-2 border-primary">
                {count}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container-x mx-auto py-4 flex flex-col gap-2">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "py-3 px-4 font-display uppercase tracking-wider",
                    isActive ? "bg-secondary text-primary" : "text-foreground"
                  )
                }
              >
                {n.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setOpen(false)}
                className="py-3 px-4 font-display uppercase tracking-wider text-primary border-t border-border"
              >
                Admin Dashboard
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
