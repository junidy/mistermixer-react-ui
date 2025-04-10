// src/components/KnobPan.jsx
import React, { useCallback } from 'react';
import KnobBase from './KnobBase'; // Correct import path assumed

/**
 * Panning Knob (Linear, 0.0 L to 1.0 R, displays 50L/C/50R)
 */
function KnobPan({ value, onChange, size, color }) {

  const valueRawDisplayFn = useCallback((val) => {
    if (Math.abs(val - 0.5) < 0.01) return "C"; // Check for center with tolerance
    const scaledVal = Math.round((val - 0.5) * 100);
    return `${Math.abs(scaledVal)}${scaledVal < 0 ? 'L' : 'R'}`;
  }, []);

  return (
    <KnobBase
      label="Pan"
      valueRaw={value}
      valueMin={0.0}
      valueMax={1.0}
      onValueRawChange={onChange}
      valueRawDisplayFn={valueRawDisplayFn}
      // No mapTo01 or mapFrom01 needed - defaults to linear
      size={size}
      color={color ?? "text-green-500"}
      // trackColor={...} // Optional
      // dragSensitivity={...} // Optional
    />
  );
}

export default KnobPan;