import { Link } from "react-router-dom";
import intulistLogo from "@/assets/intulist-logo.svg";

const Footer = () => (
  <footer className="border-t border-border/50 py-14">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link to="/">
            <img src={intulistLogo} alt="Intulist" className="h-8 mb-4" />
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your single source of truth for consumer data management.
          </p>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-display font-semibold text-sm mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Product */}
        <div>
          <h4 className="font-display font-semibold text-sm mb-4">Product</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/features" className="hover:text-foreground transition-colors">Features</Link></li>
            <li><a href="/#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
            <li><Link to="/learn-more" className="hover:text-foreground transition-colors">Learn More</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-display font-semibold text-sm mb-4">Support</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/help-center" className="hover:text-foreground transition-colors">Help Center</Link></li>
            <li><Link to="/api-docs" className="hover:text-foreground transition-colors">Test List API</Link></li>
            <li><Link to="/developers" className="hover:text-foreground transition-colors">Developers</Link></li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-border/50 flex flex-col items-center gap-2">
        <span className="text-xs text-muted-foreground">© 2026 Intulist. All rights reserved.</span>
        <span className="text-xs text-muted-foreground">
          Developed by{" "}
          <a href="https://artum8labs.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline transition-colors">
            Artum 8 Labs LLC.
          </a>
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
