"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  className,
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105 z-40",
        "flex items-center justify-center",
        className
      )}
    >
      <Plus className="h-6 w-6 text-primary-foreground" />
    </Button>
  );
}
