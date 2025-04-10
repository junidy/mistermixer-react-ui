import React from 'react';
import ChannelStrip from '../components/ChannelStrip';
import MixerHeader from '../components/MixerHeader';

/**
 * MixerConsole View
 * @param {object} props
 * @param {function} props.onShowEffects - Callback to signal showing effects view
 */
function MixerConsole({ onShowEffects }) {
  const inputChannelIndices = Array.from({ length: 8 }, (_, i) => i + 1);
  const masterChannelIndex = 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Pass showBackButton={false} (or omit, as false is default) */}
      <MixerHeader showBackButton={false} />
      <div className="flex-grow flex min-h-0">
        <div className="flex flex-row flex-nowrap h-full w-full">
          {/* Render Input Channels */}
          {inputChannelIndices.map(index => (
            <ChannelStrip
              key={`channel-${index}`}
              channelIndex={index}
              isMaster={false}
              onShowEffects={onShowEffects} // Pass the handler down
            />
          ))}
          {/* Divider */}
          <div className="flex-shrink-0 w-px bg-gray-400 h-full mx-1"></div>
          {/* Render Master Channel */}
          <ChannelStrip
            key={`channel-${masterChannelIndex}`}
            channelIndex={masterChannelIndex}
            isMaster={true}
            onShowEffects={onShowEffects} // Pass the handler down
          />
        </div>
      </div>
    </div>
  );
}

export default MixerConsole;