import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, TrendingUp, Upload, AlertTriangle, Users } from "lucide-react";
import { format, isWeekend } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

type OrderWithClient = {
  id: string;
  title: string;
  client_id: string;
  leads_per_day: number;
  status: string;
  client_name: string;
  client_email: string;
  todayDelivered: number;
};

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState(0);
  const [todayDelivered, setTodayDelivered] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<OrderWithClient[]>([]);
  const [overdueClients, setOverdueClients] = useState<OrderWithClient[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];
      const isTodayWeekend = isWeekend(new Date());

      // Active orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, title, client_id, leads_per_day, status")
        .eq("status", "In Progress");

      setActiveOrders(orders?.length ?? 0);

      if (!orders || orders.length === 0) {
        setLoading(false);
        return;
      }

      // Get client names
      const clientIds = [...new Set(orders.map((o) => o.client_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", clientIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      // Today's leads across all active orders
      const orderIds = orders.map((o) => o.id);
      const { data: todayLeads } = await supabase
        .from("leads")
        .select("order_id")
        .in("order_id", orderIds)
        .eq("delivery_date", today);

      const todayByOrder: Record<string, number> = {};
      todayLeads?.forEach((l) => { todayByOrder[l.order_id!] = (todayByOrder[l.order_id!] || 0) + 1; });
      setTodayDelivered(todayLeads?.length ?? 0);

      // Build order list with client info
      const enriched: OrderWithClient[] = orders.map((o) => {
        const profile = profileMap.get(o.client_id);
        return {
          ...o,
          client_name: profile?.name || "Unknown",
          client_email: profile?.email || "",
          todayDelivered: todayByOrder[o.id] || 0,
        };
      });

      // Pending = today's delivery not met (skip weekends)
      if (!isTodayWeekend) {
        setPendingUploads(enriched.filter((o) => o.todayDelivered < o.leads_per_day));
      }

      // Overdue = delivered 0 today and it's a weekday
      if (!isTodayWeekend) {
        setOverdueClients(enriched.filter((o) => o.todayDelivered === 0));
      }

      setLoading(false);
    };
    fetchStats();
  }, []);

  const stats = [
    { label: "Active Orders", value: activeOrders, icon: Package, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Leads Delivered Today", value: todayDelivered, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Pending Uploads Today", value: pendingUploads.length, icon: Upload, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Overdue Clients", value: overdueClients.length, icon: AlertTriangle, color: overdueClients.length > 0 ? "text-destructive" : "text-muted-foreground", bg: overdueClients.length > 0 ? "bg-destructive/10" : "bg-muted/10" },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card border-border/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                {loading ? <Skeleton className="h-7 w-12 mt-1" /> : <p className="text-2xl font-display font-bold">{s.value}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending uploads */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4 text-amber-400" />
              Pending Uploads Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : pendingUploads.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isWeekend(new Date()) ? "It's the weekend — no deliveries due." : "All deliveries are on track! 🎉"}
              </p>
            ) : (
              <div className="space-y-2">
                {pendingUploads.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-background/50 p-3 cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => navigate("/admin/upload")}
                  >
                    <div>
                      <p className="text-sm font-medium">{o.client_name}</p>
                      <p className="text-xs text-muted-foreground">{o.title}</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/30">
                      {o.todayDelivered}/{o.leads_per_day}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue clients */}
        <Card className={`glass-card ${overdueClients.length > 0 ? "border-destructive/30" : "border-border/50"}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${overdueClients.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              Overdue Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : overdueClients.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {isWeekend(new Date()) ? "Weekend — no deliveries tracked." : "No overdue deliveries! ✅"}
              </p>
            ) : (
              <div className="space-y-2">
                {overdueClients.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 cursor-pointer hover:bg-destructive/10 transition-colors"
                    onClick={() => navigate("/admin/upload")}
                  >
                    <div>
                      <p className="text-sm font-medium text-destructive">{o.client_name}</p>
                      <p className="text-xs text-muted-foreground">{o.title} — 0/{o.leads_per_day} delivered today</p>
                    </div>
                    <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">
                      Overdue
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Admin;
