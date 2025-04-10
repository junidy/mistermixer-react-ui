// src/components/KnobTime.jsx
import React, { useCallback } from 'react';
import KnobBase from './KnobBase';

// Log mapping functions (Ensure min > 0 for simple log)
// Using exponential mapping: norm = (log(value/min) / log(max/min))
const mapTo01Log = (value, min, max) => {
  if (value <= min) return 0;
  if (value >= max) return 1;
  if (min <= 0) { // Safety check & linear fallback
      console.warn("Time range min must be > 0 for log scale.");
      const range = max - min; return range === 0 ? 0 : (value - min) / range;
  }
  return Math.log(value / min) / Math.log(max / min);
};

const mapFrom01Log = (norm, min, max) => {
   if (norm <= 0) return min;
   if (norm >= 1) return max;
   if (min <= 0) { // Safety check & linear fallback
      const range = max - min; return range === 0 ? min : min + norm * range;
   }
   return min * Math.pow(max / min, norm);
};

/**
 * Time Knob (Logarithmic Scale, displays ms or s)
 * Assumes input value is always in milliseconds if range involves ms.
 */
function KnobTime({ label, value, onChange, min, max, size, color }) {

  // Display ms or s based on magnitude
  const valueRawDisplayFn = useCallback((valMs) => {
    const clampedVal = Math.min(max, Math.max(min, valMs)); // Clamp for display
    if (clampedVal < 1000) {
      // Show 1 decimal for values under 100ms, 0 otherwise
      const precision = clampedVal < 100 ? 1 : 0;
      return `${clampedVal.toFixed(precision)} ms`;
    } else {
      // Show 2 decimals for seconds
      return `${(clampedVal / 1000).toFixed(2)} s`;
    }
  }, [min, max]);

  // Determine if the min value allows for log scaling
  const useLog = min > 0;
  const mapTo01 = useLog ? mapTo01Log : undefined; // Only pass if using log
  const mapFrom01 = useLog ? mapFrom01Log : undefined; // Only pass if using log

  return (
    <KnobBase
      label={label} // e.g., "Attack", "Release", "Decay"
      valueRaw={value}
      valueMin={min} // Expecting ms
      valueMax={max} // Expecting ms
      onValueRawChange={onChange}
      valueRawDisplayFn={valueRawDisplayFn}
      mapTo01={mapTo01}
      mapFrom01={mapFrom01}
      size={size}
      color={color ?? "text-yellow-500"} // Example default time color
    />
  );
}

export default KnobTime;