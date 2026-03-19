// Supabase Edge Function for Single Lead Operations
// Handles GET /api/v1/leads/:id, PUT /api/v1/leads/:id, DELETE /api/v1/leads/:id

declare const Deno: any;

// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Create Supabase client with auth context
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {
                global: {
                    headers: { Authorization: req.headers.get("Authorization") ?? "" },
                },
            }
        );

        // Get user from auth context
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Extract lead ID from URL
        const url = new URL(req.url);
        const pathParts = url.pathname.split("/");
        const leadId = pathParts[pathParts.length - 1];

        if (!leadId || leadId === "leads-by-id") {
            return new Response(
                JSON.stringify({ error: "Lead ID is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // GET /api/v1/leads/:id - Get specific lead
        if (req.method === "GET") {
            const { data, error } = await supabaseClient
                .from("leads")
                .select("*")
                .eq("id", leadId)
                .single();

            if (error) {
                if (error.code === "PGRST116") {
                    return new Response(
                        JSON.stringify({ error: "Lead not found" }),
                        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ data }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // PUT /api/v1/leads/:id - Update lead
        if (req.method === "PUT") {
            const body = await req.json();

            // Remove fields that shouldn't be updated
            delete body.id;
            delete body.uploaded_at;
            delete body.order_id;

            const { data, error } = await supabaseClient
                .from("leads")
                .update(body)
                .eq("id", leadId)
                .select()
                .single();

            if (error) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({
                    data,
                    message: "Lead updated successfully",
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // DELETE /api/v1/leads/:id - Delete lead
        if (req.method === "DELETE") {
            const { error } = await supabaseClient
                .from("leads")
                .delete()
                .eq("id", leadId);

            if (error) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({
                    message: "Lead deleted successfully",
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Method not allowed
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
