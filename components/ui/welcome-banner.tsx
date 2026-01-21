"use client";

import { Brain, Sparkles, TrendingUp, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WelcomeBannerProps {
  userName?: string;
  totalMemories: number;
  recentActivity: number;
  onQuickAdd: () => void;
}

export function WelcomeBanner({
  userName,
  totalMemories,
  recentActivity,
  onQuickAdd,
}: WelcomeBannerProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Card className="p-8 mb-8">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-1">
              {getGreeting()}
              {userName && <span>, {userName}</span>}
            </h2>
            <p className="text-muted-foreground text-sm">
              Your knowledge, organized and connected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-6">
            <div className="text-center px-4 py-2">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-1">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Total</span>
              </div>
              <p className="text-3xl font-bold">
                {totalMemories}
              </p>
            </div>
            
            <div className="h-12 w-px bg-border" />
            
            <div className="text-center px-4 py-2">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Recent</span>
              </div>
              <p className="text-3xl font-bold">
                {recentActivity}
              </p>
            </div>
            
            <div className="h-12 w-px bg-border" />
            
            <div className="text-center px-4 py-2">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Today</span>
              </div>
              <p className="text-3xl font-bold">
                {new Date().toLocaleDateString("en-US", { day: "numeric" })}
              </p>
            </div>
          </div>

          <Button
            onClick={onQuickAdd}
            size="lg"
            className="gap-2"
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Quick Add</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
