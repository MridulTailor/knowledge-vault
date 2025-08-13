// Background script for Knowledge Vault extension
const isDevelopment = chrome.runtime.getManifest().name.includes("Dev");

function log(message, ...args) {
  if (isDevelopment) {
    console.log(message, ...args);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  log("Knowledge Vault extension installed");

  // Create context menu items
  chrome.contextMenus.create({
    id: "save-to-knowledge-vault",
    title: "Save to Knowledge Vault",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "save-selection-to-knowledge-vault",
    title: "Save selection to Knowledge Vault",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "save-link-to-knowledge-vault",
    title: "Save link to Knowledge Vault",
    contexts: ["link"],
  });
});

// Handle manual logout coordination (no automatic checking)
async function handleManualLogout() {
  try {
    // Clear auth data
    await chrome.storage.sync.remove([
      "serverUrl",
      "authToken",
      "user",
      "authTime",
    ]);
    await chrome.storage.local.remove(["authState"]);

    // Notify all listeners about logout
    chrome.runtime
      .sendMessage({
        type: "AUTH_STATUS_CHANGED",
        isAuthenticated: false,
      })
      .catch(() => {
        // Silent fail if no listeners
      });
  } catch (error) {
    log("Manual logout error:", error);
  }
}

// Check if user is still authenticated in web app (manual call only)
async function checkWebAppAuth(serverUrl, token) {
  try {
    const testQuery = `
      query TestAuth {
        me {
          id
          email
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
      return false;
    }

    const result = await response.json();

    if (result.errors || !result.data?.me) {
      return false;
    }

    return true;
  } catch (error) {
    log("Web app auth check failed:", error);
    return false;
  }
}

// Listen for storage changes (development only)
if (isDevelopment) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    log("Storage changed in", namespace, ":", changes);

    if (changes.authToken) {
      log("Auth token changed:", {
        oldValue: changes.authToken.oldValue ? "Present" : "Missing",
        newValue: changes.authToken.newValue ? "Present" : "Missing",
      });
    }

    if (changes.serverUrl) {
      log("Server URL changed:", changes.serverUrl);
    }
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { serverUrl, authToken } = await chrome.storage.sync.get([
    "serverUrl",
    "authToken",
  ]);

  log("Context menu clicked:", {
    hasServerUrl: !!serverUrl,
    hasAuthToken: !!authToken,
    serverUrl,
  });

  if (!serverUrl || !authToken) {
    // Open options page to configure
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
    switch (info.menuItemId) {
      case "save-to-knowledge-vault":
        await savePageFromContextMenu(tab, serverUrl, authToken);
        break;
      case "save-selection-to-knowledge-vault":
        await saveSelectionFromContextMenu(info, tab, serverUrl, authToken);
        break;
      case "save-link-to-knowledge-vault":
        await saveLinkFromContextMenu(info, tab, serverUrl, authToken);
        break;
    }
  } catch (error) {
    console.error("Context menu action failed:", error);
    showNotification("Failed to save to Knowledge Vault", "error");
  }
});

async function savePageFromContextMenu(tab, serverUrl, authToken) {
  try {
    // Extract page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const title = document.title;
        const content =
          document.body.innerText || document.body.textContent || "";
        const url = window.location.href;
        const metaDescription =
          document.querySelector('meta[name="description"]')?.content || "";
        return {
          title,
          content: content.substring(0, 2000),
          url,
          metaDescription,
        };
      },
    });

    const pageData = results[0].result;

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
        title: pageData.title,
        content: `# ${pageData.title}\n\nSource: [${pageData.url}](${
          pageData.url
        })\n\n${
          pageData.metaDescription ? pageData.metaDescription + "\n\n" : ""
        }${pageData.content}`,
        type: "BOOKMARK",
        tagNames: [getDomainFromUrl(pageData.url)],
        url: pageData.url,
      },
    };

    await makeGraphQLRequest(serverUrl, authToken, mutation, variables);
    showNotification("Page saved to Knowledge Vault!", "success");
  } catch (error) {
    console.error("Error saving page:", error);
    throw error;
  }
}

async function saveSelectionFromContextMenu(info, tab, serverUrl, authToken) {
  try {
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
        title: `Selection from ${tab.title}`,
        content: `# Selection from ${tab.title}\n\nSource: [${tab.url}](${tab.url})\n\n> ${info.selectionText}`,
        type: "ARTICLE",
        tagNames: ["web-clip", getDomainFromUrl(tab.url)],
      },
    };

    await makeGraphQLRequest(serverUrl, authToken, mutation, variables);
    showNotification("Selection saved to Knowledge Vault!", "success");
  } catch (error) {
    console.error("Error saving selection:", error);
    throw error;
  }
}

