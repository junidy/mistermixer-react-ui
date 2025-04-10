// src/components/EffectModule.jsx
import React from 'react';
import useMixerStore from '../store/mixerStore'; // Import store hook

// Import the specific Knob components we created
import KnobDb from './KnobDb';
import KnobFrequency from './KnobFrequency';
import KnobLinearUnitless from './KnobLinearUnitless';
import KnobPercent from './KnobPercent';
import KnobTime from './KnobTime';

// Placeholder icons (replace with actual icons later)
const PowerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;


/**
 * EffectModule Component - Renders controls for a specific effect type.
 * @param {object} props
 * @param {string} props.title - Name of the effect
 * @param {string} props.effectType - Identifier ('equalizer', 'compressor', etc.)
 * @param {number} props.channelIndex - Index of the channel this effect belongs to.
 */
function EffectModule({ title, effectType, channelIndex }) {

  // --- State Selectors ---
  // Select the whole effect object for efficiency, then destructure inside render
  const effectState = useMixerStore((state) => state?.channels?.[channelIndex]?.[effectType]);

  // --- Action Selectors ---
  // Select relevant actions from the store
  const setEqEnabled = useMixerStore(state => state.setEqEnabled);
  const setEqBandParam = useMixerStore(state => state.setEqBandParam);
  const setCompressorEnabled = useMixerStore(state => state.setCompressorEnabled);
  const setCompressorParam = useMixerStore(state => state.setCompressorParam);
  const setDistortionEnabled = useMixerStore(state => state.setDistortionEnabled);
  const setDistortionParam = useMixerStore(state => state.setDistortionParam);
  const setPhaserEnabled = useMixerStore(state => state.setPhaserEnabled);
  const setPhaserParam = useMixerStore(state => state.setPhaserParam);
  const setReverbEnabled = useMixerStore(state => state.setReverbEnabled);
  const setReverbParam = useMixerStore(state => state.setReverbParam);


  // --- Event Handlers ---
  const handleToggle = () => {
    const currentEnabled = effectState?.enabled ?? false;
    switch (effectType) {
      case 'equalizer': setEqEnabled(channelIndex, !currentEnabled); break;
      case 'compressor': setCompressorEnabled(channelIndex, !currentEnabled); break;
      case 'distortion': setDistortionEnabled(channelIndex, !currentEnabled); break;
      case 'phaser': setPhaserEnabled(channelIndex, !currentEnabled); break;
      case 'reverb': setReverbEnabled(channelIndex, !currentEnabled); break;
      default: console.warn("Unknown effect type for toggle:", effectType);
    }
  };

  // Placeholder close handler - likely handled by parent EffectsConsole view
  const handleClose = () => { console.log(`Close ${title} (placeholder)`); };


  // --- Render Specific Knobs based on effectType ---
  const renderKnobs = () => {
    if (!effectState) {
      return <span className="text-xs text-gray-400">Loading effect...</span>;
    }

    switch (effectType) {
      case 'equalizer':
        return (
          <>
            {/* Low Shelf */}
            <KnobDb label="LS Gain" value={effectState.lowShelf?.gain_db ?? 0} onChange={v => setEqBandParam(channelIndex, 'lowShelf', 'gain_db', v)} min={-48} max={24} />
            <KnobFrequency label="LS Freq" value={effectState.lowShelf?.cutoff_freq ?? 80} onChange={v => setEqBandParam(channelIndex, 'lowShelf', 'cutoff_freq', v)} min={20} max={2000} />
            <KnobLinearUnitless label="LS Q" value={effectState.lowShelf?.q_factor ?? 0.7} onChange={v => setEqBandParam(channelIndex, 'lowShelf', 'q_factor', v)} min={0.1} max={6.0} precision={2}/>
            {/* High Shelf */}
            <KnobDb label="HS Gain" value={effectState.highShelf?.gain_db ?? 0} onChange={v => setEqBandParam(channelIndex, 'highShelf', 'gain_db', v)} min={-48} max={24} />
            <KnobFrequency label="HS Freq" value={effectState.highShelf?.cutoff_freq ?? 12000} onChange={v => setEqBandParam(channelIndex, 'highShelf', 'cutoff_freq', v)} min={4000} max={23000} />
            <KnobLinearUnitless label="HS Q" value={effectState.highShelf?.q_factor ?? 0.7} onChange={v => setEqBandParam(channelIndex, 'highShelf', 'q_factor', v)} min={0.1} max={6.0} precision={2}/>
            {/* Band 0-3 (Example for Band 0, repeat pattern) */}
            <KnobDb label="B0 Gain" value={effectState.band0?.gain_db ?? 0} onChange={v => setEqBandParam(channelIndex, 'band0', 'gain_db', v)} min={-48} max={24} />
            <KnobFrequency label="B0 Freq" value={effectState.band0?.cutoff_freq ?? 250} onChange={v => setEqBandParam(channelIndex, 'band0', 'cutoff_freq', v)} min={80} max={2000} />
            <KnobLinearUnitless label="B0 Q" value={effectState.band0?.q_factor ?? 1.0} onChange={v => setEqBandParam(channelIndex, 'band0', 'q_factor', v)} min={0.1} max={6.0} precision={2}/>
            {/* ... Knobs for Band 1, 2, 3 ... */}
             <KnobDb label="B1 Gain" value={effectState.band1?.gain_db ?? 0} onChange={v => setEqBandParam(channelIndex, 'band1', 'gain_db', v)} min={-48} max={24} />
            <KnobFrequency label="B1 Freq" value={effectState.band1?.cutoff_freq ?? 1000} onChange={v => setEqBandParam(channelIndex, 'band1', 'cutoff_freq', v)} min={2000} max={8000} />
            <KnobLinearUnitless label="B1 Q" value={effectState.band1?.q_factor ?? 1.0} onChange={v => setEqBandParam(channelIndex, 'band1', 'q_factor', v)} min={0.1} max={6.0} precision={2}/>
             <KnobDb label="B2 Gain" value={effectState.band2?.gain_db ?? 0} onChange={v => setEqBandParam(channelIndex, 'band2', 'gain_db', v)} min={-48} max={24} />
            <KnobFrequency label="B2 Freq" value={effectState.band2?.cutoff_freq ?? 4000} onChange={v => setEqBandParam(channelIndex, 'band2', 'cutoff_freq', v)} min={8000} max={12000} />
            <KnobLinearUnitless label="B2 Q" value={effectState.band2?.q_factor ?? 1.0} onChange={v => setEqBandParam(channelIndex, 'band2', 'q_factor', v)} min={0.1} max={6.0} precision={2}/>
             <KnobDb label="B3 Gain" value={effectState.band3?.gain_db ?? 0} onChange={v => setEqBandParam(channelIndex, 'band3', 'gain_db', v)} min={-48} max={24} />
            <KnobFrequency label="B3 Freq" value={effectState.band3?.cutoff_freq ?? 10000} onChange={v => setEqBandParam(channelIndex, 'band3', 'cutoff_freq', v)} min={12000} max={23000} />
            <KnobLinearUnitless label="B3 Q" value={effectState.band3?.q_factor ?? 1.0} onChange={v => setEqBandParam(channelIndex, 'band3', 'q_factor', v)} min={0.1} max={6.0} precision={2}/>
          </>
        );
      case 'compressor':
        return (
          <>
            <KnobDb label="Threshold" value={effectState.threshold_db ?? -20} onChange={v => setCompressorParam(channelIndex, 'threshold_db', v)} min={-60} max={0} />
            <KnobLinearUnitless label="Ratio" value={effectState.ratio ?? 2.0} onChange={v => setCompressorParam(channelIndex, 'ratio', v)} min={1.0} max={20.0} precision={1} />
            <KnobTime label="Attack" value={effectState.attack_ms ?? 10} onChange={v => setCompressorParam(channelIndex, 'attack_ms', v)} min={5.0} max={100.0} />
            <KnobTime label="Release" value={effectState.release_ms ?? 50} onChange={v => setCompressorParam(channelIndex, 'release_ms', v)} min={5.0} max={100.0} />
            <KnobDb label="Knee" value={effectState.knee_db ?? 0} onChange={v => setCompressorParam(channelIndex, 'knee_db', v)} min={0} max={12} />
            <KnobDb label="Makeup" value={effectState.makeup_gain_db ?? 0} onChange={v => setCompressorParam(channelIndex, 'makeup_gain_db', v)} min={0} max={12} />
          </>
        );
      case 'distortion':
         return (
           <>
             <KnobDb label="Drive" value={effectState.drive ?? 0} onChange={v => setDistortionParam(channelIndex, 'drive', v)} min={0} max={20} color="text-red-500" />
             <KnobDb label="Output" value={effectState.output_gain_db ?? 0} onChange={v => setDistortionParam(channelIndex, 'output_gain_db', v)} min={-20} max={0} />
           </>
         );
      case 'phaser':
         return (
           <>
              {/* Rate is Hz, so use Frequency Knob */}
              <KnobFrequency label="Rate" value={effectState.rate ?? 1.0} onChange={v => setPhaserParam(channelIndex, 'rate', v)} min={0.1} max={10.0} />
              <KnobPercent label="Depth" value={effectState.depth ?? 50} onChange={v => setPhaserParam(channelIndex, 'depth', v)} min={0} max={100} />
           </>
         );
      case 'reverb':
          return (
            <>
              {/* Decay is time */}
              <KnobTime label="Decay" value={effectState.decay_time * 1000 ?? 1500} onChange={v => setReverbParam(channelIndex, 'decay_time', v/1000)} min={300} max={3000} />
              <KnobPercent label="Wet Level" value={effectState.wet_level ?? 25} onChange={v => setReverbParam(channelIndex, 'wet_level', v)} min={0} max={100} />
            </>
          );
      default:
        return <span className="text-xs text-red-400">Unknown effect type: {effectType}</span>;
    }
  };

  const isEnabled = effectState?.enabled ?? false;

  return (
    <div className={`bg-gray-800 text-gray-200 rounded-lg shadow-md flex flex-col h-full overflow-hidden border-2 ${isEnabled ? 'border-transparent' : 'border-red-900 border-opacity-50'}`}> {/* Indicate disabled state */}
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700 flex-shrink-0 bg-gray-700 bg-opacity-50">
        <button
            onClick={handleToggle}
            className={`p-1 rounded ${isEnabled ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-300'}`}
            title={isEnabled ? "Disable Effect" : "Enable Effect"}
        >
          <PowerIcon />
        </button>
        <span className="text-sm font-semibold truncate px-1">{title}</span>
        {/* Close button might not belong here, maybe in EffectsConsole? */}
        <button onClick={handleClose} className="text-gray-500 hover:text-white p-1 rounded invisible"> {/* Hide close for now */}
           <CloseIcon />
        </button>
      </div>
{/* --- Body (Knobs/Controls) --- */}
      {/* Apply disabled styles directly to the container, ALWAYS render knobs */}
      <div className={`flex-grow p-3 md:p-4 flex flex-wrap gap-x-4 gap-y-3 justify-center items-start overflow-y-auto ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
         {renderKnobs()} {/* <-- Always render the knobs */}
      </div>
       {/* --- REMOVED Conditional Rendering --- */}
       {/* {isEnabled ? renderKnobs() : (
            <div className="text-center text-gray-500 text-sm italic mt-4">Effect Disabled</div>
        )} */}
    </div>
  );
}

export default EffectModule;