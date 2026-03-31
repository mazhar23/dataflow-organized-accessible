import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Plus, Trash2, ChevronDown, Package } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Progress } from "@/components/ui/progress";

type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company: string | null;
  created_at: string;
};

type ClientOrder = {
  id: string;
  title: string;
  total_leads_ordered: number;
  leads_per_day: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  delivered: number;
};

const statusColors: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "In Progress": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export default function AdminClients() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientOrders, setClientOrders] = useState<Record<string, ClientOrder[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const [creating, setCreating] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or("role.eq.client,role.is.null")
      .order("created_at", { ascending: false });
    setClients(data ?? []);
    setLoading(false);

    // Fetch orders for all clients
    if (data && data.length > 0) {
      const clientIds = data.map((c) => c.id);
      const { data: orders } = await supabase.from("orders").select("*").in("client_id", clientIds).order("created_at", { ascending: false });
      
      if (orders && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const { data: leads } = await supabase.from("leads").select("order_id").in("order_id", orderIds);
        const deliveredMap: Record<string, number> = {};
        leads?.forEach((l) => { deliveredMap[l.order_id] = (deliveredMap[l.order_id] || 0) + 1; });

        const grouped: Record<string, ClientOrder[]> = {};
        orders.forEach((o) => {
          if (!grouped[o.client_id]) grouped[o.client_id] = [];
          grouped[o.client_id].push({
            id: o.id,
            title: o.title,
            total_leads_ordered: o.total_leads_ordered,
            leads_per_day: o.leads_per_day,
            status: o.status,
            start_date: o.start_date,
            end_date: o.end_date,
            delivered: deliveredMap[o.id] || 0,
          });
        });
        setClientOrders(grouped);
      }
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleCreateClient = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-client", {
        body: { name: form.name, email: form.email, password: form.password, company: form.company || null },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Client ${form.name} created successfully`);
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", company: "" });
      // Wait briefly for trigger to create profile
      setTimeout(fetchClients, 1000);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create client");
    } finally {
      setCreating(false);
    }
  };

  const deleteClient = async (c: ClientRow) => {
    const { error } = await supabase.from("profiles").delete().eq("id", c.id);
    if (error) toast.error("Failed to remove client");
    else { setClients((prev) => prev.filter((x) => x.id !== c.id)); toast.success("Client removed"); }
  };

  return (
    <AdminLayout title="Clients">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Clients — {clients.length} registered
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Create Client</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm" aria-describedby={undefined}>
                <DialogHeader><DialogTitle>Create Client</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="client-name">Full Name</Label>
                    <Input id="client-name" name="name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-company">Company (optional)</Label>
                    <Input id="client-company" name="company" autoComplete="organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-email">Email</Label>
                    <Input id="client-email" type="email" name="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-password">Password</Label>
                    <Input id="client-password" type="password" name="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
                  </div>
                  <Button onClick={handleCreateClient} disabled={creating} className="w-full">
                    {creating ? "Creating..." : "Create Client"}
                  </Button>
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
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton columns={7} rows={5} />
                ) : clients.length === 0 ? (
                  <TableRow><TableCell colSpan={7}><EmptyState title="No clients" description="Create a client to get started." /></TableCell></TableRow>
                ) : (
                  clients.map((c) => {
                    const orders = clientOrders[c.id] ?? [];
                    const isExpanded = expandedClient === c.id;
                    return (
                      <>
                        <TableRow key={c.id} className="border-border/50 group">
                          <TableCell>
                            {orders.length > 0 && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedClient(isExpanded ? null : c.id)}>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{c.name || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{c.email}</TableCell>
                          <TableCell className="text-muted-foreground">{c.company || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border/50">
                              {orders.length} order{orders.length !== 1 ? "s" : ""}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(c.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => deleteClient(c)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && orders.length > 0 && (
                          <TableRow key={`${c.id}-orders`} className="border-border/50 bg-muted/10">
                            <TableCell colSpan={7} className="p-0">
                              <div className="px-8 py-3 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                  <Package className="h-3 w-3" /> Orders for {c.name}
                                </p>
                                <div className="space-y-2">
                                  {orders.map((o) => {
                                    const pct = o.total_leads_ordered > 0 ? Math.round((o.delivered / o.total_leads_ordered) * 100) : 0;
                                    return (
                                      <div key={o.id} className="flex items-center gap-4 rounded-lg border border-border/30 bg-background/50 p-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{o.title}</span>
                                            <Badge variant="outline" className={`text-[10px] ${statusColors[o.status]}`}>{o.status}</Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground mt-0.5">
                                            {o.leads_per_day}/day • {o.start_date && o.end_date ? `${format(new Date(o.start_date), "MMM d")} – ${format(new Date(o.end_date), "MMM d")}` : "No dates"}
                                          </p>
                                        </div>
                                        <div className="w-32 space-y-1 text-right">
                                          <p className="text-xs text-muted-foreground">{o.delivered}/{o.total_leads_ordered} ({pct}%)</p>
                                          <Progress value={pct} className="h-1.5" />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
