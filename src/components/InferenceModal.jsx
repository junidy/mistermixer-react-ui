// src/components/InferenceModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import useMixerStore from '../store/mixerStore'; // Import Zustand store hook

// Constants for timing
const COUNTDOWN_SECONDS = 5;
const RECORDING_SECONDS = 6;

/**
 * InferenceModal Component
 * @param {object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Function to call to close the modal
 */
function InferenceModal({ isOpen, onClose }) {
  const [stage, setStage] = useState('idle'); // 'idle', 'countdown', 'recording', 'waiting'
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [progress, setProgress] = useState(0); // Progress percentage (0-100)

  // Refs for timers to ensure proper cleanup
  const countdownIntervalRef = useRef(null);
  const recordingTimeoutRef = useRef(null); // Use timeout for recording end

  // Get the action from Zustand store
  const setInferencingActive = useMixerStore(state => state.setInferencingActive);

  // --- Timer Cleanup ---
  // Ensure timers are cleared if component unmounts or modal is closed abruptly
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
    };
  }, []);

  // --- Reset State on Close ---
  // When the modal is closed externally (via prop), reset internal state
  useEffect(() => {
    if (!isOpen) {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      setStage('idle');
      setCountdown(COUNTDOWN_SECONDS);
      setProgress(0);
      // Note: We don't automatically set inferencing_active=false here
      // if the modal is closed during recording, as the backend should handle it.
      // If manual cancel during recording is needed later, add that logic.
    }
  }, [isOpen]);


  // --- Handlers for State Transitions ---

  const handleStartCountdown = useCallback(() => {
    if (stage !== 'idle') return;
    console.log("Modal: Starting countdown...");
    setStage('countdown');
    setCountdown(COUNTDOWN_SECONDS); // Reset just in case
    setProgress(0); // Reset progress

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const nextVal = prev - 1;
        if (nextVal <= 0) {
          clearInterval(countdownIntervalRef.current); // Stop countdown timer
          handleStartRecording(); // Transition to next stage
          return 0; // Ensure countdown shows 0 briefly
        }
        // Update progress bar during countdown (Yellow portion)
        setProgress(((COUNTDOWN_SECONDS - nextVal) / COUNTDOWN_SECONDS) * (5 / (5 + 6 + 20)) * 100); // Approx ratio
        return nextVal;
      });
    }, 1000); // Run every second
  }, [stage]); // Dependency: stage


  const handleStartRecording = useCallback(() => {
    console.log("Modal: Starting recording (sending inferencing_active=true)...");
    setStage('recording');
    // --- Tell backend to start ---
    setInferencingActive(true);
    // --- Start 6-second timer ---
    const startTime = Date.now();
    const totalDuration = (5 + 6 + 20) * 1000; // Approx total ms
    const recordingEndTime = startTime + RECORDING_SECONDS * 1000;

    // Animate progress bar during recording (Green portion)
    const animateRecordingProgress = () => {
       const now = Date.now();
       if (now >= recordingEndTime) {
           setProgress(((COUNTDOWN_SECONDS + RECORDING_SECONDS) * 1000 / totalDuration) * 100); // Ensure it hits end of green
           handleStartWaiting(); // Transition after 6 seconds
           return; // Stop animation
       }
       const elapsedRecording = now - startTime;
       // Calculate progress based on time elapsed within the total estimated duration
       const currentProgress = ((COUNTDOWN_SECONDS * 1000 + elapsedRecording) / totalDuration) * 100;
       setProgress(currentProgress);
       requestAnimationFrame(animateRecordingProgress); // Continue animation
    };
    requestAnimationFrame(animateRecordingProgress); // Start animation


    // We don't actually need a timeout here now because the backend
    // is responsible for setting inferencing_active=false after 6s.
    // The animation loop above handles transitioning to 'waiting' visually.

  }, [setInferencingActive]); // Dependency: setInferencingActive


  const handleStartWaiting = useCallback(() => {
      console.log("Modal: Recording finished, entering waiting stage...");
      setStage('waiting');
      // Animate progress bar during waiting (Blue portion) - Optional
      // This is tricky as backend time varies. We could just set it
      // to the start of the blue section and show a spinner.
      setProgress(((COUNTDOWN_SECONDS + RECORDING_SECONDS) * 1000 / ((5 + 6 + 20) * 1000)) * 100); // Start of blue
      // The backend will eventually send the results, updating the main app state.
      // This modal doesn't currently react to that completion, it just shows 'waiting'.
      // Consider adding a message or automatically closing after a while?
      // For now, user closes manually via onClose.
  }, []);


  // --- Render Logic ---
  if (!isOpen) {
    return null; // Don't render anything if not open
  }

  // Modal Backdrop & Container
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose} // Close on backdrop click
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 text-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Title */}
        <h2 className="text-2xl font-bold mb-4">AI Auto-Mixing</h2>

        {/* --- Content based on Stage --- */}

        {stage === 'idle' && (
          <>
            <p className="text-gray-600 mb-6">
              Prepare to play a representative 6-second snippet of your music through the active input channels.
              Click start when ready to begin the 5-second countdown.
            </p>
            <button
              onClick={handleStartCountdown}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Start Countdown
            </button>
          </>
        )}

        {stage === 'countdown' && (
          <>
            <p className="text-gray-600 mb-4">Get Ready!</p>
            <p className="text-6xl font-bold mb-6">{countdown}</p>
            <p className="text-gray-600 mb-6">Start playing now!</p>
          </>
        )}

        {stage === 'recording' && (
          <>
            <p className="text-red-600 font-bold mb-6 text-xl animate-pulse">RECORDING AUDIO</p>
            <p className="text-gray-600 mb-6">(6 seconds)</p>
          </>
        )}

        {stage === 'waiting' && (
          <>
            <p className="text-blue-600 font-bold mb-6 text-xl">Inferencing...</p>
            {/* Basic Spinner Placeholder */}
            <div className="flex justify-center items-center mb-6">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
             <p className="text-gray-500 text-sm mb-6">This may take 15-20 seconds. You can close this window.</p>
          </>
        )}

         {/* --- Progress Bar --- */}
         {stage !== 'idle' && (
             <div className="w-full bg-gray-200 rounded-full h-4 mt-6 overflow-hidden">
                 <div
                     className="bg-gradient-to-r from-yellow-400 via-green-500 to-blue-600 h-4 rounded-full transition-all duration-100 ease-linear" // Smooth transition
                     style={{ width: `${progress}%` }}
                 ></div>
             </div>
         )}

        {/* Close Button (optional, since backdrop click also closes) */}
        <button onClick={onClose} className="mt-6 text-sm text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>
    </div>
  );
}

export default InferenceModal;