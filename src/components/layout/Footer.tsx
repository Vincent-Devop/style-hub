import { Link } from "react-router-dom";
import { ADMIN_NUMBERS, formatPhoneDisplay, WHATSAPP_GROUP_URL } from "@/lib/whatsapp";

export const Footer = () => (
  <footer className="bg-card border-t border-border mt-20">
    <div className="container-x mx-auto py-12 grid md:grid-cols-4 gap-8">
      <div>
        <div className="font-display text-2xl tracking-wider mb-3">
          JO <span className="text-primary">COLLECTIONS</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Premium sneakers, shoes & streetwear for Nairobi and beyond.
        </p>
      </div>
      <div>
        <h4 className="text-primary mb-3">Shop</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/shop?category=sneakers" className="hover:text-foreground">Sneakers</Link></li>
          <li><Link to="/shop?category=mens" className="hover:text-foreground">Men's Shoes</Link></li>
          <li><Link to="/shop?category=ladies" className="hover:text-foreground">Ladies Shoes</Link></li>
          <li><Link to="/shop?category=kids" className="hover:text-foreground">Kids</Link></li>
          <li><Link to="/shop?category=clothing" className="hover:text-foreground">Clothing</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-primary mb-3">Support</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/contact" className="hover:text-foreground">Contact us</Link></li>
          <li><Link to="/feed" className="hover:text-foreground">Community feed</Link></li>
          <li><Link to="/orders" className="hover:text-foreground">Track order</Link></li>
          <li><a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">WhatsApp group</a></li>
        </ul>
      </div>
      <div>
        <h4 className="text-primary mb-3">Talk to us</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {ADMIN_NUMBERS.map((n) => (
            <li key={n}>{formatPhoneDisplay(n)}</li>
          ))}
        </ul>
      </div>
    </div>
    <div className="border-t border-border py-4 text-center text-xs text-muted-foreground container-x">
      © {new Date().getFullYear()} Jo Collections. All rights reserved.
    </div>
  </footer>
);
