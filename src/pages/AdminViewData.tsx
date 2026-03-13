import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Search, Database } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { PaginationControls } from "@/components/PaginationControls";

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

const statusColors: Record<string, string> = {
  Hot: "bg-red-500/15 text-red-400 border-red-500/30",
  Warm: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Cold: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const filters = ["All", "Hot", "Warm", "Cold"] as const;
const PAGE_SIZE = 20;

export default function AdminViewData() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [page, setPage] = useState(1);

  const fetchLeads = async () => {
    const { data } = await supabase.from("leads").select("*").order("uploaded_at", { ascending: false });
    setLeads(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) toast.error("Failed to delete lead");
    else { setLeads((prev) => prev.filter((l) => l.id !== id)); toast.success("Lead deleted"); }
  };

  const filtered = useMemo(() => {
    let result = leads;
    if (activeFilter !== "All") result = result.filter((l) => l.status === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q));
    }
    setPage(1);
    return result;
  }, [leads, activeFilter, search]);

  return (
    <AdminLayout title="View Data">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" />All Leads — {leads.length} total</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 bg-muted/50 border-border/50" />
            </div>
          </div>
        </CardHeader>
        <div className="flex items-center gap-2 px-6 pb-4">
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton columns={7} rows={6} />
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7}><EmptyState /></TableCell></TableRow>
                ) : (
                  filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((lead) => (
                    <TableRow key={lead.id} className="border-border/50 group">
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.email ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.phone ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.city ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className={statusColors[lead.status] ?? ""}>{lead.status}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{lead.delivery_date ? format(new Date(lead.delivery_date), "MMM d, yyyy") : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => handleDelete(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls page={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
