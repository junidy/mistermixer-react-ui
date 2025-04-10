import useMixerStore from '../store/mixerStore'; // Import the Zustand store hook

let socket = null;
let reconnectInterval = null;
const RECONNECT_DELAY = 5000; // 5 seconds

// ========================================================================
// !!! Use Vite Environment Variable for WebSocket URL !!!
// ========================================================================
// Reads from .env.development (for npm run dev) or .env.production (for npm run build)
// Provides a default fallback if the variable isn't defined for some reason.
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8765';
// ========================================================================

const stopReconnectTimer = () => {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
};

const scheduleReconnect = () => {
   stopReconnectTimer(); // Clear any existing timer
   // Only schedule if not already connected or connecting
   const status = useMixerStore.getState().connectionStatus;
   if (status === 'connected' || status === 'connecting') {
      return;
   }

   console.log(`WebSocket disconnected. Scheduling reconnect in ${RECONNECT_DELAY / 1000}s...`);
   reconnectInterval = setInterval(() => {
      console.log("Attempting to reconnect WebSocket...");
      connectWebSocket(); // Try connecting again
   }, RECONNECT_DELAY);
};


// Function to initialize the connection
export const connectWebSocket = () => {
  // Avoid multiple connections or reconnect attempts while already trying
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
     console.log('WebSocket already connected or connecting.');
     stopReconnectTimer(); // Stop trying to reconnect if we succeed manually
     return;
  }

  // Clear any pending reconnection attempts before starting a new one
  stopReconnectTimer();

  console.log(`Attempting to connect WebSocket to ${WS_URL}...`);
  useMixerStore.getState().setConnectionStatus('connecting');

  // Ensure previous socket is fully cleaned up before creating a new one
  if (socket) {
     socket.onopen = null;
     socket.onmessage = null;
     socket.onerror = null;
     socket.onclose = null;
     // Close might be redundant if already closed, but safe to call
     try { socket.close(); } catch(e) { console.error(e); } /* ignore */
  }

  try {
     socket = new WebSocket(WS_URL);
  } catch (error) {
     console.error("WebSocket constructor failed:", error);
     useMixerStore.getState().setConnectionStatus('disconnected');
     scheduleReconnect(); // Schedule a retry even if constructor fails
     return; // Exit if constructor fails
  }


  socket.onopen = () => {
    console.log('WebSocket Connected');
    stopReconnectTimer(); // Successfully connected, stop trying to reconnect
    useMixerStore.getState().setConnectionStatus('connected');
    // Optional: Request initial state from server upon connection?
    // The server might send it automatically, or you might need to request it.
    // Example request: sendMessage({ type: 'GET_FULL_STATE' }); // Adjust format as needed
  };

  socket.onmessage = (event) => {
    try {
      const serverUpdate = JSON.parse(event.data);
      // console.log('WebSocket message received:', serverUpdate); // Log if needed

      // Pass the parsed data (either full state object or patch array) to the store
      useMixerStore.getState().applyServerUpdate(serverUpdate);

    } catch (error) {
      console.error('Failed to parse WebSocket message or update state:', error, 'Raw data:', event.data);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
    // The onclose event will likely follow, which handles status update and reconnection
  };

  socket.onclose = (event) => {
    console.log('WebSocket Disconnected:', event.code, event.reason);
    socket = null; // Clear the socket variable
    useMixerStore.getState().setConnectionStatus('disconnected');
    scheduleReconnect(); // Attempt to reconnect after disconnection
  };
};

// Function to send messages (JSON Patch arrays)
// Called by Zustand actions
export const sendMessage = (patch) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
        socket.send(JSON.stringify(patch));
    } catch(error) {
        console.error("Failed to send WebSocket message:", error);
    }
  } else {
    console.warn('WebSocket not connected. Message not sent:', patch);
    // Optionally queue messages here if needed, but often better to just drop them
    // if the connection is down, as the UI state might become stale anyway.
  }
};

// Function to explicitly disconnect
export const disconnectWebSocket = () => {
    stopReconnectTimer(); // Stop any reconnection attempts
    if (socket) {
        console.log("Disconnecting WebSocket manually.");
        socket.onclose = null; // Prevent scheduleReconnect from firing on manual close
        socket.close();
        socket = null;
        useMixerStore.getState().setConnectionStatus('disconnected');
    }
};

// Optional: Export the raw socket instance if needed elsewhere (use with caution)
// export const getWebSocketInstance = () => socket;