import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import AIChat from "@/components/AIChat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, Users, Package, BarChart3 } from "lucide-react";

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFarmers: 0,
    pendingFarmers: 0,
    totalOrders: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || role !== "admin") return;

      try {
        // Get user counts
        const { data: userRoles } = await supabase.from("user_roles").select("role");
        const totalUsers = userRoles?.filter(r => r.role === "user").length || 0;
        const totalFarmers = userRoles?.filter(r => r.role === "farmer").length || 0;

        // Get pending farmers
        const { data: pending } = await supabase
          .from("farmer_profiles")
          .select("id")
          .eq("verification_status", "pending");

        // Get total orders
        const { data: orders } = await supabase.from("vegetable_orders").select("id");

        setStats({
          totalUsers,
          totalFarmers,
          pendingFarmers: pending?.length || 0,
          totalOrders: orders?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user, role]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "admin") return null;

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Analytics & AI</h1>
          <p className="text-muted-foreground">
            Platform insights and AI-powered analytics
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Farmers</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalFarmers}</p>
                </div>
                <Users className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold text-sun">{stats.pendingFarmers}</p>
                </div>
                <Users className="h-8 w-8 text-sun/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalOrders}</p>
                </div>
                <Package className="h-8 w-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <AIChat
            type="admin"
            title="Admin Analytics AI"
            placeholder="Ask about platform analytics..."
            context={stats}
            initialMessage="Give me an overview of the platform's current status and any recommendations."
          />

          <Card className="border-primary/10 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Admin AI Capabilities
              </CardTitle>
              <CardDescription>
                AI-powered platform management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="font-medium">Analytics Insights</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Vegetable demand trends across platform</li>
                  <li>• User activity and engagement patterns</li>
                  <li>• Farmer performance overview</li>
                  <li>• Revenue and growth metrics</li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <p className="font-medium">Sample Questions</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• What vegetables are trending?</li>
                  <li>• Show me farmer activity summary</li>
                  <li>• Any concerns I should address?</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
