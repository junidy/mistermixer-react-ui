// src/components/KnobPercent.jsx
import React, { useCallback } from 'react';
import KnobBase from './KnobBase';

/**
 * Percentage Knob (Linear, 0% to 100%)
 */
function KnobPercent({ label, value, onChange, min = 0, max = 100, precision = 0, size, color }) {

  const valueRawDisplayFn = useCallback((val) => {
    // Clamp value just in case it slightly exceeds bounds due to float math
    const clampedVal = Math.min(max, Math.max(min, val));
    return `${clampedVal.toFixed(precision)}%`;
  }, [min, max, precision]);

  return (
    <KnobBase
      label={label} // e.g., "Depth", "Wet Level"
      valueRaw={value}
      valueMin={min}
      valueMax={max}
      onValueRawChange={onChange}
      valueRawDisplayFn={valueRawDisplayFn}
      // No mapTo01 or mapFrom01 needed - defaults to linear
      size={size}
      color={color ?? "text-cyan-500"} // Example default percent color
    />
  );
}

export default KnobPercent;