import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatKES } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  on_offer: boolean;
  images: string[];
  category?: { name: string } | null;
}

export const ProductCard = ({ product }: { product: ProductCardData }) => {
  const { addToCart } = useCart();
  const price = product.on_offer && product.discount_price ? Number(product.discount_price) : Number(product.price);
  const orig = Number(product.price);
  const img = product.images?.[0];

  return (
    <div className="group relative bg-card border border-border rounded-sm overflow-hidden hover:shadow-elevated hover:border-primary transition-all duration-300">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square bg-secondary overflow-hidden relative">
          {img ? (
            <img
              src={img}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-muted-foreground text-xs uppercase">
              No image
            </div>
          )}
          {product.on_offer && (
            <span className="absolute top-3 left-3 bg-primary text-primary-foreground px-2 py-1 text-xs font-display tracking-widest">
              ON OFFER
            </span>
          )}
        </div>
        <div className="p-4">
          {product.category && (
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              {product.category.name}
            </div>
          )}
          <h3 className="font-display text-lg tracking-wide mb-1 line-clamp-1">{product.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-primary font-bold">{formatKES(price)}</span>
            {product.on_offer && product.discount_price && (
              <span className="text-muted-foreground line-through text-sm">{formatKES(orig)}</span>
            )}
          </div>
        </div>
      </Link>
      <Button
        size="sm"
        variant="default"
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          addToCart(product.id, null, 1);
        }}
        aria-label="Quick add"
      >
        <ShoppingBag className="size-4" />
      </Button>
    </div>
  );
};
