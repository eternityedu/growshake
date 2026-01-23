import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import UserSidebar from "@/components/dashboard/UserSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sprout, Calendar, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

interface Order {
  id: string;
  vegetable_name: string;
  status: string;
  farmer_profiles?: { farm_name: string };
}

interface GrowthUpdate {
  id: string;
  order_id: string;
  status: string;
  notes: string | null;
  images: string[] | null;
  created_at: string;
}

const GROWTH_STATUSES: Record<string, string> = {
  seed_planted: "Seeds Planted",
  sprouting: "Sprouting",
  growing: "Growing Well",
  flowering: "Flowering",
  fruiting: "Fruiting",
  almost_ready: "Almost Ready",
  ready_to_harvest: "Ready to Harvest",
  harvested: "Harvested",
};

const UserGrowthUpdates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [updates, setUpdates] = useState<Record<string, GrowthUpdate[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get user's orders that are in progress
        const { data: ordersData, error: ordersError } = await supabase
          .from("vegetable_orders")
          .select("id, vegetable_name, status, farmer_id")
          .eq("user_id", user.id)
          .in("status", ["accepted", "planted", "growing", "ready_to_harvest"])
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;

        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Get farmer profiles
        const farmerIds = [...new Set(ordersData.map(o => o.farmer_id))];
        const { data: farmersData } = await supabase
          .from("farmer_profiles")
          .select("id, farm_name")
          .in("id", farmerIds);

        const farmersMap = new Map(
          farmersData?.map(f => [f.id, { farm_name: f.farm_name }]) || []
        );

        const ordersWithFarmers = ordersData.map(order => ({
          ...order,
          farmer_profiles: farmersMap.get(order.farmer_id) || { farm_name: "Unknown Farm" },
        }));

        setOrders(ordersWithFarmers);

        // Get growth updates
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

    fetchData();
  }, [user, toast]);

  if (loading) {
    return (
      <DashboardLayout sidebar={<UserSidebar />}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Growth Updates</h1>
          <p className="text-muted-foreground">Track the progress of your vegetables</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sprout className="h-12 w-12 text-primary/30 mb-4" />
              <p className="text-muted-foreground">No active orders to track</p>
              <p className="text-sm text-muted-foreground">
                Place an order to see growth updates from farmers
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="border-primary/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sprout className="h-5 w-5 text-primary" />
                        {order.vegetable_name}
                      </CardTitle>
                      <CardDescription>
                        Farm: {order.farmer_profiles?.farm_name}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{order.status.replace(/_/g, " ")}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {updates[order.id] && updates[order.id].length > 0 ? (
                    <div className="space-y-4">
                      {updates[order.id].map((update, index) => (
                        <div
                          key={update.id}
                          className={`relative pl-6 pb-4 ${
                            index !== updates[order.id].length - 1 ? "border-l-2 border-primary/20" : ""
                          }`}
                        >
                          {/* Timeline dot */}
                          <div className="absolute left-0 -translate-x-1/2 w-3 h-3 rounded-full bg-primary" />
                          
                          <div className="bg-muted/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                {GROWTH_STATUSES[update.status] || update.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(update.created_at), "PPp")}
                              </span>
                            </div>
                            
                            {update.notes && (
                              <p className="text-sm text-foreground mb-3">{update.notes}</p>
                            )}
                            
                            {update.images && update.images.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {update.images.map((img, idx) => (
                                  <a
                                    key={idx}
                                    href={img}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={img}
                                      alt={`Growth photo ${idx + 1}`}
                                      className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                                    />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>No updates yet</p>
                      <p className="text-sm">The farmer will post updates soon!</p>
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

export default UserGrowthUpdates;
