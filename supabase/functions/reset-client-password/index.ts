// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

// @ts-expect-error Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error ESM import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Server-side password complexity validation (mirrors front-end rules). */
function validatePasswordComplexity(
  password: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Minimum 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least 1 uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least 1 lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("At least 1 digit");
  if (!/[!@#$%^&*()_+\-=]/.test(password))
    errors.push("At least 1 special character");
  return { valid: errors.length === 0, errors };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. Verify Authorization header ──────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Missing or malformed Authorization header");
    }
    const jwt = authHeader.replace("Bearer ", "");

    // ── 2. Build Supabase clients ───────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Admin client – uses service role for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // User-scoped client – uses the caller's JWT to verify identity
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 3. Identify the caller and verify admin role ────────────────────
    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseUser.auth.getUser();

    if (callerError || !caller) {
      throw new Error("Invalid or expired token");
    }

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden – admin role required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // ── 4. Parse request body ───────────────────────────────────────────
    const { action, user_id, new_password } = await req.json();

    if (!action || !user_id) {
      throw new Error("'action' and 'user_id' are required");
    }

    // Prevent admin from resetting their own password through this endpoint
    if (user_id === caller.id) {
      throw new Error("Cannot reset your own password via this endpoint");
    }

    // Verify target user exists and is not an admin
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("role, email")
      .eq("user_id", user_id)
      .single();

    if (targetError || !targetProfile) {
      throw new Error("Target user not found");
    }

    if (targetProfile.role === "admin") {
      throw new Error("Cannot reset another admin's password");
    }

    // Extract client IP for audit logging
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;

    // ── 5. Execute the requested action ─────────────────────────────────
    if (action === "direct_reset") {
      if (!new_password) {
        throw new Error("'new_password' is required for direct_reset");
      }

      // Validate password complexity server-side
      const validation = validatePasswordComplexity(new_password);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            error: "Password does not meet complexity requirements",
            details: validation.errors,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 422 }
        );
      }

      // Update the user's password
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password: new_password,
        });

      if (updateError) {
        console.error("Password update error:", updateError);
        throw new Error(`Failed to update password: ${updateError.message}`);
      }

      // Write audit log
      await supabaseAdmin.from("admin_audit_log").insert({
        admin_user_id: caller.id,
        target_user_id: user_id,
        action: "direct_reset",
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ message: "Password updated successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (action === "send_reset_link") {
      // Generate a recovery link and send it to the client's email
      const { error: linkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: targetProfile.email,
        });

      if (linkError) {
        console.error("Generate link error:", linkError);
        throw new Error(`Failed to send reset link: ${linkError.message}`);
      }

      // Write audit log
      await supabaseAdmin.from("admin_audit_log").insert({
        admin_user_id: caller.id,
        target_user_id: user_id,
        action: "send_reset_link",
        ip_address: clientIp,
      });

      return new Response(
        JSON.stringify({ message: "Password reset link sent successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error(
      "Invalid action. Use 'direct_reset' or 'send_reset_link'."
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("reset-client-password error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