async function saveLinkFromContextMenu(info, tab, serverUrl, authToken) {
  try {
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
        title: info.linkText || info.linkUrl,
        content: `# ${info.linkText || info.linkUrl}\n\nLink: [${
          info.linkUrl
        }](${info.linkUrl})\n\nSaved from: [${tab.title}](${tab.url})`,
        type: "BOOKMARK",
        tagNames: ["link", getDomainFromUrl(info.linkUrl)],
        url: info.linkUrl,
      },
    };

    await makeGraphQLRequest(serverUrl, authToken, mutation, variables);
    showNotification("Link saved to Knowledge Vault!", "success");
  } catch (error) {
    console.error("Error saving link:", error);
    throw error;
  }
}

async function makeGraphQLRequest(serverUrl, authToken, query, variables = {}) {
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

function getDomainFromUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace("www.", "");
  } catch {
    return "web";
  }
}

function showNotification(message, type = "info") {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-48.png",
    title: "Knowledge Vault",
    message: message,
  });
}

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const { serverUrl, authToken } = await chrome.storage.sync.get([
    "serverUrl",
    "authToken",
  ]);

  if (!serverUrl || !authToken) {
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
    switch (command) {
      case "save-page":
        await savePageFromContextMenu(tab, serverUrl, authToken);
        break;
      case "quick-note":
        chrome.tabs.create({
          url: `${serverUrl}/dashboard?new=true`,
        });
        break;
    }
  } catch (error) {
    console.error("Keyboard shortcut action failed:", error);
    showNotification("Action failed. Please try again.", "error");
  }
});

// Listen for messages from content script and web app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  log("Background received message:", request);

  if (request.action === "saveHighlight") {
    handleSaveHighlight(request.data, sender.tab);
  } else if (request.type === "AUTH_SUCCESS") {
    log("Received AUTH_SUCCESS message from web app");
    handleAuthSuccess(request, sender);
    sendResponse({ success: true });
  } else if (request.type === "MANUAL_LOGOUT") {
    log("Received manual logout request");
    handleManualLogout();
    sendResponse({ success: true });
  }
});

// Handle manual logout (when user clicks logout in extension)
async function handleManualLogout() {
  try {
    // Clear extension auth data
    await chrome.storage.sync.remove([
      "serverUrl",
      "authToken",
      "user",
      "authTime",
    ]);
    await chrome.storage.local.remove(["authState"]);

    // Notify all extension components
    chrome.runtime
      .sendMessage({
        type: "AUTH_STATUS_CHANGED",
        isAuthenticated: false,
      })
      .catch(() => {
        // Silent fail if no listeners
      });

    log("Manual logout completed");
  } catch (error) {
    console.error("Error during manual logout:", error);
  }
}

// Handle successful authentication from web app
async function handleAuthSuccess(authData, sender) {
  try {
    log("Processing AUTH_SUCCESS:", {
      hasToken: !!authData.token,
      tokenLength: authData.token?.length,
      hasUser: !!authData.user,
      serverUrl: authData.serverUrl,
      sender: sender.tab?.url,
    });

    // Store auth data in Chrome extension storage
    const storeData = {
      serverUrl: authData.serverUrl,
      authToken: authData.token,
      user: authData.user,
      authTime: authData.timestamp || Date.now(),
    };

    await chrome.storage.sync.set(storeData);

    log("Auth data stored in Chrome storage via background script:", {
      serverUrl: storeData.serverUrl,
      hasToken: !!storeData.authToken,
      tokenLength: storeData.authToken?.length,
      hasUser: !!storeData.user,
      userEmail: storeData.user?.email,
    });

    // Notify that auth is complete
    chrome.runtime
      .sendMessage({
        type: "AUTH_COMPLETED",
        success: true,
      })
      .catch(() => {
        // Ignore errors if no listeners
      });
  } catch (error) {
    console.error("Error processing AUTH_SUCCESS:", error);
  }
}

async function handleSaveHighlight(highlightData, tab) {
  const { serverUrl, authToken } = await chrome.storage.sync.get([
    "serverUrl",
    "authToken",
  ]);

  if (!serverUrl || !authToken) {
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
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
        title: `Highlight from ${tab.title}`,
        content: `# Highlight from ${tab.title}\n\nSource: [${tab.url}](${
          tab.url
        })\n\n> ${highlightData.text}\n\n${
          highlightData.note ? `**Note:** ${highlightData.note}` : ""
        }`,
        type: "ARTICLE",
        tagNames: ["highlight", "web-clip", getDomainFromUrl(tab.url)],
      },
    };

    await makeGraphQLRequest(serverUrl, authToken, mutation, variables);
    showNotification("Highlight saved to Knowledge Vault!", "success");
  } catch (error) {
    console.error("Error saving highlight:", error);
    showNotification("Failed to save highlight", "error");
  }
}
