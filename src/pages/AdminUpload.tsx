import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Papa from "papaparse";
import * as XLSX from "@e965/xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Check, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type ParsedRow = Record<string, string>;
type OrderOption = {
  id: string; title: string; total_leads_ordered: number; leads_per_day: number;
  client_name: string; client_id: string; vendor_id: string | null;
};

const REQUIRED_FIELDS = ["name", "email", "phone", "city", "status"] as const;
const VALID_STATUSES = ["Hot", "Warm", "Cold"];

export default function AdminUpload() {
  const { profileId } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"select-order" | "upload" | "map" | "preview" | "done">("select-order");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [todayUploaded, setTodayUploaded] = useState(0);
  const [todayTarget, setTodayTarget] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, title, total_leads_ordered, leads_per_day, client_id, vendor_id")
        .in("status", ["Pending", "In Progress"])
        .order("created_at", { ascending: false });

      if (!data) return;

      const clientIds = [...new Set(data.map((o) => o.client_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", clientIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      setOrders(
        data.map((o) => ({
          id: o.id,
          title: o.title,
          total_leads_ordered: o.total_leads_ordered,
          leads_per_day: o.leads_per_day,
          client_name: profileMap.get(o.client_id)?.name || profileMap.get(o.client_id)?.email || "Unknown",
          client_id: o.client_id,
          vendor_id: o.vendor_id,
        }))
      );
    };
    fetchOrders();
  }, []);

  // Pre-select order from URL query param (e.g. navigated from AdminClients)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    if (orderId && orders.length > 0) {
      const match = orders.find((o) => o.id === orderId);
      if (match) {
        setSelectedOrderId(orderId);
        setStep("upload");
      }
    }
  }, [location.search, orders]);

  // Fetch today's progress when order or delivery date changes
  useEffect(() => {
    if (!selectedOrderId || !deliveryDate) { setTodayUploaded(0); setTodayTarget(0); return; }
    const order = orders.find((o) => o.id === selectedOrderId);
    setTodayTarget(order?.leads_per_day ?? 0);

    const fetchTodayCount = async () => {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("order_id", selectedOrderId)
        .eq("delivery_date", deliveryDate);
      setTodayUploaded(count ?? 0);
    };
    fetchTodayCount();
  }, [selectedOrderId, deliveryDate, orders, step]);

  const autoMapHeaders = (detectedHeaders: string[]) => {
    const newMapping: Record<string, string> = {};
    const lowerHeaders = detectedHeaders.map((h) => h.toLowerCase().trim());
    
    const fieldPatterns: Record<string, string[]> = {
      name: ["name", "full name", "client name", "customer name", "fullname"],
      email: ["email", "e-mail", "email address", "mail"],
      phone: ["phone", "phone number", "mobile", "cell", "contact", "contact number"],
      city: ["city", "location", "town", "region", "state", "postcode", "zip"],
      status: ["status", "lead status", "state", "condition"],
    };

    REQUIRED_FIELDS.forEach((field) => {
      const patterns = fieldPatterns[field] || [field];
      const matchIndex = lowerHeaders.findIndex((h) => patterns.includes(h) || patterns.some((p) => h.includes(p)));
      
      if (matchIndex !== -1) {
        newMapping[field] = detectedHeaders[matchIndex];
      }
    });
    
    setMapping(newMapping);
  };

  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (results) => { 
          const detectedHeaders = results.meta.fields ?? [];
          setRawData(results.data as ParsedRow[]); 
          setHeaders(detectedHeaders); 
          autoMapHeaders(detectedHeaders);
          setStep("map"); 
        },
        error: () => toast.error("Failed to parse CSV file"),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: "" });
        const detectedHeaders = Object.keys(data[0] ?? {});
        setRawData(data); 
        setHeaders(detectedHeaders); 
        autoMapHeaders(detectedHeaders);
        setStep("map");
      };
      reader.readAsArrayBuffer(file);
    } else { toast.error("Only .csv and .xlsx files are supported"); }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) parseFile(file); }, [parseFile]);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) parseFile(file); };

  const mappedData = rawData.map((row) => {
    const mapped: Record<string, string> = {};
    for (const field of REQUIRED_FIELDS) { const src = mapping[field]; mapped[field] = src ? (row[src] ?? "") : ""; }
    if (mapped.status) { const s = mapped.status.charAt(0).toUpperCase() + mapped.status.slice(1).toLowerCase(); mapped.status = VALID_STATUSES.includes(s) ? s : "Cold"; }
    else { mapped.status = "Cold"; }
    return mapped;
  });

  const allMapped = REQUIRED_FIELDS.every((f) => mapping[f]);
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleConfirmUpload = async () => {
    if (!profileId || !selectedOrderId || !selectedOrder) return;
    setUploading(true);
    try {
      const leadsToInsert = mappedData.map((row) => ({
        name: row.name,
        email: row.email || null,
        phone: row.phone || null,
        city: row.city || null,
        status: row.status,
        order_id: selectedOrderId,
        client_id: selectedOrder.client_id,
        vendor_id: selectedOrder.vendor_id,
        delivery_date: deliveryDate,
      }));

      const { error: leadsError } = await supabase.from("leads").insert(leadsToInsert);
      if (leadsError) throw leadsError;

      const { error: logError } = await supabase.from("uploads_log").insert({
        order_id: selectedOrderId,
        file_name: fileName,
        record_count: leadsToInsert.length,
        delivery_date: deliveryDate,
        uploaded_by: profileId,
      });
      if (logError) throw logError;

      // Notify the client
      await supabase.from("notifications").insert({
        user_profile_id: selectedOrder.client_id,
        title: "New leads delivered",
        message: `${leadsToInsert.length} leads uploaded for "${selectedOrder.title}" (${deliveryDate}).`,
      });

      setStep("done");
      toast.success(`Successfully delivered ${leadsToInsert.length} leads!`);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally { setUploading(false); }
  };

  const reset = () => { setRawData([]); setHeaders([]); setMapping({}); setStep("select-order"); setFileName(""); setSelectedOrderId(""); };

  const todayPct = todayTarget > 0 ? Math.min(Math.round((todayUploaded / todayTarget) * 100), 100) : 0;

  return (
    <AdminLayout title="Upload Leads">
      {step === "select-order" && (
        <Card className="glass-card border-border/50 max-w-2xl mx-auto">
          <CardHeader><CardTitle>Select Order to Deliver Against</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active orders. Create an order first.</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Order</Label>
                  <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                    <SelectTrigger><SelectValue placeholder="Select an order..." /></SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => <SelectItem key={o.id} value={o.id}>{o.client_name} — {o.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Delivery Date</Label>
                  <Input autoComplete="off" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Which day's quota do these leads belong to?</p>
                </div>

                {selectedOrderId && todayTarget > 0 && (
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Today's progress</span>
                      <span className="font-medium">
                        Uploaded <span className={todayUploaded >= todayTarget ? "text-emerald-400" : "text-foreground"}>{todayUploaded}</span> of {todayTarget} leads
                      </span>
                    </div>
                    <Progress value={todayPct} className="h-2.5" />
                    {todayUploaded >= todayTarget && (
                      <p className="text-xs text-emerald-400 font-medium">✓ Today's quota met!</p>
                    )}
                  </div>
                )}

                <Button disabled={!selectedOrderId} onClick={() => setStep("upload")}>Continue to Upload</Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === "upload" && (
        <Card className="glass-card border-border/50 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Upload for: {selectedOrder?.client_name} — {selectedOrder?.title}</CardTitle>
            {todayTarget > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Today: {todayUploaded}/{todayTarget} leads uploaded
              </p>
            )}
          </CardHeader>
          <CardContent className="p-8">
            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-muted/20"}`}>
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-display font-semibold text-lg mb-1">Drop your file here</p>
              <p className="text-sm text-muted-foreground">or click to browse — CSV, XLSX supported</p>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
            </div>
          </CardContent>
        </Card>
      )}

      {step === "map" && (
        <Card className="glass-card border-border/50 max-w-3xl mx-auto">
          <CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" />Map Columns — {fileName}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Map each field to a column from your file ({rawData.length} rows detected).</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {REQUIRED_FIELDS.map((field) => (
                <div key={field} className="space-y-1.5">
                  <label className="text-sm font-medium capitalize">{field}</label>
                  <Select value={mapping[field] ?? ""} onValueChange={(v) => setMapping((m) => ({ ...m, [field]: v }))}>
                    <SelectTrigger className="bg-muted/50 border-border/50"><SelectValue placeholder="Select column..." /></SelectTrigger>
                    <SelectContent>{headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button disabled={!allMapped} onClick={() => setStep("preview")}>Preview Data</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-primary" />Preview — {mappedData.length} records for {selectedOrder?.client_name}</CardTitle>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("map")}><X className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={handleConfirmUpload} disabled={uploading}><Check className="h-4 w-4 mr-1" /> {uploading ? "Uploading..." : "Confirm Upload"}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader><TableRow className="border-border/50">{REQUIRED_FIELDS.map((f) => <TableHead key={f} className="capitalize">{f}</TableHead>)}</TableRow></TableHeader>
                <TableBody>
                  {mappedData.slice(0, 100).map((row, i) => (
                    <TableRow key={i} className="border-border/50">
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground">{row.email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{row.phone || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{row.city || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={row.status === "Hot" ? "bg-red-500/15 text-red-400 border-red-500/30" : row.status === "Warm" ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}>{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {mappedData.length > 100 && <p className="text-xs text-muted-foreground text-center py-3">Showing first 100 of {mappedData.length} rows</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card className="glass-card border-border/50 max-w-md mx-auto text-center">
          <CardContent className="p-10">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4"><Check className="h-8 w-8 text-emerald-400" /></div>
            <h2 className="font-display text-2xl font-bold mb-2">Delivery Complete!</h2>
            <p className="text-muted-foreground mb-6">{mappedData.length} leads from <span className="font-medium text-foreground">{fileName}</span> delivered to {selectedOrder?.client_name}.</p>
            <Button onClick={reset}>Upload Another File</Button>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
