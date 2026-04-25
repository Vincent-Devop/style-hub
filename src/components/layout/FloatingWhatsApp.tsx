import { useEffect, useState } from "react";
import { MessageCircle, X, Package, ShoppingBag, AlertCircle, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { PRIMARY_WHATSAPP, buildWaLink } from "@/lib/whatsapp";

const QUICK = [
  {
    icon: Package,
    label: "Track Order",
    msg: "Hello, I want to track my order. Order ID: ____",
    color: "bg-primary text-primary-foreground",
  },
  {
    icon: ShoppingBag,
    label: "Product Inquiry",
    msg: "Hello, I am interested in your products. Can you assist?",
    color: "bg-primary text-primary-foreground",
  },
  {
    icon: AlertCircle,
    label: "Complaint / Issue",
    msg: "Hello, I have an issue with my order. Please assist.",
    color: "bg-destructive text-destructive-foreground",
  },
];

export const FloatingWhatsApp = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[300px] bg-card border-2 border-primary rounded-lg shadow-elevated p-4 animate-float-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display tracking-wider text-base">Chat with us</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Typically replies instantly
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <Link
            to="/support"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 w-full p-3 mb-2 rounded-sm bg-secondary hover:bg-muted transition-colors border border-border"
          >
            <Bot className="size-5 text-primary" />
            <div className="flex-1">
              <div className="font-display text-sm tracking-wider">AI Assistant</div>
              <div className="text-xs text-muted-foreground">Instant answers, 24/7</div>
            </div>
          </Link>

          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 mt-3">
            Or chat on WhatsApp
          </div>

          {QUICK.map((q) => (
            <a
              key={q.label}
              href={buildWaLink(PRIMARY_WHATSAPP, q.msg)}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-3 w-full p-3 mb-2 rounded-sm font-display tracking-wider text-sm uppercase transition-transform hover:-translate-y-0.5 ${q.color}`}
            >
              <q.icon className="size-4" />
              {q.label}
            </a>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        aria-label="Open WhatsApp chat"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-elevated hover:scale-110 transition-transform animate-pulse-neon"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  );
};
