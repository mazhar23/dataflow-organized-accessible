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
import { Upload, FileSpreadsheet, Check, X, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";

type ParsedRow = Record<string, string>;
type OrderOption = {
  id: string; title: string; total_leads_ordered: number; leads_per_day: number;
  client_name: string; client_id: string; vendor_id: string | null;
};

// These 9 fields have dedicated named columns in the DB and get an explicit mapping UI.
// Every other column from the file passes through automatically into `extra_data`.
const CORE_FIELDS = ["Bank", "FirstName", "LastName", "Address", "City", "State", "Zip", "Phone", "Email"] as const;
type CoreField = typeof CORE_FIELDS[number];

const FIELD_PATTERNS: Record<CoreField, string[]> = {
  Bank:      ["bank", "bank name", "financial institution", "financial"],
  FirstName: ["first name", "firstname", "first"],
  LastName:  ["last name", "lastname", "last"],
  Address:   ["address", "street", "street address"],
  City:      ["city", "location", "town"],
  State:     ["state", "province", "region"],
  Zip:       ["zip", "zip code", "zipcode", "postal", "postal code", "postcode"],
  Phone:     ["phone", "phone number", "mobile", "cell", "contact", "contact number"],
  Email:     ["email", "e-mail", "email address", "mail"],
};

export default function AdminUpload() {
  const { profileId } = useAuth();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  // mapping: CoreField -> source column name in the file
  const [mapping, setMapping] = useState<Partial<Record<CoreField, string>>>({});
  const [step, setStep] = useState<"select-order" | "upload" | "map" | "preview" | "done">("select-order");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [todayUploaded, setTodayUploaded] = useState(0);
  const [todayTarget, setTodayTarget] = useState(0);

  // ── orders fetch ────────────────────────────────────────────────────────────
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

  // Pre-select order from URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    if (orderId && orders.length > 0) {
      const match = orders.find((o) => o.id === orderId);
      if (match) { setSelectedOrderId(orderId); setStep("upload"); }
    }
  }, [location.search, orders]);

  // Today's progress
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

  // ── auto-map core fields ─────────────────────────────────────────────────────
  const autoMapHeaders = (detectedHeaders: string[]) => {
    const newMapping: Partial<Record<CoreField, string>> = {};
    const lowerHeaders = detectedHeaders.map((h) => h.toLowerCase().trim());

    CORE_FIELDS.forEach((field) => {
      const patterns = FIELD_PATTERNS[field];
      const matchIndex = lowerHeaders.findIndex((h) =>
        patterns.includes(h) || patterns.some((p) => h.includes(p))
      );
      if (matchIndex !== -1) {
        newMapping[field] = detectedHeaders[matchIndex];
      }
    });

    setMapping(newMapping);
  };

  // ── file parsing ─────────────────────────────────────────────────────────────
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
    } else {
      toast.error("Only .csv and .xlsx files are supported");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // ── data transformation ──────────────────────────────────────────────────────
  // Set of file-column names that are being used to satisfy a core field mapping.
  const usedSourceColumns = new Set(Object.values(mapping).filter(Boolean) as string[]);

  /**
   * For each raw row:
   *  - Map the 9 core fields from their assigned source columns.
   *  - Collect every remaining column into `extra_data`.
   */
  const mappedData = rawData.map((row) => {
    const result: Record<string, string | Record<string, string>> = {};

    // Core fields
    for (const field of CORE_FIELDS) {
      const src = mapping[field];
      result[field] = src ? (row[src] ?? "") : "";
    }

    // All extra columns not used by a core-field mapping
    const extra: Record<string, string> = {};
    for (const header of headers) {
      if (!usedSourceColumns.has(header)) {
        extra[header] = row[header] ?? "";
      }
    }
    if (Object.keys(extra).length > 0) {
      result.extra_data = extra;
    }

    return result;
  });

  // Columns for the preview table: core fields + sorted extra column names
  const extraColumnNames = headers.filter((h) => !usedSourceColumns.has(h));
  const previewColumns = [...CORE_FIELDS, ...extraColumnNames];

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const todayPct = todayTarget > 0 ? Math.min(Math.round((todayUploaded / todayTarget) * 100), 100) : 0;

  // ── upload ───────────────────────────────────────────────────────────────────
  const handleConfirmUpload = async () => {
    if (!profileId || !selectedOrderId || !selectedOrder) return;
    setUploading(true);
    try {
      const now = new Date();
      let lastUploadedAt = new Date(now.getTime() + 5 * 60000);

      const leadsToInsert = mappedData.map((row, index) => {
        if (index > 0) {
          const randomDelayMins = Math.floor(Math.random() * (11 - 5 + 1)) + 5;
          lastUploadedAt = new Date(lastUploadedAt.getTime() + randomDelayMins * 60000);
        }

        const coreRow = row as Record<string, string>;
        const extra = row.extra_data as Record<string, string> | undefined;

        return {
          name: [coreRow.FirstName, coreRow.LastName].filter(Boolean).join(" ") || "Unknown",
          first_name: coreRow.FirstName || null,
          last_name:  coreRow.LastName  || null,
          email:      coreRow.Email     || null,
          phone:      coreRow.Phone     || null,
          address:    coreRow.Address   || null,
          city:       coreRow.City      || null,
          state:      coreRow.State     || null,
          zip:        coreRow.Zip       || null,
          bank:       coreRow.Bank      || null,
          status:     "Cold",
          order_id:   selectedOrderId,
          client_id:  selectedOrder.client_id,
          vendor_id:  selectedOrder.vendor_id,
          delivery_date: deliveryDate,
          uploaded_at: lastUploadedAt.toISOString(),
          // Store all additional columns from the file — nothing is lost
          extra_data: extra && Object.keys(extra).length > 0 ? extra : null,
        };
      });

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

      await supabase.from("notifications").insert({
        user_profile_id: selectedOrder.client_id,
        title: "New leads delivered",
        message: `${leadsToInsert.length} leads uploaded for "${selectedOrder.title}" (${deliveryDate}).`,
      });

      setStep("done");
      toast.success(`Successfully delivered ${leadsToInsert.length} leads!`);
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setRawData([]); setHeaders([]); setMapping({});
    setStep("select-order"); setFileName(""); setSelectedOrderId("");
  };

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <AdminLayout title="Upload Leads">

      {/* STEP 1 — select order */}
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

      {/* STEP 2 — drop file */}
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
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-muted/20"}`}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-display font-semibold text-lg mb-1">Drop your file here</p>
              <p className="text-sm text-muted-foreground">or click to browse — CSV, XLSX supported</p>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3 — map core fields */}
      {step === "map" && (
        <Card className="glass-card border-border/50 max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Map Columns — {fileName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              {rawData.length} rows detected. Map the core fields below — all other columns are imported automatically.
            </p>

            {/* Info banner about auto-imported extras */}
            {extraColumnNames.length > 0 && (
              <div className="flex gap-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-300">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">{extraColumnNames.length} additional column{extraColumnNames.length > 1 ? "s" : ""} detected</span> and will be imported automatically:{" "}
                  <span className="font-mono text-xs">{extraColumnNames.join(", ")}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CORE_FIELDS.map((field) => (
                <div key={field} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">{field}</label>
                    {mapping[field]
                      ? <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/40">auto-matched</Badge>
                      : <Badge variant="outline" className="text-xs text-muted-foreground">optional</Badge>
                    }
                  </div>
                  <Select
                    value={mapping[field] ?? "__unmapped__"}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [field]: v === "__unmapped__" ? undefined : v }))}
                  >
                    <SelectTrigger className="bg-muted/50 border-border/50">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unmapped__">— Not mapped —</SelectItem>
                      {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              {/* Upload is never blocked — extras always come through even if core fields aren't mapped */}
              <Button onClick={() => setStep("preview")}>Preview Data</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4 — preview */}
      {step === "preview" && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Preview — {mappedData.length} records for {selectedOrder?.client_name}
                {extraColumnNames.length > 0 && (
                  <Badge variant="outline" className="text-xs ml-1">
                    {previewColumns.length} columns
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("map")}><X className="h-4 w-4 mr-1" /> Back</Button>
                <Button onClick={handleConfirmUpload} disabled={uploading}>
                  <Check className="h-4 w-4 mr-1" /> {uploading ? "Uploading..." : "Confirm Upload"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    {previewColumns.map((col, index) => (
                      <TableHead key={`${col}-${index}`} className={extraColumnNames.includes(col) ? "text-blue-400/80" : ""}>
                        {col}
                        {extraColumnNames.includes(col) && (
                          <span className="ml-1 text-[10px] font-normal opacity-60">extra</span>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedData.slice(0, 100).map((row, i) => {
                    const coreRow = row as Record<string, string>;
                    const extra = (row.extra_data ?? {}) as Record<string, string>;
                    return (
                      <TableRow key={i} className="border-border/50">
                        {CORE_FIELDS.map((field, idx) => (
                          <TableCell key={`${field}-${idx}`} className={field === "Bank" ? "font-medium" : ""}>
                            {coreRow[field] || <span className="text-muted-foreground/40">—</span>}
                          </TableCell>
                        ))}
                        {extraColumnNames.map((col, idx) => (
                          <TableCell key={`${col}-${idx}`} className="text-muted-foreground">
                            {extra[col] || <span className="opacity-40">—</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {mappedData.length > 100 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Showing first 100 of {mappedData.length} rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5 — done */}
      {step === "done" && (
        <Card className="glass-card border-border/50 max-w-md mx-auto text-center">
          <CardContent className="p-10">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Delivery Complete!</h2>
            <p className="text-muted-foreground mb-6">
              {mappedData.length} leads from <span className="font-medium text-foreground">{fileName}</span> delivered to {selectedOrder?.client_name}.
              {extraColumnNames.length > 0 && (
                <span className="block mt-1 text-xs text-blue-400">
                  Includes {extraColumnNames.length} extra column{extraColumnNames.length > 1 ? "s" : ""} stored in each record.
                </span>
              )}
            </p>
            <Button onClick={reset}>Upload Another File</Button>
          </CardContent>
        </Card>
      )}

    </AdminLayout>
  );
}
