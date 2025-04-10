// src/App.jsx
import { useState, useCallback } from "react"; // Added useCallback
import MixerConsole from "./views/MixerConsole";
import EffectsConsole from "./views/EffectsConsole";
import InferenceModal from "./components/InferenceModal"; // <-- Import the new modal
import { MantineProvider } from "@mantine/core";

function App() {
  const [currentView, setCurrentView] = useState("mixer");
  const [selectedChannelIndex, setSelectedChannelIndex] = useState(null);
  const [isInferencingModalOpen, setIsInferencingModalOpen] = useState(false); // <-- State for modal

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
