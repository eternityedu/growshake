import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Sprout, Truck } from "lucide-react";
import logoCircle from "@/assets/logo-circle.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 leaf-pattern opacity-30" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
              <Leaf className="h-4 w-4" />
              <span className="text-sm font-medium">Farm-to-Table Revolution</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 animate-fade-in text-foreground" style={{ animationDelay: "0.1s" }}>
              Get Your Own
              <span className="text-primary block">Fresh Vegetables</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Connect directly with verified local farmers. Choose your vegetables, and receive farm-fresh produce delivered to your doorstep.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" asChild className="text-lg px-8 shadow-glow bg-primary hover:bg-primary/90">
                <Link to="/auth?mode=signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 border-primary text-primary hover:bg-primary/10">
                <Link to="/auth?mode=signup&role=farmer">
                  Register as Farmer
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-primary/10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Active Farmers</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-primary">10K+</p>
                <p className="text-sm text-muted-foreground">Happy Users</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Vegetables</p>
              </div>
            </div>
          </div>
          
          {/* Hero Image - Floating Circle Logo */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Main Floating Circle Logo */}
              <div className="w-72 h-72 md:w-96 md:h-96 float-animation">
                <img 
                  src={logoCircle} 
                  alt="GrowShare" 
                  className="w-full h-full object-contain drop-shadow-2xl" 
                />
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 md:-left-8 bg-card rounded-2xl p-4 shadow-soft animate-float border border-primary/10" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Sprout className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">100% Organic</p>
                    <p className="text-xs text-muted-foreground">Certified Fresh</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 md:-right-8 bg-card rounded-2xl p-4 shadow-soft animate-float border border-primary/10" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Fast Delivery</p>
                    <p className="text-xs text-muted-foreground">To Your Door</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
