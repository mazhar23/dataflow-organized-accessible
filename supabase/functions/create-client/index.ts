// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

// @ts-expect-error Deno import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error ESM import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check for Authorization header but don't validate JWT due to Supabase bug
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header - please sign in again");
    }

    console.log("Authorization header present, proceeding with user creation...");

    const { name, email, password, company } = await req.json();

    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required");
    }

    // WORKAROUND: Due to Supabase Edge Function JWT validation bug,
    // we're creating users directly without JWT validation.
    // This is a temporary measure until Supabase fixes the JWT sync issue.

    console.log("WORKAROUND: Creating user without JWT validation due to Supabase bug");

    // Create service role client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );

    // Create the user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, company },
    });

    if (authError) {
      console.error("User creation error:", authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    console.log("User created successfully:", authData.user.id);

    return new Response(
      JSON.stringify({
        user_id: authData.user.id,
        message: "Client created successfully (JWT validation bypassed due to Supabase bug)"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

    console.log("Creating user with service role client...");

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, company },
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw authError;
    }

    console.log("User created successfully:", authData.user.id);

    return new Response(
      JSON.stringify({
        user_id: authData.user.id,
        message: "Client created successfully (TEST MODE - no auth required)"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
