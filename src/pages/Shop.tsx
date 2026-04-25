import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductCard, type ProductCardData } from "@/components/shop/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const CATS = [
  { slug: "all", name: "All" },
  { slug: "sneakers", name: "Sneakers" },
  { slug: "mens", name: "Men's" },
  { slug: "ladies", name: "Ladies" },
  { slug: "unisex", name: "Unisex" },
  { slug: "kids", name: "Kids" },
  { slug: "clothing", name: "Clothing" },
];

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const active = params.get("category") || "all";
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Shop · Jo Collections";
  }, []);

  useEffect(() => {
    setLoading(true);
    let q = supabase
      .from("products")
      .select("id, name, price, discount_price, on_offer, images, category:categories!inner(slug, name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (active !== "all") {
      q = q.eq("categories.slug", active);
    }
    q.then(({ data }) => {
      setProducts((data as any) || []);
      setLoading(false);
    });
  }, [active]);

  return (
    <div className="container-x mx-auto py-10">
      <h1 className="font-display text-5xl md:text-6xl mb-8">The Shop</h1>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-8 -mx-4 px-4">
        {CATS.map((c) => (
          <button
            key={c.slug}
            onClick={() => setParams(c.slug === "all" ? {} : { category: c.slug })}
            className={cn(
              "px-5 py-2 font-display tracking-wider uppercase text-sm border whitespace-nowrap transition-all",
              active === c.slug
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-card animate-pulse rounded-sm" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-sm text-muted-foreground">
          No products in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
