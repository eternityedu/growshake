import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import UserSidebar from "@/components/dashboard/UserSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, Calendar, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Order {
  id: string;
  vegetable_name: string;
  land_size_sqft: number;
  total_price: number;
  advance_amount: number;
  final_amount: number;
  status: string;
  expected_harvest_date: string | null;
  created_at: string;
}

const UserOrders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { formatPrice, loading: currencyLoading } = useCurrency();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("vegetable_orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(data || []);
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
      fetchOrders();
    }
  }, [user, toast]);

  if (authLoading || loading || currencyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      accepted: { variant: "default", label: "Accepted" },
      planted: { variant: "default", label: "Planted" },
      growing: { variant: "default", label: "Growing" },
      ready_to_harvest: { variant: "default", label: "Ready to Harvest" },
      harvested: { variant: "default", label: "Harvested" },
      delivered: { variant: "outline", label: "Delivered" },
      rejected: { variant: "destructive", label: "Rejected" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track your vegetable orders</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No orders yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Browse farmers to place your first order!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border-primary/10">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Leaf className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{order.vegetable_name}</CardTitle>
                        <CardDescription>
                          {order.land_size_sqft} sqft
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Price</p>
                      <p className="font-semibold text-primary">{formatPrice(order.total_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Advance Paid</p>
                      <p className="font-semibold">{formatPrice(order.advance_amount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-semibold">{formatPrice(order.final_amount)}</p>
                    </div>
                  </div>
                  {order.expected_harvest_date && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-primary/10">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Expected harvest: {format(new Date(order.expected_harvest_date), "PPP")}
                      </span>
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

export default UserOrders;
