import useMixerStore from "../store/mixerStore";
import React from "react";
import KnobPan from "./KnobPan";
import KnobDb from "./KnobDb";
import SliderGain from "./SliderGain";
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
  const channelLabel = isMaster ? "Master" : `CH ${channelIndex}`;
  const baseBgColor = isMaster ? "bg-gray-100" : "bg-white"; // Base background

  // --- Select State using MULTIPLE hooks ---
  const isMuted = useMixerStore(
    (state) => state?.channels?.[channelIndex]?.muted ?? false
  );
  const isSoloed = useMixerStore(
    (state) => state?.channels?.[channelIndex]?.soloed ?? false
  );
  // Only select stereo if master, otherwise use a default
  const isStereo = useMixerStore((state) =>
    isMaster ? state?.channels?.[channelIndex]?.stereo ?? false : false
  );
  const soloingIsActive = useMixerStore(
    (state) => state?.soloing_active ?? false
  );
  const panValue = useMixerStore(
    (state) => state?.channels?.[channelIndex]?.panning ?? 0.5
  );
  const analogGainValue = useMixerStore(
    (state) => state?.channels?.[channelIndex]?.analog_gain ?? 0
  );

  // --- Get Actions from Store ---
  const setMuted = useMixerStore((state) => state.setMuted);
  const setSoloed = useMixerStore((state) => state.setSoloed);
  const setStereo = useMixerStore((state) => state.setStereo);
  const setPanning = useMixerStore((state) => state.setPanning);
  const setAnalogGain = useMixerStore((state) => state.setAnalogGain);

  // --- Event Handlers ---
  const handleEffectsClick = () => {
    if (onShowEffects) onShowEffects(channelIndex);
  };
  const handleMuteToggle = () => {
    setMuted(channelIndex, !isMuted);
  };
  const handleSoloToggle = () => {
    setSoloed(channelIndex, !isSoloed);
  };
  // Only call setStereo if it's the master channel
  const handleStereoToggle = () => {
    if (isMaster) setStereo(channelIndex, !isStereo);
  };

  // --- Determine Visual State based on Mute/Solo logic ---
  // A channel is effectively silenced if it's explicitly muted OR
  // if soloing is active globally AND this channel itself is NOT soloed.
  const isEffectivelySilenced = isMuted || (soloingIsActive && !isSoloed);

  // --- Dynamic Styling for Buttons/Channel ---
  // Base styles
  const buttonBaseStyle =
    "flex-1 basis-0 text-xs md:text-sm py-1 px-1 rounded border";
  const muteInactiveStyle =
    "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-400";
  const muteActiveStyle =
    "bg-red-500 hover:bg-red-600 text-white border-red-700 font-semibold shadow-inner";
  const soloInactiveStyle =
    "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-400";
  const soloActiveStyle =
    "bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-600 font-semibold shadow-inner";
  const stereoInactiveStyle =
    "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-400"; // Mono state
  const stereoActiveStyle =
    "bg-blue-500 hover:bg-blue-600 text-white border-blue-700 font-semibold shadow-inner"; // Stereo state

  // Channel strip background dims if effectively silenced (but not if it's the one *being* soloed)
  const channelBgColor =
    isEffectivelySilenced && !isSoloed
      ? "bg-gray-300 opacity-70"
      : isMaster
      ? "bg-gray-100"
      : "bg-white";

  return (
    // Apply dynamic background to root
    <div
      className={`flex-1 basis-0 min-w-0 border border-gray-300 ${channelBgColor} h-full flex flex-col p-2 md:p-4 overflow-hidden`}
    >
      {/* --- Top Section --- */}
      <div className="flex-shrink-0 w-full">
        <div className="text-center mb-2">
          <span className="text-sm md:text-base font-bold">{channelLabel}</span>
        </div>
        {!isMaster && (
          <div className="flex justify-center mb-2">
            <KnobDb
              label="Analog Gain"
              value={analogGainValue}
              onChange={(val) => setAnalogGain(channelIndex, val)}
              min={-12.0}
              max={32.0}
            />
          </div>
        )}
        <button
          onClick={handleEffectsClick}
          className="w-full bg-blue-100 hover:bg-blue-200 ..."
        >
          Effects
        </button>
      </div>
      {/* --- Middle Section: Digital Gain Slider --- */}
      <SliderGain channelIndex={channelIndex} />
      {/* --- Bottom Section --- */}
      <div className="flex-shrink-0 w-full mt-2">
        <div className="flex justify-center mb-2">
          <KnobPan
            value={panValue}
            onChange={(val) => setPanning(channelIndex, val)}
          />
        </div>

        {/* Mute/Solo Buttons */}
        <div className="flex justify-center space-x-2 mb-2">
          <button
            onClick={handleMuteToggle}
            className={`${buttonBaseStyle} ${
              isMuted ? muteActiveStyle : muteInactiveStyle
            }`}
          >
            Mute
          </button>
          <button
            onClick={handleSoloToggle}
            className={`${buttonBaseStyle} ${
              isSoloed ? soloActiveStyle : soloInactiveStyle
            }`}
          >
            Solo
          </button>
        </div>

        {/* Stereo Toggle (Master Only) */}
        {isMaster && (
          <div className="flex items-center justify-center text-xs md:text-sm mt-1">
            {" "}
            {/* Added margin top */}
            <button
              onClick={handleStereoToggle}
              className={`w-full ${buttonBaseStyle} ${
                isStereo ? stereoActiveStyle : stereoInactiveStyle
              }`} // Use full width if it's the only button
            >
              {isStereo ? "Stereo" : "Mono"} {/* Dynamically change label */}
            </button>
          </div>
        )}
      </div>{" "}
      {/* --- End Bottom Section --- */}
    </div> // --- End Root Container ---
  );
}

export default ChannelStrip;
