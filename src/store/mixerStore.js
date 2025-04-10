import { create } from "zustand";
import { applyPatch } from "fast-json-patch";
import { sendMessage } from "../services/websocketService"; // Import send function

// --- Configuration ---
const DEBOUNCE_DELAY_MS = 66; // Approx 15 updates per second

// --- Debounce Management (Module Scope) ---
// Stores timeout IDs for debounced patch sends, keyed by JSON Pointer path
let debounceTimers = {};

// --- State Initialization ---
// Helper to create a default channel state based on schema defaults/mins
const createDefaultChannel = (index) => {
  // Pass index here
  const isMainBus = index === 0;
  let defaultAnalogGain = 0.0; // Default for Master Bus (index 0)
  if (index >= 1 && index <= 4) {
    // Channels 1-4 (XLR)
    defaultAnalogGain = -3.0;
  } else if (index >= 5 && index <= 8) {
    // Channels 5-8 (TS)
    defaultAnalogGain = -9.0;
  }

  return {
    muted: false,
    soloed: false,
    panning: 0.5,
    digital_gain: 0.0,
    analog_gain: defaultAnalogGain, // <-- ADDED with default logic
    stereo: isMainBus,
    equalizer: {
      enabled: false,
      lowShelf: { gain_db: 0.0, cutoff_freq: 80, q_factor: 0.707 },
      highShelf: { gain_db: 0.0, cutoff_freq: 12000, q_factor: 0.707 },
      band0: { gain_db: 0.0, cutoff_freq: 250, q_factor: 1.0 },
      band1: { gain_db: 0.0, cutoff_freq: 1000, q_factor: 1.0 },
      band2: { gain_db: 0.0, cutoff_freq: 4000, q_factor: 1.0 },
      band3: { gain_db: 0.0, cutoff_freq: 10000, q_factor: 1.0 },
    },
    compressor: {
      enabled: false,
      threshold_db: -20.0,
      ratio: 2.0,
      attack_ms: 10.0,
      release_ms: 50.0,
      knee_db: 0.0,
      makeup_gain_db: 0.0,
    },
    distortion: { enabled: false, drive: 0.0, output_gain_db: 0.0 },
    phaser: { enabled: false, rate: 1.0, depth: 50.0 },
    reverb: { enabled: isMainBus, decay_time: 1.5, wet_level: 25.0 },
  };
};

// Define the initial state based on the schema
const initialState = {
  channels: Array.from({ length: 9 }, (_, index) =>
    createDefaultChannel(index)
  ), // Pass index
  soloing_active: false, // Read-only from server probably
  inferencing_active: false, // Might be controllable or read-only
  hw_init_ready: false, // Read-only from server probably
  // Internal UI state, not part of the synced schema
  connectionStatus: "disconnected",
};

