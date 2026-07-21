import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, Key, Send, Database, RefreshCw, AlertTriangle } from "lucide-react";
import intulistLogo from "@/assets/intulist-logo.svg";
import Footer from "@/components/Footer";

const endpoints = [
  { method: "POST", path: "/api/v1/leads", desc: "Submit a single lead or batch of leads to a specified list." },
  { method: "GET", path: "/api/v1/leads", desc: "Retrieve leads with filtering, pagination, and sorting options." },
  { method: "GET", path: "/api/v1/leads/:id", desc: "Fetch a specific lead record by its unique identifier." },
  { method: "PUT", path: "/api/v1/leads/:id", desc: "Update an existing lead record with new field values." },
  { method: "DELETE", path: "/api/v1/leads/:id", desc: "Remove a lead record from your account permanently." },
  { method: "GET", path: "/api/v1/lists", desc: "List all available data lists in your account with metadata." },
];

const methodColors: Record<string, string> = {
  GET: "bg-success/10 text-success",
  POST: "bg-primary/10 text-primary",
  PUT: "bg-amber-500/10 text-amber-500",
  DELETE: "bg-destructive/10 text-destructive",
};

const ApiDocs = () => (
  <div className="min-h-screen bg-background">
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/"><img src={intulistLogo} alt="Intulist" className="h-12" /></Link>
        <Link to="/"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
      </div>
    </nav>

    <main className="container max-w-4xl pt-28 pb-20 space-y-16">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">Test List API</h1>
        <p className="text-lg text-muted-foreground">Integrate Intulist into your stack with our RESTful API. Push, pull, and manage leads programmatically.</p>
      </div>

      {/* Auth */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold">Authentication</h2>
        </div>
        <p className="text-foreground/80 leading-relaxed">All API requests require a Bearer token in the <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">Authorization</code> header. Generate your API key from the Intulist dashboard under Settings → API Keys.</p>
        <div className="rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto">
          <span className="text-muted-foreground">Authorization:</span> Bearer your_api_key_here
        </div>
      </section>

      {/* Base URL */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold">Base URL</h2>
        </div>
        <div className="rounded-lg bg-muted p-4 font-mono text-sm">
          https://api.Intulist.com/v1
        </div>
      </section>

      {/* Endpoints */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Code className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold">Endpoints</h2>
        </div>
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div key={ep.method + ep.path} className="glass-card rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold font-mono w-fit ${methodColors[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-sm font-mono text-foreground">{ep.path}</code>
              <span className="text-sm text-muted-foreground sm:ml-auto">{ep.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Rate Limits */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold">Rate Limits</h2>
        </div>
        <p className="text-foreground/80 leading-relaxed">Free accounts are limited to 100 requests per minute. Paid accounts receive up to 1,000 requests per minute. Rate limit headers are included in every response.</p>
      </section>
    </main>
    <Footer />
  </div>
);

export default ApiDocs;
