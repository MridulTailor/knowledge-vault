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
    
    // Create popup content container
    const popupContent = document.createElement("div");
    popupContent.className = "kv-popup-content";
    
    // Create Save button
    const saveBtn = document.createElement("button");
    saveBtn.className = "kv-popup-btn kv-save-btn";
    saveBtn.title = "Save to Knowledge Vault";
    
    const saveSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    saveSvg.setAttribute("width", "16");
    saveSvg.setAttribute("height", "16");
    saveSvg.setAttribute("viewBox", "0 0 24 24");
    saveSvg.setAttribute("fill", "none");
    saveSvg.setAttribute("stroke", "currentColor");
    saveSvg.setAttribute("stroke-width", "2");
    
    const savePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    savePath.setAttribute("d", "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z");
    saveSvg.appendChild(savePath);
    
    saveBtn.appendChild(saveSvg);
    saveBtn.appendChild(document.createTextNode(" Save"));
    
    // Create Note button
    const noteBtn = document.createElement("button");
    noteBtn.className = "kv-popup-btn kv-note-btn";
    noteBtn.title = "Save with note";
    
    const noteSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    noteSvg.setAttribute("width", "16");
    noteSvg.setAttribute("height", "16");
    noteSvg.setAttribute("viewBox", "0 0 24 24");
    noteSvg.setAttribute("fill", "none");
    noteSvg.setAttribute("stroke", "currentColor");
    noteSvg.setAttribute("stroke-width", "2");
    
    const notePath1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    notePath1.setAttribute("d", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z");
    const notePolyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    notePolyline.setAttribute("points", "14,2 14,8 20,8");
    const noteLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    noteLine1.setAttribute("x1", "16");
    noteLine1.setAttribute("y1", "13");
    noteLine1.setAttribute("x2", "8");
    noteLine1.setAttribute("y2", "13");
    const noteLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    noteLine2.setAttribute("x1", "16");
    noteLine2.setAttribute("y1", "17");
    noteLine2.setAttribute("x2", "8");
    noteLine2.setAttribute("y2", "17");
    
    noteSvg.appendChild(notePath1);
    noteSvg.appendChild(notePolyline);
    noteSvg.appendChild(noteLine1);
    noteSvg.appendChild(noteLine2);
    
    noteBtn.appendChild(noteSvg);
    noteBtn.appendChild(document.createTextNode(" Note"));
    
    // Create Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "kv-popup-btn kv-close-btn";
    closeBtn.title = "Close";
    
    const closeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    closeSvg.setAttribute("width", "16");
    closeSvg.setAttribute("height", "16");
    closeSvg.setAttribute("viewBox", "0 0 24 24");
    closeSvg.setAttribute("fill", "none");
    closeSvg.setAttribute("stroke", "currentColor");
    closeSvg.setAttribute("stroke-width", "2");
    
    const closeLine1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    closeLine1.setAttribute("x1", "18");
    closeLine1.setAttribute("y1", "6");
    closeLine1.setAttribute("x2", "6");
    closeLine1.setAttribute("y2", "18");
    const closeLine2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    closeLine2.setAttribute("x1", "6");
    closeLine2.setAttribute("y1", "6");
    closeLine2.setAttribute("x2", "18");
    closeLine2.setAttribute("y2", "18");
    
    closeSvg.appendChild(closeLine1);
    closeSvg.appendChild(closeLine2);
    closeBtn.appendChild(closeSvg);
    
    // Assemble the popup
    popupContent.appendChild(saveBtn);
    popupContent.appendChild(noteBtn);
    popupContent.appendChild(closeBtn);
    highlightPopup.appendChild(popupContent);

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
