import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound, Send } from "lucide-react";
import {
  PasswordStrengthMeter,
  isPasswordValid,
} from "@/components/PasswordStrengthMeter";

interface ClientInfo {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

interface AdminPasswordResetDialogProps {
  client: ClientInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminPasswordResetDialog({
  client,
  open,
  onOpenChange,
}: AdminPasswordResetDialogProps) {
  const { session } = useAuth();
  const [tab, setTab] = useState<string>("set-password");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setNewPassword("");
    setConfirmPassword("");
    setTab("set-password");
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const callEdgeFunction = async (body: Record<string, string>) => {
    const token = session?.access_token;
    if (!token) {
      toast.error("Session expired — please sign in again");
      return;
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-client-password`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  };

  const handleSetPassword = async () => {
    if (!client) return;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!isPasswordValid(newPassword)) {
      toast.error("Password does not meet complexity requirements");
      return;
    }

    setLoading(true);
    try {
      await callEdgeFunction({
        action: "direct_reset",
        user_id: client.user_id,
        new_password: newPassword,
      });
      toast.success(`Password updated for ${client.name}`);
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetLink = async () => {
    if (!client) return;

    setLoading(true);
    try {
      await callEdgeFunction({
        action: "send_reset_link",
        user_id: client.user_id,
      });
      toast.success(`Reset link sent to ${client.email}`);
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const canSubmitPassword = isPasswordValid(newPassword) && passwordsMatch;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            {client.name} — {client.email}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger id="tab-set-password" value="set-password">
              Set Password
            </TabsTrigger>
            <TabsTrigger id="tab-send-link" value="send-link">
              Send Reset Link
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Direct password set ─────────────────────────── */}
          <TabsContent value="set-password" className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-destructive mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <PasswordStrengthMeter password={newPassword} />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                id="btn-set-password"
                onClick={handleSetPassword}
                disabled={loading || !canSubmitPassword}
              >
                {loading ? "Updating…" : "Set Password"}
              </Button>
            </div>
          </TabsContent>

          {/* ── Tab 2: Send reset link ─────────────────────────────── */}
          <TabsContent value="send-link" className="space-y-4 pt-2">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground">
              A password reset email will be sent to{" "}
              <span className="font-medium text-foreground">
                {client.email}
              </span>
              . The client will be able to set their own new password.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                id="btn-send-reset-link"
                onClick={handleSendResetLink}
                disabled={loading}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? "Sending…" : "Send Link"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
