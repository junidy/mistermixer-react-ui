// src/components/KnobBase.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { KnobHeadless } from 'react-knob-headless';

// Helper function for LINEAR mapping (used internally for visuals if no custom map provided)
// This is NOT imported, just defined here for visual calculations.
const internalMapTo01Linear = (value, min, max) => {
    if (max === min) return 0; // Avoid division by zero
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

// Define a reference root font size (usually 16px for default browser/Tailwind)
const REFERENCE_ROOT_FONT_SIZE = 16;

/**
 * KnobBase - Core visual/interaction component.
 * Uses default linear scaling unless map functions are provided.
 *
 * @param {object} props
 * @param {string} props.label - Accessible label for the knob.
 * @param {number} props.valueRaw - Current raw value.
 * @param {number} props.valueMin - Minimum value.
 * @param {number} props.valueMax - Maximum value.
 * @param {function} props.onValueRawChange - Callback when value changes.
 * @param {function} props.valueRawDisplayFn - Function to format value for display & aria.
 * @param {function} [props.mapTo01] - Optional: Custom mapping value -> [0, 1]. If omitted, uses linear.
 * @param {function} [props.mapFrom01] - Optional: Custom mapping [0, 1] -> value. If omitted, uses linear.
 * @param {number} [props.size=64] - Diameter in pixels.
 * @param {string} [props.color="text-blue-500"] - Tailwind text color for indicator.
 * @param {string} [props.trackColor="bg-gray-700"] - Tailwind background color for track.
 * @param {number} [props.dragSensitivity=0.006] - Drag sensitivity.
 */
function KnobBase({
  label,
  valueRaw,
  valueMin,
  valueMax,
  onValueRawChange,
  valueRawDisplayFn,
  mapTo01, // Optional prop for non-linear
  mapFrom01, // Optional prop for non-linear
  size = 64,
  color = "text-blue-500",
  trackColor = "bg-gray-700",
  dragSensitivity = 0.006,
}) {

  // --- Determine the mapping function to use for VISUALS ---
  // Use the provided mapTo01 if available, otherwise default to our internal linear one.
  const internalMapTo01 = useMemo(() => (
     mapTo01 ? (val) => mapTo01(val, valueMin, valueMax) : (val) => internalMapTo01Linear(val, valueMin, valueMax)
  ), [mapTo01, valueMin, valueMax]);


  // --- Normalize Value for Visuals (0 to 1) ---
  const [normalizedValue, setNormalizedValue] = useState(() => internalMapTo01(valueRaw));

  useEffect(() => {
    // Update visual state if external value changes
    setNormalizedValue(internalMapTo01(valueRaw));
  }, [valueRaw, internalMapTo01]);


  // --- Value Change Handler ---
  // This gets called by KnobHeadless *raw* value change
  const handleValueChange = useCallback((newValueRaw) => {
    setNormalizedValue(internalMapTo01(newValueRaw)); // Update visual state
    onValueRawChange(newValueRaw);                  // Call the external handler
  }, [onValueRawChange, internalMapTo01]);

  // --- Styling ---
  // Calculate size in rem based on the pixel size prop and reference font size
  const sizeInRem = size / REFERENCE_ROOT_FONT_SIZE;
  const knobStyle = {
    width: `${sizeInRem}rem`, // Use rem units
    height: `${sizeInRem}rem`, // Use rem units
  };

  // --- Styling ---
  // const knobStyle = { width: `${size}px`, height: `${size}px` };
  const rotationRange = 270;
  const startAngle = -135;
  const rotation = startAngle + normalizedValue * rotationRange;

    // --- Indicator Styling - Revised ---
  // --- Indicator Styling - CORRECTION for Centered Rotation ---
  const indicatorHeightRem = (size * 0.35) / REFERENCE_ROOT_FONT_SIZE;
  const indicatorWidthRem = (size * 0.05) / REFERENCE_ROOT_FONT_SIZE;
  // Style for the indicator line itself
  const indicatorLineStyle = {
    height: `${indicatorHeightRem}rem`,
    width: `${indicatorWidthRem}rem`,
    backgroundColor: 'currentColor',
    // --- CORRECTED: Position origin at bottom center ---
    transformOrigin: 'bottom center',
    // --- Apply rotation AND translate up to pivot around center ---
    // Translate Y by negative half the indicator's height to move pivot point up
    transform: `translateY(-${indicatorHeightRem / 2}rem) rotate(${rotation}deg)`,
    // --- Force it to be above the track background potentially ---
    zIndex: 1,
    // --- Add rounded corners ---
    borderRadius: '9999px', // Tailwind's rounded-full equivalent
};


  return (
    <div className="flex flex-col items-center space-y-1">
      {/* Label Text */}
      <span className="text-xs text-gray-500 font-medium select-none truncate px-1">{label}</span>

      {/* Headless Knob - Pass map funcs ONLY if they exist */}
      <KnobHeadless
        style={knobStyle}
        className={`relative rounded-full ${trackColor} border border-black/20 shadow-inner cursor-pointer focus:outline-none ${color}`} // Removed focus ring stuff for touch
        valueRaw={valueRaw}
        valueMin={valueMin}
        valueMax={valueMax}
        dragSensitivity={dragSensitivity}
        onValueRawChange={handleValueChange}
        // Conditionally pass mapping functions:
        {...(mapTo01 && { mapTo01: (v) => mapTo01(v, valueMin, valueMax) })}
        {...(mapFrom01 && { mapFrom01: (n) => mapFrom01(n, valueMin, valueMax) })}
        valueRawRoundFn={(v) => v} // Pass raw float
        valueRawDisplayFn={valueRawDisplayFn} // Used for aria-valuetext
        aria-label={label}
        tabIndex={-1} // Ensure not keyboard focusable
      >
       {/* --- Indicator Container - Center Content --- */}
        {/* Position absolutely, use flex to center the indicator line horizontally and vertically */}
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
             {/* The visible indicator line, rotation handled by inline style */}
             <div
                className={`${color}`} // Apply color via text-* on parent
                style={indicatorLineStyle} // Apply calculated style
            ></div>
        </div>
        {/* --- End Indicator Container --- */}
      </KnobHeadless>

      {/* Value Output */}
      <span className="text-xs font-mono text-gray-700 select-none">
        {valueRawDisplayFn(valueRaw)}
      </span>
    </div>
  );
}

export default KnobBase;