import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductCardData } from "@/components/shop/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-sneaker.jpg";

const CATEGORIES = [
  { slug: "sneakers", name: "Sneakers", emoji: "👟" },
  { slug: "mens", name: "Men", emoji: "🧢" },
  { slug: "ladies", name: "Ladies", emoji: "👠" },
  { slug: "kids", name: "Kids", emoji: "🧒" },
  { slug: "unisex", name: "Unisex", emoji: "👕" },
  { slug: "clothing", name: "Clothing", emoji: "🔥" },
];

const Home = () => {
  const [featured, setFeatured] = useState<ProductCardData[]>([]);

  useEffect(() => {
    document.title = "Jo Collections — Sneakers, Shoes & Streetwear in Kenya";
    supabase
      .from("products")
      .select("id, name, price, discount_price, on_offer, images, category:categories(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => data && setFeatured(data as any));
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
        <div className="container-x mx-auto py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center relative">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 border border-primary text-primary text-xs uppercase tracking-widest">
              New Drop · Live now
            </div>
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl leading-[0.9] tracking-tight">
              STEP <br />
              INTO <br />
              <span className="text-primary">CULTURE.</span>
            </h1>
            <p className="text-muted-foreground max-w-md text-lg">
              Premium sneakers, fashion shoes, kids and streetwear delivered countrywide.
              Pay securely with M-Pesa.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Button asChild variant="hero" size="lg">
                <Link to="/shop">Shop the drop <ArrowRight className="size-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/feed">Join the community</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="Featured sneaker"
              className="w-full max-w-lg mx-auto drop-shadow-[0_20px_50px_hsl(145_100%_50%_/_0.3)]"
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 font-display text-sm tracking-widest whitespace-nowrap">
              ★ KENYA'S #1 SNEAKER STORE
            </div>
          </div>
        </div>
        {/* marquee */}
        <div className="border-t border-b border-border bg-background/50 py-3 overflow-hidden">
          <div className="flex gap-12 animate-marquee whitespace-nowrap font-display text-2xl tracking-widest text-muted-foreground">
            {Array(2).fill(0).map((_, i) => (
              <span key={i} className="flex gap-12">
                <span>SNEAKERS</span><span className="text-primary">★</span>
                <span>STREETWEAR</span><span className="text-primary">★</span>
                <span>FASHION</span><span className="text-primary">★</span>
                <span>KIDS</span><span className="text-primary">★</span>
                <span>NEW DROPS WEEKLY</span><span className="text-primary">★</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-x mx-auto py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-4xl md:text-5xl">Shop by category</h2>
          <Link to="/shop" className="text-primary text-sm uppercase tracking-widest hover:underline hidden sm:inline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/shop?category=${c.slug}`}
              className="group aspect-square bg-card border border-border rounded-sm grid place-items-center text-center p-4 hover:border-primary hover:shadow-neon transition-all"
            >
              <div>
                <div className="text-4xl mb-2 group-hover:scale-125 transition-transform">{c.emoji}</div>
                <div className="font-display tracking-widest text-sm">{c.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-x mx-auto py-12">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-4xl md:text-5xl">Latest arrivals</h2>
          <Link to="/shop" className="text-primary text-sm uppercase tracking-widest hover:underline hidden sm:inline">
            See all →
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-sm text-muted-foreground">
            Products will appear here once the admin adds them.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* PROMISES */}
      <section className="bg-card border-y border-border py-12">
        <div className="container-x mx-auto grid sm:grid-cols-3 gap-8">
          {[
            { Icon: Truck, t: "Countrywide Delivery", d: "Nairobi same-day. Other towns 1–3 days." },
            { Icon: ShieldCheck, t: "Verified Payments", d: "Pay securely with M-Pesa Paybill." },
            { Icon: RotateCcw, t: "Easy Returns", d: "Wrong size? Swap within 7 days." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="flex items-start gap-4">
              <Icon className="size-8 text-primary shrink-0" />
              <div>
                <div className="font-display text-lg tracking-wide">{t}</div>
                <div className="text-sm text-muted-foreground">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Home;
