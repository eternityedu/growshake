import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FarmerSidebar from "@/components/dashboard/FarmerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Loader2, CheckCircle, XCircle, Sprout, Truck } from "lucide-react";

interface Order {
  id: string;
  vegetable_name: string;
  land_size_sqft: number;
  planting_instructions: string | null;
  status: string;
  total_price: number;
  advance_amount: number;
  delivery_address: string | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null };
  land_listings?: { title: string };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  planted: "bg-green-100 text-green-800",
  growing: "bg-emerald-100 text-emerald-800",
  ready_to_harvest: "bg-lime-100 text-lime-800",
  harvested: "bg-teal-100 text-teal-800",
  delivered: "bg-primary text-primary-foreground",
  cancelled: "bg-gray-100 text-gray-800",
};

const statusFlow = [
  "pending",
  "accepted",
  "planted",
  "growing",
  "ready_to_harvest",
  "harvested",
  "delivered",
];

const FarmerOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);

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

    const { data: ordersData, error } = await supabase
      .from("vegetable_orders")
      .select("*")
      .eq("farmer_id", farmerProfile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
      return;
    }

    if (!ordersData || ordersData.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Fetch profiles and land listings separately
    const userIds = [...new Set(ordersData.map(o => o.user_id))];
    const landIds = [...new Set(ordersData.map(o => o.land_listing_id))];

    const [profilesRes, landRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds),
      supabase.from("land_listings").select("id, title").in("id", landIds),
    ]);

    const profilesMap = new Map(
      profilesRes.data?.map(p => [p.user_id, { full_name: p.full_name, email: p.email }]) || []
    );
    const landMap = new Map(
      landRes.data?.map(l => [l.id, { title: l.title }]) || []
    );

    const ordersWithData = ordersData.map(order => ({
      ...order,
      profiles: profilesMap.get(order.user_id) || { full_name: null, email: null },
      land_listings: landMap.get(order.land_listing_id) || { title: "" },
    }));

    setOrders(ordersWithData);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const { error } = await supabase
      .from("vegetable_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Updated",
        description: `Order status changed to ${newStatus.replace(/_/g, " ")}.`,
      });
      fetchOrders();
    }
    setUpdating(null);
  };

  const getNextStatus = (currentStatus: string) => {
    const idx = statusFlow.indexOf(currentStatus);
    if (idx === -1 || idx >= statusFlow.length - 1) return null;
    return statusFlow[idx + 1];
  };

  const filteredOrders = orders.filter(
    (order) => statusFilter === "all" || order.status === statusFilter
  );

  return (
    <DashboardLayout sidebar={<FarmerSidebar />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage customer planting requests</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="planted">Planted</SelectItem>
              <SelectItem value="growing">Growing</SelectItem>
              <SelectItem value="ready_to_harvest">Ready to Harvest</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-primary/30 mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-primary" />
                        {order.vegetable_name}
                      </CardTitle>
                      <CardDescription>
                        From: {order.profiles?.full_name || "Unknown"} ({order.profiles?.email})
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[order.status]}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Land</p>
                      <p className="font-medium">{order.land_listings?.title}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium">{order.land_size_sqft} sq ft</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Price</p>
                      <p className="font-medium">${order.total_price}</p>
                    </div>
                  </div>

                  {order.planting_instructions && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Planting Instructions:</p>
                      <p className="text-sm">{order.planting_instructions}</p>
                    </div>
                  )}

                  {order.delivery_address && (
                    <div className="flex items-start gap-2 text-sm">
                      <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{order.delivery_address}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {order.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, "accepted")}
                          disabled={updating === order.id}
                        >
                          {updating === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updateOrderStatus(order.id, "rejected")}
                          disabled={updating === order.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {order.status !== "pending" &&
                      order.status !== "rejected" &&
                      order.status !== "cancelled" &&
                      order.status !== "delivered" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const next = getNextStatus(order.status);
                            if (next) updateOrderStatus(order.id, next);
                          }}
                          disabled={updating === order.id}
                        >
                          {updating === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            `Mark as ${getNextStatus(order.status)?.replace(/_/g, " ")}`
                          )}
                        </Button>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FarmerOrders;
