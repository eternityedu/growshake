import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FarmerSidebar from "@/components/dashboard/FarmerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Camera, Sprout, Image as ImageIcon, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: string;
  vegetable_name: string;
  status: string;
  user_id: string;
  profiles?: { full_name: string | null };
}

interface GrowthUpdate {
  id: string;
  order_id: string;
  status: string;
  notes: string | null;
  images: string[] | null;
  created_at: string;
}

const GROWTH_STATUSES = [
  { value: "seed_planted", label: "Seeds Planted" },
  { value: "sprouting", label: "Sprouting" },
  { value: "growing", label: "Growing Well" },
  { value: "flowering", label: "Flowering" },
  { value: "fruiting", label: "Fruiting" },
  { value: "almost_ready", label: "Almost Ready" },
  { value: "ready_to_harvest", label: "Ready to Harvest" },
  { value: "harvested", label: "Harvested" },
];

const GrowthTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [updates, setUpdates] = useState<Record<string, GrowthUpdate[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get farmer profile
      const { data: farmerProfile } = await supabase
        .from("farmer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!farmerProfile) {
        setLoading(false);
        return;
      }

      // Get active orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("vegetable_orders")
        .select("id, vegetable_name, status, user_id")
        .eq("farmer_id", farmerProfile.id)
        .in("status", ["accepted", "planted", "growing", "ready_to_harvest"])
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for orders
      const userIds = [...new Set(ordersData.map(o => o.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, { full_name: p.full_name }]) || []
      );

      const ordersWithProfiles = ordersData.map(order => ({
        ...order,
        profiles: profilesMap.get(order.user_id) || { full_name: null },
      }));

      setOrders(ordersWithProfiles);

      // Get growth updates for all orders
      const orderIds = ordersData.map(o => o.id);
      const { data: updatesData, error: updatesError } = await supabase
        .from("growth_status")
        .select("*")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });

      if (updatesError) throw updatesError;

      // Group updates by order
      const updatesMap: Record<string, GrowthUpdate[]> = {};
      updatesData?.forEach(update => {
        if (!updatesMap[update.order_id]) {
          updatesMap[update.order_id] = [];
        }
        updatesMap[update.order_id].push(update);
      });

      setUpdates(updatesMap);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 4));
    }
  };

  const handleSubmit = async () => {
    if (!selectedOrder || !newStatus || !user) return;

    setSubmitting(true);

    try {
      let imageUrls: string[] = [];

      // Upload images if any
      if (images.length > 0) {
        for (const image of images) {
          const fileName = `${user.id}/${selectedOrder}/${Date.now()}-${image.name}`;
          const { error: uploadError } = await supabase.storage
            .from("verification-docs")
            .upload(fileName, image);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("verification-docs")
            .getPublicUrl(fileName);

          imageUrls.push(urlData.publicUrl);
        }
      }

      // Insert growth status
      const { error } = await supabase.from("growth_status").insert({
        order_id: selectedOrder,
        status: newStatus,
        notes: notes || null,
        images: imageUrls.length > 0 ? imageUrls : null,
        recorded_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Update Added",
        description: "Growth status has been recorded successfully.",
      });

      // Reset form
      setSelectedOrder("");
      setNewStatus("");
      setNotes("");
      setImages([]);
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error adding update:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout sidebar={<FarmerSidebar />}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<FarmerSidebar />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Growth Tracking</h1>
            <p className="text-muted-foreground">Update customers on crop progress</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={orders.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Update
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Growth Update</DialogTitle>
                <DialogDescription>
                  Share progress photos and notes with your customer
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Select Order</Label>
                  <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((order) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.vegetable_name} - {order.profiles?.full_name || "Customer"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Growth Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROWTH_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add details about the crop progress..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photos (Up to 4)</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="growth-images"
                    />
                    <label htmlFor="growth-images" className="cursor-pointer">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload photos
                      </p>
                    </label>
                  </div>
                  {images.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {images.length} photo(s) selected
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!selectedOrder || !newStatus || submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Add Update"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sprout className="h-12 w-12 text-primary/30 mb-4" />
              <p className="text-muted-foreground">No active orders to track</p>
              <p className="text-sm text-muted-foreground">
                Accept orders to start tracking growth
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-primary" />
                        {order.vegetable_name}
                      </CardTitle>
                      <CardDescription>
                        Customer: {order.profiles?.full_name || "Unknown"}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {updates[order.id] && updates[order.id].length > 0 ? (
                    <div className="space-y-4">
                      {updates[order.id].map((update) => (
                        <div
                          key={update.id}
                          className="border rounded-lg p-4 bg-muted/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge>
                              {GROWTH_STATUSES.find(s => s.value === update.status)?.label || update.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(update.created_at), "PPp")}
                            </span>
                          </div>
                          {update.notes && (
                            <p className="text-sm mb-3">{update.notes}</p>
                          )}
                          {update.images && update.images.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {update.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Growth photo ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No updates yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GrowthTracking;
