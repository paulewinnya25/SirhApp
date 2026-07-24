// Edge Function Supabase - Demandes employés (employee_requests)
// Déployer: supabase functions deploy requests

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
  "Access-Control-Max-Age": "86400",
};

function getPathSegments(url: string): string[] {
  try {
    const u = new URL(url);
    const path = u.pathname;
    // Supabase peut exposer /functions/v1/requests/... ou /requests/...
    const cleaned = path
      .replace(/^\/functions\/v1\/requests\/?/, "")
      .replace(/^\/requests\/?/, "")
      .replace(/^\//, "");
    return cleaned ? cleaned.split("/").filter(Boolean) : [];
  } catch {
    return [];
  }
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

    const segments = getPathSegments(req.url);

    if (req.method === "GET" && segments[0] === "count" && segments[1] === "pending") {
      const { data, error } = await supabase
        .from("employee_requests")
        .select("id")
        .eq("status", "pending");

      if (error) throw error;
      return new Response(
        JSON.stringify({
          pendingCount: data?.length ?? 0,
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET" && segments.length === 0) {
      const { data: requests, error } = await supabase
        .from("employee_requests")
        .select("*")
        .order("request_date", { ascending: false });

      if (error) throw error;
      const rows = requests || [];
      const ids = [...new Set(rows.map((r: Record<string, unknown>) => r.employee_id).filter(Boolean))];
      const empMap: Record<number, Record<string, unknown>> = {};
      if (ids.length > 0) {
        const { data: emps } = await supabase.from("employees").select("id, nom_prenom, poste_actuel, entity, email").in("id", ids);
        (emps || []).forEach((e: Record<string, unknown>) => { empMap[Number(e.id)] = e; });
      }
      const result = rows.map((r: Record<string, unknown>) => {
        const emp = empMap[Number(r.employee_id)];
        return { ...r, nom_prenom: emp?.nom_prenom ?? null, poste_actuel: emp?.poste_actuel ?? null, entity: emp?.entity ?? null, email: emp?.email ?? null };
      });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && segments[0] === "employee" && segments[1]) {
      const { data, error } = await supabase
        .from("employee_requests")
        .select("*")
        .eq("employee_id", parseInt(segments[1], 10))
        .order("request_date", { ascending: false });

      if (error) throw error;
      const rows = (data || []) as Record<string, unknown>[];
      const ids = [...new Set(rows.map((r) => r.employee_id).filter(Boolean))];
      const empMap: Record<number, Record<string, unknown>> = {};
      if (ids.length > 0) {
        const { data: emps } = await supabase.from("employees").select("id, nom_prenom, poste_actuel, entity, email").in("id", ids);
        (emps || []).forEach((e: Record<string, unknown>) => { empMap[Number(e.id)] = e; });
      }
      const result = rows.map((r) => {
        const emp = empMap[Number(r.employee_id)];
        return { ...r, nom_prenom: emp?.nom_prenom ?? null, poste_actuel: emp?.poste_actuel ?? null, entity: emp?.entity ?? null, email: emp?.email ?? null };
      });
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "GET" && segments[0] && /^\d+$/.test(segments[0])) {
      const { data, error } = await supabase
        .from("employee_requests")
        .select("*")
        .eq("id", parseInt(segments[0], 10))
        .single();

      if (error || !data) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const d = data as Record<string, unknown>;
      const { data: emp } = await supabase.from("employees").select("nom_prenom, poste_actuel, entity, email").eq("id", d.employee_id).single();
      const result = { ...d, nom_prenom: emp?.nom_prenom ?? null, poste_actuel: emp?.poste_actuel ?? null, entity: emp?.entity ?? null, email: emp?.email ?? null };
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST /requests - créer une nouvelle demande employé
    if (req.method === "POST" && segments.length === 0) {
      let body: Record<string, unknown>;
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ error: "Body JSON invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const employee_id = body.employee_id != null ? Number(body.employee_id) : null;
      const request_type = typeof body.request_type === "string" ? body.request_type.trim() : "";
      if (employee_id == null || !request_type) {
        return new Response(
          JSON.stringify({ error: "employee_id et request_type requis" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const row: Record<string, unknown> = {
        employee_id,
        request_type,
        request_details: body.request_details ?? "",
        reason: body.reason ?? "",
        status: (body.status as string) || "pending",
      };
      if (body.start_date != null && body.start_date !== "") row.start_date = body.start_date;
      if (body.end_date != null && body.end_date !== "") row.end_date = body.end_date;

      const { data, error } = await supabase
        .from("employee_requests")
        .insert(row)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /requests/:id/approve
    if (req.method === "PUT" && segments[0] && /^\d+$/.test(segments[0]) && segments[1] === "approve") {
      const id = parseInt(segments[0], 10);
      const body = await req.json().catch(() => ({})) as Record<string, unknown>;
      const { data, error } = await supabase
        .from("employee_requests")
        .update({
          status: "approved",
          response_date: new Date().toISOString(),
          response_comments: body.response_comments ?? body.comments ?? "",
        })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data || { success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /requests/:id/reject
    if (req.method === "PUT" && segments[0] && /^\d+$/.test(segments[0]) && segments[1] === "reject") {
      const id = parseInt(segments[0], 10);
      const body = await req.json().catch(() => ({})) as Record<string, unknown>;
      const { data, error } = await supabase
        .from("employee_requests")
        .update({
          status: "rejected",
          response_date: new Date().toISOString(),
          response_comments: body.response_comments ?? body.rejectionReason ?? "",
        })
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data || { success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /requests/:id - supprimer une demande employé
    if (req.method === "DELETE" && segments[0] && /^\d+$/.test(segments[0])) {
      const id = parseInt(segments[0], 10);
      const { error } = await supabase
        .from("employee_requests")
        .delete()
        .eq("id", id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE /requests/all - supprimer toutes les demandes
    if (req.method === "DELETE" && segments[0] === "all") {
      const { data: existing, error: countError } = await supabase
        .from("employee_requests")
        .select("id");

      if (countError) {
        return new Response(JSON.stringify({ error: countError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const deletedCount = existing?.length ?? 0;
      if (deletedCount > 0) {
        const { error } = await supabase
          .from("employee_requests")
          .delete()
          .gte("id", 0);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ success: true, deletedCount }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch requests", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
