// src/App.jsx
import { useState, useCallback, useEffect } from "react"; // Added useCallback
import MixerConsole from "./views/MixerConsole";
import EffectsConsole from "./views/EffectsConsole";
import InferenceModal from "./components/InferenceModal"; // <-- Import the new modal
import { MantineProvider } from "@mantine/core";

// --- Import WebSocket connection functions ---
import { connectWebSocket, disconnectWebSocket } from './services/websocketService'; // Adjust path if needed
// --- Optional: Import store to display status ---
// import useMixerStore from './store/mixerStore'; // Adjust path if needed

function App() {
  const [currentView, setCurrentView] = useState("mixer");
  const [selectedChannelIndex, setSelectedChannelIndex] = useState(null);
  const [isInferencingModalOpen, setIsInferencingModalOpen] = useState(false); // <-- State for modal
  // Optional: Get connection status for display
  // const connectionStatus = useMixerStore((state) => state.connectionStatus);

  // --- Add this useEffect hook BACK IN ---
  useEffect(() => {
    // This code runs once when the App component mounts
    console.log("App component mounted, attempting WebSocket connection...");
    connectWebSocket(); // <-- INITIATE THE CONNECTION HERE

    // This function runs when the App component unmounts (cleanup)
    return () => {
      console.log("App component unmounting, disconnecting WebSocket...");
      disconnectWebSocket(); // <-- DISCONNECT ON CLEANUP
    };
  }, []); // <-- Empty dependency array ensures this runs only on mount and unmount
  // --- End Re-added useEffect ---

  const showEffects = useCallback((channelIndex) => {
    console.log(`App: Showing effects for channel ${channelIndex}`);
    setSelectedChannelIndex(channelIndex);
    setCurrentView("effects");
  }, []); // Using useCallback for stable prop reference

  const showMixer = useCallback(() => {
    console.log("App: Showing mixer view");
    setSelectedChannelIndex(null);
    setCurrentView("mixer");
  }, []); // Using useCallback

  // --- Functions to control the inferencing modal ---
  const openInferenceModal = useCallback(() => {
    console.log("App: Opening inference modal");
    setIsInferencingModalOpen(true);
  }, []);

  const closeInferenceModal = useCallback(() => {
    console.log("App: Closing inference modal");
    setIsInferencingModalOpen(false);
    // Optionally reset any inferencing-related state here if needed upon close
  }, []);
  // --- End modal functions ---

  return (
    <MantineProvider>
      <div className="App">
        {" "}
        {/* Consider adding relative positioning if modal needs it */}
        {currentView === "mixer" && (
          <MixerConsole
            onShowEffects={showEffects}
            onStartInferencing={openInferenceModal} // Pass handler to open modal
          />
        )}
        {currentView === "effects" && (
          <EffectsConsole
            selectedChannelIndex={selectedChannelIndex}
            onClose={showMixer}
            onStartInferencing={openInferenceModal} // Pass handler to open modal
          />
        )}
        {/* Render the Modal conditionally */}
        <InferenceModal
          isOpen={isInferencingModalOpen}
          onClose={closeInferenceModal}
        />
      </div>
    </MantineProvider>
  );
}

export default App;
