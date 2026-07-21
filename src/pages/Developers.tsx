import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Terminal, BookOpen, GitBranch, Webhook, Puzzle, Cpu } from "lucide-react";
import intulistLogo from "@/assets/intulist-logo.svg";
import Footer from "@/components/Footer";

const resources = [
  { icon: Terminal, title: "REST API", desc: "Full-featured RESTful API for programmatic access to all Intulist functionality. Supports JSON request and response formats.", link: "/api-docs" },
  { icon: Webhook, title: "Webhooks", desc: "Receive real-time HTTP callbacks when leads are created, updated, or routed. Configure endpoints and retry policies from the dashboard." },
  { icon: Puzzle, title: "SDKs & Libraries", desc: "Official client libraries for Node.js, Python, and PHP to speed up your integration. Available on npm, PyPI, and Packagist." },
  { icon: BookOpen, title: "Integration Guides", desc: "Step-by-step walkthroughs for connecting Intulist to Salesforce, HubSpot, Zapier, and other popular platforms." },
  { icon: GitBranch, title: "Code Samples", desc: "Ready-to-use examples in multiple languages covering common use cases like bulk import, routing, and real-time sync." },
  { icon: Cpu, title: "Sandbox Environment", desc: "Test your integrations in a safe sandbox with mock data before going live. No impact on production records." },
];

const Developers = () => (
  <div className="min-h-screen bg-background">
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/"><img src={intulistLogo} alt="Intulist" className="h-12" /></Link>
        <Link to="/"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
      </div>
    </nav>

    <main className="container max-w-4xl pt-28 pb-20 space-y-16">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">Developer Resources</h1>
        <p className="text-lg text-muted-foreground">Build powerful integrations with Intulist using our APIs, SDKs, and developer tools.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((r) => (
          <div key={r.title} className="glass-card rounded-xl p-6 space-y-3 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <r.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg">{r.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-8 text-center space-y-4">
        <h2 className="font-display text-xl font-semibold">Ready to integrate?</h2>
        <p className="text-muted-foreground">Start building with our API today—no credit card required.</p>
        <div className="flex justify-center gap-4">
          <Link to="/api-docs"><Button variant="hero" size="lg">View API Docs</Button></Link>
          <Link to="/register"><Button variant="heroOutline" size="lg">Create Account</Button></Link>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default Developers;
