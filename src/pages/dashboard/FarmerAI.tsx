import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FarmerSidebar from "@/components/dashboard/FarmerSidebar";
import AIChat from "@/components/AIChat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Sparkles, BookOpen } from "lucide-react";

const FarmerAI = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    if (!loading && role !== "farmer") {
      navigate("/dashboard");
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "farmer") return null;

  return (
    <DashboardLayout sidebar={<FarmerSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">Farmer AI Assistant</h1>
          <p className="text-muted-foreground">
            Get insights on trending vegetables and platform guidance
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <AIChat
            type="farmer"
            title="Farming Insights AI"
            placeholder="Ask about trends or platform help..."
            initialMessage="What vegetables are users requesting the most right now?"
          />

          <Card className="border-primary/10 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                What I Can Help With
              </CardTitle>
              <CardDescription>
                Your personal farming assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <p className="font-medium">Demand Insights</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Which vegetables are trending?</li>
                  <li>• What are users requesting most?</li>
                  <li>• Seasonal demand patterns</li>
                </ul>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <p className="font-medium">Platform Help</p>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• How to add land listings?</li>
                  <li>• Managing orders effectively</li>
                  <li>• Best practices for farmers</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FarmerAI;
