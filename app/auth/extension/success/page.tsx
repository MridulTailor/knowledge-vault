"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ExtensionAuthSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === "development";

    if (isDevelopment) {
      console.log("Extension success page loaded");
    }

    // Extract data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const user = urlParams.get("user");
    const state = urlParams.get("state");

    const debug = {
      hasToken: !!token,
      tokenLength: token?.length,
      hasUser: !!user,
      hasState: !!state,
      url: window.location.href,
      allParams: Object.fromEntries(urlParams.entries()),
    };

    if (isDevelopment) {
      console.log("Success page URL params:", debug);
      setDebugInfo(debug);
    }

    // Store auth data for extension to read
    if (token) {
      try {
        // Parse user data if provided
        let userData = null;
        if (user) {
          try {
            userData = JSON.parse(decodeURIComponent(user));
          } catch (e) {
            if (isDevelopment) {
              console.error("Failed to parse user data:", e);
            }
          }
        }

        // Create auth data object
        const authData = {
          token,
          user: userData,
          timestamp: Date.now(),
          serverUrl: window.location.origin,
          state,
        };

        // Store in multiple locations for extension to find
        localStorage.setItem("extensionAuth", JSON.stringify(authData));
        localStorage.setItem("token", token);
        localStorage.setItem("kv-extension-token", token);
        sessionStorage.setItem("extensionAuth", JSON.stringify(authData));

        if (isDevelopment) {
          console.log("Extension auth data stored:", {
            token: token.substring(0, 20) + "...",
            user: userData?.email || "Unknown",
            locations: {
              localStorage: !!localStorage.getItem("extensionAuth"),
              sessionStorage: !!sessionStorage.getItem("extensionAuth"),
              tokenStored: !!localStorage.getItem("token"),
            },
          });
        }

        // Test the token with GraphQL to ensure it's valid
        testTokenValidity(token).then((isValid) => {
          if (isDevelopment) {
            console.log("Token validity test:", isValid ? "Valid" : "Invalid");
          }
        });

        // CRITICAL FIX: Post message to extension background script
        if (isDevelopment) {
          console.log("Attempting to communicate with extension...");
        }

        // Method 1: Post message to window (for content scripts)
        window.postMessage(
          {
            type: "EXTENSION_AUTH_SUCCESS",
            token,
            user: userData,
            serverUrl: window.location.origin,
            timestamp: Date.now(),
          },
          "*"
        );

        // Method 2: Try to communicate via extension APIs if available
        if (typeof window !== "undefined" && (window as any).chrome?.runtime) {
          try {
            (window as any).chrome.runtime.sendMessage({
              type: "AUTH_SUCCESS",
              token,
              user: userData,
              serverUrl: window.location.origin,
              timestamp: Date.now(),
            });
            if (isDevelopment) {
              console.log("Message sent to extension runtime");
            }
          } catch (err: any) {
            if (isDevelopment) {
              console.log(
                "Extension runtime not available:",
                err?.message || err
              );
            }
          }
        }

        // Method 3: Set a flag in DOM for content script detection
        document.body.setAttribute("data-extension-auth-token", token);
        document.body.setAttribute(
          "data-extension-auth-user",
          JSON.stringify(userData)
        );
        document.body.setAttribute("data-extension-auth-ready", "true");

        if (isDevelopment) {
          console.log("Extension communication methods attempted");
        }
      } catch (error) {
        console.error("Error storing extension auth data:", error);
      }
    } else {
      console.error("No token found in URL parameters");
    }

    // Auto-close timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Test token validity
  const testTokenValidity = async (token: string) => {
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: "query TestAuth { me { id email name } }",
        }),
      });

      const result = await response.json();
      return !result.errors && result.data?.me;
    } catch (error) {
      console.error("Token validation failed:", error);
      return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
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
          <CardTitle className="text-green-800">
            Authorization Successful!
          </CardTitle>
          <CardDescription>
            Your browser extension has been successfully authorized
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">
              You can now use the Knowledge Vault browser extension to save
              content from any webpage directly to your knowledge vault.
            </p>
          </div>

          {/* Debug info for development */}
          {debugInfo && process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-blue-50 p-3 text-left">
              <details className="text-xs">
                <summary className="cursor-pointer font-medium text-blue-800">
                  🔧 Debug Info (dev only)
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-blue-700">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>This window will close automatically in {countdown} seconds.</p>
          </div>

          <button
            onClick={() => window.close()}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Close this window now
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
