import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CloudUpload, GitBranch, ShieldCheck, CreditCard, BarChart3, Lock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import intulistLogo from "@/assets/Intulist-logo.png";
import heroIllustration from "@/assets/hero-illustration.png";
import Footer from "@/components/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const Pricing = () => (
  <section id="pricing" className="py-28">
    <div className="container max-w-4xl">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Our Pricing</h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-lg">
          We have the fairest pricing in the industry. Everything is on a month-to-month basis, but more importantly — you only pay for what you use. Get a free account today and upgrade whenever you like.
        </p>
        <a
          href="#"
          className="inline-block mt-4 text-primary underline underline-offset-4 hover:text-primary/80 transition-colors text-sm font-medium"
        >
          View full pricing details
        </a>
      </motion.div>

      <motion.div
        className="glass-card rounded-2xl p-8 sm:p-10 max-w-md mx-auto text-center border-primary/20"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <span className="inline-block mb-3 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold uppercase tracking-wide">
          Start for free
        </span>
        <p className="text-muted-foreground text-sm mb-2">500 imports per month</p>
        <div className="flex items-baseline justify-center gap-1 mb-6">
          <span className="font-display text-5xl font-bold">$0</span>
          <span className="text-muted-foreground text-sm">/ month</span>
        </div>
        <ul className="space-y-3 text-sm text-foreground/80 mb-8">
          {["No credit card required", "Access to all features", "No commitment", "Upgrade any time"].map((item) => (
            <li key={item} className="flex items-center gap-2 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              {item}
            </li>
          ))}
        </ul>
        <Link to="/register">
          <Button variant="success" size="lg" className="w-full">
            Get Started Free
          </Button>
        </Link>
      </motion.div>
    </div>
  </section>
);


const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
    <div className="container flex h-16 items-center justify-between">
      <a href="/">
        <img src={intulistLogo} alt="Intulist" className="h-12" />
      </a>
      <div className="hidden md:flex items-center gap-8">
        {[
          { label: "Our Platform", href: "#our-platform" },
          { label: "Pricing", href: "#pricing" },
          { label: "Demo", href: "#demo" },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </a>
        ))}
        <Link to="/learn-more" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Learn More
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
        <Link to="/register"><Button variant="success" size="sm">SIGN UP</Button></Link>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="relative min-h-screen flex items-center hero-gradient pt-16">
    <div className="container grid lg:grid-cols-2 gap-12 items-center">
      <div className="text-center lg:text-left">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-block mb-6 px-4 py-1.5 rounded-full border border-border text-xs font-medium text-muted-foreground tracking-wide uppercase">
            Now in Public Beta
          </span>
        </motion.div>
        <motion.h1
          className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
        >
          Your leads.{" "}
          <span className="gradient-text">Organised.</span>{" "}
          Accessible.
        </motion.h1>
        <motion.p
          className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10"
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
        >
          Intulist gives your team a single source of truth—upload, search, and manage data with enterprise-grade security.
        </motion.p>
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          initial="hidden" animate="visible" variants={fadeUp} custom={3}
        >
          <Link to="/login"><Button variant="hero" size="lg">View Demo</Button></Link>
          <Link to="/login"><Button variant="heroOutline" size="lg">View Demo</Button></Link>
        </motion.div>
      </div>
      <motion.div
        className="hidden lg:flex items-center justify-center"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
      >
        <img src={heroIllustration} alt="Data management illustration" className="w-full max-w-lg" />
      </motion.div>
    </div>
  </section>
);


const capabilities = [
  { icon: CloudUpload, title: "Seamless Data Ingestion & Storage", desc: "Rely on our secure cloud infrastructure to house and organise every record you bring in.", detail: "Upload CSV, JSON, or Excel files and let Intulist automatically parse, validate, and store them in our high-availability cloud database. With built-in deduplication and schema detection, your data is ready to query in seconds—no manual mapping required." },
  { icon: GitBranch, title: "Intelligent Data Routing", desc: "Funnel your datasets to any endpoint, webhook, or third-party API with zero friction.", detail: "Configure routing rules to automatically distribute incoming records to CRMs, marketing platforms, or custom webhooks. Set up conditional logic, transformations, and retry policies—all from a visual interface, no code needed." },
  { icon: ShieldCheck, title: "Multi-Layer Data Cleansing", desc: "Leverage our automated validation pipeline to scrub, normalise, and enrich your records on import.", detail: "Our three-stage pipeline catches formatting errors, removes duplicates, and enriches records with missing fields using third-party data sources. Custom validation rules let you enforce business logic before data ever hits your database." },
  { icon: CreditCard, title: "Usage-Based Billing", desc: "Only spend on the volume you actually process—no subscriptions, no lock-in commitments.", detail: "Start free with 500 records per month, then pay per record as you scale. No setup fees, no annual contracts. Real-time usage dashboards let you track spend and set budget alerts so there are never surprises on your invoice." },
  { icon: BarChart3, title: "Actionable Analytics", desc: "Monitor every import, track conversion metrics, and measure the ROI of your data operations in real time.", detail: "Visualise import trends, rejection rates, and data quality scores with interactive charts. Build custom reports, schedule automated exports, and share dashboards with your team—all without leaving Intulist." },
  { icon: Lock, title: "Enterprise-Grade Protection", desc: "Your records sit behind AES-256 encryption at rest with strict access controls—built to be breach-resistant.", detail: "Every record is encrypted at rest with AES-256 and in transit with TLS 1.3. Role-based access control, audit logging, and SOC 2-aligned practices ensure your data meets the most stringent compliance requirements." },
];

const Capabilities = () => {
  const [selectedCapability, setSelectedCapability] = useState<typeof capabilities[0] | null>(null);

  return (
    <section className="py-28 bg-muted/20">
      <div className="container">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Unlock the full potential of your data
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Here's a glimpse of what Intulist puts at your fingertips. Explore further to see everything we offer.
          </p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((c, i) => (
            <motion.button
              key={c.title}
              className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors group text-left cursor-pointer"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeUp}
              custom={i}
              onClick={() => setSelectedCapability(c)}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{c.desc}</p>
              <span className="inline-flex items-center text-xs font-medium text-primary group-hover:gap-2 gap-1 transition-all">
                Learn more <ChevronRight className="w-3 h-3" />
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedCapability} onOpenChange={() => setSelectedCapability(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedCapability && (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <selectedCapability.icon className="w-6 h-6 text-primary" />
                </div>
                <DialogTitle className="font-display text-xl">{selectedCapability.title}</DialogTitle>
                <DialogDescription>{selectedCapability.desc}</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-foreground/80 leading-relaxed">{selectedCapability.detail}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};


const LandingPage = () => (
  <>
    <Navbar />
    <Hero />

    <Capabilities />
    <Pricing />
    <Footer />
  </>
);

export default LandingPage;
