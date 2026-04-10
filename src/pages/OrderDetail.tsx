import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Download, CalendarDays, Store, FileDown, CheckCircle2, Clock, RefreshCw, FileSpreadsheet } from "lucide-react";
import * as XLSX from "@e965/xlsx";
import { format, addDays, isWeekend, isBefore, isAfter, isToday, parseISO } from "date-fns";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { PaginationControls } from "@/components/PaginationControls";
import { NotificationBell } from "@/components/NotificationBell";

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string;
  uploaded_at: string;
  delivery_date: string | null;
};

type Order = {
  id: string;
  title: string;
  total_leads_ordered: number;
  leads_per_day: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  vendor_id: string | null;
};

type DayRow = {
  date: string;
  leadsDue: number;
  leadsDelivered: number;
  status: "done" | "partial" | "pending";
};

const statusColors: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "In Progress": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Completed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const leadStatusColors: Record<string, string> = {
  Hot: "bg-red-500/15 text-red-400 border-red-500/30",
  Warm: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Cold: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const PAGE_SIZE = 25;

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState<string>("all");

  const fetchData = async () => {
    if (!orderId) return;
    const [orderRes, leadsRes] = await Promise.all([
      supabase.from("orders").select("*").eq("id", orderId).single(),
      supabase.from("leads").select("*").eq("order_id", orderId).order("uploaded_at", { ascending: false }),
    ]);
    setOrder(orderRes.data);
    setLeads(leadsRes.data ?? []);

    if (orderRes.data?.vendor_id) {
      const { data: vendor } = await supabase.from("vendors").select("name").eq("id", orderRes.data.vendor_id).single();
      setVendorName(vendor?.name ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (!orderId) return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "leads",
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setLeads((prev) => [payload.new as Lead, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  // Day-wise delivery schedule
  const daySchedule = useMemo((): DayRow[] => {
    if (!order?.start_date || !order?.end_date) return [];

    const deliveredByDate: Record<string, number> = {};
    leads.forEach((l) => {
      const key = l.delivery_date ?? "Unknown";
      deliveredByDate[key] = (deliveredByDate[key] || 0) + 1;
    });

    const rows: DayRow[] = [];
    let current = parseISO(order.start_date);
    const end = parseISO(order.end_date);
    const today = new Date();

    while (!isAfter(current, end)) {
      if (!isWeekend(current)) {
        const dateStr = format(current, "yyyy-MM-dd");
        const delivered = deliveredByDate[dateStr] || 0;
        const due = order.leads_per_day;

        let status: DayRow["status"] = "pending";
        if (delivered >= due) {
          status = "done";
        } else if (delivered > 0) {
          status = "partial";
        } else if (isBefore(current, today) && !isToday(current)) {
          status = "partial"; // overdue with 0
        }

        rows.push({ date: dateStr, leadsDue: due, leadsDelivered: delivered, status });
      }
      current = addDays(current, 1);
    }
    return rows;
  }, [order, leads]);

  // Filtered leads
  const filtered = useMemo(() => {
    let result = leads;
    if (dateFilter !== "all") {
      result = result.filter((l) => l.delivery_date === dateFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.name.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q) || l.phone?.includes(q)
      );
    }
    return result;
  }, [leads, dateFilter, search]);

  const exportCSV = () => {
    const data = filtered;
    const header = "Name,Email,Phone,City,Status,Delivery Date,Generated on\n";
    const rows = data
      .map((l) =>
        [l.name, l.email ?? "", l.phone ?? "", l.city ?? "", l.status, l.delivery_date ?? "", format(new Date(l.uploaded_at), "yyyy-MM-dd")].join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${order?.title ?? "leads"}${dateFilter !== "all" ? `-${dateFilter}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const data = filtered.map((l) => ({
      Name: l.name,
      Email: l.email ?? "",
      Phone: l.phone ?? "",
      City: l.city ?? "",
      Status: l.status,
      "Delivery Date": l.delivery_date ?? "",
      "Generated on": format(new Date(l.uploaded_at), "yyyy-MM-dd"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `${order?.title ?? "leads"}${dateFilter !== "all" ? `-${dateFilter}` : ""}.xlsx`);
  };

  const delivered = leads.length;
  const pct = order && order.total_leads_ordered > 0 ? Math.round((delivered / order.total_leads_ordered) * 100) : 0;

  const dayStatusIcon = (status: DayRow["status"]) => {
    switch (status) {
      case "done": return <span className="flex items-center gap-1.5 text-emerald-400 font-medium"><CheckCircle2 className="h-4 w-4" /> Done</span>;
      case "partial": return <span className="flex items-center gap-1.5 text-amber-400 font-medium"><RefreshCw className="h-4 w-4" /> Partial</span>;
      case "pending": return <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4" /> Pending</span>;
    }
  };

  return (
    <DashboardLayout title="Order Details" searchValue={search} onSearchChange={setSearch} headerExtra={<NotificationBell />}>
      <Button variant="ghost" size="sm" className="mb-4 gap-2" onClick={() => navigate("/dashboard")}>
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Button>

      {loading ? (
        <Card className="glass-card border-border/50 p-6">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted/50 rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted/50 rounded animate-pulse" />
          </div>
        </Card>
      ) : !order ? (
        <EmptyState title="Order not found" description="This order doesn't exist or you don't have access." />
      ) : (
        <div className="space-y-6">
          {/* Order header */}
          <Card className="glass-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="font-display text-xl font-bold">{order.title}</h2>
                    <Badge variant="outline" className={statusColors[order.status] ?? ""}>{order.status}</Badge>
                  </div>
                  {vendorName && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                      <Store className="h-3.5 w-3.5" />
                      Data provided by: <span className="font-medium text-foreground">{vendorName}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                    <span>{order.leads_per_day} leads/day</span>
                    {order.start_date && order.end_date && (
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {format(new Date(order.start_date), "EEEE MMM d")} → {format(new Date(order.end_date), "EEEE MMM d, yyyy")}
                      </span>
                    )}
                    <span>Ordered {format(new Date(order.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2" disabled={filtered.length === 0}>
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportExcel} className="gap-2" disabled={filtered.length === 0}>
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                  </Button>
                </div>
              </div>
              <div className="mt-6 max-w-md">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Delivery Progress</span>
                  <span className="font-medium">{delivered} / {order.total_leads_ordered} leads ({pct}%)</span>
                </div>
                <Progress value={pct} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Day-wise delivery table */}
          {daySchedule.length > 0 && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Day-wise Delivery Schedule
                </CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Leads Due</TableHead>
                      <TableHead className="text-right">Leads Delivered</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {daySchedule.map((row) => (
                      <TableRow
                        key={row.date}
                        className={`border-border/50 cursor-pointer hover:bg-muted/20 ${dateFilter === row.date ? "bg-primary/5" : ""}`}
                        onClick={() => setDateFilter(dateFilter === row.date ? "all" : row.date)}
                      >
                        <TableCell className="font-medium">
                          {format(parseISO(row.date), "EEEE, MMM d")}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{row.leadsDue}</TableCell>
                        <TableCell className="text-right font-medium">{row.leadsDelivered}</TableCell>
                        <TableCell>{dayStatusIcon(row.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Leads table */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Leads {dateFilter !== "all" ? `for ${format(parseISO(dateFilter), "MMM d, yyyy")}` : ""} — {filtered.length} total
                </CardTitle>
                <div className="flex gap-2">
                  {dateFilter !== "all" && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDateFilter("all")}>
                      Show All
                    </Button>
                  )}
                  {dateFilter !== "all" && filtered.length > 0 && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={exportCSV}>
                        <FileDown className="h-3.5 w-3.5" /> CSV
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={exportExcel}>
                        <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivered On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <EmptyState title="No leads yet" description={dateFilter !== "all" ? "No leads for this date." : "Leads will appear here as they are delivered."} />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((lead) => (
                      <TableRow key={lead.id} className="border-border/50">
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell className="text-muted-foreground">{lead.email ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{lead.phone ?? "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{lead.city ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={leadStatusColors[lead.status] ?? ""}>{lead.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {lead.delivery_date ? format(parseISO(lead.delivery_date), "MMM d, yyyy") : format(new Date(lead.uploaded_at), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filtered.length > PAGE_SIZE && (
              <PaginationControls page={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
            )}
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
