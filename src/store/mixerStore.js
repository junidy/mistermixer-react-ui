// src/store/mixerStore.js
import { create } from 'zustand';
import { applyPatch } from 'fast-json-patch';
import { sendMessage } from '../services/websocketService'; // Adjust path if needed

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
    if (1 <= index <= 4) { defaultAnalogGain = -3.0; }
    else if (5 <= index <= 8) { defaultAnalogGain = -9.0; }
    return {
        muted: false, soloed: false, panning: 0.5, digital_gain: 0.0,
        analog_gain: defaultAnalogGain, stereo: isMainBus,
        equalizer: { enabled: false, lowShelf: { gain_db: 0.0, cutoff_freq: 80, q_factor: 0.707 }, highShelf: { gain_db: 0.0, cutoff_freq: 12000, q_factor: 0.707 }, band0: { gain_db: 0.0, cutoff_freq: 250, q_factor: 1.0 }, band1: { gain_db: 0.0, cutoff_freq: 1000, q_factor: 1.0 }, band2: { gain_db: 0.0, cutoff_freq: 4000, q_factor: 1.0 }, band3: { gain_db: 0.0, cutoff_freq: 10000, q_factor: 1.0 }, },
        compressor: { enabled: false, threshold_db: -20.0, ratio: 2.0, attack_ms: 10.0, release_ms: 50.0, knee_db: 0.0, makeup_gain_db: 0.0, },
        distortion: { enabled: false, drive: 0.0, output_gain_db: 0.0 },
        phaser: { enabled: false, rate: 1.0, depth: 50.0 },
        reverb: { enabled: isMainBus, decay_time: 1.5, wet_level: 25.0 },
    };
};
const initialState = {
    channels: Array.from({ length: 9 }, (_, index) => createDefaultChannel(index)),
    soloing_active: false, inferencing_active: false, hw_init_ready: false,
    connectionStatus: 'disconnected',
};

