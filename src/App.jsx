import React, { useState } from 'react';
import MixerConsole from './views/MixerConsole'; // Assuming views are in src/views
import EffectsConsole from './views/EffectsConsole';
import { MantineProvider } from '@mantine/core';

function App() {
  const [currentView, setCurrentView] = useState('mixer'); // 'mixer' or 'effects'
  const [selectedChannelIndex, setSelectedChannelIndex] = useState(null); // 0-8

  // Function passed down to trigger showing effects view
  const showEffects = (channelIndex) => {
    console.log(`App: Showing effects for channel ${channelIndex}`);
    setSelectedChannelIndex(channelIndex);
    setCurrentView('effects');
  };

  // Function passed down to trigger going back to mixer view
  const showMixer = () => {
    console.log('App: Showing mixer view');
    setSelectedChannelIndex(null);
    setCurrentView('mixer');
  };

  return (
    <MantineProvider>
    <div className="App">
      {currentView === 'mixer' && <MixerConsole onShowEffects={showEffects} />}
      {currentView === 'effects' && (
        <EffectsConsole
          selectedChannelIndex={selectedChannelIndex}
          onClose={showMixer} // Pass function to close effects view
        />
      )}
    </div></MantineProvider>
  );
}

export default App;