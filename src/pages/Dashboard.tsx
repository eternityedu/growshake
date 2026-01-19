import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import FarmerSidebar from "@/components/dashboard/FarmerSidebar";
import UserSidebar from "@/components/dashboard/UserSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Package, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useEffect } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const getSidebar = () => {
    switch (role) {
      case "admin": return <AdminSidebar />;
      case "farmer": return <FarmerSidebar />;
      default: return <UserSidebar />;
    }
  };

  const getQuickActions = () => {
    switch (role) {
      case "admin":
        return [
          { title: "Verify Farmers", description: "Review pending applications", href: "/dashboard/admin/verify-farmers" },
          { title: "All Orders", description: "Monitor platform orders", href: "/dashboard/admin/orders" },
          { title: "Users", description: "Manage platform users", href: "/dashboard/admin/users" },
        ];
      case "farmer":
        return [
          { title: "My Land", description: "Manage your listings", href: "/dashboard/farmer/land" },
          { title: "Orders", description: "View planting requests", href: "/dashboard/farmer/orders" },
          { title: "Add Land", description: "Create new listing", href: "/dashboard/farmer/land/new" },
        ];
      default:
        return [
          { title: "Find Farmers", description: "Browse verified farmers", href: "/dashboard/user/farmers" },
          { title: "My Orders", description: "Track your orders", href: "/dashboard/user/orders" },
          { title: "AI Suggestions", description: "Get recommendations", href: "/dashboard/user/suggestions" },
        ];
    }
  };

  return (
    <DashboardLayout sidebar={getSidebar()}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
            Welcome back, {user.user_metadata?.full_name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            {role === "farmer" && "Manage your farm and connect with customers."}
            {role === "admin" && "Monitor and manage the GrowShare platform."}
            {role === "user" && "Browse farmers and track your vegetable orders."}
          </p>
        </div>

        {role === "farmer" && (
          <Card className="border-sun bg-sun/10">
            <CardContent className="flex items-center gap-4 py-4">
              <Clock className="h-8 w-8 text-sun" />
              <div>
                <p className="font-semibold">Profile Under Review</p>
                <p className="text-sm text-muted-foreground">
                  Your farmer profile is pending admin approval.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {getQuickActions().map((action, idx) => (
            <Link key={idx} to={action.href}>
              <Card className="hover:shadow-glow transition-all duration-300 h-full">
                <CardHeader>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-display font-semibold mb-4">Overview</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Orders</p>
                    <p className="text-3xl font-bold text-primary">0</p>
                  </div>
                  <Package className="h-8 w-8 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {role === "farmer" ? "Land Plots" : "Growing"}
                    </p>
                    <p className="text-3xl font-bold text-primary">0</p>
                  </div>
                  <Leaf className="h-8 w-8 text-primary/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {role === "farmer" ? "Earnings" : "Spent"}
                    </p>
                    <p className="text-3xl font-bold text-primary">$0</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
