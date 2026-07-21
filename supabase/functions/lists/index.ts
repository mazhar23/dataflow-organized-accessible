// Supabase Edge Function for Lists API (Orders)
// Handles GET /api/v1/lists

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

        // GET /api/v1/lists - List all orders (called "lists" in API docs)
        if (req.method === "GET") {
            const url = new URL(req.url);
            const status = url.searchParams.get("status");
            const limit = parseInt(url.searchParams.get("limit") ?? "50");
            const offset = parseInt(url.searchParams.get("offset") ?? "0");

            let query = supabaseClient
                .from("orders")
                .select("*, profiles(name, email, company)", { count: "exact" })
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);

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

            // Transform data to match API expectations
            const transformedData = data?.map((order: any) => ({
                id: order.id,
                title: order.title,
                status: order.status,
                client: order.profiles,
                leads_per_day: order.leads_per_day,
                total_leads_ordered: order.total_leads_ordered,
                start_date: order.start_date,
                end_date: order.end_date,
                created_at: order.created_at,
            }));

            return new Response(
                JSON.stringify({
                    data: transformedData,
                    meta: {
                        total: count,
                        limit,
                        offset,
                    },
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
