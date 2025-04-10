// src/components/KnobFrequency.jsx
import React, { useCallback } from 'react';
import KnobBase from './KnobBase';

// --- Frequency Log Mapping ---
// This needs a robust implementation. The example from the docs using
// NormalisableRange is likely Typescript specific or requires that utility.
// Let's adapt the simple log, *assuming min > 0* (e.g., 20 Hz).
// A common approach is exponential: norm = (log(value/min) / log(max/min))
const mapTo01Freq = (value, min, max) => {
  if (value <= min) return 0;
  if (value >= max) return 1;
  if (min <= 0) { // Safety check
      console.warn("Frequency range min must be > 0 for log scale.");
      const range = max - min; return range === 0 ? 0 : (value - min) / range; // Fallback linear
  }
  return Math.log(value / min) / Math.log(max / min);
};

const mapFrom01Freq = (norm, min, max) => {
   if (norm <= 0) return min;
   if (norm >= 1) return max;
   if (min <= 0) { // Safety check
      const range = max - min; return range === 0 ? min : min + norm * range; // Fallback linear
   }
   return min * Math.pow(max / min, norm);
};

/**
 * Frequency Knob (Logarithmic Scale, displays Hz/kHz)
 */
function KnobFrequency({ label, value, onChange, min = 20, max = 20000, size, color }) {

   const valueRawDisplayFn = useCallback((hz) => {
    const clampedHz = Math.min(max, Math.max(min, hz)); // Clamp for display
    if (clampedHz < 100) return `${clampedHz.toFixed(1)} Hz`;
    if (clampedHz < 1000) return `${clampedHz.toFixed(0)} Hz`;
    const kHz = clampedHz / 1000;
    if (clampedHz < 10000) return `${kHz.toFixed(2)} kHz`;
    return `${kHz.toFixed(1)} kHz`;
  }, [min, max]);


  return (
    <KnobBase
      label={label} // e.g., "Cutoff", "Rate" (for LFO)
      valueRaw={value}
      valueMin={min}
      valueMax={max}
      onValueRawChange={onChange}
      valueRawDisplayFn={valueRawDisplayFn}
      mapTo01={mapTo01Freq} // Pass the log mapping functions
      mapFrom01={mapFrom01Freq} // Pass the log mapping functions
      size={size}
      color={color ?? "text-orange-500"} // Example default freq color
    />
  );
}

export default KnobFrequency;