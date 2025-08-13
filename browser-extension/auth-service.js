// Authentication service for Knowledge Vault extension
class AuthService {
  constructor() {
    this.serverUrls = [
      "https://knowledge-vault-seven.vercel.app",
      "http://localhost:3000",
    ];
    this.isDevelopment =
      typeof chrome !== "undefined" &&
      chrome.runtime.getManifest().name.includes("Dev");
  }

  log(message, ...args) {
    if (this.isDevelopment) {
      console.log(message, ...args);
    }
  }

  // Notify components about auth status changes
  notifyAuthStatusChange(isAuthenticated) {
    try {
      chrome.runtime.sendMessage({
        type: "AUTH_STATUS_CHANGED",
        isAuthenticated,
      });
    } catch (error) {
      // Silent fail if no listeners
    }
  }

  // Check web app auth status (called manually, not automatically)
  async checkWebAppAuthStatus() {
    try {
      const result = await chrome.storage.sync.get(["serverUrl", "authToken"]);

      if (!result.serverUrl || !result.authToken) {
        return false;
      }

      const testQuery = `
        query TestAuth {
          me {
            id
            email
          }
        }
      `;

      const response = await fetch(`${result.serverUrl}/api/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${result.authToken}`,
        },
        body: JSON.stringify({
          query: testQuery,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();

      if (data.errors || !data.data?.me) {
        return false;
      }

      return true;
    } catch (error) {
      this.log("Web app auth check failed:", error);
      return false;
    }
  }

  // Auto-detect which server is available
  async detectServer() {
    for (const url of this.serverUrls) {
      try {
        const response = await fetch(`${url}/api/health`, {
          method: "GET",
          mode: "cors",
          cache: "no-cache",
        });

        if (response.ok) {
          this.log(`Detected Knowledge Vault server at: ${url}`);
          return url;
        }
      } catch (error) {
        // Silent fail for server detection
      }
    }

    // Default to production if none detected
    return this.serverUrls[0];
  }

  // Open authentication flow
  async authenticate() {
    try {
      const serverUrl = await this.detectServer();

      // Create a unique state for this auth request
      const state = this.generateState();
      await chrome.storage.local.set({ authState: state });

      // Open auth tab with extension callback
      const authUrl = `${serverUrl}/auth/extension?state=${state}`;
      const authTab = await chrome.tabs.create({
        url: authUrl,
        active: true,
      });

      return new Promise((resolve, reject) => {
        let checkCount = 0;

        // Listen for the auth completion
        const checkAuth = setInterval(async () => {
          checkCount++;

          try {
            const tab = await chrome.tabs.get(authTab.id);

            // Check if tab was closed (user cancelled)
            if (!tab) {
              clearInterval(checkAuth);
              reject(new Error("Authentication cancelled"));
              return;
            }

            // Check if we're on the success page
            if (tab.url && tab.url.includes("/auth/extension/success")) {
              // Wait for the success page to process the data
              setTimeout(async () => {
                try {
                  clearInterval(checkAuth);

                  // Extract token from URL or storage
                  const result = await this.completeAuth(tab.id, serverUrl);

                  // Close the auth tab
                  chrome.tabs.remove(tab.id);
                  resolve(result);
                } catch (error) {
                  console.error("Authentication completion error:", error);
                  reject(error);
                }
              }, 3000); // Wait 3 seconds for data to be processed

              return; // Don't continue the interval
            }
          } catch (error) {
            console.error("Authentication check error:", error);
            clearInterval(checkAuth);
            reject(error);
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkAuth);
          reject(new Error("Authentication timeout"));
        }, 300000);
      });
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  }

  // Complete the authentication process
  async completeAuth(tabId, serverUrl) {
    try {
      // Execute script in the auth tab to get the token
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        function: () => {
          // Wait for the success page to fully load and process data
          return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;

            const checkForToken = () => {
              attempts++;

              // Check if page has finished processing (look for our data attribute)
              const isReady = document.body.getAttribute(
                "data-extension-auth-ready"
              );

              if (isReady === "true") {
                // Get token and user from DOM attributes (most reliable)
                const tokenFromDOM = document.body.getAttribute(
                  "data-extension-auth-token"
                );
                const userFromDOM = document.body.getAttribute(
                  "data-extension-auth-user"
                );

                if (tokenFromDOM) {
                  resolve({
                    token: tokenFromDOM,
                    user: userFromDOM,
                    source: "DOM attributes",
                  });
                  return;
                }
              }

              // Fallback: Try to get token from URL first
              const urlParams = new URLSearchParams(window.location.search);
              const tokenFromUrl = urlParams.get("token");
              const userFromUrl = urlParams.get("user");

              if (tokenFromUrl) {
                resolve({
                  token: tokenFromUrl,
                  user: userFromUrl,
                  source: "URL parameters",
                });
                return;
              }

              // Then check localStorage/sessionStorage
              const tokenFromStorage =
                localStorage.getItem("token") ||
                localStorage.getItem("kv-extension-token");

              const extensionAuth = localStorage.getItem("extensionAuth");
              let extensionToken = null;
              let extensionUser = null;

              if (extensionAuth) {
                try {
                  const authData = JSON.parse(extensionAuth);
                  extensionToken = authData.token;
                  extensionUser = authData.user;
                } catch (e) {
                  // Silent fail
                }
              }

              const finalToken =
                tokenFromUrl || extensionToken || tokenFromStorage;
              const finalUser =
                userFromUrl ||
                (extensionUser ? JSON.stringify(extensionUser) : null);

              if (finalToken) {
                resolve({
                  token: finalToken,
                  user: finalUser,
                  source: extensionToken
                    ? "Extension Auth Storage"
                    : "Local Storage",
                });
                return;
              }

              // If no token found and we haven't reached max attempts, try again
              if (attempts < maxAttempts) {
                setTimeout(checkForToken, 500);
              } else {
                resolve({
                  token: null,
                  user: null,
                  source: "none",
                });
              }
            };

            // Start checking immediately
            checkForToken();
          });
        },
      });

      const authData = results[0]?.result;

      if (!authData?.token) {
        throw new Error("No authentication token received");
      }

      // Store the authentication data
      const storeData = {
        serverUrl: serverUrl,
        authToken: authData.token,
        user: authData.user ? JSON.parse(authData.user) : null,
        authTime: Date.now(),
      };

      await chrome.storage.sync.set(storeData);

      // Verify the token works
      const user = await this.verifyToken(serverUrl, authData.token);

      return {
        serverUrl,
        token: authData.token,
        user: authData.user ? JSON.parse(authData.user) : user,
      };
    } catch (error) {
      console.error("Error completing authentication:", error);
      throw error;
    }
  }

  // Verify the token is valid
  async verifyToken(serverUrl, token) {
    const testQuery = `
      query TestAuth {
        me {
          id
          email
          name
        }
      }
    `;

    const response = await fetch(`${serverUrl}/api/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: testQuery,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token verification failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`Token verification failed: ${result.errors[0].message}`);
    }

    if (!result.data?.me) {
      throw new Error("Token verification failed: No user data returned");
    }

    return result.data.me;
  }

  // Check if user is still authenticated in the web app
  async checkWebAppAuthStatus(serverUrl, token) {
    try {
      // First check the GraphQL endpoint
      await this.verifyToken(serverUrl, token);

      // Additionally check if there's a specific auth check endpoint
      const authCheckResponse = await fetch(`${serverUrl}/api/auth/check`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => null); // Ignore if endpoint doesn't exist

      // If auth check endpoint exists and fails, user is logged out
      if (authCheckResponse && !authCheckResponse.ok) {
        throw new Error("Web app auth check failed");
      }

      return true;
    } catch (error) {
      this.log("Web app auth check failed:", error.message);
      return false;
    }
  }

  // Generate a random state for OAuth security
  generateState() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Check if user is authenticated (local check only - no network calls)
  async isAuthenticated() {
    try {
      const result = await chrome.storage.sync.get([
        "serverUrl",
        "authToken",
        "authTime",
      ]);

      if (!result.serverUrl || !result.authToken) {
        return false;
      }

      // Check if token is less than 7 days old
      const tokenAge = Date.now() - (result.authTime || 0);
      if (tokenAge > 7 * 24 * 60 * 60 * 1000) {
        // 7 days
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }

  // Check if user is authenticated with full web app verification (network call)
  async isAuthenticatedWithSync() {
    try {
      // First do local check
      const localAuth = await this.isAuthenticated();
      if (!localAuth) {
        return false;
      }

      // Then verify with web app
      const isValidInWebApp = await this.checkWebAppAuthStatus();
      if (!isValidInWebApp) {
        this.log("User logged out from web app, syncing extension logout");
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking authentication with sync:", error);
      return false;
    }
  }

  // Get current auth data
  async getAuthData() {
    const result = await chrome.storage.sync.get([
      "serverUrl",
      "authToken",
      "user",
    ]);
    return {
      serverUrl: result.serverUrl,
      authToken: result.authToken,
      user: result.user,
    };
  }

  // Logout
  async logout() {
    await chrome.storage.sync.remove([
      "serverUrl",
      "authToken",
      "user",
      "authTime",
    ]);
    await chrome.storage.local.remove(["authState"]);

    // Notify about logout
    this.notifyAuthStatusChange(false);

    this.log("User logged out from extension");
  }

  // Refresh token if needed
  async refreshAuth() {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      return await this.authenticate();
    }
    return await this.getAuthData();
  }
}

// Make AuthService available globally
window.AuthService = AuthService;
