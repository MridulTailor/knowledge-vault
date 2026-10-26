"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { formatClientError } from "@/lib/errors";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error securely for telemetry
    console.error("[APP_RUNTIME_ERROR]", error);
  }, [error]);

  const formatted = formatClientError(error);
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-primary/5" />
      </div>

      <Card className="relative z-10 w-full max-w-md glass-card border-destructive/20 shadow-2xl text-center">
        <CardHeader className="space-y-3 pb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold">{formatted.title}</CardTitle>
          <CardDescription className="text-foreground/80">
            {formatted.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {formatted.suggestion && (
            <p className="text-xs text-muted-foreground italic">
              💡 {formatted.suggestion}
            </p>
          )}

          {isDev && error.message && (
            <div className="text-left rounded-xl bg-black/40 p-3 font-mono text-[11px] text-destructive/90 border border-white/5 overflow-x-auto max-h-36">
              <div className="font-semibold text-muted-foreground mb-1">
                Digest: {error.digest || "none"}
              </div>
              <div className="break-all whitespace-pre-wrap">{error.message}</div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
              className="flex-1 h-11 rounded-xl gap-2"
            >
              <Home className="h-4 w-4" />
              <span>Go Home</span>
            </Button>
            <Button
              onClick={reset}
              className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
