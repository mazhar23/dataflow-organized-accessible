import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Store, Plus, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";

type Vendor = { id: string; name: string; contact: string | null; created_at: string };

export default function AdminVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState({ name: "", contact: "" });
  const [saving, setSaving] = useState(false);

  const fetchVendors = async () => {
    const { data } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
    setVendors(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchVendors(); }, []);

  const openCreate = () => {
    setEditingVendor(null);
    setForm({ name: "", contact: "" });
    setDialogOpen(true);
  };

  const openEdit = (v: Vendor) => {
    setEditingVendor(v);
    setForm({ name: v.name, contact: v.contact || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Vendor name is required"); return; }
    setSaving(true);

    if (editingVendor) {
      const { error } = await supabase.from("vendors").update({ name: form.name, contact: form.contact || null }).eq("id", editingVendor.id);
      setSaving(false);
      if (error) toast.error("Failed to update vendor");
      else { toast.success("Vendor updated"); setDialogOpen(false); fetchVendors(); }
    } else {
      const { error } = await supabase.from("vendors").insert({ name: form.name, contact: form.contact || null });
      setSaving(false);
      if (error) toast.error("Failed to create vendor");
      else { toast.success("Vendor added"); setDialogOpen(false); fetchVendors(); }
    }
  };

  const deleteVendor = async (id: string) => {
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) toast.error("Failed to delete vendor");
    else { setVendors((prev) => prev.filter((v) => v.id !== id)); toast.success("Vendor deleted"); }
  };

  return (
    <AdminLayout title="Vendors">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" />Vendors — {vendors.length} total</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Add Vendor</Button></DialogTrigger>
              <DialogContent className="max-w-sm" aria-describedby={undefined}>
                <DialogHeader><DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input autoComplete="organization" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sharma Data Co." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact (optional)</Label>
                    <Input autoComplete="tel" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Phone or email" />
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? "Saving..." : editingVendor ? "Update Vendor" : "Add Vendor"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton columns={4} rows={4} />
                ) : vendors.length === 0 ? (
                  <TableRow><TableCell colSpan={4}><EmptyState title="No vendors" description="Add your lead suppliers here." /></TableCell></TableRow>
                ) : (
                  vendors.map((v) => (
                    <TableRow key={v.id} className="border-border/50 group">
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell className="text-muted-foreground">{v.contact || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(v.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => deleteVendor(v.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
