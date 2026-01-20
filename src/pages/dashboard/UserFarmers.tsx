import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import UserSidebar from "@/components/dashboard/UserSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MapPin, Leaf, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FarmerProfile {
  id: string;
  farm_name: string;
  location: string;
  farm_description: string | null;
  specializations: string[] | null;
  experience_years: number | null;
}

interface LandListing {
  id: string;
  title: string;
  location: string;
  total_size_sqft: number;
  available_size_sqft: number;
  price_per_sqft: number;
  supported_vegetables: string[];
  farmer_id: string;
}

const UserFarmers = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [listings, setListings] = useState<LandListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch approved farmers
        const { data: farmersData, error: farmersError } = await supabase
          .from("farmer_profiles")
          .select("*")
          .eq("verification_status", "approved");

        if (farmersError) throw farmersError;
        setFarmers(farmersData || []);

        // Fetch active land listings
        const { data: listingsData, error: listingsError } = await supabase
          .from("land_listings")
          .select("*")
          .eq("is_active", true);

        if (listingsError) throw listingsError;
        setListings(listingsData || []);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, toast]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const getFarmerListings = (farmerId: string) => {
    return listings.filter((l) => l.farmer_id === farmerId);
  };

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Find Farmers</h1>
          <p className="text-muted-foreground">
            Browse verified farmers and their available land listings
          </p>
        </div>

        {farmers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Leaf className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No verified farmers available yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back soon for new farmers!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {farmers.map((farmer) => {
              const farmerListings = getFarmerListings(farmer.id);
              return (
                <Card key={farmer.id} className="border-primary/10">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{farmer.farm_name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {farmer.location}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {farmer.farm_description && (
                      <p className="text-sm text-muted-foreground">{farmer.farm_description}</p>
                    )}
                    
                    {farmer.specializations && farmer.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {farmer.specializations.map((spec, idx) => (
                          <Badge key={idx} variant="outline">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {farmerListings.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-primary/10">
                        <p className="font-medium text-sm">Available Land Listings:</p>
                        {farmerListings.map((listing) => (
                          <div
                            key={listing.id}
                            className="p-4 rounded-lg bg-muted/50 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{listing.title}</p>
                              <p className="text-primary font-bold">
                                ${listing.price_per_sqft}/sqft
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Available: {listing.available_size_sqft} sqft
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {listing.supported_vegetables.slice(0, 5).map((veg, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {veg}
                                </Badge>
                              ))}
                              {listing.supported_vegetables.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{listing.supported_vegetables.length - 5} more
                                </Badge>
                              )}
                            </div>
                            <Button
                              className="w-full mt-2 bg-primary hover:bg-primary/90"
                              onClick={() => navigate(`/dashboard/user/order/${listing.id}`)}
                            >
                              Select & Order
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserFarmers;
