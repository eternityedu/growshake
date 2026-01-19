import { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Shield, Tractor, User, Loader2, Menu, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

const DashboardLayout = ({ children, sidebar }: DashboardLayoutProps) => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
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
    navigate("/auth");
    return null;
  }

  const getRoleBadge = () => {
    switch (role) {
      case "admin":
        return <Badge className="bg-destructive"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
      case "farmer":
        return <Badge className="bg-earth"><Tractor className="h-3 w-3 mr-1" />Farmer</Badge>;
      default:
        return <Badge variant="secondary"><User className="h-3 w-3 mr-1" />User</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {sidebar && (
              <button
                className="lg:hidden p-2 -ml-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 p-1.5 flex items-center justify-center">
                <img src={logo} alt="GrowShare" className="h-full w-full object-contain" />
              </div>
              <span className="font-display text-xl font-bold hidden sm:block">
                Grow<span className="text-primary">Share</span>
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            {getRoleBadge()}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        {sidebar && (
          <>
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar content */}
            <aside className={`
              fixed lg:sticky top-[57px] left-0 z-40
              w-64 h-[calc(100vh-57px)] bg-card border-r border-border
              transform transition-transform duration-200
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <div className="p-4 overflow-y-auto h-full">
                {sidebar}
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className={`flex-1 min-h-[calc(100vh-57px)] ${sidebar ? 'lg:ml-0' : ''}`}>
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
