import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminVerifyFarmers from "./pages/dashboard/AdminVerifyFarmers";
import AdminUsers from "./pages/dashboard/AdminUsers";
import AdminOrders from "./pages/dashboard/AdminOrders";
import AdminAnalytics from "./pages/dashboard/AdminAnalytics";

// Farmer pages
import FarmerLand from "./pages/dashboard/FarmerLand";
import FarmerLandNew from "./pages/dashboard/FarmerLandNew";
import FarmerOrders from "./pages/dashboard/FarmerOrders";
import FarmerAI from "./pages/dashboard/FarmerAI";

// User pages
import UserFarmers from "./pages/dashboard/UserFarmers";
import UserOrders from "./pages/dashboard/UserOrders";
import UserAISuggestions from "./pages/dashboard/UserAISuggestions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Admin Routes */}
            <Route path="/dashboard/admin/verify-farmers" element={<AdminVerifyFarmers />} />
            <Route path="/dashboard/admin/users" element={<AdminUsers />} />
            <Route path="/dashboard/admin/orders" element={<AdminOrders />} />
            <Route path="/dashboard/admin/analytics" element={<AdminAnalytics />} />
            
            {/* Farmer Routes */}
            <Route path="/dashboard/farmer/land" element={<FarmerLand />} />
            <Route path="/dashboard/farmer/land/new" element={<FarmerLandNew />} />
            <Route path="/dashboard/farmer/orders" element={<FarmerOrders />} />
            <Route path="/dashboard/farmer/ai" element={<FarmerAI />} />
            
            {/* User Routes */}
            <Route path="/dashboard/user/farmers" element={<UserFarmers />} />
            <Route path="/dashboard/user/orders" element={<UserOrders />} />
            <Route path="/dashboard/user/suggestions" element={<UserAISuggestions />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
