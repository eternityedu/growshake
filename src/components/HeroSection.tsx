import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Sprout, Truck } from "lucide-react";
import logo from "@/assets/logo.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 leaf-pattern opacity-50" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
              <Leaf className="h-4 w-4" />
              <span className="text-sm font-medium">Farm-to-Table Revolution</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Grow Your Own
              <span className="text-gradient block">Fresh Vegetables</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Connect directly with local farmers. Choose your land, pick your vegetables, and receive fresh produce delivered to your doorstep.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button size="lg" asChild className="text-lg px-8 shadow-glow">
                <Link to="/auth?mode=signup">
                  Start Growing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <Link to="/how-it-works">
                  How It Works
                </Link>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border animate-fade-in" style={{ animationDelay: "0.4s" }}>
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
          
          {/* Hero Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Main Logo/Image */}
              <div className="w-72 h-72 md:w-96 md:h-96 rounded-full hero-gradient p-2 shadow-glow-lg float-animation">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                  <img src={logo} alt="GrowShare" className="w-4/5 h-4/5 object-contain" />
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 md:-left-8 bg-card rounded-2xl p-4 shadow-soft animate-float" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Sprout className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">100% Organic</p>
                    <p className="text-xs text-muted-foreground">Certified Fresh</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 md:-right-8 bg-card rounded-2xl p-4 shadow-soft animate-float" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-accent/20">
                    <Truck className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Fast Delivery</p>
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
