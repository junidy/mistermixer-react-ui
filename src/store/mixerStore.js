// src/store/mixerStore.js
import { create } from "zustand";
import { applyPatch } from "fast-json-patch";
import { sendMessage } from "../services/websocketService"; // Adjust path if needed

// --- Configuration ---
const THROTTLE_DELAY_MS = 20; // Approx 20 updates per second

// --- Module-level state for throttling ---
let throttleTimers = {};
let lastValueSent = {};
let valueToSendOnThrottleEnd = {};

// --- State Initialization ---
const createDefaultChannel = (index) => {
  const isMainBus = index === 0;
  let defaultAnalogGain = 0.0;
  if (1 <= index <= 4) {
    defaultAnalogGain = -3.0;
  } else if (5 <= index <= 8) {
    defaultAnalogGain = -9.0;
  }
  // --- ENSURE ALL EFFECT OBJECTS ARE INITIALIZED ---
  return {
    // Direct Params
    muted: false,
    soloed: false,
    panning: 0.5,
    digital_gain: 0.0,
    analog_gain: defaultAnalogGain,
    stereo: isMainBus,

    // Nested Effect Params (Initialize the objects!)
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
    distortion: {
      enabled: false,
      drive: 0.0,
      output_gain_db: 0.0,
    },
    phaser: {
      enabled: false,
      rate: 1.0,
      depth: 50.0,
    },
    reverb: {
      // Only relevant for Master, but initialize anyway for consistency
      enabled: isMainBus, // Default enable only for master
      decay_time: 1.5,
      wet_level: 25.0,
    },
    // --- END EFFECT INITIALIZATION ---
  };
};
const initialState = {
  channels: Array.from({ length: 9 }, (_, index) =>
    createDefaultChannel(index)
  ),
  soloing_active: false,
  inferencing_active: false,
  hw_init_ready: false,
  inferencing_state: "idle", // NEW: 'idle', 'countdown', 'recording', 'inferencing'
  connectionStatus: "disconnected",
};

