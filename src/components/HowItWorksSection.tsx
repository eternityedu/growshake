import { Search, Sprout, TrendingUp, Truck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Find a Farmer",
    description: "Browse verified farmers in your area and choose one that suits your needs.",
    step: "01",
  },
  {
    icon: Sprout,
    title: "Select Your Vegetables",
    description: "Choose what you want to grow from a variety of fresh, organic options.",
    step: "02",
  },
  {
    icon: TrendingUp,
    title: "Track Growth",
    description: "Follow your vegetables' journey from seed to harvest with real-time updates.",
    step: "03",
  },
  {
    icon: Truck,
    title: "Receive Fresh Produce",
    description: "Get your farm-fresh vegetables delivered right to your doorstep.",
    step: "04",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            How GrowShare Works
          </h2>
          <p className="text-lg text-muted-foreground">
            From farm to table in four simple steps. We make growing your own vegetables easy and accessible.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className="relative group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-border -translate-x-1/2 z-0">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                </div>
              )}
              
              <div className="relative bg-card rounded-2xl p-6 shadow-soft hover:shadow-glow transition-all duration-300 group-hover:-translate-y-2">
                {/* Step Number */}
                <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full hero-gradient flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md">
                  {step.step}
                </span>
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-display font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
