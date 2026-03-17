import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import intulistLogo from "@/assets/intulist-logo.svg";
import Footer from "@/components/Footer";

const Contact = () => (
  <div className="min-h-screen bg-background">
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/"><img src={intulistLogo} alt="Intulist" className="h-12" /></Link>
        <Link to="/"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
      </div>
    </nav>

    <main className="container max-w-3xl pt-28 pb-20 space-y-12">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">Get in Touch</h1>
        <p className="text-lg text-muted-foreground">Have questions or need assistance? We'd love to hear from you.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {[
          { icon: Mail, title: "Email", detail: "support@Intulist.com", sub: "We respond within 24 hours" },
          { icon: Phone, title: "Phone", detail: "+1 (555) 123-4567", sub: "Mon–Fri, 9 AM – 6 PM EST" },
          { icon: MapPin, title: "Office", detail: "123 Innovation Drive", sub: "San Francisco, CA 94107" },
        ].map((item) => (
          <div key={item.title} className="glass-card rounded-xl p-6 space-y-3 text-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-display font-semibold">{item.title}</h3>
            <p className="text-sm text-foreground/80">{item.detail}</p>
            <p className="text-xs text-muted-foreground">{item.sub}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-8 space-y-6">
        <h2 className="font-display text-xl font-semibold">Send us a Message</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <input type="text" placeholder="Your Name" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="email" placeholder="Your Email" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <input type="text" placeholder="Subject" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <textarea placeholder="Your message..." rows={5} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        <Button variant="hero" size="lg">Send Message</Button>
      </div>
    </main>
    <Footer />
  </div>
);

export default Contact;
