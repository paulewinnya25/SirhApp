// Edge Function Supabase - Performance evaluations
// Déployer: npx supabase functions deploy performance --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
  "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const url = new URL(req.url);
    const path = url.pathname;
    const segments = path
      .replace(/^\/functions\/v1\/performance\/?/, "")
      .replace(/^\/performance\/?/, "")
      .split("/")
      .filter(Boolean);

    // GET /performance or /performance/ → list evaluations (empty if table missing)
    if (req.method === "GET" && segments.length === 0) {
      const { data, error } = await supabase
        .from("performance_evaluations")
        .select("*")
        .order("evaluation_date", { ascending: false });
      if (error) {
        console.error("performance list error:", error.message);
        return json([]);
      }
      return json(data || []);
    }

    // GET /performance/employee/:id
    if (req.method === "GET" && segments[0] === "employee" && segments[1]) {
      const { data, error } = await supabase
        .from("performance_evaluations")
        .select("*")
        .eq("employee_id", segments[1])
        .order("evaluation_date", { ascending: false });
      if (error) return json([]);
      return json(data || []);
    }

    // GET /performance/:id
    if (req.method === "GET" && segments[0] && /^\d+$/.test(segments[0])) {
      const { data, error } = await supabase
        .from("performance_evaluations")
        .select("*")
        .eq("id", parseInt(segments[0], 10))
        .maybeSingle();
      if (error || !data) return json({ error: "Not found" }, 404);
      return json(data);
    }

    // POST /performance
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { data, error } = await supabase
        .from("performance_evaluations")
        .insert([body])
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json(data || body, 201);
    }

    // PUT /performance/:id
    if (req.method === "PUT" && segments[0]) {
      const body = await req.json().catch(() => ({}));
      const { data, error } = await supabase
        .from("performance_evaluations")
        .update(body)
        .eq("id", segments[0])
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      return json(data || body);
    }

    // DELETE /performance/:id
    if (req.method === "DELETE" && segments[0]) {
      const { error } = await supabase
        .from("performance_evaluations")
        .delete()
        .eq("id", segments[0]);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json([]);
  } catch (err) {
    console.error(err);
    return json([]);
  }
});
