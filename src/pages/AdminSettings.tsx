import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Bell, Database, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const [emailNotifs, setEmailNotifs] = useState({
    newUser: true,
    newUpload: true,
    weeklyDigest: false,
  });
  const [retentionDays, setRetentionDays] = useState("365");
  const [autoBackup, setAutoBackup] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Simulate saving — in production, persist to a settings table
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved successfully");
    }, 600);
  };

  return (
    <AdminLayout title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* Email Notifications */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Email Notifications
            </CardTitle>
            <CardDescription>Configure which events trigger email alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">New user registration</Label>
                <p className="text-xs text-muted-foreground">Get notified when a new user signs up.</p>
              </div>
              <Switch checked={emailNotifs.newUser} onCheckedChange={(v) => setEmailNotifs((s) => ({ ...s, newUser: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">New data upload</Label>
                <p className="text-xs text-muted-foreground">Alert when a CSV/XLSX file is uploaded.</p>
              </div>
              <Switch checked={emailNotifs.newUpload} onCheckedChange={(v) => setEmailNotifs((s) => ({ ...s, newUpload: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Weekly digest</Label>
                <p className="text-xs text-muted-foreground">Receive a weekly summary of activity.</p>
              </div>
              <Switch checked={emailNotifs.weeklyDigest} onCheckedChange={(v) => setEmailNotifs((s) => ({ ...s, weeklyDigest: v }))} />
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-primary" />
              Data Retention
            </CardTitle>
            <CardDescription>Control how long lead data is stored.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="font-medium">Retention period</Label>
                <p className="text-xs text-muted-foreground">Leads older than this will be flagged for review.</p>
              </div>
              <Select value={retentionDays} onValueChange={setRetentionDays}>
                <SelectTrigger className="w-40 bg-muted/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Automatic backups</Label>
                <p className="text-xs text-muted-foreground">Create daily backups of all lead data.</p>
              </div>
              <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Manage platform security settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Row-Level Security</Label>
                <p className="text-xs text-muted-foreground">RLS is enforced on all tables.</p>
              </div>
              <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">Active</span>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save All Settings"}
        </Button>
      </div>
    </AdminLayout>
  );
}