// --- Zustand Store Definition ---
export const useMixerStore = create((set, get) => ({
  ...initialState,

  // --- Server Update / Connection Status (Unchanged) ---
  // --- Server Update Application ---
  // Called by websocketService when a message (patch or full state) arrives
  applyServerUpdate: (update) => {
    set((state) => {
      // Use the 'updater function' form of set
      // Keep track if the state actually changed to optimize re-renders
      let stateChanged = false;
      let newState = state; // Start with the current state

      if (Array.isArray(update)) {
        // JSON Patch array
        try {
          // --- Log incoming patches related to inferencing for debug ---
          update.forEach((op) => {
            if (
              op.path === "/inferencing_state" ||
              op.path === "/inferencing_active"
            ) {
              console.log("Store received inference patch op:", op);
            }
          });
          // --- End Debug Log ---

          // Use fast-json-patch to apply the changes immutably
          // The 'mutate' option is false by default, returning a new object
          // The 'validate' option is false for slight performance gain (trust server)
          const patchResult = applyPatch(
            state,
            update,
            /*validate*/ false,
            /*mutate*/ false
          );
          newState = patchResult.newDocument; // Get the potentially new state object

          // Check if the root object reference changed; indicates a change occurred.
          // Note: fast-json-patch *might* return the same object reference if the patch
          // resulted in no actual value changes (e.g., replacing 'a' with 'a').
          // A deep comparison could be added here if that edge case matters,
          // but usually reference check is sufficient for performance optimization.
          stateChanged = newState !== state;

          if (!stateChanged) {
            console.debug("Received patch resulted in no state change.");
          }
        } catch (e) {
          console.error("Failed to apply JSON Patch:", e, "Patch:", update);
          // Don't change state on error, return the original state
          newState = state;
          stateChanged = false;
        }
      } else if (
        typeof update === "object" &&
        update !== null &&
        update.channels &&
        Array.isArray(update.channels)
      ) {
        // It looks like a full state object overwrite
        // Check if it's different enough to warrant an update
        // (Simple stringify comparison, could be more granular if needed)
        if (
          JSON.stringify(state.channels) !== JSON.stringify(update.channels) ||
          state.soloing_active !== update.soloing_active ||
          state.inferencing_active !== update.inferencing_active ||
          state.inferencing_state !== update.inferencing_state || // Check new state
          state.hw_init_ready !== update.hw_init_ready
        ) {
          console.log("Applying full state update from server.");
          // Overwrite state, but preserve local connectionStatus
          newState = { ...update, connectionStatus: state.connectionStatus };
          stateChanged = true;
        } else {
          console.debug(
            "Received full state object, but it matches current state."
          );
          newState = state; // No change needed
          stateChanged = false;
        }
      } else {
        console.warn("Received unknown update format from server:", update);
        newState = state; // No change for unknown format
        stateChanged = false;
      }

      // IMPORTANT: Only return a new object reference if the state *actually* changed.
      // This prevents Zustand from triggering unnecessary re-renders in components
      // if the incoming update was redundant.
      return stateChanged ? newState : state;
    }); // End of set updater function
  }, // End of applyServerUpdate
  setConnectionStatus: (status) => {
    set({ connectionStatus: status });
  },

  // --- Helper functions DEFINED AS PART OF THE RETURNED OBJECT ---
  _sendPatchInternal: (path, value) => {
    /* ... (Same as previous correct version) ... */
    const patch = [{ op: "replace", path, value }];
    sendMessage(patch);
    lastValueSent[path] = value;
    if (
      Object.prototype.hasOwnProperty.call(valueToSendOnThrottleEnd, path) &&
      valueToSendOnThrottleEnd[path] === value
    ) {
      delete valueToSendOnThrottleEnd[path];
    }
  },
  _throttleSendPatch: (path, value) => {
    /* ... (Same as previous correct version) ... */
    valueToSendOnThrottleEnd[path] = value;
    if (!throttleTimers[path]) {
      get()._sendPatchInternal(path, value); // Use get()
      throttleTimers[path] = setTimeout(() => {
        const timerPath = path;
        delete throttleTimers[timerPath];
        const hasLastSent = Object.prototype.hasOwnProperty.call(
          lastValueSent,
          timerPath
        );
        const hasPendingEndValue = Object.prototype.hasOwnProperty.call(
          valueToSendOnThrottleEnd,
          timerPath
        );
        if (
          hasPendingEndValue &&
          (!hasLastSent ||
            lastValueSent[timerPath] !== valueToSendOnThrottleEnd[timerPath])
        ) {
          get()._throttleSendPatch(
            timerPath,
            valueToSendOnThrottleEnd[timerPath]
          ); // Use get()
        } else if (hasPendingEndValue) {
          delete valueToSendOnThrottleEnd[timerPath];
        }
      }, THROTTLE_DELAY_MS);
    }
  },
  // --- End Helper Definitions ---

  // --- UI Triggered Actions ---

  // Helper for safe optimistic update of nested properties
  // NOTE: This deep copies on every update, consider Immer middleware for complex states if performance becomes an issue.
  _optimisticUpdate(updater) {
    set((state) => {
      try {
        // Create deep copy FIRST
        const newState = JSON.parse(JSON.stringify(state));
        // Apply the update logic to the copied state
        updater(newState);
        // Return the modified copy
        return newState;
      } catch (e) {
        console.error("Error during optimistic state update:", e);
        return state; // Return original state on error
      }
    });
  },

  // ** Channel Parameters **
  setMuted: (channelIndex, isMuted) => {
    const path = `/channels/${channelIndex}/muted`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]) {
        // Check existence
        newState.channels[channelIndex].muted = isMuted;
      }
    });
    get()._sendPatchInternal(path, isMuted);
  },
  setSoloed: (channelIndex, isSoloed) => {
    const path = `/channels/${channelIndex}/soloed`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]) {
        newState.channels[channelIndex].soloed = isSoloed;
      }
    });
    get()._sendPatchInternal(path, isSoloed);
  },
  setPanning: (channelIndex, panValue) => {
    const path = `/channels/${channelIndex}/panning`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]) {
        newState.channels[channelIndex].panning = panValue;
      }
    });
    get()._throttleSendPatch(path, panValue);
  },
  setDigitalGain: (channelIndex, gainDb) => {
    const path = `/channels/${channelIndex}/digital_gain`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]) {
        newState.channels[channelIndex].digital_gain = gainDb;
      }
    });
    get()._throttleSendPatch(path, gainDb);
  },
  setAnalogGain: (channelIndex, gainDb) => {
    const path = `/channels/${channelIndex}/analog_gain`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]) {
        newState.channels[channelIndex].analog_gain = gainDb;
      }
    });
    get()._throttleSendPatch(path, gainDb);
  },
  setStereo: (channelIndex, isStereo) => {
    const path = `/channels/${channelIndex}/stereo`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]) {
        newState.channels[channelIndex].stereo = isStereo;
      }
    });
    get()._sendPatchInternal(path, isStereo);
  },

  // ** Equalizer Parameters **
  setEqEnabled: (channelIndex, enabled) => {
    const path = `/channels/${channelIndex}/equalizer/enabled`;
    get()._optimisticUpdate((newState) => {
      // Check path segments existence before assigning
      if (newState.channels?.[channelIndex]?.equalizer) {
        newState.channels[channelIndex].equalizer.enabled = enabled;
      }
    });
    get()._sendPatchInternal(path, enabled);
  },
  setEqBandParam: (channelIndex, bandName, paramName, value) => {
    const path = `/channels/${channelIndex}/equalizer/${bandName}/${paramName}`;
    get()._optimisticUpdate((newState) => {
      // Check deeper path existence
      if (newState.channels?.[channelIndex]?.equalizer?.[bandName]) {
        newState.channels[channelIndex].equalizer[bandName][paramName] = value;
      }
    });
    get()._throttleSendPatch(path, value);
  },

  // ** Compressor Parameters **
  setCompressorEnabled: (channelIndex, enabled) => {
    const path = `/channels/${channelIndex}/compressor/enabled`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]?.compressor) {
        newState.channels[channelIndex].compressor.enabled = enabled;
      }
    });
    get()._sendPatchInternal(path, enabled);
  },
  setCompressorParam: (channelIndex, paramName, value) => {
    const path = `/channels/${channelIndex}/compressor/${paramName}`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]?.compressor) {
        newState.channels[channelIndex].compressor[paramName] = value;
      }
    });
    get()._throttleSendPatch(path, value);
  },

  // ** Distortion Parameters **
  setDistortionEnabled: (channelIndex, enabled) => {
    const path = `/channels/${channelIndex}/distortion/enabled`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]?.distortion) {
        newState.channels[channelIndex].distortion.enabled = enabled;
      }
    });
    get()._sendPatchInternal(path, enabled);
  },
  setDistortionParam: (channelIndex, paramName, value) => {
    const path = `/channels/${channelIndex}/distortion/${paramName}`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]?.distortion) {
        newState.channels[channelIndex].distortion[paramName] = value;
      }
    });
    get()._throttleSendPatch(path, value);
  },

  // ** Phaser Parameters **
  setPhaserEnabled: (channelIndex, enabled) => {
    const path = `/channels/${channelIndex}/phaser/enabled`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]?.phaser) {
        newState.channels[channelIndex].phaser.enabled = enabled;
      }
    });
    get()._sendPatchInternal(path, enabled);
  },
  setPhaserParam: (channelIndex, paramName, value) => {
    const path = `/channels/${channelIndex}/phaser/${paramName}`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]?.phaser) {
        newState.channels[channelIndex].phaser[paramName] = value;
      }
    });
    get()._throttleSendPatch(path, value);
  },

  // ** Reverb Parameters **
  setReverbEnabled: (channelIndex, enabled) => {
    const path = `/channels/${channelIndex}/reverb/enabled`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]?.reverb) {
        newState.channels[channelIndex].reverb.enabled = enabled;
      }
    });
    get()._sendPatchInternal(path, enabled);
  },
  setReverbParam: (channelIndex, paramName, value) => {
    const path = `/channels/${channelIndex}/reverb/${paramName}`;
    get()._optimisticUpdate((newState) => {
      if (newState.channels?.[channelIndex]?.reverb) {
        newState.channels[channelIndex].reverb[paramName] = value;
      }
    });
    get()._throttleSendPatch(path, value);
  },

// --- RENAMED and MODIFIED Action for Inference State ---
    /**
     * Sets the desired inferencing state ('idle', 'countdown', 'recording').
     * Sends a patch for '/inferencing_state'. The backend handles associated logic.
     * @param {'idle' | 'countdown' | 'recording'} newState - The target state.
     */
    setInferencingState: (newState) => {
      const validStates = ["idle", "countdown", "recording"]; // States UI can directly set
      if (!validStates.includes(newState)) {
           console.warn(`UI attempted to set invalid inferencing_state: ${newState}`);
           return;
      }
      const path = `/inferencing_state`;
      // Optimistic update for the state string
      set({ inferencing_state: newState });
      // Send patch for the state string immediately
      get()._sendPatchInternal(path, newState);
      // NOTE: We no longer directly send inferencing_active=true from here.
      // The backend will handle setting inferencing_active when it receives state="recording".
  },
  // --- End Renamed/Modified Action ---

  // --- REMOVE old setInferencingActive action ---
  // setInferencingActive: (isActive) => { ... } // Remove this
})); // --- End of create ---

export default useMixerStore;
