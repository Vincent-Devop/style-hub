import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatKES } from "@/lib/format";
import { toast } from "sonner";

const empty = {
  id: "" as string | "",
  name: "",
  description: "",
  category_id: "",
  price: "",
  discount_price: "",
  on_offer: false,
  images: "",
  is_active: true,
};

interface VariantRow { id?: string; size: string; color: string; stock: string; }

const AdminProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [editing, setEditing] = useState<typeof empty | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase
        .from("products")
        .select("*, category:categories(name), variants:product_variants(id, size, color, stock)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("display_order"),
    ]);
    setProducts(p || []);
    setCats(c || []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openNew = () => {
    setEditing({ ...empty, category_id: cats[0]?.id || "" });
    setVariants([]);
  };
  const openEdit = (p: any) => {
    setEditing({
      id: p.id, name: p.name, description: p.description || "", category_id: p.category_id,
      price: String(p.price), discount_price: p.discount_price ? String(p.discount_price) : "",
      on_offer: p.on_offer, images: (p.images || []).join("\n"), is_active: p.is_active,
    });
    setVariants(
      (p.variants || []).map((v: any) => ({
        id: v.id, size: v.size || "", color: v.color || "", stock: String(v.stock ?? 0),
      }))
    );
  };

  const addVariant = () => setVariants([...variants, { size: "", color: "", stock: "0" }]);
  const updateVariant = (i: number, patch: Partial<VariantRow>) =>
    setVariants(variants.map((v, idx) => idx === i ? { ...v, ...patch } : v));
  const removeVariant = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing || !user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    setEditing({ ...editing, images: editing.images ? `${editing.images}\n${publicUrl}` : publicUrl });
    setUploading(false);
    toast.success("Image uploaded");
  };

  const save = async () => {
    if (!editing) return;
    const payload = {
      name: editing.name.trim(),
      description: editing.description.trim() || null,
      category_id: editing.category_id,
      price: Number(editing.price),
      discount_price: editing.discount_price ? Number(editing.discount_price) : null,
      on_offer: editing.on_offer,
      images: editing.images.split("\n").map((s) => s.trim()).filter(Boolean),
      is_active: editing.is_active,
    };
    if (!payload.name || !payload.category_id || !payload.price) {
      toast.error("Name, category and price are required");
      return;
    }

    let productId = editing.id;
    if (productId) {
      const { error } = await supabase.from("products").update(payload).eq("id", productId);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error || !data) { toast.error(error?.message || "Failed"); return; }
      productId = data.id;
    }

    // Sync variants: delete removed, upsert current
    const { data: existing } = await supabase
      .from("product_variants").select("id").eq("product_id", productId);
    const keepIds = new Set(variants.filter(v => v.id).map(v => v.id!));
    const toDelete = (existing || []).filter(e => !keepIds.has(e.id)).map(e => e.id);
    if (toDelete.length) {
      await supabase.from("product_variants").delete().in("id", toDelete);
    }
    for (const v of variants) {
      const row = {
        product_id: productId,
        size: v.size.trim() || null,
        color: v.color.trim() || null,
        stock: Math.max(0, Number(v.stock) || 0),
      };
      if (v.id) {
        await supabase.from("product_variants").update(row).eq("id", v.id);
      } else if (row.size || row.color) {
        await supabase.from("product_variants").insert(row);
      }
    }

    toast.success("Saved");
    setEditing(null);
    setVariants([]);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); refresh(); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl">Products</h1>
        <Button variant="hero" onClick={openNew}><Plus className="size-4" /> New product</Button>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr className="text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Pricing</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Variants</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const totalStock = (p.variants || []).reduce((s: number, v: any) => s + (v.stock || 0), 0);
              const variantSummary = (p.variants || [])
                .map((v: any) => [v.size, v.color].filter(Boolean).join("/"))
                .filter(Boolean).join(", ") || "—";
              return (
                <tr key={p.id} className="border-t border-border align-top">
                  <td className="p-3 font-display tracking-wide">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.category?.name}</td>
                  <td className="p-3">
                    {p.on_offer && p.discount_price ? (
                      <div>
                        <div className="text-primary font-bold">{formatKES(Number(p.discount_price))}</div>
                        <div className="text-xs text-muted-foreground line-through">{formatKES(Number(p.price))}</div>
                      </div>
                    ) : (
                      <div>{formatKES(Number(p.price))}</div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={totalStock === 0 ? "text-destructive" : "text-foreground"}>{totalStock}</span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate" title={variantSummary}>
                    {variantSummary}
                  </td>
                  <td className="p-3">{p.is_active ? "✓" : "✗"}</td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(p)}><Edit className="size-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="size-3 text-destructive" /></Button>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-sm w-full max-w-2xl p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display text-2xl">{editing.id ? "Edit" : "New"} product</h2>
              <button onClick={() => setEditing(null)}><X className="size-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full h-10 bg-input border border-border rounded-sm px-2"
                    value={editing.category_id}
                    onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
                  >
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Price (KES)</Label>
                  <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Current price (KES)</Label>
                  <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
                </div>
                <div>
                  <Label>Former price (KES, optional)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. original price before discount"
                    value={editing.discount_price}
                    onChange={(e) => setEditing({ ...editing, discount_price: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    If "On offer" is on, this is shown as the strike-through original price.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editing.on_offer} onCheckedChange={(v) => setEditing({ ...editing, on_offer: v })} />
                <span>On offer (show former price as discount)</span>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div>
                <Label>Image URLs (one per line)</Label>
                <Textarea rows={3} value={editing.images} onChange={(e) => setEditing({ ...editing, images: e.target.value })} />
                <input type="file" accept="image/*" onChange={handleUpload} className="mt-2 text-sm" disabled={uploading} />
                {uploading && <p className="text-xs text-muted-foreground mt-1">Uploading…</p>}
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <span>Active (visible to customers)</span>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button variant="hero" onClick={save}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
