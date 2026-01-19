import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Tractor,
  Package,
  Leaf,
  History,
  User,
  Heart,
} from "lucide-react";

const menuItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Find Farmers", href: "/dashboard/user/farmers", icon: Tractor },
  { title: "My Orders", href: "/dashboard/user/orders", icon: Package },
  { title: "Track Growth", href: "/dashboard/user/tracking", icon: Leaf },
  { title: "AI Suggestions", href: "/dashboard/user/suggestions", icon: Heart },
  { title: "Order History", href: "/dashboard/user/history", icon: History },
  { title: "My Profile", href: "/dashboard/user/profile", icon: User },
];

const UserSidebar = () => {
  const location = useLocation();

  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
        My Dashboard
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

export default UserSidebar;
