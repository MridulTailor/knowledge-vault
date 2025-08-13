"use client";

import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  sidebarProps?: {
    activeView: string;
    onViewChange: (view: string) => void;
    onShowSearch: () => void;
    onShowForm: () => void;
    onShowExportImport: () => void;
  };
  showSidebar?: boolean;
}

export function MainLayout({
  children,
  sidebarProps,
  showSidebar = true,
}: MainLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!showSidebar) {
    // For pages that don't need sidebar (like graph page)
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // For pages that need sidebar (like dashboard)
  return (
    <div className="flex h-screen bg-background">
      {sidebarProps && <Sidebar {...sidebarProps} />}
      <main
        className={cn(
          "flex-1 overflow-hidden",
          sidebarProps && !isMobile ? "ml-64" : "ml-0"
        )}
      >
        {children}
      </main>
    </div>
  );
}
