import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Bot, User as UserIcon, Headphones } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { PRIMARY_WHATSAPP, buildWaLink } from "@/lib/whatsapp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Msg { id: string; sender: "USER" | "ADMIN" | "AI"; message: string; needs_admin?: boolean }

const Support = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("id, sender, message, needs_admin")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setMessages((data as Msg[]) || []);
  }, [user]);

  useEffect(() => {
    document.title = "Support · Jo Collections";
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user) return;
    setSending(true);
    setInput("");
    const optimistic: Msg = { id: `tmp-${Date.now()}`, sender: "USER", message: text };
    setMessages((m) => [...m, optimistic]);
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: { message: text },
    });
    setSending(false);
    if (error || (data && data.error)) {
      toast.error((data && data.error) || error?.message || "Chat failed");
    }
    refresh();
  };

  if (!user) {
    return (
      <div className="container-x mx-auto py-20 text-center">
        <h1 className="font-display text-4xl mb-4">Login to chat</h1>
        <Button asChild variant="hero"><Link to="/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-x mx-auto py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Headphones className="size-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl tracking-wide">Support Chat</h1>
          <p className="text-xs text-muted-foreground">AI assistant · escalates to our team when needed</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm h-[60vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Bot className="size-10 mx-auto mb-2 text-primary" />
              <p className="text-sm">Ask about your order, products, payment or delivery.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-2", m.sender === "USER" ? "justify-end" : "justify-start")}>
              {m.sender !== "USER" && (
                <div className="w-7 h-7 rounded-full grid place-items-center bg-primary text-primary-foreground shrink-0">
                  {m.sender === "AI" ? <Bot className="size-4" /> : <Headphones className="size-4" />}
                </div>
              )}
              <div className={cn(
                "max-w-[75%] rounded-sm px-3 py-2 text-sm",
                m.sender === "USER" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              )}>
                <div className="prose prose-sm prose-invert max-w-none [&_a]:text-primary [&_p]:m-0 [&_p+p]:mt-2">
                  <ReactMarkdown>{m.message}</ReactMarkdown>
                </div>
                {m.needs_admin && (
                  <a
                    href={buildWaLink(PRIMARY_WHATSAPP, "Hello, I need help with my order.")}
                    target="_blank"
                    rel="noreferrer"
                    className="block mt-2 px-3 py-1.5 bg-[#25D366] text-white text-xs font-display tracking-wider uppercase rounded-sm text-center"
                  >
                    Continue on WhatsApp
                  </a>
                )}
              </div>
              {m.sender === "USER" && (
                <div className="w-7 h-7 rounded-full grid place-items-center bg-secondary shrink-0">
                  <UserIcon className="size-4" />
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full grid place-items-center bg-primary text-primary-foreground">
                <Bot className="size-4" />
              </div>
              <div className="bg-secondary rounded-sm px-3 py-2 text-sm text-muted-foreground">Thinking…</div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            disabled={sending}
          />
          <Button type="submit" variant="default" size="icon" disabled={sending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Support;
