// src/components/KnobLinearUnitless.jsx
import React, { useCallback } from 'react';
import KnobBase from './KnobBase';

/**
 * Generic Linear Knob for unitless values like Ratio, Q-Factor.
 */
function KnobLinearUnitless({ label, value, onChange, min, max, precision = 1, size, color }) {

  const valueRawDisplayFn = useCallback((val) => {
    const clampedVal = Math.min(max, Math.max(min, val));
    return `${clampedVal.toFixed(precision)}`;
  }, [min, max, precision]);

  return (
    <KnobBase
      label={label} // e.g., "Ratio", "Q-Factor"
      valueRaw={value}
      valueMin={min}
      valueMax={max}
      onValueRawChange={onChange}
      valueRawDisplayFn={valueRawDisplayFn}
      // No mapTo01/mapFrom01 needed for linear
      size={size}
      color={color ?? "text-gray-500"} // Example default unitless color
    />
  );
}

export default KnobLinearUnitless;