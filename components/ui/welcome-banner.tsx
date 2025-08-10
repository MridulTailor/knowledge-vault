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
    <Card className="glass-effect border-border/50 p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {getGreeting()}
              {userName ? `, ${userName}` : ""}
            </h2>
            <p className="text-muted-foreground">
              Your memories are always in sync
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Stats */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Total</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {totalMemories}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Recent</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {recentActivity}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Today</span>
              </div>
              <p className="text-2xl font-bold text-accent">
                {new Date().toLocaleDateString("en-US", { day: "numeric" })}
              </p>
            </div>
          </div>

          <Button
            onClick={onQuickAdd}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>
    </Card>
  );
}
