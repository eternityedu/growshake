import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FarmerSidebar from "@/components/dashboard/FarmerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Plus, MapPin, Leaf, DollarSign, Loader2, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LandListing {
  id: string;
  title: string;
  description: string | null;
  location: string;
  total_size_sqft: number;
  available_size_sqft: number;
  price_per_sqft: number;
  supported_vegetables: string[];
  is_active: boolean;
  created_at: string;
}

const FarmerLand = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<LandListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchListings = async () => {
    if (!user) return;

    setLoading(true);
    
    // First get farmer profile id
    const { data: farmerProfile } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!farmerProfile) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("land_listings")
      .select("*")
      .eq("farmer_id", farmerProfile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      toast({
        title: "Error",
        description: "Failed to load your land listings.",
        variant: "destructive",
      });
    } else {
      setListings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    const { error } = await supabase
      .from("land_listings")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Land listing has been removed.",
      });
      fetchListings();
    }
    setDeleting(false);
    setDeleteId(null);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("land_listings")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update listing status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `Listing is now ${!currentStatus ? "active" : "inactive"}.`,
      });
      fetchListings();
    }
  };

  return (
    <DashboardLayout sidebar={<FarmerSidebar />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">My Land Listings</h1>
            <p className="text-muted-foreground">Manage your available farming land</p>
          </div>
          <Button asChild>
            <Link to="/dashboard/farmer/land/new">
              <Plus className="h-4 w-4 mr-2" />
              Add New Land
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-primary/30 mb-4" />
              <p className="text-muted-foreground mb-4">No land listings yet</p>
              <Button asChild>
                <Link to="/dashboard/farmer/land/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Listing
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className={!listing.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{listing.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {listing.location}
                      </CardDescription>
                    </div>
                    <Badge variant={listing.is_active ? "default" : "secondary"}>
                      {listing.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{listing.available_size_sqft} / {listing.total_size_sqft} sq ft</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${listing.price_per_sqft}/sq ft</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Leaf className="h-3 w-3" />
                      Supported vegetables:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {listing.supported_vegetables.slice(0, 5).map((veg, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {veg}
                        </Badge>
                      ))}
                      {listing.supported_vegetables.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{listing.supported_vegetables.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(listing.id, listing.is_active)}
                    >
                      {listing.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dashboard/farmer/land/${listing.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(listing.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Land Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your land listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default FarmerLand;
