import { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  MapPin,
  Lightbulb,
  Camera,
  TrendingUp,
  Calendar,
  BookOpen,
  BarChart3,
  Settings,
  Menu,
  X,
  Sprout,
  LogOut,
} from "lucide-react";

const navItems = [
  { title: "Overview", icon: LayoutDashboard, path: "/" },
  { title: "Farm Profile", icon: MapPin, path: "/farm-profile" },
  { title: "Smart Advisory", icon: Lightbulb, path: "/advisory" },
  { title: "Vision & Diagnosis", icon: Camera, path: "/diagnosis" },
  { title: "Market & Sales", icon: TrendingUp, path: "/market" },
  { title: "Scheduler", icon: Calendar, path: "/scheduler" },
  { title: "Knowledge Hub", icon: BookOpen, path: "/knowledge" },
  { title: "Insights & Reports", icon: BarChart3, path: "/insights" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-card border-r transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sprout className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold">AgroAgent</h1>
                <p className="text-xs text-muted-foreground">Smart Farming</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <Menu /> : <X />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed && "justify-center",
                    isActive && "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        {!collapsed && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
