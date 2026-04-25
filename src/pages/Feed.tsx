import { useEffect, useState, useCallback } from "react";
import { Lightbulb, AlertCircle, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPES = [
  { v: "REQUEST",   label: "Design request",  Icon: Lightbulb,  color: "text-info" },
  { v: "COMPLAINT", label: "Complaint",       Icon: AlertCircle,color: "text-destructive" },
  { v: "IDEA",      label: "Recommendation",  Icon: Sparkles,   color: "text-primary" },
] as const;

const Feed = () => {
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [type, setType] = useState<typeof TYPES[number]["v"]>("IDEA");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profile:profiles!posts_user_id_fkey(display_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts(data || []);
  }, []);

  useEffect(() => {
    document.title = "Community Feed · Jo Collections";
    refresh();
  }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please log in to post"); return; }
    const trimmed = content.trim();
    if (trimmed.length < 3) { toast.error("Post is too short"); return; }
    if (trimmed.length > 2000) { toast.error("Post is too long"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      post_type: type,
      content: trimmed,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Posted!");
      setContent("");
      refresh();
    }
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); refresh(); }
  };

  return (
    <div className="container-x mx-auto py-10 max-w-3xl">
      <h1 className="font-display text-5xl md:text-6xl mb-2">Community Feed</h1>
      <p className="text-muted-foreground mb-8">
        Request a design, share an idea, or flag a concern. Our team reads every post.
      </p>

      {user ? (
        <form onSubmit={submit} className="bg-card border border-border rounded-sm p-5 mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t.v}
                onClick={() => setType(t.v)}
                className={cn(
                  "px-4 py-2 text-sm font-display tracking-wider uppercase border-2 inline-flex items-center gap-2 transition-colors",
                  type === t.v ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary"
                )}
              >
                <t.Icon className="size-4" /> {t.label}
              </button>
            ))}
          </div>
          <Textarea
            rows={3}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{content.length}/2000</span>
            <Button type="submit" variant="hero" disabled={submitting}>
              {submitting ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-card border border-border rounded-sm p-5 mb-8 text-center text-muted-foreground">
          Login to share a post.
        </div>
      )}

      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-sm">
            No posts yet. Be the first.
          </div>
        )}
        {posts.map((p) => {
          const meta = TYPES.find((t) => t.v === p.post_type) ?? TYPES[2];
          const canDelete = isAdmin || p.user_id === user?.id;
          return (
            <div key={p.id} className="bg-card border border-border rounded-sm p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary grid place-items-center text-xs font-display">
                    {(p.profile?.display_name || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-display tracking-wide">
                      {p.profile?.display_name || "Anonymous"}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</div>
                  </div>
                </div>
                <div className={cn("text-xs uppercase tracking-widest font-display flex items-center gap-1", meta.color)}>
                  <meta.Icon className="size-3" /> {meta.label}
                </div>
              </div>
              <p className="text-sm whitespace-pre-line">{p.content}</p>
              {canDelete && (
                <button
                  onClick={() => del(p.id)}
                  className="text-xs text-muted-foreground hover:text-destructive mt-3 inline-flex items-center gap-1"
                >
                  <Trash2 className="size-3" /> Delete
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Feed;