// --- Zustand Store Definition ---
export const useMixerStore = create((set, get) => ({
  ...initialState,

  // --- Server Update Application ---
  // Called by websocketService when a message (patch or full state) arrives
  applyServerUpdate: (update) => {
    set((state) => {
      // Keep track if the state actually changed
      let stateChanged = false;
      let newState = state;

      if (Array.isArray(update)) {
        // JSON Patch array
        try {
          // Use fast-json-patch to apply the changes immutably
          // The 'mutate' option is false by default, returning a new object
          const patchResult = applyPatch(
            state,
            update,
            /*validate*/ false,
            /*mutate*/ false
          );
          newState = patchResult.newDocument;
          // Check if the root object reference changed
          stateChanged = newState !== state;
        } catch (e) {
          console.error("Failed to apply JSON Patch:", e, "Patch:", update);
          // Don't change state on error
        }
      } else if (
        typeof update === "object" &&
        update !== null &&
        update.channels
      ) {
        // Full state object
        console.log("Applying full state update from server.");
        // Compare if necessary or just assume change
        stateChanged =
          JSON.stringify(state.channels) !== JSON.stringify(update.channels); // || /* compare other top-level keys */;
        // Overwrite state, preserving local connectionStatus
        newState = { ...update, connectionStatus: state.connectionStatus };
      } else {
        console.warn("Received unknown update format from server:", update);
      }

      // Only return a new object reference if the state actually changed
      // This prevents unnecessary re-renders if the incoming patch was redundant
      // Note: fast-json-patch might return the same object reference if no changes occurred.
      // You might need a deeper comparison if patch library behavior varies.
      return stateChanged ? newState : state;
    });
  },

  // --- Connection Status ---
  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },

  // --- Patch Sending Helpers ---
  /**
   * Sends a patch immediately (for toggles, etc.).
   * @param {string} path - JSON Pointer path
   * @param {*} value - The new value
   */
  _sendPatch: (path, value) => {
    const patch = [{ op: "replace", path, value }];
    // console.log('Sending Patch Immediately:', patch); // Verbose logging
    sendMessage(patch);
  },

  /**
   * Debounces sending a patch (for sliders, knobs, etc.).
   * @param {string} path - JSON Pointer path
   * @param {*} value - The new value
   */
  _debounceSendPatch: (path, value) => {
    // Clear any existing timer for this specific path
    if (debounceTimers[path]) {
      clearTimeout(debounceTimers[path]);
    }
    // Set a new timer
    debounceTimers[path] = setTimeout(() => {
      get()._sendPatch(path, value); // Call the immediate send function after delay
      delete debounceTimers[path]; // Clean up the timer ID reference
    }, DEBOUNCE_DELAY_MS);
  },

  // --- UI Triggered Actions (Optimistic Updates + Patch Sending) ---

  // ** Channel Parameters **
  setMuted: (channelIndex, isMuted) => {
    const path = `/channels/${channelIndex}/muted`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state)); // Deep copy for safety
      newState.channels[channelIndex].muted = isMuted;
      return newState;
    });
    get()._sendPatch(path, isMuted); // Send immediately
  },

  setSoloed: (channelIndex, isSoloed) => {
    const path = `/channels/${channelIndex}/soloed`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].soloed = isSoloed;
      // Note: soloing_active should be updated by the server based on all solo states
      return newState;
    });
    get()._sendPatch(path, isSoloed); // Send immediately
  },

  setPanning: (channelIndex, panValue) => {
    const path = `/channels/${channelIndex}/panning`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].panning = panValue;
      return newState;
    });
    get()._debounceSendPatch(path, panValue); // Debounce
  },

  setDigitalGain: (channelIndex, gainDb) => {
    const path = `/channels/${channelIndex}/digital_gain`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].digital_gain = gainDb;
      return newState;
    });
    get()._debounceSendPatch(path, gainDb); // Debounce
  },

  setAnalogGain: (channelIndex, gainDb) => {
    const path = `/channels/${channelIndex}/analog_gain`;
    set((state) => {
      /* Optimistic Update */
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].analog_gain = gainDb;
      return newState;
    });
    get()._debounceSendPatch(path, gainDb); // Debounce
  },

  // ** Equalizer Parameters **
  setEqEnabled: (channelIndex, enabled) => {
    const path = `/channels/${channelIndex}/equalizer/enabled`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].equalizer.enabled = enabled;
      return newState;
    });
    get()._sendPatch(path, enabled); // Send immediately
  },

  setEqBandParam: (channelIndex, bandName, paramName, value) => {
    // bandName: lowShelf, highShelf, band0, band1, band2, band3
    // paramName: gain_db, cutoff_freq, q_factor
    const path = `/channels/${channelIndex}/equalizer/${bandName}/${paramName}`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].equalizer[bandName][paramName] = value;
      return newState;
    });
    get()._debounceSendPatch(path, value); // Debounce
  },

  // ** Compressor Parameters **
  setCompressorEnabled: (channelIndex, enabled) => {
    const path = `/channels/${channelIndex}/compressor/enabled`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].compressor.enabled = enabled;
      return newState;
    });
    get()._sendPatch(path, enabled); // Send immediately
  },

  setCompressorParam: (channelIndex, paramName, value) => {
    // paramName: threshold_db, ratio, attack_ms, release_ms, knee_db, makeup_gain_db
    const path = `/channels/${channelIndex}/compressor/${paramName}`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].compressor[paramName] = value;
      return newState;
    });
    get()._debounceSendPatch(path, value); // Debounce
  },

  // ** Distortion Parameters **
  setDistortionEnabled: (channelIndex, enabled) => {
    const path = `/channels/${channelIndex}/distortion/enabled`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].distortion.enabled = enabled;
      return newState;
    });
    get()._sendPatch(path, enabled); // Send immediately
  },

  setDistortionParam: (channelIndex, paramName, value) => {
    // paramName: drive, output_gain_db
    const path = `/channels/${channelIndex}/distortion/${paramName}`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].distortion[paramName] = value;
      return newState;
    });
    // Drive is like a knob, output gain maybe less frequent - decide debounce per param
    if (paramName === "drive") {
      get()._debounceSendPatch(path, value); // Debounce drive
    } else {
      get()._sendPatch(path, value); // Send output gain immediately (or debounce too if needed)
    }
  },

  // ** Phaser Parameters **
  setPhaserEnabled: (channelIndex, enabled) => {
    const path = `/channels/${channelIndex}/phaser/enabled`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].phaser.enabled = enabled;
      return newState;
    });
    get()._sendPatch(path, enabled); // Send immediately
  },

  setPhaserParam: (channelIndex, paramName, value) => {
    // paramName: rate, depth
    const path = `/channels/${channelIndex}/phaser/${paramName}`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].phaser[paramName] = value;
      return newState;
    });
    get()._debounceSendPatch(path, value); // Debounce rate and depth
  },

  // ** Reverb Parameters (Likely only on Main Bus - Channel 0) **
  setReverbEnabled: (channelIndex, enabled) => {
    // Usually channelIndex = 0
    const path = `/channels/${channelIndex}/reverb/enabled`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].reverb.enabled = enabled;
      return newState;
    });
    get()._sendPatch(path, enabled); // Send immediately
  },

  setReverbParam: (channelIndex, paramName, value) => {
    // Usually channelIndex = 0
    // paramName: decay_time, wet_level
    const path = `/channels/${channelIndex}/reverb/${paramName}`;
    set((state) => {
      // Optimistic Update
      const newState = JSON.parse(JSON.stringify(state));
      newState.channels[channelIndex].reverb[paramName] = value;
      return newState;
    });
    get()._debounceSendPatch(path, value); // Debounce decay and wet level
  },

  // ** Top-Level Flags (If UI needs control) **
  // Example: Allow UI to toggle inferencing if needed
  setInferencingActive: (isActive) => {
    const path = `/inferencing_active`;
    set((state) => ({
      // Optimistic Update
      ...state,
      inferencing_active: isActive,
    }));
    // Send immediately regardless of true/false
    get()._sendPatch(path, isActive);
  },
}));

// Export the hook
export default useMixerStore;