// --- Zustand Store Definition ---
export const useMixerStore = create((set, get) => ({
    ...initialState,

    // --- Server Update / Connection Status (Unchanged) ---
// --- Server Update Application ---
    // Called by websocketService when a message (patch or full state) arrives
    applyServerUpdate: (update) => {
      set((state) => { // Use the 'updater function' form of set
          // Keep track if the state actually changed to optimize re-renders
          let stateChanged = false;
          let newState = state; // Start with the current state

          if (Array.isArray(update)) { // JSON Patch array
              try {
                  // Use fast-json-patch to apply the changes immutably
                  // The 'mutate' option is false by default, returning a new object
                  // The 'validate' option is false for slight performance gain (trust server)
                  const patchResult = applyPatch(state, update, /*validate*/ false, /*mutate*/ false);
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
                  console.error('Failed to apply JSON Patch:', e, 'Patch:', update);
                  // Don't change state on error, return the original state
                  newState = state;
                  stateChanged = false;
              }
          } else if (typeof update === 'object' && update !== null && update.channels && Array.isArray(update.channels)) {
               // It looks like a full state object overwrite
               // Check if it's different enough to warrant an update
               // (Simple stringify comparison, could be more granular if needed)
              if (JSON.stringify(state.channels) !== JSON.stringify(update.channels) ||
                  state.soloing_active !== update.soloing_active ||
                  state.inferencing_active !== update.inferencing_active ||
                  state.hw_init_ready !== update.hw_init_ready )
              {
                  console.log("Applying full state update from server.");
                  // Overwrite state, but preserve local connectionStatus
                  newState = { ...update, connectionStatus: state.connectionStatus };
                  stateChanged = true;
              } else {
                   console.debug("Received full state object, but it matches current state.");
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
    setConnectionStatus: (status) => { set({ connectionStatus: status }); },

    // --- Helper functions DEFINED AS PART OF THE RETURNED OBJECT ---
    _sendPatchInternal: (path, value) => { /* ... (Same as previous correct version) ... */
        const patch = [{ op: 'replace', path, value }];
        sendMessage(patch);
        lastValueSent[path] = value;
        if (Object.prototype.hasOwnProperty.call(valueToSendOnThrottleEnd, path) && valueToSendOnThrottleEnd[path] === value) {
             delete valueToSendOnThrottleEnd[path];
         }
    },
    _throttleSendPatch: (path, value) => { /* ... (Same as previous correct version) ... */
        valueToSendOnThrottleEnd[path] = value;
        if (!throttleTimers[path]) {
            get()._sendPatchInternal(path, value); // Use get()
            throttleTimers[path] = setTimeout(() => {
                const timerPath = path;
                delete throttleTimers[timerPath];
                const hasLastSent = Object.prototype.hasOwnProperty.call(lastValueSent, timerPath);
                const hasPendingEndValue = Object.prototype.hasOwnProperty.call(valueToSendOnThrottleEnd, timerPath);
                if (hasPendingEndValue && (!hasLastSent || lastValueSent[timerPath] !== valueToSendOnThrottleEnd[timerPath])) {
                    get()._throttleSendPatch(timerPath, valueToSendOnThrottleEnd[timerPath]); // Use get()
                } else if (hasPendingEndValue) {
                    delete valueToSendOnThrottleEnd[timerPath];
                }
            }, THROTTLE_DELAY_MS);
        }
    },
    // --- End Helper Definitions ---

    // --- UI Triggered Actions ---

    // ** Channel Parameters **
    setMuted: (channelIndex, isMuted) => {
        const path = `/channels/${channelIndex}/muted`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].muted = isMuted; return newState; });
        get()._sendPatchInternal(path, isMuted);
    },
    setSoloed: (channelIndex, isSoloed) => {
        const path = `/channels/${channelIndex}/soloed`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].soloed = isSoloed; return newState; });
        get()._sendPatchInternal(path, isSoloed);
    },
    setPanning: (channelIndex, panValue) => {
        const path = `/channels/${channelIndex}/panning`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].panning = panValue; return newState; });
        get()._throttleSendPatch(path, panValue);
    },
    setDigitalGain: (channelIndex, gainDb) => {
        const path = `/channels/${channelIndex}/digital_gain`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].digital_gain = gainDb; return newState; });
        get()._throttleSendPatch(path, gainDb);
    },
    setAnalogGain: (channelIndex, gainDb) => {
        const path = `/channels/${channelIndex}/analog_gain`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].analog_gain = gainDb; return newState; });
        get()._throttleSendPatch(path, gainDb);
    },
     setStereo: (channelIndex, isStereo) => { // Only relevant for channel 0 usually
        const path = `/channels/${channelIndex}/stereo`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].stereo = isStereo; return newState; });
        get()._sendPatchInternal(path, isStereo); // Toggle, send immediately
    },

    // ** Equalizer Parameters **
    setEqEnabled: (channelIndex, enabled) => {
        const path = `/channels/${channelIndex}/equalizer/enabled`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].equalizer.enabled = enabled; return newState; });
        get()._sendPatchInternal(path, enabled);
    },
    setEqBandParam: (channelIndex, bandName, paramName, value) => {
        const path = `/channels/${channelIndex}/equalizer/${bandName}/${paramName}`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].equalizer[bandName][paramName] = value; return newState; });
        get()._throttleSendPatch(path, value);
    },

    // === START: Filling in remaining actions ===

    // ** Compressor Parameters **
    setCompressorEnabled: (channelIndex, enabled) => {
        const path = `/channels/${channelIndex}/compressor/enabled`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].compressor.enabled = enabled; return newState; });
        get()._sendPatchInternal(path, enabled);
    },
    setCompressorParam: (channelIndex, paramName, value) => {
        // paramName: threshold_db, ratio, attack_ms, release_ms, knee_db, makeup_gain_db
        const path = `/channels/${channelIndex}/compressor/${paramName}`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].compressor[paramName] = value; return newState; });
        get()._throttleSendPatch(path, value); // All compressor params are continuous
    },

    // ** Distortion Parameters **
    setDistortionEnabled: (channelIndex, enabled) => {
        const path = `/channels/${channelIndex}/distortion/enabled`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].distortion.enabled = enabled; return newState; });
        get()._sendPatchInternal(path, enabled);
    },
    setDistortionParam: (channelIndex, paramName, value) => {
        // paramName: drive, output_gain_db
        const path = `/channels/${channelIndex}/distortion/${paramName}`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].distortion[paramName] = value; return newState; });
        get()._throttleSendPatch(path, value); // Both drive and output gain are continuous
    },

    // ** Phaser Parameters **
    setPhaserEnabled: (channelIndex, enabled) => {
        const path = `/channels/${channelIndex}/phaser/enabled`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].phaser.enabled = enabled; return newState; });
        get()._sendPatchInternal(path, enabled);
    },
    setPhaserParam: (channelIndex, paramName, value) => {
        // paramName: rate, depth
        const path = `/channels/${channelIndex}/phaser/${paramName}`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].phaser[paramName] = value; return newState; });
        get()._throttleSendPatch(path, value); // Both rate and depth are continuous
    },

    // ** Reverb Parameters **
    setReverbEnabled: (channelIndex, enabled) => {
        const path = `/channels/${channelIndex}/reverb/enabled`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].reverb.enabled = enabled; return newState; });
        get()._sendPatchInternal(path, enabled);
    },
    setReverbParam: (channelIndex, paramName, value) => {
        // paramName: decay_time, wet_level
        const path = `/channels/${channelIndex}/reverb/${paramName}`;
        set((state) => { const newState = JSON.parse(JSON.stringify(state)); newState.channels[channelIndex].reverb[paramName] = value; return newState; });
        get()._throttleSendPatch(path, value); // Both decay and wet level are continuous
    },

    // ** Top-Level Flags **
    setInferencingActive: (isActive) => {
        const path = `/inferencing_active`;
        // Optimistic update for inferencing flag
        set((state) => ({ ...state, inferencing_active: isActive }));
        get()._sendPatchInternal(path, isActive); // Send toggle immediately
    },
    // Note: soloing_active and hw_init_ready are typically read-only from the
    // perspective of the UI client, managed by the backend state_manager.py.
    // If you needed the UI to *set* hw_init_ready (unlikely), you'd add an action:
    // setHwInitReady: (isReady) => {
    //    const path = `/hw_init_ready`;
    //    set((state) => ({ ...state, hw_init_ready: isReady }));
    //    get()._sendPatchInternal(path, isReady);
    // },

    // === END: Filling in remaining actions ===

})); // --- End of create ---

export default useMixerStore;