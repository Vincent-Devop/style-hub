import { useEffect, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";

const AdminFeed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("posts")
      .select("*, profile:profiles!posts_user_id_fkey(display_name)")
      .order("created_at", { ascending: false });
    setPosts(data || []);
  }, []);
  useEffect(() => { document.title = "Admin · Feed"; refresh(); }, [refresh]);

  const del = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); refresh(); }
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-4xl mb-6">Community feed moderation</h1>
      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-sm p-4">
            <div className="flex justify-between gap-3 mb-2">
              <div className="text-sm">
                <span className="font-display tracking-wide">{p.profile?.display_name || "Anonymous"}</span>
                <span className="text-muted-foreground"> · {p.post_type}</span>
              </div>
              <span className="text-xs text-muted-foreground">{formatDateTime(p.created_at)}</span>
            </div>
            <p className="text-sm whitespace-pre-line mb-2">{p.content}</p>
            <Button size="sm" variant="ghost" onClick={() => del(p.id)}>
              <Trash2 className="size-3 text-destructive" /> Delete
            </Button>
          </div>
        ))}
        {posts.length === 0 && <div className="text-center py-10 text-muted-foreground">No posts.</div>}
      </div>
    </div>
  );
};

export default AdminFeed;
