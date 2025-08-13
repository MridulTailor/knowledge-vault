// Options page functionality
class KnowledgeVaultOptions {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get(["serverUrl", "authToken"]);

    document.getElementById("server-url").value =
      result.serverUrl || "http://localhost:3000";
    document.getElementById("auth-token").value = result.authToken || "";
  }

  setupEventListeners() {
    document.getElementById("save-settings").addEventListener("click", () => {
      this.saveSettings();
    });

    document.getElementById("test-connection").addEventListener("click", () => {
      this.testConnection();
    });

    // Auto-save on input change
    document.getElementById("server-url").addEventListener("input", () => {
      this.autoSave();
    });

    document.getElementById("auth-token").addEventListener("input", () => {
      this.autoSave();
    });
  }

  async autoSave() {
    // Debounced auto-save
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(async () => {
      const serverUrl = document.getElementById("server-url").value.trim();
      const authToken = document.getElementById("auth-token").value.trim();

      if (serverUrl && authToken) {
        await chrome.storage.sync.set({
          serverUrl: serverUrl,
          authToken: authToken,
        });
      }
    }, 1000);
  }

  async saveSettings() {
    const serverUrl = document.getElementById("server-url").value.trim();
    const authToken = document.getElementById("auth-token").value.trim();

    if (!serverUrl) {
      this.showStatus("Please enter a server URL", "error");
      return;
    }

    if (!authToken) {
      this.showStatus("Please enter an authentication token", "error");
      return;
    }

    // Validate URL format
    try {
      new URL(serverUrl);
    } catch (error) {
      this.showStatus(
        "Please enter a valid URL (e.g., http://localhost:3000)",
        "error"
      );
      return;
    }

    // Save settings
    await chrome.storage.sync.set({
      serverUrl: serverUrl,
      authToken: authToken,
    });

    this.showStatus("Settings saved successfully!", "success");
  }

  async testConnection() {
    const serverUrl = document.getElementById("server-url").value.trim();
    const authToken = document.getElementById("auth-token").value.trim();

    if (!serverUrl || !authToken) {
      this.showStatus(
        "Please fill in both server URL and authentication token",
        "error"
      );
      return;
    }

    this.showStatus("Testing connection...", "loading");

    try {
      // Test GraphQL endpoint with a simple query
      const testQuery = `
        query TestConnection {
          entries {
            id
          }
        }
      `;

      const response = await fetch(`${serverUrl}/api/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          query: testQuery,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        if (
          result.errors[0].message.includes("Unauthorized") ||
          result.errors[0].message.includes("Authentication")
        ) {
          throw new Error("Authentication failed. Please check your token.");
        }
        throw new Error(result.errors[0].message);
      }

      // Connection successful
      this.showStatus(
        "✅ Connection successful! Your settings are working correctly.",
        "success"
      );

      // Auto-save successful settings
      await chrome.storage.sync.set({
        serverUrl: serverUrl,
        authToken: authToken,
      });
    } catch (error) {
      console.error("Connection test failed:", error);

      let errorMessage = "Connection failed: ";

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage += `Cannot reach server at ${serverUrl}. Please check the URL and ensure your Knowledge Vault app is running.`;
      } else if (
        error.message.includes("Authentication") ||
        error.message.includes("Unauthorized")
      ) {
        errorMessage +=
          "Invalid authentication token. Please check your token and try again.";
      } else {
        errorMessage += error.message;
      }

      this.showStatus(errorMessage, "error");
    }
  }

  showStatus(message, type = "info") {
    const statusEl = document.getElementById("connection-status");

    statusEl.textContent = message;
    statusEl.className = `connection-status ${type}`;
    statusEl.classList.remove("hidden");

    // Auto-hide after 5 seconds for success messages
    if (type === "success") {
      setTimeout(() => {
        statusEl.classList.add("hidden");
      }, 5000);
    }
  }

  // Utility method to get current settings
  async getCurrentSettings() {
    return await chrome.storage.sync.get(["serverUrl", "authToken"]);
  }

  // Method to clear all settings
  async clearSettings() {
    await chrome.storage.sync.clear();
    document.getElementById("server-url").value = "";
    document.getElementById("auth-token").value = "";
    this.showStatus("Settings cleared", "success");
  }
}

// Initialize options page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new KnowledgeVaultOptions();
});

// Add keyboard shortcuts for better UX
document.addEventListener("keydown", (e) => {
  // Ctrl/Cmd + S to save
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    document.getElementById("save-settings").click();
  }

  // Ctrl/Cmd + Enter to test connection
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    document.getElementById("test-connection").click();
  }
});

// Add helpful tooltips and instructions
function addInteractiveHelp() {
  // Add copy button for common URLs
  const serverUrlInput = document.getElementById("server-url");

  // Add common URL suggestions
  const commonUrls = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://your-app.vercel.app",
    "https://your-app.netlify.app",
  ];

  // Create datalist for URL suggestions
  const datalist = document.createElement("datalist");
  datalist.id = "url-suggestions";

  commonUrls.forEach((url) => {
    const option = document.createElement("option");
    option.value = url;
    datalist.appendChild(option);
  });

  document.body.appendChild(datalist);
  serverUrlInput.setAttribute("list", "url-suggestions");
}

// Initialize interactive help when page loads
document.addEventListener("DOMContentLoaded", addInteractiveHelp);
