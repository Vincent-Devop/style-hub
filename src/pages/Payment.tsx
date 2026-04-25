import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Smartphone, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatKES } from "@/lib/format";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  mpesa_phone: z.string().trim().regex(/^(?:\+?254|0)?7\d{8}$/, "Enter a valid Kenyan phone"),
  transaction_code: z.string().trim().min(6, "Transaction code is required").max(20).regex(/^[A-Z0-9]+$/i, "Letters and numbers only"),
});

const PAYBILL = "247247";
const ACCOUNT = "0748505193";

const Payment = () => {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Pay with M-Pesa · Jo Collections";
    if (!orderId || !user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setOrder(data);
        setLoading(false);
      });
  }, [orderId, user]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ mpesa_phone: phone, transaction_code: code });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("submit-payment", {
      body: {
        order_id: orderId,
        mpesa_phone: parsed.data.mpesa_phone,
        transaction_code: parsed.data.transaction_code.toUpperCase(),
      },
    });
    setSubmitting(false);
    if (error || (data && data.error)) {
      toast.error((data && data.error) || error?.message || "Failed to submit payment");
      return;
    }
    toast.success("Payment submitted! Awaiting admin verification.");
    navigate("/orders");
  };

  if (loading) return <div className="container-x mx-auto py-20 text-center text-muted-foreground">Loading…</div>;
  if (!order) {
    return (
      <div className="container-x mx-auto py-20 text-center">
        <p className="mb-4 text-muted-foreground">Order not found.</p>
        <Button asChild><Link to="/shop">Continue shopping</Link></Button>
      </div>
    );
  }

  if (order.status !== "PENDING_PAYMENT") {
    return (
      <div className="container-x mx-auto py-20 text-center">
        <h1 className="font-display text-4xl mb-2">Payment already submitted</h1>
        <p className="text-muted-foreground mb-6">Status: {order.status.replaceAll("_", " ")}</p>
        <Button asChild variant="hero"><Link to="/orders">View my orders</Link></Button>
      </div>
    );
  }

  return (
    <div className="container-x mx-auto py-10 grid lg:grid-cols-2 gap-10">
      <div>
        <h1 className="font-display text-5xl mb-2">Pay with M-Pesa</h1>
        <p className="text-muted-foreground mb-6">
          Order #{order.id.slice(0, 8).toUpperCase()} · Total{" "}
          <span className="text-primary font-bold">{formatKES(Number(order.total_amount))}</span>
        </p>

        <div className="bg-card border border-border rounded-sm p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-display text-lg uppercase tracking-widest">
            <Smartphone className="size-5" /> Payment instructions
          </div>
          <ol className="text-sm space-y-3 list-decimal list-inside text-muted-foreground">
            <li>Open your M-Pesa menu</li>
            <li>Select <span className="text-foreground">Lipa na M-Pesa</span></li>
            <li>Select <span className="text-foreground">Pay Bill</span></li>
            <li>
              Business Number:{" "}
              <button onClick={() => copy(PAYBILL, "pb")} className="inline-flex items-center gap-1 text-primary font-bold hover:underline">
                {PAYBILL} {copied === "pb" ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
            </li>
            <li>
              Account Number:{" "}
              <button onClick={() => copy(ACCOUNT, "ac")} className="inline-flex items-center gap-1 text-primary font-bold hover:underline">
                {ACCOUNT} {copied === "ac" ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
            </li>
            <li>
              Enter amount{" "}
              <button onClick={() => copy(String(Number(order.total_amount)), "am")} className="inline-flex items-center gap-1 text-primary font-bold hover:underline">
                {formatKES(Number(order.total_amount))} {copied === "am" ? <Check className="size-3" /> : <Copy className="size-3" />}
              </button>
            </li>
            <li>Enter your M-Pesa PIN and confirm</li>
            <li>You'll receive an SMS with a transaction code (e.g. <span className="font-mono">QWE12XYZ45</span>) — paste it here</li>
          </ol>
        </div>
      </div>

      <form onSubmit={submit} className="bg-card border-2 border-primary rounded-sm p-6 space-y-5 h-fit shadow-neon">
        <h2 className="font-display text-2xl">Confirm your payment</h2>
        <div>
          <Label htmlFor="mpesa_phone">M-Pesa phone number</Label>
          <Input id="mpesa_phone" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="tx">M-Pesa transaction code</Label>
          <Input
            id="tx"
            placeholder="e.g. QWE12XYZ45"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            className="font-mono uppercase tracking-wider"
          />
          <p className="text-xs text-muted-foreground mt-1">
            From the M-Pesa SMS you received after paying.
          </p>
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Submitting…" : "I've Completed Payment"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Your payment will be verified by our team and confirmed shortly.
        </p>
      </form>
    </div>
  );
};

export default Payment;
