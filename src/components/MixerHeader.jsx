import React from 'react';

function MixerHeader() {
  const handleInferenceClick = () => { console.log("Start Inferencing clicked"); };

  return (
    <header className="bg-white border-b border-gray-300 px-4 py-2 flex justify-between items-center flex-shrink-0 h-16"> {/* Added fixed height */}
      <h1 className="text-xl font-semibold">Digital Mixer Console</h1>
      <button
        onClick={handleInferenceClick}
        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Start Inferencing
      </button>
    </header>
  );
}

export default MixerHeader;