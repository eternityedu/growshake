import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import UserSidebar from "@/components/dashboard/UserSidebar";
import AIChat from "@/components/AIChat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Heart, Sparkles } from "lucide-react";

const UserAISuggestions = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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

  return (
    <DashboardLayout sidebar={<UserSidebar />}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold mb-2">AI Suggestions</h1>
          <p className="text-muted-foreground">
            Get personalized vegetable recommendations powered by AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Trending Vegetables AI */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Trending Vegetables</h2>
                <p className="text-sm text-muted-foreground">
                  See what's popular among users
                </p>
              </div>
            </div>
            <AIChat
              type="trending"
              title="Trending AI"
              placeholder="Ask about trending vegetables..."
              initialMessage="What vegetables are trending right now?"
            />
          </div>

          {/* Health Advisor AI */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Heart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Health & Food Advisor</h2>
                <p className="text-sm text-muted-foreground">
                  Get health-based recommendations
                </p>
              </div>
            </div>
            <AIChat
              type="health"
              title="Health Advisor AI"
              placeholder="Ask about health benefits..."
              initialMessage="What vegetables are good for overall health?"
            />
          </div>
        </div>

        {/* Quick Questions */}
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Quick Questions
            </CardTitle>
            <CardDescription>
              Popular questions you can ask our AI assistants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium mb-2">Trending AI</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Which vegetables are most popular this season?</li>
                  <li>• What are users ordering the most?</li>
                  <li>• Show me demand patterns for tomatoes</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium mb-2">Health Advisor AI</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Which vegetables help with diabetes?</li>
                  <li>• What should I eat for better digestion?</li>
                  <li>• Vegetables good for blood pressure</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserAISuggestions;
