import React from 'react';
import ChannelStrip from '../components/ChannelStrip';
import MixerHeader from '../components/MixerHeader';
import EffectsArea from '../components/EffectsArea';

/**
 * EffectsConsole View
 * @param {object} props
 * @param {number} props.selectedChannelIndex - Index of the channel whose effects are shown.
 * @param {function} props.onClose - Callback to go back to MixerConsole view.
 */
function EffectsConsole({ selectedChannelIndex, onClose, onStartInferencing }) {
  const isMasterSelected = selectedChannelIndex === 0;
  const masterChannelIndex = 0;
  const dummyOnShowEffects = () => {};

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Pass showBackButton={true} and the onClose handler */}
      <MixerHeader showBackButton={true} onBackClick={onClose} onStartInferencing={onStartInferencing} />

      {/* --- Main Content Row: Takes remaining space, horizontal flex --- */}
      <div className="flex-grow flex flex-row flex-nowrap min-h-0">

        {/* --- Left: Selected Channel Strip --- */}
        {/* Use flex-shrink-0 and a width. Adjust w-40 (10rem) as needed */}
        <div className="flex-shrink-0 w-40 h-full">
           <ChannelStrip
            key={`selected-${selectedChannelIndex}`}
            channelIndex={selectedChannelIndex}
            isMaster={isMasterSelected}
            onShowEffects={dummyOnShowEffects} // Pass dummy/noop
          />
        </div>

        {/* --- Middle: Effects Area --- */}
        {/* Use flex-grow to take up remaining space */}
        <div className="flex-grow h-full min-w-0"> {/* min-w-0 helps prevent squeezing */}
            <EffectsArea isMaster={isMasterSelected} />
        </div>

        {/* --- Right: Master Channel Strip --- */}
        {/* Use flex-shrink-0 and the same width as the left strip */}
        <div className="flex-shrink-0 w-40 h-full">
           <ChannelStrip
            key={`master-${masterChannelIndex}`}
            channelIndex={masterChannelIndex}
            isMaster={true}
            onShowEffects={dummyOnShowEffects} // Pass dummy/noop
          />
          {/* Add a close button maybe? Or rely on header/other nav */}
          {/* <button onClick={onClose} className="absolute top-2 right-2 ...">Close</button> */}
        </div>

      </div> {/* --- End Main Content Row --- */}
    </div> // --- End Outer Container ---
  );
}

export default EffectsConsole;