import React from 'react';
// Optional: Import an icon for the back button
// import { IoChevronBack } from "react-icons/io5";

/**
 * MixerHeader Component
 * @param {object} props
 * @param {boolean} [props.showBackButton=false] - Whether to display the back button.
 * @param {function} [props.onBackClick] - Callback function when back button is clicked.
 */
function MixerHeader({ showBackButton = false, onBackClick }) { // Added props with default
  const handleInferenceClick = () => { console.log("Start Inferencing clicked"); };

  // Handler for the back button
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
       console.warn("onBackClick handler not provided to MixerHeader");
    }
  };

  return (
    <header className="bg-white border-b border-gray-300 px-4 py-2 flex justify-between items-center flex-shrink-0 h-16 relative"> {/* Added relative for potential absolute positioning of back button if needed */}

      {/* --- Back Button (Conditional) --- */}
      {showBackButton && (
        <button
          onClick={handleBackClick}
          className="text-blue-600 hover:text-blue-800 flex items-center px-2 py-1 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-4" // Added margin-right
          aria-label="Go back"
        >
          {/* Placeholder Icon - Replace with actual icon library component */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
      {/* --- End Back Button --- */}


      {/* --- Title (Adjust layout if back button present) --- */}
      {/* Use absolute positioning or adjust flex spacing if needed for centering title when back button exists */}
      <h1 className={`text-xl font-semibold ${showBackButton ? 'ml-auto mr-auto pl-10' : ''}`}> {/* Basic centering attempt */}
         Digital Mixer Console
      </h1>


      {/* --- Inferencing Button --- */}
      <button
        onClick={handleInferenceClick}
        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-auto" // Added ml-auto to push right
      >
        Start Inferencing
      </button>
    </header>
  );
}

export default MixerHeader;