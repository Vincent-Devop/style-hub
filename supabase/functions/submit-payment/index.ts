import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const order_id = String(body.order_id || "").trim();
    const mpesa_phone = String(body.mpesa_phone || "").trim();
    const transaction_code = String(body.transaction_code || "").trim().toUpperCase();

    if (!order_id || !mpesa_phone || !transaction_code) {
      return new Response(JSON.stringify({ error: "order_id, mpesa_phone and transaction_code are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^[A-Z0-9]{6,20}$/.test(transaction_code)) {
      return new Response(JSON.stringify({ error: "Invalid transaction code format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reject duplicate transaction codes
    const { data: dup } = await admin
      .from("orders")
      .select("id")
      .eq("transaction_code", transaction_code)
      .neq("id", order_id)
      .maybeSingle();
    if (dup) {
      return new Response(JSON.stringify({ error: "This transaction code has already been used." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership + state
    const { data: order, error: ordErr } = await admin
      .from("orders").select("id, user_id, status").eq("id", order_id).maybeSingle();
    if (ordErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (order.status !== "PENDING_PAYMENT") {
      return new Response(JSON.stringify({ error: `Order is already ${order.status}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await admin.from("orders").update({
      status: "PAYMENT_UNDER_REVIEW",
      transaction_code,
      payment_phone: mpesa_phone,
      updated_at: new Date().toISOString(),
    }).eq("id", order_id);

    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("audit_logs").insert({
      action: "PAYMENT_SUBMITTED",
      actor_id: user.id,
      target_type: "order",
      target_id: order_id,
      details: { transaction_code, mpesa_phone },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
