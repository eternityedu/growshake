import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient opacity-90" />
      <div className="absolute inset-0 leaf-pattern opacity-10" />
      
      {/* Floating Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-background/10 rounded-full blur-2xl" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-background/10 rounded-full blur-2xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/20 text-primary-foreground mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Start Your Journey</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary-foreground mb-6">
            Ready to Grow Your Own Fresh Vegetables?
          </h2>
          
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of happy users who are already enjoying farm-fresh produce. 
            Sign up today and start your sustainable food journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="text-lg px-8 shadow-lg hover:shadow-xl transition-shadow"
            >
              <Link to="/auth?mode=signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Link to="/auth?mode=signup&role=farmer">
                Register as Farmer
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
