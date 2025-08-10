"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Zap, Mail, Lock } from "lucide-react";

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <Card className="w-[420px] glass-effect border-border/50 animate-fade-in">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to access your knowledge vault
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg animate-slide-in">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-card/50 border-border/50 focus:border-primary/50 focus:bg-card transition-all duration-200"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-card/50 border-border/50 focus:border-primary/50 focus:bg-card transition-all duration-200"
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
          >
            Sign In
          </Button>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
            >
              Create account
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
