// Content script for Knowledge Vault extension
(function () {
  "use strict";

  let highlightPopup = null;
  let currentSelection = null;

  // Initialize content script
  function init() {
    // Listen for text selection
    document.addEventListener("mouseup", handleTextSelection);
    document.addEventListener("keyup", handleTextSelection);

    // Listen for escape key to close popup
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && highlightPopup) {
        closeHighlightPopup();
      }
    });

    // Close popup when clicking outside
    document.addEventListener("click", (e) => {
      if (highlightPopup && !highlightPopup.contains(e.target)) {
        closeHighlightPopup();
      }
    });

    // Listen for messages from web page (for auth success)
    window.addEventListener("message", handleWebPageMessage);

    // Minimal logging for production
    if (chrome.runtime.getManifest().name.includes("Dev")) {
      console.log("Knowledge Vault content script initialized");
    }
  }

  // Handle messages from web page
  function handleWebPageMessage(event) {
    // Only accept messages from the same origin as known auth pages
    if (
      !event.origin.includes("localhost:3000") &&
      !event.origin.includes("knowledge-vault-seven.vercel.app")
    ) {
      return;
    }

    if (event.data.type === "EXTENSION_AUTH_SUCCESS") {
      // Only log in development
      if (chrome.runtime.getManifest().name.includes("Dev")) {
        console.log("Content script received AUTH_SUCCESS from web page:", {
          hasToken: !!event.data.token,
          tokenLength: event.data.token?.length,
          hasUser: !!event.data.user,
          origin: event.origin,
        });
      }

      // Forward to background script
      chrome.runtime.sendMessage({
        type: "AUTH_SUCCESS",
        token: event.data.token,
        user: event.data.user,
        serverUrl: event.data.serverUrl,
        timestamp: event.data.timestamp,
        source: "content-script-relay",
      });
    }
  }

  function handleTextSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.length > 10) {
      currentSelection = {
        text: selectedText,
        range: selection.getRangeAt(0),
      };

      // Show highlight popup after a short delay
      setTimeout(() => {
        if (window.getSelection().toString().trim() === selectedText) {
          showHighlightPopup();
        }
      }, 500);
    } else {
      closeHighlightPopup();
      currentSelection = null;
    }
  }

  function showHighlightPopup() {
    if (!currentSelection) return;

    // Remove existing popup
    closeHighlightPopup();

    // Create popup element
    highlightPopup = document.createElement("div");
    highlightPopup.className = "knowledge-vault-highlight-popup";
    highlightPopup.innerHTML = `
      <div class="kv-popup-content">
        <button class="kv-popup-btn kv-save-btn" title="Save to Knowledge Vault">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          Save
        </button>
        <button class="kv-popup-btn kv-note-btn" title="Save with note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          Note
        </button>
        <button class="kv-popup-btn kv-close-btn" title="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;

    // Position popup
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    highlightPopup.style.position = "absolute";
    highlightPopup.style.top = `${window.scrollY + rect.bottom + 10}px`;
    highlightPopup.style.left = `${window.scrollX + rect.left}px`;
    highlightPopup.style.zIndex = "10000";

    // Add event listeners
    highlightPopup
      .querySelector(".kv-save-btn")
      .addEventListener("click", saveHighlight);
    highlightPopup
      .querySelector(".kv-note-btn")
      .addEventListener("click", saveHighlightWithNote);
    highlightPopup
      .querySelector(".kv-close-btn")
      .addEventListener("click", closeHighlightPopup);

    document.body.appendChild(highlightPopup);
  }

  function closeHighlightPopup() {
    if (highlightPopup) {
      highlightPopup.remove();
      highlightPopup = null;
    }
  }

  function saveHighlight() {
    if (!currentSelection) return;

    chrome.runtime.sendMessage({
      action: "saveHighlight",
      data: {
        text: currentSelection.text,
        url: window.location.href,
        title: document.title,
      },
    });

    closeHighlightPopup();
    showTempNotification("Highlight saved!");
  }

  function saveHighlightWithNote() {
    if (!currentSelection) return;

    const note = prompt("Add a note to this highlight (optional):");

    chrome.runtime.sendMessage({
      action: "saveHighlight",
      data: {
        text: currentSelection.text,
        note: note || "",
        url: window.location.href,
        title: document.title,
      },
    });

    closeHighlightPopup();
    showTempNotification("Highlight with note saved!");
  }

  function showTempNotification(message) {
    const notification = document.createElement("div");
    notification.className = "knowledge-vault-notification";
    notification.textContent = message;

    notification.style.position = "fixed";
    notification.style.top = "20px";
    notification.style.right = "20px";
    notification.style.background = "#10b981";
    notification.style.color = "white";
    notification.style.padding = "12px 20px";
    notification.style.borderRadius = "8px";
    notification.style.fontSize = "14px";
    notification.style.fontWeight = "500";
    notification.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    notification.style.zIndex = "10001";
    notification.style.animation = "kvSlideIn 0.3s ease-out";

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = "kvSlideOut 0.3s ease-out";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  // Add CSS styles
  function addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .knowledge-vault-highlight-popup {
        position: absolute;
        background: white;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 4px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .kv-popup-content {
        display: flex;
        gap: 4px;
      }

      .kv-popup-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        background: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: #374151;
        transition: all 0.2s;
      }

      .kv-popup-btn:hover {
        background: #f3f4f6;
        color: #111827;
      }

      .kv-save-btn:hover {
        background: #dcfdf7;
        color: #047857;
      }

      .kv-note-btn:hover {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .kv-close-btn:hover {
        background: #fef2f2;
        color: #dc2626;
      }

      .kv-popup-btn svg {
        width: 14px;
        height: 14px;
      }

      @keyframes kvSlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes kvSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      .knowledge-vault-notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }
    `;

    document.head.appendChild(style);
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      addStyles();
      init();
    });
  } else {
    addStyles();
    init();
  }
})();
