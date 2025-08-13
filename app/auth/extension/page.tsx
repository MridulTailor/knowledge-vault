"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExtensionAuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [state, setState] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  useEffect(() => {
    // Get state from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const stateParam = urlParams.get("state");
    if (stateParam) {
      setState(stateParam);
    }
  }, []);

  useEffect(() => {
    // If user is already authenticated, auto-authorize
    if (user && !loading && state) {
      handleAuthorize();
    }
  }, [user, loading, state]);

  const handleAuthorize = async () => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/auth/extension?state=${state}`);
      router.push(`/auth?returnUrl=${returnUrl}`);
      return;
    }

    setIsAuthorizing(true);

    try {
      // Get the current auth token
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Store user data for the extension
      localStorage.setItem(
        "extensionAuth",
        JSON.stringify({
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          timestamp: Date.now(),
        })
      );

      // Redirect to success page with token and user data
      const successUrl =
        `/auth/extension/success?` +
        new URLSearchParams({
          token: token,
          state: state || "",
          user: JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name || "",
          }),
        }).toString();

      console.log("🔍 Redirecting to success page with data:", {
        hasToken: !!token,
        tokenLength: token.length,
        user: user.email,
        state,
      });

      router.push(successUrl);
    } catch (error) {
      console.error("Authorization error:", error);
    } finally {
      setIsAuthorizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <CardTitle>Authorize Browser Extension</CardTitle>
          <CardDescription>
            Knowledge Vault Browser Extension is requesting access to your
            account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="text-sm text-blue-800">
              <p className="font-medium">This will allow the extension to:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Save web pages and content to your Knowledge Vault</li>
                <li>Access your entries for search and recent items</li>
                <li>Create new entries from browser content</li>
              </ul>
            </div>
          </div>

          {!user ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                You need to sign in to authorize the browser extension
              </p>
              <Button onClick={() => router.push("/auth")} className="w-full">
                Sign In to Knowledge Vault
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">
                  Signed in as {user.email}
                </span>
              </div>

              <Button
                onClick={handleAuthorize}
                disabled={isAuthorizing}
                className="w-full"
              >
                {isAuthorizing ? "Authorizing..." : "Authorize Extension"}
              </Button>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => window.close()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
