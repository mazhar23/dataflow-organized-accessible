import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CloudUpload, GitBranch, ShieldCheck, BarChart3, Lock, Zap, RefreshCw, Globe, Database } from "lucide-react";
import dataflowLogo from "@/assets/dataflow-logo.png";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  { icon: CloudUpload, title: "Bulk Data Import", desc: "Upload CSV, JSON, or Excel files and let DataFlow automatically parse, validate, and organise your records in seconds." },
  { icon: GitBranch, title: "Smart Routing", desc: "Route data to CRMs, webhooks, or third-party APIs using visual, code-free conditional logic and retry policies." },
  { icon: ShieldCheck, title: "Multi-Layer Validation", desc: "Automatically cleanse, deduplicate, and enrich records through a three-stage validation pipeline." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track import volumes, rejection rates, and data quality scores with interactive dashboards and scheduled reports." },
  { icon: Lock, title: "Enterprise Security", desc: "AES-256 encryption at rest, TLS 1.3 in transit, role-based access control, and full audit logging." },
  { icon: Zap, title: "Instant API Builder", desc: "Generate RESTful endpoints for your datasets in minutes. Push and pull data programmatically with full documentation." },
  { icon: RefreshCw, title: "Automated Workflows", desc: "Schedule recurring imports, trigger notifications on data events, and automate repetitive data operations." },
  { icon: Globe, title: "Global CDN Delivery", desc: "Distribute data across edge locations worldwide for low-latency access regardless of your team's location." },
  { icon: Database, title: "Unlimited Storage", desc: "Scale from hundreds to millions of records without worrying about storage limits or performance degradation." },
];

const Features = () => (
  <div className="min-h-screen bg-background">
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/"><img src={dataflowLogo} alt="DataFlow" className="h-12" /></Link>
        <Link to="/"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
      </div>
    </nav>

    <main className="container max-w-5xl pt-28 pb-20 space-y-16">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">Everything You Need to Manage Data</h1>
        <p className="text-lg text-muted-foreground">DataFlow combines powerful ingestion, intelligent routing, and enterprise-grade security into one seamless platform.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="glass-card rounded-xl p-6 space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            custom={i}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <f.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <Link to="/register"><Button variant="success" size="lg">Get Started Free</Button></Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default Features;
