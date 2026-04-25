import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ShoppingBag, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { formatKES } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Variant { id: string; size: string | null; color: string | null; stock: number }
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  on_offer: boolean;
  images: string[];
  category: { name: string } | null;
  variants: Variant[];
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("products")
      .select(`id, name, description, price, discount_price, on_offer, images,
               category:categories(name),
               variants:product_variants(id, size, color, stock)`)
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data as any);
        setLoading(false);
        if (data) document.title = `${data.name} · Jo Collections`;
      });
  }, [id]);

  if (loading) {
    return <div className="container-x mx-auto py-20 text-center text-muted-foreground">Loading…</div>;
  }
  if (!product) {
    return (
      <div className="container-x mx-auto py-20 text-center">
        <p className="mb-4 text-muted-foreground">Product not found.</p>
        <Button asChild><Link to="/shop">Back to shop</Link></Button>
      </div>
    );
  }

  const price = product.on_offer && product.discount_price ? Number(product.discount_price) : Number(product.price);

  const handleAdd = async () => {
    if (product.variants.length > 0 && !variantId) {
      toast.error("Please select size / variant");
      return;
    }
    await addToCart(product.id, variantId, qty);
  };

  return (
    <div className="container-x mx-auto py-8">
      <button
        onClick={() => navigate(-1)}
        className="text-muted-foreground hover:text-primary text-sm mb-6 inline-flex items-center gap-2"
      >
        <ArrowLeft className="size-4" /> Back
      </button>

      <div className="grid lg:grid-cols-2 gap-10">
        <div>
          <div className="aspect-square bg-card border border-border rounded-sm overflow-hidden mb-3">
            {product.images[activeImg] ? (
              <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center text-muted-foreground text-sm uppercase">No image</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    "aspect-square bg-card border-2 rounded-sm overflow-hidden",
                    activeImg === i ? "border-primary" : "border-border"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <div className="text-xs uppercase tracking-widest text-primary mb-2">{product.category.name}</div>
          )}
          <h1 className="font-display text-4xl md:text-5xl mb-4">{product.name}</h1>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-primary text-3xl font-bold">{formatKES(price)}</span>
            {product.on_offer && product.discount_price && (
              <span className="text-muted-foreground line-through text-lg">{formatKES(Number(product.price))}</span>
            )}
          </div>
          {product.description && (
            <p className="text-muted-foreground mb-6 whitespace-pre-line">{product.description}</p>
          )}

          {product.variants.length > 0 && (
            <div className="mb-6">
              <div className="text-sm uppercase tracking-widest text-muted-foreground mb-2">Select option</div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const label = [v.size, v.color].filter(Boolean).join(" / ") || "Standard";
                  const out = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      disabled={out}
                      onClick={() => setVariantId(v.id)}
                      className={cn(
                        "px-4 py-2 border-2 font-display tracking-wider text-sm uppercase",
                        out && "opacity-40 line-through cursor-not-allowed",
                        variantId === v.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      )}
                    >
                      {label}
                      {variantId === v.id && <Check className="inline size-3 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-sm uppercase tracking-widest text-muted-foreground">Qty</span>
            <div className="flex border border-border rounded-sm">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 hover:bg-secondary">−</button>
              <div className="px-4 py-2 border-x border-border min-w-[50px] text-center">{qty}</div>
              <button onClick={() => setQty(qty + 1)} className="px-4 py-2 hover:bg-secondary">+</button>
            </div>
          </div>

          <Button variant="hero" size="lg" className="w-full" onClick={handleAdd}>
            <ShoppingBag className="size-4" /> Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
