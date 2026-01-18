import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src={logo} alt="GrowShare" className="h-12 w-12" />
              <span className="font-display text-2xl font-bold">
                Grow<span className="text-primary">Share</span>
              </span>
            </Link>
            <p className="text-background/70 mb-6">
              Connecting farmers and consumers for a sustainable, farm-fresh future.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-full bg-background/10 hover:bg-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-background/70 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-background/70 hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/farmers" className="text-background/70 hover:text-primary transition-colors">
                  Find Farmers
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-background/70 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">For You</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/auth?mode=signup" className="text-background/70 hover:text-primary transition-colors">
                  Start Growing
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-background/70 hover:text-primary transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/auth?mode=signup&role=farmer" className="text-background/70 hover:text-primary transition-colors">
                  Become a Farmer
                </Link>
              </li>
              <li>
                <a href="#faq" className="text-background/70 hover:text-primary transition-colors">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-background/70">
                <Mail className="h-5 w-5 text-primary" />
                hello@growshare.com
              </li>
              <li className="flex items-center gap-3 text-background/70">
                <Phone className="h-5 w-5 text-primary" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-start gap-3 text-background/70">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                123 Farm Lane, Green Valley, CA 90210
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-background/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm">
            © {new Date().getFullYear()} GrowShare. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-background/60 hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-background/60 hover:text-primary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
