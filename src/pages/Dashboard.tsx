import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Leaf, 
  LogOut, 
  User, 
  Tractor, 
  Shield, 
  Home,
  TrendingUp,
  Package,
  Clock,
  Loader2
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("user");

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const role = session.user.user_metadata?.role || "user";
          setUserRole(role);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const role = session.user.user_metadata?.role || "user";
        setUserRole(role);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleBadge = () => {
    switch (userRole) {
      case "admin":
        return <Badge className="bg-destructive"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case "farmer":
        return <Badge className="bg-earth"><Tractor className="h-3 w-3 mr-1" />Farmer</Badge>;
      default:
        return <Badge variant="secondary"><User className="h-3 w-3 mr-1" />User</Badge>;
    }
  };

  const getQuickActions = () => {
    switch (userRole) {
      case "admin":
        return [
          { title: "Verify Farmers", icon: Shield, description: "Review pending farmer applications", href: "/admin/farmers" },
          { title: "All Orders", icon: Package, description: "Monitor platform orders", href: "/admin/orders" },
          { title: "Users", icon: User, description: "Manage platform users", href: "/admin/users" },
          { title: "Analytics", icon: TrendingUp, description: "View platform statistics", href: "/admin/analytics" },
        ];
      case "farmer":
        return [
          { title: "My Land", icon: Home, description: "Manage your land listings", href: "/farmer/land" },
          { title: "Orders", icon: Package, description: "View planting requests", href: "/farmer/orders" },
          { title: "AI Insights", icon: TrendingUp, description: "See trending vegetables", href: "/farmer/insights" },
          { title: "Deliveries", icon: Clock, description: "Manage deliveries", href: "/farmer/deliveries" },
        ];
      default:
        return [
          { title: "Find Farmers", icon: Tractor, description: "Browse verified farmers", href: "/farmers" },
          { title: "My Orders", icon: Package, description: "Track your orders", href: "/user/orders" },
          { title: "AI Suggestions", icon: Leaf, description: "Get vegetable recommendations", href: "/user/suggestions" },
          { title: "Order History", icon: Clock, description: "View past orders", href: "/user/history" },
        ];
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="GrowShare" className="h-10 w-10" />
            <span className="font-display text-xl font-bold">
              Grow<span className="text-primary">Share</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {getRoleBadge()}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {user.user_metadata?.full_name || "User"}!
          </h1>
          <p className="text-muted-foreground">
            {userRole === "farmer" && "Manage your farm and connect with customers."}
            {userRole === "admin" && "Monitor and manage the GrowShare platform."}
            {userRole === "user" && "Browse farmers and track your vegetable orders."}
          </p>
        </div>

        {/* Farmer Pending Notice */}
        {userRole === "farmer" && (
          <Card className="mb-8 border-sun bg-sun/10">
            <CardContent className="flex items-center gap-4 py-4">
              <Clock className="h-8 w-8 text-sun" />
              <div>
                <p className="font-semibold">Profile Under Review</p>
                <p className="text-sm text-muted-foreground">
                  Your farmer profile is pending admin approval. You'll be notified once verified.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {getQuickActions().map((action, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-glow transition-all duration-300 cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{action.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="mt-12">
          <h2 className="text-xl font-display font-semibold mb-6">Overview</h2>
          <div className="grid sm:grid-cols-3 gap-6">
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
                      {userRole === "farmer" ? "Land Plots" : "Vegetables Growing"}
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
                      {userRole === "farmer" ? "Total Earnings" : "Total Spent"}
                    </p>
                    <p className="text-3xl font-bold text-primary">$0</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary/30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
