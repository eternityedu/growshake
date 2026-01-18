import { Check, Users, Tractor, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  "Direct connection with local farmers",
  "Choose exactly what vegetables to grow",
  "Track growth progress in real-time",
  "AI-powered vegetable recommendations",
  "Fresh, organic produce delivered",
  "Secure payment system",
];

const stats = [
  { icon: Users, value: "10,000+", label: "Happy Users" },
  { icon: Tractor, value: "500+", label: "Active Farmers" },
  { icon: Shield, value: "100%", label: "Secure Payments" },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20 md:py-32 bg-foreground text-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
              Why GrowShare
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              The Future of
              <span className="text-primary block">Farm-Fresh Living</span>
            </h2>
            <p className="text-background/70 text-lg mb-8">
              GrowShare revolutionizes how you access fresh, organic vegetables. 
              We connect you directly with verified farmers, giving you control 
              over what grows in your plot.
            </p>

            {/* Features List */}
            <ul className="grid sm:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <span className="text-background/80">{feature}</span>
                </li>
              ))}
            </ul>

            <Button size="lg" asChild className="shadow-glow">
              <Link to="/auth?mode=signup">Join GrowShare Today</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="relative">
            <div className="absolute inset-0 hero-gradient opacity-10 rounded-3xl blur-3xl" />
            <div className="relative bg-background/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-background/10">
              <div className="grid gap-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-6 p-6 rounded-2xl bg-background/5 hover:bg-background/10 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center shadow-lg">
                      <stat.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-3xl md:text-4xl font-display font-bold text-primary">
                        {stat.value}
                      </p>
                      <p className="text-background/60">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
