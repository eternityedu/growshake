import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Tractor,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  CheckCircle,
} from "lucide-react";

const menuItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Farmer Verification", href: "/dashboard/admin/verify-farmers", icon: CheckCircle },
  { title: "All Farmers", href: "/dashboard/admin/farmers", icon: Tractor },
  { title: "All Users", href: "/dashboard/admin/users", icon: Users },
  { title: "All Orders", href: "/dashboard/admin/orders", icon: Package },
  { title: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
  { title: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  { title: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
        Admin Panel
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

export default AdminSidebar;
