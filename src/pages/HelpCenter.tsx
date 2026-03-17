import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, MessageCircle, FileText, Video, HelpCircle, Mail } from "lucide-react";
import intulistLogo from "@/assets/intulist-logo.svg";
import Footer from "@/components/Footer";

const topics = [
  { icon: BookOpen, title: "Getting Started", desc: "Learn the basics of setting up your account, importing your first dataset, and navigating the dashboard." },
  { icon: FileText, title: "Data Import Guides", desc: "Step-by-step instructions for importing CSV, JSON, and Excel files with field mapping and validation." },
  { icon: MessageCircle, title: "API Documentation", desc: "Complete reference for the Intulist REST API including authentication, endpoints, and code samples." },
  { icon: Video, title: "Video Tutorials", desc: "Watch walkthrough videos covering everything from account setup to advanced routing configurations." },
  { icon: HelpCircle, title: "FAQs", desc: "Answers to the most commonly asked questions about billing, data security, limits, and integrations." },
  { icon: Mail, title: "Contact Support", desc: "Can't find what you need? Reach out to our support team and get a response within 24 hours." },
];

const HelpCenter = () => (
  <div className="min-h-screen bg-background">
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/"><img src={intulistLogo} alt="Intulist" className="h-12" /></Link>
        <Link to="/"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
      </div>
    </nav>

    <main className="container max-w-4xl pt-28 pb-20 space-y-16">
      <div className="text-center">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-lg text-muted-foreground">Find answers, guides, and resources to get the most out of Intulist.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((t) => (
          <div key={t.title} className="glass-card rounded-xl p-6 space-y-3 hover:border-primary/30 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <t.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg">{t.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-8 text-center space-y-4">
        <h2 className="font-display text-xl font-semibold">Still need help?</h2>
        <p className="text-muted-foreground">Our team is available Monday through Friday, 9 AM – 6 PM EST.</p>
        <Link to="/contact"><Button variant="hero" size="lg">Contact Support</Button></Link>
      </div>
    </main>
    <Footer />
  </div>
);

export default HelpCenter;
