// Popup functionality
class KnowledgeVaultPopup {
  constructor() {
    this.authService = new AuthService();
    this.isDevelopment = chrome.runtime.getManifest().name.includes("Dev");
    this.init();
  }

  log(message, ...args) {
    if (this.isDevelopment) {
      console.log(message, ...args);
    }
  }

  async init() {
    await this.checkAuthState();
    this.setupEventListeners();
    this.setupMessageListeners();

    if (await this.authService.isAuthenticated()) {
      await this.loadRecentEntries();
    }
  }

  // Listen for messages from background script
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.log("Popup received message:", message);

      if (message.type === "AUTH_COMPLETED" && message.success) {
        this.log("Authentication completed! Refreshing popup state...");
        // Refresh auth state and UI
        setTimeout(async () => {
          await this.checkAuthState();
          if (await this.authService.isAuthenticated()) {
            await this.loadRecentEntries();
          }
        }, 500);
      } else if (
        message.type === "AUTH_STATUS_CHANGED" &&
        !message.isAuthenticated
      ) {
        this.log("User logged out, updating extension UI...");
        // User logged out, update UI immediately (no visual notification)
        this.showAuthSection();
      }
    });
  }

  // Helper method to show auth section
  showAuthSection() {
    const authSection = document.getElementById("auth-section");
    const mainSection = document.getElementById("main-section");

    if (authSection && mainSection) {
      authSection.classList.remove("hidden");
      mainSection.classList.add("hidden");
    }
  }

  async checkAuthState() {
    const isAuthenticated = await this.authService.isAuthenticated();
    const authSection = document.getElementById("auth-section");
    const mainSection = document.getElementById("main-section");

    this.log("Checking auth state:", {
      isAuthenticated,
      authSectionExists: !!authSection,
      mainSectionExists: !!mainSection,
    });

    // Development debugging only
    if (this.isDevelopment) {
      const storageData = await new Promise((resolve) => {
        chrome.storage.sync.get(
          ["serverUrl", "authToken", "user", "authTime"],
          resolve
        );
      });

      this.log("Direct storage check:", {
        hasServerUrl: !!storageData.serverUrl,
        hasToken: !!storageData.authToken,
        tokenLength: storageData.authToken?.length,
        hasUser: !!storageData.user,
        authTime: storageData.authTime
          ? new Date(storageData.authTime).toLocaleString()
          : null,
      });

      // If AuthService says not authenticated but we have storage data, investigate
      if (!isAuthenticated && storageData.authToken && storageData.serverUrl) {
        this.log("AuthService says not authenticated but storage has token!");

        try {
          const user = await this.authService.verifyToken(
            storageData.serverUrl,
            storageData.authToken
          );
          this.log("Manual verification successful! User:", user.email);

          // Force show authenticated state since token is valid
          authSection.classList.add("hidden");
          mainSection.classList.remove("hidden");

          // Try to display user info
          const userInfo = document.getElementById("user-info");
          if (userInfo) {
            userInfo.textContent = `Signed in as ${user.email}`;
          }

          this.log("Manually set authenticated state in UI");
          return; // Exit early since we're actually authenticated
        } catch (verifyError) {
          console.error("Manual verification failed:", verifyError);
          this.log("Token is invalid, cleaning up...");
          await this.authService.logout();
        }
      }
    }

    if (!isAuthenticated) {
      authSection.classList.remove("hidden");
      mainSection.classList.add("hidden");
      this.log("User not authenticated, showing auth section");
    } else {
      authSection.classList.add("hidden");
      mainSection.classList.remove("hidden");
      this.log("User authenticated, showing main section");

      // Display current user info if available
      try {
        const authData = await this.authService.getAuthData();
        if (authData.user) {
          this.log("Current user:", authData.user.email);
          const userInfo = document.getElementById("user-info");
          if (userInfo) {
            userInfo.textContent = `Signed in as ${authData.user.email}`;
          }
        }
      } catch (e) {
        console.error("Error getting auth data:", e);
      }
    }
  }

  setupEventListeners() {
    // Auth buttons
    document.getElementById("sign-in-btn")?.addEventListener("click", () => {
      this.signIn();
    });

    document.getElementById("retry-auth")?.addEventListener("click", () => {
      this.signIn();
    });

    document
      .getElementById("refresh-auth")
      ?.addEventListener("click", async () => {
        this.log("🔄 Manual auth state refresh requested");
        await this.checkAuthState();
        if (await this.authService.isAuthenticated()) {
          await this.loadRecentEntries();
        }
      });

    // Settings button
    document.getElementById("settings-btn").addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });

    // Logout button
    document
      .getElementById("logout-btn")
      ?.addEventListener("click", async () => {
        try {
          await this.authService.logout();
          await this.checkAuthState();
        } catch (error) {
          this.log("Logout failed:", error);
        }
      });

    // Manual web app sync check button (for manual logout detection)
    document
      .getElementById("sync-auth")
      ?.addEventListener("click", async () => {
        try {
          const isValidInWebApp =
            await this.authService.checkWebAppAuthStatus();
          if (!isValidInWebApp) {
            this.log("Web app auth expired, logging out extension");
            await this.authService.logout();
            this.showAuthSection();
          } else {
            this.log("Extension and web app are in sync");
          }
        } catch (error) {
          this.log("Auth sync check failed:", error);
        }
      });

    // Quick actions
    document.getElementById("save-page").addEventListener("click", () => {
      this.savePage();
    });

    document.getElementById("save-selection").addEventListener("click", () => {
      this.saveSelection();
    });

    document.getElementById("create-note").addEventListener("click", () => {
      this.createNote();
    });

    // Search
    document
      .getElementById("search-input")
      .addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.performSearch();
        }
      });

    document.getElementById("search-btn").addEventListener("click", () => {
      this.performSearch();
    });

    // Footer link
    document.getElementById("open-vault").addEventListener("click", (e) => {
      e.preventDefault();
      this.openKnowledgeVault();
    });

    document.getElementById("open-settings")?.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });

    // Check for selected text
    this.checkSelectedText();
  }

  async signIn() {
    const loadingEl = document.getElementById("auth-loading");
    const errorEl = document.getElementById("auth-error");
    const signInBtn = document.getElementById("sign-in-btn");

    try {
      loadingEl.classList.remove("hidden");
      errorEl.classList.add("hidden");
      signInBtn.disabled = true;

      this.log("🔍 Starting sign-in process...");
      await this.authService.authenticate();

      this.log("🔍 Authentication completed, refreshing UI...");

      // Wait a moment for storage to sync, then refresh
      setTimeout(async () => {
        await this.checkAuthState();

        if (await this.authService.isAuthenticated()) {
          this.log("✅ Now authenticated, loading entries...");
          await this.loadRecentEntries();
        } else {
          this.log(
            "⚠️ Still not authenticated after sign-in, manual refresh needed"
          );
          // Try one more time after a longer delay
          setTimeout(async () => {
            await this.checkAuthState();
            if (await this.authService.isAuthenticated()) {
              await this.loadRecentEntries();
            }
          }, 2000);
        }
      }, 1000);
    } catch (error) {
      console.error("Sign in error:", error);
      errorEl.classList.remove("hidden");
      errorEl.querySelector(".error-text").textContent =
        error.message || "Authentication failed. Please try again.";
    } finally {
      loadingEl.classList.add("hidden");
      signInBtn.disabled = false;
    }
  }

  async checkSelectedText() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Check if this is a restricted page
      if (!tab?.url) {
        this.disableSelectionButton("No active tab");
        return;
      }

      const url = tab.url;
      const isRestrictedPage =
        url.startsWith("chrome://") ||
        url.startsWith("chrome-extension://") ||
        url.startsWith("moz-extension://") ||
        url.startsWith("edge://") ||
        url.startsWith("about:") ||
        url.startsWith("data:") ||
        url.includes("chrome.google.com/webstore");

      if (isRestrictedPage) {
        this.log("Skipping selected text check on restricted page:", url);
        this.disableSelectionButton("Cannot access this page");
        return;
      }

      // Try to get selected text from allowed pages
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => window.getSelection().toString(),
      });

      const selectedText = results[0]?.result;
      const saveSelectionBtn = document.getElementById("save-selection");

      if (selectedText && selectedText.trim().length > 0) {
        saveSelectionBtn.disabled = false;
        saveSelectionBtn.textContent = `Save "${selectedText.substring(0, 20)}${
          selectedText.length > 20 ? "..." : ""
        }"`;
      } else {
        this.disableSelectionButton();
      }
    } catch (error) {
      this.log("Cannot check selected text on this page:", error.message);
      this.disableSelectionButton("Cannot access this page");
    }
  }

  disableSelectionButton(reason = null) {
    const saveSelectionBtn = document.getElementById("save-selection");
    saveSelectionBtn.disabled = true;

    // Clear existing content
    while (saveSelectionBtn.firstChild) {
      saveSelectionBtn.removeChild(saveSelectionBtn.firstChild);
    }

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");

    const path1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path1.setAttribute("d", "M3 6l3 3-3 3");
    const path2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path2.setAttribute("d", "M21 6l-3 3 3 3");
    const path3 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    path3.setAttribute("d", "M8 12h8");

    svg.appendChild(path1);
    svg.appendChild(path2);
    svg.appendChild(path3);

    // Add text
    const text = document.createTextNode(
      ` ${reason ? reason : "Save Selection"}`
    );

    saveSelectionBtn.appendChild(svg);
    saveSelectionBtn.appendChild(text);
  }

  async savePage() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Check if this is a restricted page
      if (!tab?.url) {
        this.showError("Cannot save: No active tab");
        return;
      }

      const url = tab.url;
      const isRestrictedPage =
        url.startsWith("chrome://") ||
        url.startsWith("chrome-extension://") ||
        url.startsWith("moz-extension://") ||
        url.startsWith("edge://") ||
        url.startsWith("about:") ||
        url.startsWith("data:");

      if (isRestrictedPage) {
        this.showError("Cannot save browser internal pages");
        return;
      }

      // Extract page content from allowed pages
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // Simple content extraction
          const title = document.title;
          const content =
            document.body.innerText || document.body.textContent || "";
          const url = window.location.href;
          return { title, content: content.substring(0, 2000), url };
        },
      });

      const pageData = results[0].result;

      await this.saveEntry({
        title: pageData.title,
        content: `# ${pageData.title}\n\nSource: [${pageData.url}](${pageData.url})\n\n${pageData.content}`,
        type: "BOOKMARK",
        tags: [this.getDomainFromUrl(pageData.url)],
        url: pageData.url,
      });

      this.showSuccess("Page saved successfully!");
    } catch (error) {
      console.error("Error saving page:", error);
      this.showError("Failed to save page. Please try again.");
    }
  }

  async saveSelection() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Check if this is a restricted page
      if (!tab?.url) {
        this.showError("Cannot save: No active tab");
        return;
      }

      const url = tab.url;
      const isRestrictedPage =
        url.startsWith("chrome://") ||
        url.startsWith("chrome-extension://") ||
        url.startsWith("moz-extension://") ||
        url.startsWith("edge://") ||
        url.startsWith("about:") ||
        url.startsWith("data:");

      if (isRestrictedPage) {
        this.showError("Cannot save content from browser internal pages");
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const selection = window.getSelection().toString();
          const title = document.title;
          const url = window.location.href;
          return { selection, title, url };
        },
      });

      const selectionData = results[0].result;

      if (
        !selectionData.selection ||
        selectionData.selection.trim().length === 0
      ) {
        this.showError("No text selected. Please select some text first.");
        return;
      }

      await this.saveEntry({
        title: `Selection from ${selectionData.title}`,
        content: `# Selection from ${selectionData.title}\n\nSource: [${selectionData.url}](${selectionData.url})\n\n> ${selectionData.selection}`,
        type: "ARTICLE",
        tags: ["web-clip", this.getDomainFromUrl(selectionData.url)],
      });

      this.showSuccess("Selection saved successfully!");
    } catch (error) {
      console.error("Error saving selection:", error);
      this.showError("Failed to save selection. Please try again.");
    }
  }

  async createNote() {
    const { serverUrl } = await this.authService.getAuthData();
    chrome.tabs.create({
      url: `${serverUrl}/dashboard?new=true`,
    });
  }

  async performSearch() {
    const query = document.getElementById("search-input").value.trim();
    if (!query) return;

    const { serverUrl } = await this.authService.getAuthData();
    chrome.tabs.create({
      url: `${serverUrl}/dashboard?search=${encodeURIComponent(query)}`,
    });
  }

  async loadRecentEntries() {
    const { serverUrl, authToken } = await this.authService.getAuthData();

    if (!authToken || !serverUrl) return;

    const loadingEl = document.getElementById("loading");
    const entriesListEl = document.getElementById("entries-list");
    const noEntriesEl = document.getElementById("no-entries");

    loadingEl.classList.remove("hidden");

    // Clear entries list safely
    while (entriesListEl.firstChild) {
      entriesListEl.removeChild(entriesListEl.firstChild);
    }

    try {
      const response = await this.makeGraphQLRequest(
        `
        query GetRecentEntries {
          entries {
            id
            title
            type
            createdAt
            tags {
              name
            }
          }
        }
      `,
        {},
        serverUrl,
        authToken
      );

      const entries = response.data?.entries || [];

      if (entries.length === 0) {
        noEntriesEl.classList.remove("hidden");
      } else {
        // Sort by creation date and take first 10
        const sortedEntries = entries
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);

        sortedEntries.forEach((entry) => {
          const entryEl = this.createEntryElement(entry);
          entriesListEl.appendChild(entryEl);
        });
      }
    } catch (error) {
      console.error("Error loading recent entries:", error);

      // Clear existing content
      while (noEntriesEl.firstChild) {
        noEntriesEl.removeChild(noEntriesEl.firstChild);
      }

      const errorParagraph = document.createElement("p");
      errorParagraph.textContent =
        "Failed to load entries. Please check your connection.";
      noEntriesEl.appendChild(errorParagraph);

      noEntriesEl.classList.remove("hidden");
    } finally {
      loadingEl.classList.add("hidden");
    }
  }

  createEntryElement(entry) {
    const entryEl = document.createElement("div");
    entryEl.className = "entry-item";
    entryEl.addEventListener("click", async () => {
      const { serverUrl } = await this.authService.getAuthData();
      chrome.tabs.create({
        url: `${serverUrl}/dashboard?entry=${entry.id}`,
      });
    });

    const tags = entry.tags.map((tag) => tag.name).join(", ");
    const date = new Date(entry.createdAt).toLocaleDateString();

    // Create entry title
    const titleDiv = document.createElement("div");
    titleDiv.className = "entry-title";
    titleDiv.textContent = entry.title; // Using textContent is already safe, no need for escapeHtml

    // Create entry meta container
    const metaDiv = document.createElement("div");
    metaDiv.className = "entry-meta";

    // Create type span
    const typeSpan = document.createElement("span");
    typeSpan.className = `entry-type ${entry.type.toLowerCase()}`;
    typeSpan.textContent = entry.type.toLowerCase();

    // Create date span
    const dateSpan = document.createElement("span");
    dateSpan.textContent = date;

    metaDiv.appendChild(typeSpan);
    metaDiv.appendChild(dateSpan);

    // Create tags span if tags exist
    if (tags) {
      const tagsSpan = document.createElement("span");
      tagsSpan.textContent = tags;
      metaDiv.appendChild(tagsSpan);
    }

    // Assemble the entry element
    entryEl.appendChild(titleDiv);
    entryEl.appendChild(metaDiv);

    return entryEl;
  }

  async saveEntry(entryData) {
    const { serverUrl, authToken } = await this.authService.getAuthData();

    const mutation = `
      mutation CreateEntry($input: CreateEntryInput!) {
        createEntry(input: $input) {
          id
          title
        }
      }
    `;

    const variables = {
      input: {
        title: entryData.title,
        content: entryData.content,
        type: entryData.type,
        tagNames: entryData.tags || [],
        url: entryData.url,
      },
    };

    await this.makeGraphQLRequest(mutation, variables, serverUrl, authToken);
    await this.loadRecentEntries();
  }

  async makeGraphQLRequest(query, variables = {}, serverUrl, authToken) {
    const response = await fetch(`${serverUrl}/api/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    return result;
  }

  async openKnowledgeVault() {
    const { serverUrl } = await this.authService.getAuthData();
    chrome.tabs.create({
      url: serverUrl,
    });
  }

  getDomainFromUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return "web";
    }
  }

  showSuccess(message) {
    this.log("Success:", message);
  }

  showError(message) {
    this.log("Error:", message);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new KnowledgeVaultPopup();
});
