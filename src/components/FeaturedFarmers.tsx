import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Leaf, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FarmerData {
  id: string;
  farm_name: string;
  location: string;
  specializations: string[] | null;
  farm_description: string | null;
}

const FeaturedFarmers = () => {
  const [farmers, setFarmers] = useState<FarmerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedFarmers();
  }, []);

  const fetchApprovedFarmers = async () => {
    try {
      const { data, error } = await supabase
        .from("farmer_profiles")
        .select("id, farm_name, location, specializations, farm_description")
        .eq("verification_status", "approved")
        .limit(3);

      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error("Error fetching farmers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (farmers.length === 0) {
    return (
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Verified Farmers
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Featured Farmers
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Our verified farmers are ready to grow fresh vegetables for you. 
              Sign up now to connect with local farmers in your area.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/auth?mode=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Verified Farmers
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Featured Farmers
            </h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/auth?mode=signup">View All Farmers</Link>
          </Button>
        </div>

        {/* Farmers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {farmers.map((farmer, index) => (
            <Card
              key={farmer.id}
              className="overflow-hidden group hover:shadow-glow transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image Placeholder */}
              <div className="relative h-48 overflow-hidden bg-primary/10 flex items-center justify-center">
                <Leaf className="h-16 w-16 text-primary/30" />
                <Badge className="absolute top-3 left-3 bg-primary">
                  <Leaf className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>

              <CardContent className="p-6">
                {/* Name & Location */}
                <h3 className="text-xl font-display font-semibold mb-2">{farmer.farm_name}</h3>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{farmer.location}</span>
                </div>

                {/* Specialties */}
                {farmer.specializations && farmer.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {farmer.specializations.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Description */}
                {farmer.farm_description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {farmer.farm_description}
                  </p>
                )}

                {/* CTA */}
                <Button className="w-full" asChild>
                  <Link to="/auth?mode=signup">Connect with Farmer</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedFarmers;