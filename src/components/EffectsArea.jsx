import React from 'react';
import EffectModule from './EffectModule';
import PlaceholderKnob from './PlaceholderKnob'; // Reusing knob placeholder

/**
 * EffectsArea - Lays out effect modules based on channel type
 * @param {object} props
 * @param {boolean} props.isMaster - Is the selected channel the master?
 */
function EffectsArea({ isMaster }) {

  // Placeholder Knobs - Generate based on actual params later
  const eqKnobs = Array.from({length: 6}).map((_, i) => <PlaceholderKnob key={`eq-${i}`} label={`EQ ${i+1}`} />);
  const compKnobs = Array.from({length: 4}).map((_, i) => <PlaceholderKnob key={`comp-${i}`} label={`Comp ${i+1}`} />);
  const distKnobs = Array.from({length: 2}).map((_, i) => <PlaceholderKnob key={`dist-${i}`} label={`Dist ${i+1}`} />);
  const phaserKnobs = Array.from({length: 2}).map((_, i) => <PlaceholderKnob key={`phaser-${i}`} label={`Phaser ${i+1}`} />);
  const reverbKnobs = Array.from({length: 2}).map((_, i) => <PlaceholderKnob key={`reverb-${i}`} label={`Reverb ${i+1}`} />);

  return (
    // --- Main Effects Area: Takes remaining space, uses CSS Grid ---
    <div className="flex-grow h-full p-4 bg-purple-900 bg-opacity-20"> {/* Example background */}
      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">

        {/* --- Equalizer (Top Half) --- */}
        <div className="col-span-2 row-span-1">
           <EffectModule title="Equalizer">
             {eqKnobs}
           </EffectModule>
        </div>

        {/* --- Compressor (Bottom Left) --- */}
        <div className="col-span-1 row-span-1">
            <EffectModule title="Compressor">
               {compKnobs}
            </EffectModule>
        </div>

        {/* --- Bottom Right Area (Contains Dist/Phaser OR Reverb) --- */}
        <div className="col-span-1 row-span-1">
          {!isMaster ? (
            // Input Channel: Distortion & Phaser side-by-side
            <div className="flex flex-row gap-4 h-full">
              <div className="flex-1 basis-0 min-w-0"> {/* Ensure they share space */}
                 <EffectModule title="Distortion">
                   {distKnobs}
                 </EffectModule>
              </div>
              <div className="flex-1 basis-0 min-w-0"> {/* Ensure they share space */}
                 <EffectModule title="Phaser">
                    {phaserKnobs}
                 </EffectModule>
              </div>
            </div>
          ) : (
            // Master Channel: Only Reverb
             <EffectModule title="Reverb">
                {reverbKnobs}
             </EffectModule>
          )}
        </div>

      </div>
    </div>
  );
}

export default EffectsArea;