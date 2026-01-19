import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MapPin,
  Package,
  Sprout,
  Truck,
  TrendingUp,
  User,
  Plus,
} from "lucide-react";

const menuItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "My Land Listings", href: "/dashboard/farmer/land", icon: MapPin },
  { title: "Add New Land", href: "/dashboard/farmer/land/new", icon: Plus },
  { title: "Orders", href: "/dashboard/farmer/orders", icon: Package },
  { title: "Growth Updates", href: "/dashboard/farmer/growth", icon: Sprout },
  { title: "Deliveries", href: "/dashboard/farmer/deliveries", icon: Truck },
  { title: "AI Insights", href: "/dashboard/farmer/insights", icon: TrendingUp },
  { title: "My Profile", href: "/dashboard/farmer/profile", icon: User },
];

const FarmerSidebar = () => {
  const location = useLocation();

  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
        Farmer Dashboard
      </p>
      {menuItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
};

export default FarmerSidebar;
