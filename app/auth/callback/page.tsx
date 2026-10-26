"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { graphqlClient } from "@/lib/graphql/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { formatClientError, type FormattedError } from "@/lib/errors";
import { useAuth, type User } from "@/lib/hooks/use-auth";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [formattedError, setFormattedError] = useState<FormattedError | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const returnUrl = searchParams.get("returnUrl") || "/dashboard";
    const errorCode = searchParams.get("error_code");
    const rawError = searchParams.get("error");
    const id = searchParams.get("error_id");
    const details = searchParams.get("error_details");

    if (errorCode || rawError) {
      setStatus("error");
      const err = formatClientError(errorCode || decodeURIComponent(rawError || ""));
      setFormattedError(err);
      setErrorId(id);
      setErrorDetails(details);
      return;
    }

    if (!token) {
      setStatus("error");
      setFormattedError(
        formatClientError("OAUTH_EXCHANGE_FAILED", "No authentication token was received from the identity provider.")
      );
      return;
    }

    setSession(token)
      .then((userData: User | null) => {
        setStatus("success");
        const timer = setTimeout(() => {
          if (returnUrl.includes("/auth/extension")) {
            router.push(returnUrl);
          } else {
            // Perform full window navigation to guarantee layout mounts fresh with authenticated session
            window.location.href = returnUrl;
          }
        }, 500);
        return () => clearTimeout(timer);
      })
      .catch((err: unknown) => {
        console.error("Failed to complete OAuth callback session:", err);
        setStatus("error");
        setFormattedError(formatClientError(err));
      });
  }, [searchParams, router, setSession]);

  return (
    <Card className="w-full max-w-md glass-card border-border/50 shadow-2xl shadow-black/20 text-center">
      <CardHeader className="space-y-3 pb-6">
        <div className="mx-auto flex items-center justify-center">
          {status === "loading" && (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center animate-scale-in">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          )}
          {status === "error" && (
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          )}
        </div>

        <CardTitle className="text-2xl font-bold">
          {status === "loading" && "Authenticating..."}
          {status === "success" && "Authentication Successful!"}
          {status === "error" && (formattedError?.title || "Authentication Failed")}
        </CardTitle>

        <CardDescription>
          {status === "loading" && "Verifying your credentials and synchronizing your vault..."}
          {status === "success" && "Redirecting to your dashboard..."}
          {status === "error" && formattedError?.message}
        </CardDescription>
      </CardHeader>

      {status === "error" && (
        <CardContent className="space-y-4 pt-0">
          <ErrorAlert
            error={formattedError}
            errorId={errorId}
            details={errorDetails}
            className="text-left"
          />
          <Button
            onClick={() => router.push("/auth")}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Return to Sign In
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <Suspense
          fallback={
            <Card className="w-full max-w-md glass-card p-8 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
              <p className="mt-4 text-sm text-muted-foreground">Loading authentication state...</p>
            </Card>
          }
        >
          <OAuthCallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
