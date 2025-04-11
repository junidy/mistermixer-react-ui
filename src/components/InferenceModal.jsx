// src/components/InferenceModal.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import useMixerStore from "../store/mixerStore";

const COUNTDOWN_SECONDS = 5;
const RECORDING_SECONDS = 6;
const ESTIMATED_INFERENCE_SECONDS = 20;

function InferenceModal({ isOpen, onClose }) {
  const currentGlobalStage = useMixerStore(
    (state) => state.inferencing_state ?? "idle"
  );
  const setInferencingState = useMixerStore(
    (state) => state.setInferencingState
  );

  // Local state ONLY for countdown display number
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  // Local state for progress bar percentage
  const [progress, setProgress] = useState(0);

  const countdownIntervalRef = useRef(null);
  const progressAnimationRef = useRef(null);

  // --- Function to calculate target progress based on stage ---
  const calculateTargetProgress = useCallback(
    (stage, currentCountdown = COUNTDOWN_SECONDS) => {
      const totalEstSeconds =
        COUNTDOWN_SECONDS + RECORDING_SECONDS + ESTIMATED_INFERENCE_SECONDS;
      let targetProgress = 0;
      if (stage === "countdown") {
        const elapsedCountdown = COUNTDOWN_SECONDS - currentCountdown;
        targetProgress = (elapsedCountdown / totalEstSeconds) * 100;
      } else if (stage === "recording") {
        targetProgress = (COUNTDOWN_SECONDS / totalEstSeconds) * 100;
      } else if (stage === "inferencing") {
        targetProgress =
          ((COUNTDOWN_SECONDS + RECORDING_SECONDS) / totalEstSeconds) * 100;
      }
      return targetProgress;
    },
    []
  ); // No dependencies needed

  // --- Effect to handle global state changes ---
  useEffect(() => {
    // Cancel local countdown if global state moves past it
    if (
      currentGlobalStage === "recording" ||
      currentGlobalStage === "inferencing" ||
      currentGlobalStage === "idle"
    ) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
    // If global state is idle, reset local display state
    if (currentGlobalStage === "idle") {
      setCountdown(COUNTDOWN_SECONDS);
      setProgress(0);
      if (progressAnimationRef.current)
        cancelAnimationFrame(progressAnimationRef.current);
    } else {
      // Update progress bar based on the *new* global stage
      const target = calculateTargetProgress(currentGlobalStage);
      // Only animate if moving *into* recording or inferencing
      if (currentGlobalStage === "recording") {
        animateProgressTo(
          ((COUNTDOWN_SECONDS + RECORDING_SECONDS) /
            (COUNTDOWN_SECONDS +
              RECORDING_SECONDS +
              ESTIMATED_INFERENCE_SECONDS)) *
            100,
          RECORDING_SECONDS * 1000
        );
      } else if (currentGlobalStage === "inferencing") {
        animateProgressTo(100, ESTIMATED_INFERENCE_SECONDS * 1000);
      } else {
        // For countdown or idle, just set progress directly
        if (progressAnimationRef.current)
          cancelAnimationFrame(progressAnimationRef.current);
        setProgress(target);
      }
    }
  }, [currentGlobalStage, calculateTargetProgress]); // Rerun when global state changes

  // --- Timer Cleanup ---
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      if (progressAnimationRef.current)
        cancelAnimationFrame(progressAnimationRef.current);
    };
  }, []);

  // --- Reset Local State on Close ---
  useEffect(() => {
    if (!isOpen) {
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
      if (progressAnimationRef.current)
        cancelAnimationFrame(progressAnimationRef.current);
      // Reset local countdown display
      setCountdown(COUNTDOWN_SECONDS);
      setProgress(0);
      // Closing the modal doesn't automatically change the global state here
      // If the process is running, it continues until explicitly cancelled or finished.
    }
  }, [isOpen]);

  // --- Progress Animation Helper ---
  const animateProgressTo = (targetPercent, durationMs) => {
    if (progressAnimationRef.current)
      cancelAnimationFrame(progressAnimationRef.current);
    // Get current progress value using a function form if needed, otherwise direct state is fine here
    const startPercent = progress;
    const startTime = performance.now();
    const step = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progressRatio = Math.min(1, elapsed / durationMs);
      const currentPercent =
        startPercent + (targetPercent - startPercent) * progressRatio;
      setProgress(currentPercent); // SAFE: requestAnimationFrame runs outside render cycle
      if (progressRatio < 1) {
        progressAnimationRef.current = requestAnimationFrame(step);
      } else {
        progressAnimationRef.current = null;
      }
    };
    progressAnimationRef.current = requestAnimationFrame(step);
  };

  // --- Start Countdown Handler ---
  const handleStartCountdown = useCallback(() => {
    // Check global state to prevent starting if already running
    if (useMixerStore.getState().inferencing_state !== "idle") return;

    console.log("Modal: Starting countdown...");
    // --- Tell Backend/Store to enter countdown state ---
    setInferencingState("countdown");
    // ----------------------------------------------
    setCountdown(COUNTDOWN_SECONDS); // Reset local display countdown
    setProgress(0); // Reset progress

    // Clear any previous interval just in case
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const nextVal = prev - 1;
        // Update progress bar based on current countdown value
        // This setState call might be the one causing the warning if called rapidly
        // Let's move progress update into the main useEffect instead
        // setProgress(calculateTargetProgress('countdown', nextVal)); // <-- MOVE THIS

        if (nextVal <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null; // Clear ref
          // --- Tell Backend/Store to enter recording state ---
          setInferencingState("recording");
          // ----------------------------------------------
          return 0;
        }
        return nextVal;
      });
    }, 1000);
  }, [setInferencingState, calculateTargetProgress]); // Removed updateProgressBar

  // --- Render Logic ---
  if (!isOpen) return null;

  // Display based on GLOBAL stage from store
  const displayStage = currentGlobalStage;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">AI Auto-Mixing</h2>

        {/* --- Content based on Display Stage --- */}
        {displayStage === "idle" && (
          <>
            <p className="text-gray-600 mb-6">
              Prepare to play a representative 6-second snippet... Click start
              for the 5-second countdown.
            </p>
            <button
              onClick={handleStartCountdown}
              className="w-full px-4 py-2 bg-blue-600 ..."
            >
              Start Countdown
            </button>
          </>
        )}
        {displayStage === "countdown" && (
          <>
            <p className="text-gray-600 mb-4">Get Ready!</p>
            <p className="text-6xl font-bold mb-6">{countdown}</p>{" "}
            {/* Shows local countdown */}
            <p className="text-gray-600 mb-6">Start playing now!</p>
          </>
        )}
        {displayStage === "recording" && (
          <>
            <p className="text-red-600 font-bold mb-6 text-xl animate-pulse">
              RECORDING AUDIO
            </p>
            <p className="text-gray-600 mb-6">(6 seconds)</p>
          </>
        )}
        {displayStage === "inferencing" && ( // Renamed from 'waiting'
          <>
            <p className="text-blue-600 font-bold mb-6 text-xl">
              Inferencing...
            </p>
            <div className="flex justify-center items-center mb-6">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Applying mix... (~{ESTIMATED_INFERENCE_SECONDS}s). You can close
              this window.
            </p>
          </>
        )}

        {/* --- Progress Bar --- */}
        {displayStage !== "idle" && (
          <div className="w-full bg-gray-200 rounded-full h-4 mt-6 overflow-hidden">
            <div
              className="bg-gradient-to-r from-yellow-400 via-green-500 to-blue-600 h-4 rounded-full transition-width duration-500 ease-linear"
              style={{ width: `${progress}%` }} // Use progress state
            ></div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 text-sm text-gray-500 hover:text-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default InferenceModal;
