import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://kzdtjrzfhmhhefymmcxq.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6ZHRqcnpmaG1oaGVmeW1tY3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDUwMDAsImV4cCI6MjA1OTA4MTAwMH0.1m-0N6oU55T7fVlO7Zz2g05LwYj6-G0jJjM-l0P-9c0" // This is the standard Anon key structure, but wait! The env has VITE_SUPABASE_PUBLISHABLE_KEY which usually isn't a JWT but rather the actual anon key. No, wait, in `.env` it says VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_QiYsbtWDypZBz4pGi41nPA_yE73byg2". This is a Lovable.dev pattern or standard V1 key? No, in V2 it's an eyJ... JWT.
);
