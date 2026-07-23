// Edge Function Supabase - Historique départs
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
    const match = u.pathname.match(/\/functions\/v1\/departs(?:\/(.*))?$/);
    const subPath = match?.[1] || "";
    return subPath ? subPath.split("/").filter(Boolean) : [];
  } catch {
    return [];
  }
}

function splitFullName(fullName: string | null): { nom: string; prenom: string } {
  if (!fullName || fullName === "Employé supprimé") return { nom: "", prenom: "" };
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nom: parts[0] || "", prenom: "" };
  const prenom = parts.pop() || "";
  const nom = parts.join(" ");
  return { nom, prenom };
}

async function enrichDepartHistory(supabase: ReturnType<typeof createClient>, row: Record<string, unknown>) {
  if (!row.employee_id) return row;
  const { data: emp } = await supabase.from("employees").select("nom_prenom, matricule, poste_actuel, departement, functional_area, type_contrat").eq("id", row.employee_id).single();
  const { nom, prenom } = splitFullName(emp?.nom_prenom as string);
  return {
    ...row,
    nom: nom || (row.nom as string),
    prenom: prenom || (row.prenom as string),
    matricule: emp?.matricule || row.matricule || "N/A",
    poste: emp?.poste_actuel || row.poste || "Poste inconnu",
    departement: emp?.departement || emp?.functional_area || row.departement || "Département inconnu",
    statut: emp?.type_contrat || row.statut || "-",
    commentaire: row.notes || row.commentaire || ""
  };
}

async function enrichHistoriqueDepart(supabase: ReturnType<typeof createClient>, row: Record<string, unknown>) {
  const hd = row as { nom?: string; prenom?: string; matricule?: string };
  const fullName = [hd.nom, hd.prenom].filter(Boolean).join(" ").trim();
  if (!fullName || hd.matricule) return row;
  const { data: emps } = await supabase.from("employees").select("matricule").ilike("nom_prenom", `%${fullName}%`).limit(1);
  const emp = emps?.[0];
  return { ...row, matricule: emp?.matricule || (row.matricule as string) || "N/A" };
}

async function fetchDepartures(supabase: ReturnType<typeof createClient>) {
  const { data: d1, error: e1 } = await supabase.from("depart_history").select("*").order("date_depart", { ascending: false });
  if (!e1 && d1 && d1.length > 0) {
    const enriched = await Promise.all(d1.map((r) => enrichDepartHistory(supabase, r as Record<string, unknown>)));
    return enriched;
  }
  const { data, error } = await supabase.from("historique_departs").select("*").order("id", { ascending: false });
  if (error) throw error;
  return data || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    const segments = getPathSegments(req.url);

    // POST /departs - Créer un départ (offboarding)
    if (req.method === "POST" && segments.length === 0) {
      const body = await req.json().catch(() => ({})) as Record<string, unknown>;
      const employeeId = body.employee_id != null ? Number(body.employee_id) : null;
      if (!employeeId || !body.date_depart) {
        return new Response(JSON.stringify({ error: "employee_id et date_depart requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const row = {
        employee_id: employeeId,
        date_depart: body.date_depart,
        motif_depart: body.motif_depart || null,
        type_depart: body.type_depart || null,
        notes: typeof body.notes === "string"
          ? body.notes
          : (body.checklist ? JSON.stringify({ checklist: body.checklist, notes: body.notes || "" }) : (body.notes as string) || null),
      };

      const { data, error } = await supabase
        .from("depart_history")
        .insert([row])
        .select()
        .maybeSingle();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Marquer l'employé comme inactif si possible
      await supabase
        .from("employees")
        .update({ statut_employe: "inactif" })
        .eq("id", employeeId);

      return new Response(JSON.stringify(data || { success: true }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /departs/:id - Récupérer un départ par ID (avec infos employé)
    const rawId = segments[0];
    const id = rawId && /^\d+$/.test(rawId) ? parseInt(rawId, 10) : (rawId && /^(new_|old_)\d+$/.test(rawId) ? parseInt(rawId.replace(/^(new_|old_)/, ""), 10) : null);
    if (req.method === "GET" && id != null) {
      const { data: d1 } = await supabase.from("depart_history").select("*").eq("id", id).single();
      if (d1) {
        const enriched = await enrichDepartHistory(supabase, d1 as Record<string, unknown>);
        return new Response(JSON.stringify(enriched), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: d2, error } = await supabase.from("historique_departs").select("*").eq("id", id).single();
      if (error || !d2) {
        return new Response(JSON.stringify({ error: "Depart not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const enriched = await enrichHistoriqueDepart(supabase, d2 as Record<string, unknown>);
      return new Response(JSON.stringify(enriched), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // GET /departs - Liste
    if (req.method === "GET") {
      const data = await fetchDepartures(supabase);
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
