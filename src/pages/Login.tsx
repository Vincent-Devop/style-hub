import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signupSchema = loginSchema.extend({
  display_name: z.string().trim().min(1, "Name is required").max(80),
});

const Login = () => {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (tab === "login") {
      const parsed = loginSchema.safeParse({ email, password });
      if (!parsed.success) { toast.error(parsed.error.issues[0].message); setLoading(false); return; }
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success("Welcome back"); navigate(from, { replace: true }); }
    } else {
      const parsed = signupSchema.safeParse({ email, password, display_name: name });
      if (!parsed.success) { toast.error(parsed.error.issues[0].message); setLoading(false); return; }
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: parsed.data.display_name },
        },
      });
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success("Account created!"); navigate(from, { replace: true }); }
    }
  };

  return (
    <div className="min-h-[80vh] container-x mx-auto py-10 grid place-items-center">
      <div className="w-full max-w-md bg-card border border-border rounded-sm p-8">
        <Link to="/" className="inline-block mb-6">
          <div className="font-display text-3xl tracking-wider">
            JO <span className="text-primary">COLLECTIONS</span>
          </div>
        </Link>
        <div className="flex border-b border-border mb-6">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 font-display tracking-wider uppercase text-sm transition-colors ${
                tab === t ? "text-primary border-b-2 border-primary -mb-px" : "text-muted-foreground"
              }`}
            >
              {t === "login" ? "Login" : "Sign up"}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {tab === "signup" && (
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : tab === "login" ? "Login" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
