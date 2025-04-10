import useMixerStore from "../store/mixerStore";
import React from "react";
import KnobPan from "./KnobPan";
import KnobDb from "./KnobDb";
// Assuming you'll add actual controls later, we use placeholders for now
// import { Slider, Button, Group, Switch } from '@mantine/core'; // Example if using Mantine later
// import PlaceholderKnob from './PlaceholderKnob';

/**
 * ChannelStrip Skeleton Component - Enhanced Layout
 * @param {object} props
 * @param {number} props.channelIndex - The 0-based index (0=Master, 1-8=Inputs 1-8).
 * @param {boolean} props.isMaster - True if this is the master channel strip.
 */
function ChannelStrip({ channelIndex, isMaster, onShowEffects }) {
  // --- Select State from Store ---
const panValue = useMixerStore(
    // Check state and state.channels before indexing
    (state) => state?.channels?.[channelIndex]?.panning ?? 0.5
  );
  const analogGainValue = useMixerStore(
    // Check state and state.channels before indexing
    (state) => state?.channels?.[channelIndex]?.analog_gain ?? 0 // Use default from schema if state not ready
  );
  // ... select other needed state values ...

  // --- Get Actions from Store ---
  const setPanning = useMixerStore((state) => state.setPanning);
  const setAnalogGain = useMixerStore((state) => state.setAnalogGain);

  // Added onShowEffects prop
  const channelLabel = isMaster ? "Master" : `CH ${channelIndex}`;
  const bgColor = isMaster ? "bg-gray-100" : "bg-white";

  // Handler for the effects button
  const handleEffectsClick = () => {
    // Call the function passed from App/parent, providing the channel index
    if (onShowEffects) {
      onShowEffects(channelIndex);
    } else {
      console.warn(
        "onShowEffects handler not provided to ChannelStrip",
        channelIndex
      );
    }
  };

  return (
    // --- Root Container: Vertical Flex, Basis-0 for equal width, Min-Width for shrinking, Full Height ---
    <div
      className={`flex-1 basis-0 min-w-0 border border-gray-300 ${bgColor} h-full flex flex-col p-2 md:p-4 overflow-hidden`}
    >
      {" "}
      {/* Use smaller padding on smaller screens */}
      {/* --- Top Section (Fixed Height Content) --- */}
      <div className="flex-shrink-0 w-full">
        {" "}
        {/* Prevents this section from shrinking */}
        <div className="text-center mb-2">
          <span className="text-sm md:text-base font-bold">{channelLabel}</span>{" "}
          {/* Slightly smaller font on small screens */}
        </div>
        {/* Placeholder for Analog Gain Knob - Use w-full if needed */}
        {!isMaster && (
          <div className="flex justify-center mb-2">
            <KnobDb
              label="Analog Gain"
              value={analogGainValue}
              onChange={(val) => setAnalogGain(channelIndex, val)}
              min={-12.0}
              max={32.0}
              // Optional: Adjust size/color if needed
              // size={56}
            />
          </div>
        )}
        {/* --- Effects Button - Updated --- */}
        <button
          onClick={handleEffectsClick} // Use the new handler
          className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs md:text-sm py-1 px-2 rounded mb-2 disabled:opacity-50"
          disabled={isMaster && channelIndex !== 0} // Example: Disable effects for Master if needed, adjust logic
          // Master *does* have effects (EQ, Comp, Reverb), so maybe never disable? Or disable based on context?
          // For now, enable for all based on description.
        >
          Effects
        </button>
      </div>
      {/* --- End Top Section --- */}
      {/* --- Middle Section (Slider - Takes Remaining Space) --- */}
      <div className="flex-grow flex flex-col items-center w-full min-h-0 py-2">
        {" "}
        {/* flex-grow, min-h-0 crucial */}
        <span className="text-xs text-gray-500 mb-1 flex-shrink-0">
          Digital Gain
        </span>
        {/* Placeholder for Vertical Slider - Style it to fill height */}
        <div className="w-6 h-full bg-gray-200 rounded-full flex items-center justify-center border border-gray-300 relative">
          <div className="absolute bg-blue-500 w-full h-1/2 bottom-0 rounded-full"></div>{" "}
          {/* Dummy level indicator */}
          <div className="absolute bg-white w-4 h-4 rounded-full border-2 border-blue-500 shadow cursor-pointer top-1/4"></div>{" "}
          {/* Dummy thumb */}
          {/* NOTE: Actual Slider component needs styling to fill height */}
        </div>
      </div>
      {/* --- End Middle Section --- */}
      {/* --- Bottom Section (Fixed Height Content) --- */}
      <div className="flex-shrink-0 w-full mt-2">
        {" "}
        {/* Use the specific KnobPan component */}
        <div className="flex justify-center mb-2">
          <KnobPan
            value={panValue}
            onChange={(val) => setPanning(channelIndex, val)}
            // Optional: Adjust size/color
            // size={56}
          />
        </div>
        {/* Stereo Toggle (Master Only) */}
        {isMaster && (
          <div className="flex items-center justify-center text-xs md:text-sm">
            <button className="flex-1 basis-0 bg-red-100 hover:bg-red-200 text-red-800 text-xs md:text-sm py-1 px-1 rounded">
              Stereo
            </button>
          </div>
        )}
        {/* Mute/Solo Buttons */}
        <div className="flex justify-center space-x-2 mb-2">
          <button className="flex-1 basis-0 bg-red-100 hover:bg-red-200 text-red-800 text-xs md:text-sm py-1 px-1 rounded">
            Mute
          </button>
          <button className="flex-1 basis-0 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs md:text-sm py-1 px-1 rounded">
            Solo
          </button>
        </div>
      </div>
      {/* --- End Bottom Section --- */}
    </div> // --- End Root Container ---
  );
}

export default ChannelStrip;
