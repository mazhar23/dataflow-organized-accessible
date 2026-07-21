// Supabase Edge Function for Leads API
// Handles GET /api/v1/leads and POST /api/v1/leads

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

        // GET /api/v1/leads - List leads with filtering
        if (req.method === "GET") {
            const url = new URL(req.url);
            const orderId = url.searchParams.get("order_id");
            const status = url.searchParams.get("status");
            const limit = parseInt(url.searchParams.get("limit") ?? "50");
            const offset = parseInt(url.searchParams.get("offset") ?? "0");

            let query = supabaseClient
                .from("leads")
                .select("*", { count: "exact" })
                .order("uploaded_at", { ascending: false })
                .range(offset, offset + limit - 1);

            if (orderId) {
                query = query.eq("order_id", orderId);
            }

            if (status) {
                query = query.eq("status", status);
            }

            const { data, error, count } = await query;

            if (error) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({
                    data,
                    meta: {
                        total: count,
                        limit,
                        offset,
                    },
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // POST /api/v1/leads - Create new lead(s)
        if (req.method === "POST") {
            const body = await req.json();
            const leads = Array.isArray(body) ? body : [body];

            // Validate required fields
            const requiredFields = ["name", "order_id"];
            for (const lead of leads) {
                for (const field of requiredFields) {
                    if (!lead[field]) {
                        return new Response(
                            JSON.stringify({ error: `Missing required field: ${field}` }),
                            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                        );
                    }
                }
            }

            // Add metadata
            const leadsToInsert = leads.map((lead) => ({
                ...lead,
                uploaded_at: new Date().toISOString(),
            }));

            const { data, error } = await supabaseClient
                .from("leads")
                .insert(leadsToInsert)
                .select();

            if (error) {
                return new Response(
                    JSON.stringify({ error: error.message }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({
                    data,
                    message: `${data.length} lead(s) created successfully`,
                }),
                { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
