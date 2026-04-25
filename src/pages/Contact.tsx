import { ADMIN_NUMBERS, WHATSAPP_GROUP_URL, buildWaLink, formatPhoneDisplay, PRIMARY_WHATSAPP } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Phone } from "lucide-react";
import { useEffect } from "react";

const PRESET = "Hello, I would like to inquire about your products.";

const Contact = () => {
  useEffect(() => { document.title = "Contact · Jo Collections"; }, []);
  return (
    <div className="container-x mx-auto py-12 max-w-4xl">
      <h1 className="font-display text-5xl md:text-6xl mb-3">Contact us</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">
        Reach our team instantly on WhatsApp. We typically reply within minutes during business hours.
      </p>

      <div className="bg-gradient-card border-2 border-primary rounded-sm p-6 md:p-8 mb-8 shadow-neon">
        <div className="flex items-center gap-3 mb-3">
          <Users className="size-6 text-primary" />
          <h2 className="font-display text-2xl">Join our WhatsApp Group</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          Get the latest drops, deals and community updates straight to your phone.
        </p>
        <Button asChild variant="whatsapp" size="lg">
          <a href={WHATSAPP_GROUP_URL} target="_blank" rel="noreferrer">
            <MessageCircle className="size-5" /> Join the group
          </a>
        </Button>
      </div>

      <h2 className="font-display text-3xl mb-4">Direct admin contacts</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {ADMIN_NUMBERS.map((n) => (
          <a
            key={n}
            href={buildWaLink(n, PRESET)}
            target="_blank"
            rel="noreferrer"
            className="group bg-card border border-border rounded-sm p-5 hover:border-primary hover:shadow-neon transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 grid place-items-center bg-[#25D366] text-white rounded-full">
                <Phone className="size-5" />
              </div>
              <div>
                <div className="font-display tracking-wide text-lg">{formatPhoneDisplay(n)}</div>
                <div className="text-xs text-muted-foreground">Tap to chat on WhatsApp</div>
              </div>
            </div>
            <div className="text-xs text-primary uppercase tracking-widest mt-3 group-hover:underline">
              Open WhatsApp →
            </div>
          </a>
        ))}
      </div>

      <div className="mt-10 p-5 bg-card border border-border rounded-sm">
        <div className="text-sm text-muted-foreground">
          Prefer the floating button? Tap the green chat icon at the bottom-right of any page to start a conversation —
          we'll route you to <span className="text-foreground">{formatPhoneDisplay(PRIMARY_WHATSAPP)}</span>.
        </div>
      </div>
    </div>
  );
};

export default Contact;
