// src/components/MixerHeader.jsx
import React from "react";
// Icons if needed...

/**
 * MixerHeader Component
 * @param {object} props
 * @param {boolean} [props.showBackButton=false]
 * @param {function} [props.onBackClick]
 * @param {function} [props.onStartInferencing] - Callback when Start Inferencing is clicked
 */
function MixerHeader({
  showBackButton = false,
  onBackClick,
  onStartInferencing,
}) {
  // Added onStartInferencing

  const handleBackClick = () => {
    if (onBackClick) onBackClick();
  };

  // Call the handler passed from App/parent view
  const handleInferenceClick = () => {
    if (onStartInferencing) {
      onStartInferencing();
    } else {
      console.warn("onStartInferencing handler not provided to MixerHeader");
    }
  };

  return (
    <header className="bg-white border-b border-gray-300 px-4 py-2 flex justify-between items-center flex-shrink-0 h-16 relative">
      {" "}
      {/* Added relative for potential absolute positioning of back button if needed */}
      {/* --- Back Button (Conditional) --- */}
      {showBackButton && (
        <button
          onClick={handleBackClick}
          className="text-blue-600 hover:text-blue-800 flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-4" // Added margin-right
          aria-label="Go back"
        >
          {/* Placeholder Icon - Replace with actual icon library component */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      )}
      {/* --- End Back Button --- */}
      {/* --- Title (Adjust layout if back button present) --- */}
      {/* Use absolute positioning or adjust flex spacing if needed for centering title when back button exists */}
      <h1
        className={`text-xl font-semibold ${
          showBackButton ? "ml-auto mr-auto pl-10" : ""
        }`}
      >
        {" "}
        {/* Basic centering attempt */}
        MISTER MIXER
      </h1>
      {/* Inferencing Button - uses new handler */}
      <button
        onClick={handleInferenceClick} // <-- Use the new handler
        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-auto"
      >
        Start Inferencing
      </button>
    </header>
  );
}

export default MixerHeader;
