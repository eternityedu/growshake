import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FarmerSidebar from "@/components/dashboard/FarmerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { Link } from "react-router-dom";

const commonVegetables = [
  "Tomatoes", "Carrots", "Lettuce", "Spinach", "Potatoes",
  "Onions", "Peppers", "Cucumbers", "Beans", "Peas",
  "Broccoli", "Cabbage", "Corn", "Squash", "Zucchini"
];

const FarmerLandNew = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    total_size_sqft: "",
    price_per_sqft: "",
    soil_type: "",
    water_source: "",
  });
  const [vegetables, setVegetables] = useState<string[]>([]);
  const [customVeg, setCustomVeg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addVegetable = (veg: string) => {
    if (!vegetables.includes(veg)) {
      setVegetables([...vegetables, veg]);
    }
  };

  const removeVegetable = (veg: string) => {
    setVegetables(vegetables.filter((v) => v !== veg));
  };

  const addCustomVeg = () => {
    if (customVeg.trim() && !vegetables.includes(customVeg.trim())) {
      setVegetables([...vegetables, customVeg.trim()]);
      setCustomVeg("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (vegetables.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one supported vegetable.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Get farmer profile
    const { data: farmerProfile, error: profileError } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !farmerProfile) {
      toast({
        title: "Error",
        description: "Could not find your farmer profile.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("land_listings")
      .insert({
        farmer_id: farmerProfile.id,
        title: formData.title,
        description: formData.description || null,
        location: formData.location,
        total_size_sqft: parseFloat(formData.total_size_sqft),
        available_size_sqft: parseFloat(formData.total_size_sqft),
        price_per_sqft: parseFloat(formData.price_per_sqft),
        supported_vegetables: vegetables,
        soil_type: formData.soil_type || null,
        water_source: formData.water_source || null,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create land listing.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Land listing created successfully!",
      });
      navigate("/dashboard/farmer/land");
    }
    setLoading(false);
  };

  return (
    <DashboardLayout sidebar={<FarmerSidebar />}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            to="/dashboard/farmer/land"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Link>
          <h1 className="text-2xl font-display font-bold">Add New Land Listing</h1>
          <p className="text-muted-foreground">Create a new land listing for users to rent</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Land Details</CardTitle>
            <CardDescription>Provide information about your farming land</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Listing Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Sunny Organic Farm Plot"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your land, its features, and what makes it special..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="e.g., Austin, Texas"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_size_sqft">Total Size (sq ft) *</Label>
                  <Input
                    id="total_size_sqft"
                    name="total_size_sqft"
                    type="number"
                    placeholder="1000"
                    value={formData.total_size_sqft}
                    onChange={handleChange}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_sqft">Price per sq ft ($) *</Label>
                  <Input
                    id="price_per_sqft"
                    name="price_per_sqft"
                    type="number"
                    step="0.01"
                    placeholder="0.50"
                    value={formData.price_per_sqft}
                    onChange={handleChange}
                    required
                    min="0.01"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="soil_type">Soil Type</Label>
                  <Input
                    id="soil_type"
                    name="soil_type"
                    placeholder="e.g., Loamy, Clay, Sandy"
                    value={formData.soil_type}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="water_source">Water Source</Label>
                  <Input
                    id="water_source"
                    name="water_source"
                    placeholder="e.g., Well, Irrigation, Rainwater"
                    value={formData.water_source}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Supported Vegetables *</Label>
                <div className="flex flex-wrap gap-2">
                  {commonVegetables.map((veg) => (
                    <Badge
                      key={veg}
                      variant={vegetables.includes(veg) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() =>
                        vegetables.includes(veg) ? removeVegetable(veg) : addVegetable(veg)
                      }
                    >
                      {veg}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom vegetable..."
                    value={customVeg}
                    onChange={(e) => setCustomVeg(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomVeg())}
                  />
                  <Button type="button" variant="outline" onClick={addCustomVeg}>
                    Add
                  </Button>
                </div>
                {vegetables.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {vegetables.map((veg) => (
                      <Badge key={veg} variant="secondary" className="pr-1">
                        {veg}
                        <button
                          type="button"
                          onClick={() => removeVegetable(veg)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link to="/dashboard/farmer/land">Cancel</Link>
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Listing
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FarmerLandNew;
