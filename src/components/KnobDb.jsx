// src/components/KnobDb.jsx
import React, { useCallback } from 'react';
import KnobBase from './KnobBase';

// --- Log/dB Mapping Functions (Keep or move to utils) ---
// Simple log (requires min > 0)
const mapTo01Log = (value, min, max) => { /* ... implementation ... */ };
const mapFrom01Log = (norm, min, max) => { /* ... implementation ... */ };
// Linear fallback (if log isn't appropriate or min <= 0)
const mapTo01Linear = (value, min, max) => { /* ... implementation ... */ };
const mapFrom01Linear = (norm, min, max) => { /* ... implementation ... */ };

// Decide which mapping to use based on the parameter type/range if needed
// For now, let's default to LINEAR for dB as a robust log curve is complex,
// UNLESS you specifically want to try the simple log one.
const USE_LOG_FOR_DB = false; // Set to true to try the simple log mapping

/**
 * Generic Knob for dB values.
 */
function KnobDb({ label, value, onChange, min, max, precision = 1, size, color }) {

  const valueRawDisplayFn = useCallback((val) => {
      if (min <= -60 && val <= min + 1) return "-inf dB";
      return `${val.toFixed(precision)} dB`;
  }, [min, precision]);

  // Define map functions ONLY if using log scale
  const mapTo01 = USE_LOG_FOR_DB && min > 0 ? mapTo01Log : undefined;
  const mapFrom01 = USE_LOG_FOR_DB && min > 0 ? mapFrom01Log : undefined;

  return (
    <KnobBase
      label={label}
      valueRaw={value}
      valueMin={min}
      valueMax={max}
      onValueRawChange={onChange}
      valueRawDisplayFn={valueRawDisplayFn}
      mapTo01={mapTo01} // Pass ONLY if defined (i.e., using log)
      mapFrom01={mapFrom01} // Pass ONLY if defined (i.e., using log)
      size={size}
      color={color ?? "text-purple-500"}
    />
  );
}

export default KnobDb;