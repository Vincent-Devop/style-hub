import { useEffect, useState, useCallback, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminChats = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("user_id, message, created_at, needs_admin, profile:profiles!chat_messages_user_id_fkey(display_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    const seen = new Set<string>();
    const list: any[] = [];
    (data || []).forEach((r: any) => {
      if (seen.has(r.user_id)) return;
      seen.add(r.user_id);
      list.push(r);
    });
    setThreads(list);
  }, []);

  const loadMessages = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  useEffect(() => {
    document.title = "Admin · Chats";
    loadThreads();
    const t = setInterval(loadThreads, 5000);
    return () => clearInterval(t);
  }, [loadThreads]);

  useEffect(() => {
    if (!activeUserId) return;
    loadMessages(activeUserId);
    const t = setInterval(() => loadMessages(activeUserId), 4000);
    return () => clearInterval(t);
  }, [activeUserId, loadMessages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeUserId || !user) return;
    const { error } = await supabase.from("chat_messages").insert({
      user_id: activeUserId,
      sender: "ADMIN",
      message: reply.trim(),
    });
    if (error) toast.error(error.message);
    else {
      // mark needs_admin resolved on the thread
      await supabase.from("chat_messages").update({ resolved: true }).eq("user_id", activeUserId).eq("needs_admin", true);
      setReply("");
      loadMessages(activeUserId);
    }
  };

  return (
    <div className="grid grid-cols-[300px_1fr] h-screen">
      <div className="border-r border-border bg-card overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-xl">Conversations</h2>
        </div>
        {threads.length === 0 && <div className="p-4 text-sm text-muted-foreground">No chats yet.</div>}
        {threads.map((t) => (
          <button
            key={t.user_id}
            onClick={() => setActiveUserId(t.user_id)}
            className={cn(
              "w-full text-left p-4 border-b border-border hover:bg-secondary transition-colors",
              activeUserId === t.user_id && "bg-secondary border-l-2 border-l-primary"
            )}
          >
            <div className="font-display tracking-wide text-sm flex justify-between">
              <span>{t.profile?.display_name || "Customer"}</span>
              {t.needs_admin && <span className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-1">{t.message}</div>
            <div className="text-xs text-muted-foreground mt-1">{formatDateTime(t.created_at)}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        {activeUserId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.sender === "USER" ? "justify-start" : "justify-end")}>
                  <div className={cn(
                    "max-w-[70%] rounded-sm px-3 py-2 text-sm",
                    m.sender === "USER" ? "bg-secondary" :
                    m.sender === "AI" ? "bg-info/20 border border-info/30" :
                    "bg-primary text-primary-foreground"
                  )}>
                    <div className="text-xs uppercase tracking-widest opacity-60 mb-1">{m.sender}</div>
                    <div className="whitespace-pre-line">{m.message}</div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form onSubmit={send} className="border-t border-border p-3 flex gap-2">
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply as admin…" />
              <Button type="submit" size="icon" disabled={!reply.trim()}><Send className="size-4" /></Button>
            </form>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-muted-foreground">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChats;
