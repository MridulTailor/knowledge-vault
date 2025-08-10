"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Home,
  Plus,
  FileText,
  Search,
  Settings,
  LogOut,
  Brain,
  Menu,
  X,
  Code,
  Bookmark,
  Layers,
  Archive,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onShowSearch: () => void;
  onShowForm: () => void;
  onShowExportImport: () => void;
}

export function Sidebar({
  activeView,
  onViewChange,
  onShowSearch,
  onShowForm,
  onShowExportImport,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/auth");
  };

  const menuItems = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      action: () => onViewChange("home"),
    },
    {
      id: "memories",
      label: "Memories",
      icon: FileText,
      action: () => onViewChange("memories"),
    },
    {
      id: "code",
      label: "Code",
      icon: Code,
      action: () => onViewChange("code"),
    },
    {
      id: "bookmarks",
      label: "Bookmarks",
      icon: Bookmark,
      action: () => onViewChange("bookmarks"),
    },
    {
      id: "spaces",
      label: "Spaces",
      icon: Layers,
      action: () => onViewChange("spaces"),
    },
  ];

  const quickActions = [
    { label: "Add Memory", icon: Plus, action: onShowForm },
    { label: "Search", icon: Search, action: onShowSearch },
    { label: "Export/Import", icon: Download, action: onShowExportImport },
  ];

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-card/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        isMobile && isCollapsed && "-translate-x-full"
      )}
    >
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsCollapsed(true)}
        />
      )}
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Knowledge Vault
                </h1>
                <p className="text-xs text-muted-foreground">
                  Your digital memory
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto hover:bg-muted/50"
          >
            {isCollapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start text-sm font-medium transition-all duration-200",
              isCollapsed ? "px-3" : "px-4",
              activeView === item.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
            onClick={item.action}
          >
            <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && item.label}
          </Button>
        ))}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border/30">
        {!isCollapsed && (
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Quick Actions
          </p>
        )}
        <div className="space-y-1">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start text-sm transition-all duration-200 hover:bg-primary/10 hover:text-primary",
                isCollapsed ? "px-3" : "px-4"
              )}
              onClick={action.action}
            >
              <action.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/30">
        <div
          className={cn(
            "flex items-center space-x-3",
            isCollapsed && "justify-center"
          )}
        >
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
