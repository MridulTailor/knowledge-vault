"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Home,
  Plus,
  Search,
  LogOut,
  Brain,
  ChevronLeft,
  ChevronRight,
  Folder,
  Network,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ModeToggle } from "@/components/mode-toggle";

interface SidebarProps {
  onShowSearch?: () => void;
  onShowForm?: () => void;
  onShowExportImport?: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({
  onShowSearch,
  onShowForm,
  onShowExportImport,
  isMobileOpen = false,
  onMobileToggle,
  isCollapsed: externalIsCollapsed,
  onCollapsedChange,
}: SidebarProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Use external collapsed state if provided, otherwise use internal
  const isCollapsed = externalIsCollapsed ?? internalIsCollapsed;

  const handleCollapsedToggle = () => {
    const newCollapsed = !isCollapsed;
    if (onCollapsedChange) {
      onCollapsedChange(newCollapsed);
    } else {
      setInternalIsCollapsed(newCollapsed);
    }
  };

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        // Reset collapsed state on mobile
        if (onCollapsedChange) {
          onCollapsedChange(false);
        } else {
          setInternalIsCollapsed(false);
        }
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, [onCollapsedChange]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/auth");
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/dashboard",
    },
    {
      id: "graph",
      label: "Knowledge Graph",
      icon: Network,
      path: "/graph",
    },
    {
      id: "collections",
      label: "Collections",
      icon: Folder,
      path: "/dashboard?view=collections",
    },
  ];

  const quickActions = [
    { label: "Add Memory", icon: Plus, action: onShowForm },
    onShowSearch && { label: "Search", icon: Search, action: onShowSearch },
    onShowExportImport && { label: "Export/Import", icon: Download, action: onShowExportImport },
  ].filter(Boolean);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onMobileToggle}
        />
      )}
      
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-card border-r border-border transition-all duration-300",
          isCollapsed && !isMobile ? "w-20" : "w-64",
          isMobile && !isMobileOpen && "-translate-x-full"
        )}
      >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center space-x-3", isCollapsed && !isMobile ? "justify-center w-full" : "")}>
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Brain className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <h1 className="text-lg font-bold truncate">
                Knowledge Vault
              </h1>
            )}
          </div>
          
          {!isMobile && !isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapsedToggle}
              className="h-8 w-8 p-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
        {isCollapsed && !isMobile && (
           <Button
             variant="ghost"
             size="sm"
             onClick={handleCollapsedToggle}
             className="w-full mt-2 h-8"
             title="Expand sidebar"
           >
             <ChevronRight className="h-4 w-4" />
           </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-2 space-y-1 mt-4">
        {menuItems.map((item) => {
          let isActive = false;
          const viewParam = searchParams?.get('view');
          
          if (item.id === 'dashboard') {
            isActive = pathname === '/dashboard' && (!viewParam || viewParam === 'home');
          } else if (item.id === 'collections') {
            isActive = pathname === '/dashboard' && viewParam === 'collections';
          } else if (item.id === 'graph') {
            isActive = pathname === '/graph';
          } else {
            isActive = pathname === item.path;
          }
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isCollapsed ? "px-2 justify-center" : "px-3",
                isActive && "bg-accent/10 text-accent font-medium hover:bg-accent/15 hover:text-accent"
              )}
              onClick={() => {
                router.push(item.path);
                if (isMobile && onMobileToggle) onMobileToggle();
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 mt-auto">
        {!isCollapsed && (
          <p className="text-xs font-medium text-muted-foreground mb-2 px-2">
            Quick Actions
          </p>
        )}
        <div className="space-y-1">
          {quickActions.map((action: any, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className={cn(
                "w-full justify-start",
                isCollapsed ? "px-2 justify-center" : "px-3"
              )}
              onClick={() => {
                action.action();
                if (isMobile && onMobileToggle) onMobileToggle();
              }}
              title={isCollapsed ? action.label : undefined}
            >
              <action.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* User Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
    </>
  );
}
