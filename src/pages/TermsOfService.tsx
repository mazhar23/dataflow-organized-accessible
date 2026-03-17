import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import intulistLogo from "@/assets/intulist-logo.svg";
import Footer from "@/components/Footer";

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/"><img src={intulistLogo} alt="Intulist" className="h-12" /></Link>
        <Link to="/"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
      </div>
    </nav>

    <main className="container max-w-3xl pt-28 pb-20 space-y-8">
      <h1 className="font-display text-3xl sm:text-4xl font-bold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Effective: March 1, 2026</p>

      <section className="space-y-4 text-foreground/80 leading-relaxed">
        <h2 className="font-display text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>By accessing or using Intulist, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform. These terms apply to all users, including visitors, registered users, and paying customers.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">2. Account Responsibilities</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorised access. You agree to provide accurate and complete registration information.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">3. Acceptable Use</h2>
        <p>You agree not to use Intulist for any unlawful purpose, to transmit malicious code, to interfere with platform operations, or to attempt to gain unauthorised access to other accounts or systems.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">4. Service Availability</h2>
        <p>We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance windows will be communicated in advance. We are not liable for losses resulting from service interruptions.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">5. Billing & Payments</h2>
        <p>Paid features are billed on a usage basis. You are responsible for all charges incurred under your account. We reserve the right to adjust pricing with 30 days' notice.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">6. Intellectual Property</h2>
        <p>Intulist and its original content, features, and functionality are owned by Intulist Inc. You retain ownership of all data you upload to the platform.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">7. Termination</h2>
        <p>We may suspend or terminate your account if you violate these terms. Upon termination, your right to use the service ceases immediately. You may export your data within 30 days of termination.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
        <p>Intulist shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to the amount you paid in the 12 months preceding the claim.</p>
      </section>
    </main>
    <Footer />
  </div>
);

export default TermsOfService;
