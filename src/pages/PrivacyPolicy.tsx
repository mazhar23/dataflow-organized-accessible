import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import intulistLogo from "@/assets/Intulist-logo.png";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/"><img src={intulistLogo} alt="Intulist" className="h-12" /></Link>
        <Link to="/"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
      </div>
    </nav>

    <main className="container max-w-3xl pt-28 pb-20 space-y-8">
      <h1 className="font-display text-3xl sm:text-4xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: March 1, 2026</p>

      <section className="space-y-4 text-foreground/80 leading-relaxed">
        <h2 className="font-display text-xl font-semibold text-foreground">1. Information We Collect</h2>
        <p>We collect information you provide directly, such as your name, email address, company name, and payment details when you create an account or use our services. We also automatically collect usage data including IP addresses, browser type, pages visited, and interaction patterns to improve our platform.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
        <p>Your information is used to provide and maintain the Intulist service, process transactions, send service-related communications, improve our platform, and comply with legal obligations. We never sell your personal data to third parties.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">3. Data Storage & Security</h2>
        <p>All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3. We maintain strict access controls, conduct regular security audits, and follow SOC 2-aligned practices to protect your information.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">4. Data Retention</h2>
        <p>We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting our support team.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">5. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time. To exercise these rights, contact us at privacy@Intulist.com.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">6. Cookies</h2>
        <p>We use essential cookies to operate the platform and analytics cookies to understand usage patterns. You can manage cookie preferences through your browser settings.</p>

        <h2 className="font-display text-xl font-semibold text-foreground">7. Changes to This Policy</h2>
        <p>We may update this policy periodically. We will notify you of significant changes via email or through a notice on our platform.</p>
      </section>
    </main>
    <Footer />
  </div>
);

export default PrivacyPolicy;
