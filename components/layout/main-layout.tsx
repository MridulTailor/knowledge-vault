"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  sidebarProps?: {
    onShowSearch?: () => void;
    onShowForm?: () => void;
    onShowExportImport?: () => void;
  };
  showSidebar?: boolean;
}

export function MainLayout({
  children,
  sidebarProps,
  showSidebar = true,
}: MainLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!showSidebar) {
    // For pages that don't need sidebar (like graph page)
    return <div className="min-h-screen bg-background relative overflow-hidden">{children}</div>;
  }

  // For pages that need sidebar (like dashboard)
  return (
    <div className="flex h-screen bg-background">
      {sidebarProps && (
        <Sidebar 
          {...sidebarProps} 
          isMobileOpen={isSidebarOpen}
          onMobileToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
        />
      )}
      <main
        className={cn(
          "flex-1 overflow-auto transition-all duration-300 ease-in-out",
          sidebarProps && !isMobile ? (isSidebarCollapsed ? "ml-20" : "ml-64") : "ml-0"
        )}
      >
        {/* Mobile menu button */}
        {isMobile && sidebarProps && (
          <Button
            variant="outline"
            size="icon"
            className="fixed top-4 left-4 z-40 shadow-sm"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
