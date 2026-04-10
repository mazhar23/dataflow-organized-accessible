import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, ClipboardList, Download, TrendingUp, ArrowRight, Store } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";

type Order = {
  id: string;
  title: string;
  leads_per_day: number;
  total_leads_ordered: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  vendor_id: string | null;
};

type Vendor = { id: string; name: string };

const statusConfig: Record<string, { classes: string; dot: string }> = {
  Pending: { classes: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  "In Progress": { classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  Completed: { classes: "bg-blue-500/15 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
};

const Dashboard = () => {
  const { profileId, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<Map<string, Vendor>>(new Map());
  const [deliveredCounts, setDeliveredCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    const ordersData = data ?? [];
    setOrders(ordersData);

    const vendorIds = [...new Set(ordersData.map((o) => o.vendor_id).filter(Boolean))] as string[];
    if (vendorIds.length > 0) {
      const { data: vendorData } = await supabase.from("vendors").select("id, name").in("id", vendorIds);
      setVendors(new Map(vendorData?.map((v) => [v.id, v]) ?? []));
    }

    if (ordersData.length > 0) {
      const orderIds = ordersData.map((o) => o.id);
      const { data: leads } = await supabase
        .from("leads")
        .select("order_id")
        .in("order_id", orderIds)
        .lte("uploaded_at", new Date().toISOString());
      const counts: Record<string, number> = {};
      leads?.forEach((l) => { counts[l.order_id!] = (counts[l.order_id!] || 0) + 1; });
      setDeliveredCounts(counts);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!profileId) return;
    fetchOrders();

    const channel = supabase
      .channel("client-dashboard")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "leads" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  const activeOrders = orders.filter((o) => o.status === "In Progress").length;
  const totalDelivered = Object.values(deliveredCounts).reduce((a, b) => a + b, 0);
  const totalOrdered = orders.reduce((sum, o) => sum + o.total_leads_ordered, 0);
  const userName = user?.user_metadata?.name || "there";

  const stats = [
    { label: "Total Orders", value: orders.length, icon: ClipboardList, color: "text-primary" },
    { label: "Active", value: activeOrders, icon: TrendingUp, color: "text-emerald-400" },
    { label: "Delivered", value: totalDelivered, icon: Download, color: "text-amber-400" },
    { label: "Ordered", value: totalOrdered, icon: Package, color: "text-blue-400" },
  ];

  return (
    <DashboardLayout title="My Orders" headerExtra={<NotificationBell />}>
      {/* Welcome banner */}
      {!loading && (
        <Card className="glass-card border-primary/20 bg-primary/5 mb-8">
          <CardContent className="p-5">
            <p className="font-display text-lg font-semibold">
              Welcome back, {userName} 👋
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You have <span className="font-medium text-foreground">{activeOrders} active order{activeOrders !== 1 ? "s" : ""}</span>.{" "}
              <span className="font-medium text-foreground">{totalDelivered}</span> of{" "}
              <span className="font-medium text-foreground">{totalOrdered}</span> leads delivered.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="glass-card border-border/50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center ${s.color}`}>
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

      {/* Order cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card border-border/50 p-6">
              <Skeleton className="h-6 w-48 mb-3" />
              <Skeleton className="h-4 w-32 mb-6" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Your orders will appear here once assigned by the admin." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => {
            const delivered = deliveredCounts[order.id] || 0;
            const pct = order.total_leads_ordered > 0 ? Math.round((delivered / order.total_leads_ordered) * 100) : 0;
            const vendor = order.vendor_id ? vendors.get(order.vendor_id) : null;
            const status = statusConfig[order.status] ?? statusConfig["Pending"];

            return (
              <Card
                key={order.id}
                className="glass-card border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/dashboard/orders/${order.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-lg truncate">{order.title}</h3>
                      {vendor && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5 shrink-0" />
                          {vendor.name}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={`${status.classes} shrink-0 ml-3`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot} mr-1.5`} />
                      {order.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-5">
                    {order.start_date && order.end_date ? (
                      <span>
                        {format(new Date(order.start_date), "EEEE MMM d")} → {format(new Date(order.end_date), "EEEE MMM d")}
                      </span>
                    ) : (
                      <span>Dates not set</span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{order.leads_per_day} leads/day</span>
                      <span className="font-medium">{delivered} / {order.total_leads_ordered}</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <p className="text-xs text-muted-foreground">{pct}% delivered</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <span className="text-xs text-muted-foreground">
                      Ordered {format(new Date(order.created_at), "MMM d, yyyy")}
                    </span>
                    <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      View Leads <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
