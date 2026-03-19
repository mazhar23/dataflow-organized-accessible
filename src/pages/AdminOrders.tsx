import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Package, Plus, Trash2 } from "lucide-react";
import { format, differenceInCalendarDays, isWeekend, addDays } from "date-fns";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";

type Profile = { id: string; name: string; email: string; company: string | null };
type Vendor = { id: string; name: string; contact: string | null };
type Order = {
  id: string;
  client_id: string;
  vendor_id: string | null;
  title: string;
  leads_per_day: number;
  total_leads_ordered: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "In Progress": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

function countWorkingDays(start: string, end: string): number {
  let count = 0;
  let current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    if (!isWeekend(current)) count++;
    current = addDays(current, 1);
  }
  return count;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Profile[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deliveredCounts, setDeliveredCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "", vendor_id: "", title: "", leads_per_day: "", start_date: "", end_date: "",
  });
  const [creating, setCreating] = useState(false);

  const autoTotal = useMemo(() => {
    const lpd = parseInt(form.leads_per_day) || 0;
    if (!form.start_date || !form.end_date || lpd === 0) return 0;
    return lpd * countWorkingDays(form.start_date, form.end_date);
  }, [form.leads_per_day, form.start_date, form.end_date]);

  const fetchData = async () => {
    const [ordersRes, clientsRes, vendorsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "client").order("name"),
      supabase.from("vendors").select("*").order("name"),
    ]);
    const ordersData = ordersRes.data ?? [];
    setOrders(ordersData);
    setClients(clientsRes.data ?? []);
    setVendors(vendorsRes.data ?? []);

    if (ordersData.length > 0) {
      const { data: leads } = await supabase.from("leads").select("order_id").in("order_id", ordersData.map((o) => o.id));
      const counts: Record<string, number> = {};
      leads?.forEach((l) => { counts[l.order_id] = (counts[l.order_id] || 0) + 1; });
      setDeliveredCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const vendorMap = new Map(vendors.map((v) => [v.id, v]));

  const handleCreate = async () => {
    if (!form.client_id || !form.title || !form.leads_per_day || !form.start_date || !form.end_date) {
      toast.error("All fields are required");
      return;
    }
    setCreating(true);
    const { data: newOrder, error } = await supabase.from("orders").insert({
      client_id: form.client_id,
      vendor_id: form.vendor_id || null,
      title: form.title,
      leads_per_day: parseInt(form.leads_per_day),
      total_leads_ordered: autoTotal,
      start_date: form.start_date,
      end_date: form.end_date,
      status: "Pending",
    }).select().single();
    setCreating(false);
    if (error) {
      toast.error("Failed to create order");
    } else {
      toast.success("Order created");
      // Notify the client
      await supabase.from("notifications").insert({
        user_profile_id: form.client_id,
        title: "New order created",
        message: `Your order "${form.title}" has been created with ${autoTotal} total leads (${form.leads_per_day}/day).`,
      });
      setDialogOpen(false);
      setForm({ client_id: "", vendor_id: "", title: "", leads_per_day: "", start_date: "", end_date: "" });
      fetchData();
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    // Get order details first to find the client
    const { data: order } = await supabase.from("orders").select("client_id, title").eq("id", orderId).single();
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success("Status updated");
      // Notify the client about status change
      if (order) {
        await supabase.from("notifications").insert({
          user_profile_id: order.client_id,
          title: "Order status updated",
          message: `Your order "${order.title}" status changed to "${status}".`,
        });
      }
      fetchData();
    }
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Order deleted"); setOrders((prev) => prev.filter((o) => o.id !== id)); }
  };

  return (
    <AdminLayout title="Orders">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Orders — {orders.length} total
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Create Order</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Create Order</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Client</Label>
                    <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name || c.email} {c.company ? `(${c.company})` : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Vendor</Label>
                    <Select value={form.vendor_id} onValueChange={(v) => setForm({ ...form, vendor_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
                      <SelectContent>
                        {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Package Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 50 Leads/Day - March" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Leads per Day</Label>
                    <Input type="number" value={form.leads_per_day} onChange={(e) => setForm({ ...form, leads_per_day: e.target.value })} placeholder="50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Start Date</Label>
                      <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>End Date</Label>
                      <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                    </div>
                  </div>
                  {autoTotal > 0 && (
                    <div className="rounded-lg bg-muted/50 p-3 text-sm">
                      <span className="text-muted-foreground">Total leads (auto-calculated): </span>
                      <span className="font-semibold text-foreground">{autoTotal}</span>
                      <span className="text-xs text-muted-foreground ml-1">({form.leads_per_day}/day × {countWorkingDays(form.start_date, form.end_date)} working days)</span>
                    </div>
                  )}
                  <Button onClick={handleCreate} disabled={creating} className="w-full">
                    {creating ? "Creating..." : "Create Order"}
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
                  <TableHead>Client</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Leads/Day</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Delivered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton columns={10} rows={5} />
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={10}><EmptyState title="No orders" description="Create an order for a client to get started." /></TableCell></TableRow>
                ) : (
                  orders.map((order) => {
                    const client = clientMap.get(order.client_id);
                    const vendor = order.vendor_id ? vendorMap.get(order.vendor_id) : null;
                    const delivered = deliveredCounts[order.id] || 0;
                    return (
                      <TableRow key={order.id} className="border-border/50 group">
                        <TableCell>
                          <p className="font-medium">{client?.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{client?.email}</p>
                        </TableCell>
                        <TableCell className="font-medium">{order.title}</TableCell>
                        <TableCell className="text-muted-foreground">{vendor?.name ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{order.leads_per_day}</TableCell>
                        <TableCell className="text-muted-foreground">{order.start_date ? format(new Date(order.start_date), "MMM d, yy") : "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{order.end_date ? format(new Date(order.end_date), "MMM d, yy") : "—"}</TableCell>
                        <TableCell className="font-medium">{order.total_leads_ordered}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{delivered}</span>
                            <Progress value={order.total_leads_ordered > 0 ? (delivered / order.total_leads_ordered) * 100 : 0} className="h-1.5 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <Badge variant="outline" className={`${statusColors[order.status]} border-0`}>{order.status}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {["Pending", "In Progress", "Completed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => deleteOrder(order.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
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
