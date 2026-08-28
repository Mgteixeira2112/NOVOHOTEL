import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json(500, { error: "AUTH_BRIDGE_NOT_CONFIGURED" });
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "INVALID_JSON" });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return json(400, { error: "CREDENTIALS_REQUIRED" });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: legacyUser, error: legacyError } = await admin
    .from("usuarios")
    .select("id,email,senha,ativo,auth_user_id")
    .ilike("email", email)
    .maybeSingle();

  if (legacyError) return json(500, { error: "LEGACY_USER_LOOKUP_FAILED" });
  if (!legacyUser || legacyUser.ativo === false) {
    return json(401, { error: "INVALID_CREDENTIALS" });
  }

  // Usuário já migrado: Supabase Auth passa a ser a única autoridade da senha.
  if (legacyUser.auth_user_id) {
    const { data: signIn, error: signInError } = await publicClient.auth.signInWithPassword({ email, password });
    if (signInError || !signIn.session) return json(401, { error: "INVALID_CREDENTIALS" });
    return json(200, {
      access_token: signIn.session.access_token,
      refresh_token: signIn.session.refresh_token,
      expires_at: signIn.session.expires_at,
      user_id: signIn.user.id,
      migrated: false,
    });
  }

  // Compatibilidade temporária: valida a senha legada somente no primeiro corte.
  if (!legacyUser.senha || String(legacyUser.senha) !== password) {
    return json(401, { error: "INVALID_CREDENTIALS" });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { legacy_user_id: legacyUser.id },
  });

  if (createError || !created.user) {
    return json(500, { error: "AUTH_USER_CREATE_FAILED" });
  }

  const { error: linkError } = await admin
    .from("usuarios")
    .update({ auth_user_id: created.user.id, senha: null })
    .eq("id", legacyUser.id)
    .is("auth_user_id", null);

  if (linkError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json(500, { error: "AUTH_USER_LINK_FAILED" });
  }

  const { data: signIn, error: signInError } = await publicClient.auth.signInWithPassword({ email, password });
  if (signInError || !signIn.session) return json(500, { error: "AUTH_SESSION_CREATE_FAILED" });

  return json(200, {
    access_token: signIn.session.access_token,
    refresh_token: signIn.session.refresh_token,
    expires_at: signIn.session.expires_at,
    user_id: signIn.user.id,
    migrated: true,
  });
});
