/**
 * ============================================================================
 * STREAMLIT TWO-WAY MESSAGING BRIDGE
 * ============================================================================
 * Enables the React application to run inside Streamlit as a custom component.
 * All reads, writes, and file uploads pass through Streamlit (Python cloud_db).
 */

const listeners = new Set();
const pendingActions = new Map();

function sendFrameHeight() {
  try {
    const height = Math.max(
      window.innerHeight || 0,
      document.documentElement.scrollHeight || 0,
      document.body.scrollHeight || 0,
      window.screen?.availHeight || 1080
    );
    window.parent.postMessage({
      isStreamlitMessage: true,
      type: "streamlit:setFrameHeight",
      height
    }, "*");
  } catch (e) {
    // Ignore cross-origin issues if not in iframe
  }
}

// Global window message listener
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    if (!event.data) return;

    if (event.data.type === "streamlit:render") {
      const args = event.data.args || {};

      // If last_result returned, resolve any pending action promises
      if (args.last_result && args.last_result.id) {
        const actionId = args.last_result.id;
        if (pendingActions.has(actionId)) {
          const { resolve, reject, timeoutId } = pendingActions.get(actionId);
          clearTimeout(timeoutId);
          pendingActions.delete(actionId);
          if (args.last_result.success) {
            resolve(args.last_result);
          } else {
            reject(new Error(args.last_result.error || "Action failed"));
          }
        }
      }

      // Notify all data listeners
      for (const cb of listeners) {
        try {
          cb(args);
        } catch (err) {
          console.error("[streamlitBridge] Error in onData listener:", err);
        }
      }

      // Auto update height after DOM updates
      requestAnimationFrame(() => sendFrameHeight());
    }
  });

  // Watch document resize to dynamically update iframe height
  if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver(() => {
      sendFrameHeight();
    });
    window.addEventListener("DOMContentLoaded", () => {
      resizeObserver.observe(document.body);
    });
  }
}

export const streamlitBridge = {
  /**
   * Registers a listener for Streamlit render events.
   * Immediately sends componentReady and setFrameHeight to Streamlit.
   */
  onData(cb) {
    listeners.add(cb);

    // Announce ready to Streamlit
    try {
      window.parent.postMessage({
        isStreamlitMessage: true,
        type: "streamlit:componentReady",
        apiVersion: 1
      }, "*");
      sendFrameHeight();
    } catch (e) {
      console.warn("[streamlitBridge] Could not post componentReady:", e);
    }

    return () => listeners.delete(cb);
  },

  /**
   * Sends an action payload to Streamlit / Python backend.
   * Value structure: { id, action, ...data }
   */
  sendToPython(payload) {
    const id = payload.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
    const message = {
      isStreamlitMessage: true,
      type: "streamlit:setComponentValue",
      value: {
        ...payload,
        id
      },
      dataType: "json"
    };

    try {
      window.parent.postMessage(message, "*");
    } catch (err) {
      console.error("[streamlitBridge] Failed to postMessage to Streamlit parent:", err);
    }

    return id;
  },

  /**
   * Executes an action and waits for the Python response matching the event id.
   */
  callAction(action, data = {}, timeoutMs = 45000) {
    return new Promise((resolve, reject) => {
      const id = typeof crypto !== "undefined" && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const timeoutId = setTimeout(() => {
        if (pendingActions.has(id)) {
          pendingActions.delete(id);
          reject(new Error(`Action ${action} timed out after ${timeoutMs / 1000}s`));
        }
      }, timeoutMs);

      pendingActions.set(id, { resolve, reject, timeoutId });

      this.sendToPython({
        id,
        action,
        ...data
      });
    });
  },

  /**
   * Helper: converts File / Blob to Base64 string
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result;
        // Keep as full data url or extract base64
        resolve(res);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  setFrameHeight: sendFrameHeight
};

export default streamlitBridge;
