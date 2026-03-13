import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const SetupAdmin = () => {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("You must be logged in first.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("setup-admin", {
      body: { secret },
    });
    setLoading(false);

    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Setup failed");
      return;
    }

    toast.success("Admin account activated! Redirecting…");
    // Force re-fetch profile by reloading
    setTimeout(() => window.location.href = "/admin", 1000);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="font-display text-2xl font-bold">Admin Setup</h1>
          <p className="text-muted-foreground">
            You need to create an account and log in first before you can activate admin access.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/register")}>Sign Up</Button>
            <Button onClick={() => navigate("/login")}>Log In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h1 className="mt-4 font-display text-3xl font-bold">Admin Setup</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the setup secret to activate your admin account. This only works once—when no admin exists yet.
          </p>
        </div>

        <form onSubmit={handleSetup} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="secret">Setup Secret</Label>
            <Input
              id="secret"
              type="password"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter setup secret"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Activating…" : "Activate Admin"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SetupAdmin;
