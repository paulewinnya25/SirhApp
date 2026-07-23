// Edge Function Supabase - Admin portal API
// Déployer: npx supabase functions deploy admin --no-verify-jwt
// URLs: /functions/v1/admin/stats/overview, /admin/login-history, etc.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-client-info, apikey",
  "Access-Control-Max-Age": "86400",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getPathSegments(url: string): string[] {
  try {
    const path = new URL(url).pathname;
    const match = path.match(/\/functions\/v1\/admin(?:\/(.*))?$/);
    const subPath = match?.[1] || "";
    return subPath ? subPath.split("/").filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
}

async function handleStatsOverview(supabase: ReturnType<typeof createClient>) {
  let rhUsersStats = { total_users: 0, admins: 0, rh_users: 0 };
  try {
    const { data: users } = await supabase.from("users").select("role");
    if (users) {
      rhUsersStats = {
        total_users: users.length,
        admins: users.filter((u: any) => u.role === "admin").length,
        rh_users: users.filter((u: any) => u.role === "rh").length,
      };
    }
  } catch {
    /* table may not exist */
  }

  let employeesStats = {
    total_employees: 0,
    active: 0,
    inactive: 0,
    cdi: 0,
    cdd: 0,
    interns: 0,
  };
  let expiringContracts = 0;
  let departmentDistribution: { name: string; count: number }[] = [];
  let entityDistribution: { name: string; count: number }[] = [];
  let newEmployees = 0;

  try {
    const { data: employees } = await supabase.from("employees").select(
      "type_contrat, statut_employe, date_fin_contrat, functional_area, entity, created_at"
    );
    if (employees) {
      const today = new Date();
      const in30 = new Date();
      in30.setDate(today.getDate() + 30);
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);

      employeesStats = {
        total_employees: employees.length,
        active: employees.filter((e: any) => e.statut_employe === "Actif").length,
        inactive: employees.filter((e: any) => e.statut_employe === "Inactif").length,
        cdi: employees.filter((e: any) => e.type_contrat === "CDI").length,
        cdd: employees.filter((e: any) => e.type_contrat === "CDD").length,
        interns: employees.filter(
          (e: any) => e.type_contrat === "Stage" || e.type_contrat === "stage PNPE"
        ).length,
      };

      expiringContracts = employees.filter((e: any) => {
        if (!e.date_fin_contrat || e.type_contrat === "CDI") return false;
        const end = new Date(e.date_fin_contrat);
        return end >= today && end <= in30;
      }).length;

      const deptMap = new Map<string, number>();
      const entityMap = new Map<string, number>();
      for (const e of employees as any[]) {
        if (e.functional_area) {
          deptMap.set(e.functional_area, (deptMap.get(e.functional_area) || 0) + 1);
        }
        if (e.entity) {
          entityMap.set(e.entity, (entityMap.get(e.entity) || 0) + 1);
        }
        if (e.created_at && new Date(e.created_at) >= weekAgo) newEmployees++;
      }
      departmentDistribution = Array.from(deptMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      entityDistribution = Array.from(entityMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  } catch {
    /* ignore */
  }

  let employeeRequestsStats = { pending: 0, approved: 0, rejected: 0, total: 0 };
  try {
    const { data: requests } = await supabase.from("employee_requests").select("status");
    if (requests) {
      employeeRequestsStats = {
        total: requests.length,
        pending: requests.filter((r: any) => r.status === "pending").length,
        approved: requests.filter((r: any) => r.status === "approved").length,
        rejected: requests.filter((r: any) => r.status === "rejected").length,
      };
    }
  } catch {
    /* ignore */
  }

  let absencesStats = { total: 0, this_month: 0 };
  try {
    const { data: absences } = await supabase.from("absence").select("date_debut");
    if (absences) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      absencesStats = {
        total: absences.length,
        this_month: absences.filter(
          (a: any) => a.date_debut && new Date(a.date_debut) >= monthStart
        ).length,
      };
    }
  } catch {
    /* ignore */
  }

  let medicalVisitsStats = { total: 0, overdue: 0, upcoming_30_days: 0 };
  try {
    const { data: visits } = await supabase
      .from("visites_medicales")
      .select("date_prochaine_visite, statut");
    if (visits) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in30 = new Date(today);
      in30.setDate(today.getDate() + 30);
      medicalVisitsStats = {
        total: visits.length,
        overdue: visits.filter((v: any) => {
          if (v.statut !== "À venir" || !v.date_prochaine_visite) return false;
          return new Date(v.date_prochaine_visite) < today;
        }).length,
        upcoming_30_days: visits.filter((v: any) => {
          if (v.statut !== "À venir" || !v.date_prochaine_visite) return false;
          const d = new Date(v.date_prochaine_visite);
          return d >= today && d <= in30;
        }).length,
      };
    }
  } catch {
    /* ignore */
  }

  let newUsers = 0;
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: users } = await supabase.from("users").select("created_at");
    if (users) {
      newUsers = users.filter(
        (u: any) => u.created_at && new Date(u.created_at) >= weekAgo
      ).length;
    }
  } catch {
    /* ignore */
  }

  return {
    rh_portal: rhUsersStats,
    employee_portal: employeesStats,
    alerts: {
      expiring_contracts: expiringContracts,
      medical_visits_overdue: medicalVisitsStats.overdue,
      medical_visits_upcoming: medicalVisitsStats.upcoming_30_days,
    },
    requests: employeeRequestsStats,
    absences: absencesStats,
    medical_visits: medicalVisitsStats,
    distributions: {
      departments: departmentDistribution,
      entities: entityDistribution,
    },
    recent_activity: {
      new_employees: newEmployees,
      new_users: newUsers,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = getClient();
    const segments = getPathSegments(req.url);
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10) || 100, 1000);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10) || 0;

    // GET admin/stats/overview
    if (req.method === "GET" && segments[0] === "stats" && segments[1] === "overview") {
      return json(await handleStatsOverview(supabase));
    }

    // GET admin/login-history
    if (req.method === "GET" && segments[0] === "login-history") {
      let query = supabase.from("login_history").select("*");
      const userType = url.searchParams.get("userType");
      const userId = url.searchParams.get("userId");
      if (userType) query = query.eq("user_type", userType);
      if (userId) query = query.eq("user_id", userId);
      const { data, error } = await query
        .order("login_time", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) {
        // Table missing or column missing — return empty list for UI
        console.error("login-history error:", error.message);
        return json([]);
      }
      return json(data || []);
    }

    // GET admin/audit-logs/deletions
    if (
      req.method === "GET" &&
      segments[0] === "audit-logs" &&
      segments[1] === "deletions"
    ) {
      let query = supabase.from("audit_logs").select("*").eq("action_type", "delete");
      const entityType = url.searchParams.get("entityType");
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      if (entityType) query = query.eq("entity_type", entityType);
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) {
        console.error("audit deletions error:", error.message);
        return json([]);
      }
      return json(data || []);
    }

    // GET admin/audit-logs
    if (req.method === "GET" && segments[0] === "audit-logs") {
      let query = supabase.from("audit_logs").select("*");
      const actionType = url.searchParams.get("actionType");
      const entityType = url.searchParams.get("entityType");
      const userId = url.searchParams.get("userId");
      const startDate = url.searchParams.get("startDate");
      const endDate = url.searchParams.get("endDate");
      if (actionType) query = query.eq("action_type", actionType);
      if (entityType) query = query.eq("entity_type", entityType);
      if (userId) query = query.eq("user_id", userId);
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate);
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) {
        console.error("audit-logs error:", error.message);
        return json([]);
      }
      return json(data || []);
    }

    // GET admin/users/rh
    if (req.method === "GET" && segments[0] === "users" && segments[1] === "rh") {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, nom_prenom, first_name, last_name, role, created_at, last_login, status")
        .in("role", ["admin", "rh"])
        .order("created_at", { ascending: false });
      if (error) return json([]);
      return json(data || []);
    }

    // GET admin/users/all
    if (req.method === "GET" && segments[0] === "users" && segments[1] === "all") {
      const search = url.searchParams.get("search");
      const userType = url.searchParams.get("userType");
      const allUsers: any[] = [];

      if (userType !== "employee") {
        let rhQuery = supabase
          .from("users")
          .select(
            "id, email, first_name, last_name, nom_prenom, role, status, last_login, created_at"
          );
        if (search) {
          rhQuery = rhQuery.or(
            `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,nom_prenom.ilike.%${search}%`
          );
        }
        const { data: rhUsers } = await rhQuery
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        for (const row of rhUsers || []) {
          const fullName =
            (row as any).nom_prenom ||
            `${(row as any).first_name || ""} ${(row as any).last_name || ""}`.trim() ||
            (row as any).email;
          allUsers.push({
            ...row,
            user_type: "rh",
            identifier: (row as any).email,
            name: fullName,
            nom_prenom: fullName,
          });
        }
      }

      if (userType !== "rh") {
        let empQuery = supabase
          .from("employees")
          .select(
            "id, matricule, nom_prenom, email, poste_actuel, statut_employe, last_login, created_at"
          );
        if (search) {
          empQuery = empQuery.or(
            `matricule.ilike.%${search}%,nom_prenom.ilike.%${search}%,email.ilike.%${search}%`
          );
        }
        const { data: employees } = await empQuery
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        for (const row of employees || []) {
          allUsers.push({
            ...row,
            user_type: "employee",
            identifier: (row as any).matricule,
            role: "employee",
            status: (row as any).statut_employe,
            name: (row as any).nom_prenom,
          });
        }
      }

      return json(allUsers);
    }

    // GET admin/employees/active
    if (req.method === "GET" && segments[0] === "employees" && segments[1] === "active") {
      const { data, error } = await supabase
        .from("employees")
        .select(
          "id, matricule, nom_prenom, email, poste_actuel, functional_area, entity, type_contrat, date_entree, statut_employe"
        )
        .eq("statut_employe", "Actif")
        .order("nom_prenom", { ascending: true })
        .limit(100);
      if (error) return json([]);
      return json(data || []);
    }

    // PATCH admin/users/:userType/:userId/toggle-status
    if (
      req.method === "PATCH" &&
      segments[0] === "users" &&
      segments[3] === "toggle-status"
    ) {
      const userType = segments[1];
      const userId = segments[2];
      const body = await req.json().catch(() => ({}));
      const status = body.status;

      if (userType === "rh") {
        const { data, error } = await supabase
          .from("users")
          .update({ status })
          .eq("id", userId)
          .select("id, email, status")
          .maybeSingle();
        if (error) return json({ error: error.message }, 500);
        return json({ success: true, user: data });
      }

      if (userType === "employee") {
        const { data, error } = await supabase
          .from("employees")
          .update({ statut_employe: status })
          .eq("id", userId)
          .select("id, matricule, statut_employe")
          .maybeSingle();
        if (error) return json({ error: error.message }, 500);
        return json({ success: true, employee: data });
      }

      return json({ error: "Invalid user type" }, 400);
    }

    // DELETE admin/users/:userType/:userId
    if (req.method === "DELETE" && segments[0] === "users" && segments[1] && segments[2]) {
      const userType = segments[1];
      const userId = segments[2];

      if (userType === "rh") {
        const { error } = await supabase.from("users").delete().eq("id", userId);
        if (error) return json({ error: error.message }, 500);
        return json({ success: true });
      }

      if (userType === "employee") {
        const { error } = await supabase.from("employees").delete().eq("id", userId);
        if (error) return json({ error: error.message }, 500);
        return json({ success: true });
      }

      return json({ error: "Invalid user type" }, 400);
    }

    // POST admin/users/rh/:userId/reset-password
    // POST admin/users/employee/:userId/reset-password (frontend variant)
    if (
      req.method === "POST" &&
      segments[0] === "users" &&
      segments[3] === "reset-password"
    ) {
      const userType = segments[1];
      const userId = segments[2];
      const body = await req.json().catch(() => ({}));
      const newPassword = body.newPassword;
      if (!newPassword) return json({ error: "New password is required" }, 400);

      // Store plain for now if no bcrypt in Deno edge — prefer hashing via DB trigger if available
      // Minimal: update password field (same as many legacy paths in this project)
      if (userType === "rh") {
        const { data, error } = await supabase
          .from("users")
          .update({ password: newPassword, password_changed_at: new Date().toISOString() })
          .eq("id", userId)
          .select("id, email, role")
          .maybeSingle();
        if (error) return json({ error: error.message }, 500);
        return json({ success: true, message: "Password reset successfully", user: data });
      }

      if (userType === "employee") {
        const { data, error } = await supabase
          .from("employees")
          .update({ password: newPassword, password_initialized: true })
          .eq("id", userId)
          .select("id, matricule, nom_prenom, email")
          .maybeSingle();
        if (error) return json({ error: error.message }, 500);
        return json({ success: true, message: "Password reset successfully", employee: data });
      }

      return json({ error: "Invalid user type" }, 400);
    }

    return json({ error: "Not found", path: segments }, 404);
  } catch (err) {
    console.error("admin function error:", err);
    return json({ error: String(err) }, 500);
  }
});
