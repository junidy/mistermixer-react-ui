// src/components/SliderGain.jsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import useMixerStore from "../store/mixerStore"; // Import store hook

// src/components/SliderGain.jsx (or a utils file)

const MIN_DB = -60.0;
const MAX_DB = 6.0;

// Define our desired visual anchor points: [dB Value, Percentage Position (0=Top, 100=Bottom)]
// These values determine the "feel" and look. Adjust percentages as needed.
const FADER_CURVE_POINTS = [
  [MAX_DB, 2], // +6 dB at the very top (0%)
  [0, 25], // 0 dB at 25% down (leaving 75% for negative range)
  [-6, 37.5], // -6 dB roughly halfway between 0 and -12 in the next segment
  [-12, 50], // -12 dB at 50% down
  [-24, 65], // More space between -12 and -24
  [-36, 80], // Even more space between -24 and -36
  [-48, 90], // Space compresses a bit again towards the bottom
  [MIN_DB, 98], // -60 dB at the very bottom (100%)
].sort((a, b) => b[0] - a[0]); // Ensure sorted by dB descending (Top to Bottom)

/**
 * Maps a dB value to a vertical percentage based on the FADER_CURVE_POINTS.
 */
const mapDbToPercentLookup = (db) => {
  const clampedDb = Math.max(MIN_DB, Math.min(MAX_DB, db));

  // Find the segment the db value falls into
  let upperPoint = FADER_CURVE_POINTS[0];
  let lowerPoint = FADER_CURVE_POINTS[FADER_CURVE_POINTS.length - 1];

  for (let i = 0; i < FADER_CURVE_POINTS.length - 1; i++) {
    if (
      clampedDb >= FADER_CURVE_POINTS[i + 1][0] &&
      clampedDb <= FADER_CURVE_POINTS[i][0]
    ) {
      upperPoint = FADER_CURVE_POINTS[i]; // e.g., [0 dB, 25%]
      lowerPoint = FADER_CURVE_POINTS[i + 1]; // e.g., [-6 dB, 37.5%]
      break;
    }
  }

  const [dbUpper, percentUpper] = upperPoint;
  const [dbLower, percentLower] = lowerPoint;

  const dbRange = dbUpper - dbLower;
  const percentRange = percentLower - percentUpper;

  // Avoid division by zero if points are identical
  if (dbRange === 0) return percentUpper;

  // Calculate the proportion of the way the db value is within its segment
  const dbProportion = (dbUpper - clampedDb) / dbRange;

  // Linearly interpolate the percentage
  const percent = percentUpper + dbProportion * percentRange;

  return Math.max(0, Math.min(100, percent)); // Clamp final result
};

/**
 * Maps a vertical percentage (0-100, top to bottom) back to a dB value
 * based on the FADER_CURVE_POINTS.
 */
const mapPercentToDbLookup = (percent) => {
  const clampedPercent = Math.max(0, Math.min(100, percent));

  // Find the segment the percentage value falls into
  let upperPoint = FADER_CURVE_POINTS[0];
  let lowerPoint = FADER_CURVE_POINTS[FADER_CURVE_POINTS.length - 1];

  for (let i = 0; i < FADER_CURVE_POINTS.length - 1; i++) {
    // Percentages increase downwards
    if (
      clampedPercent >= FADER_CURVE_POINTS[i][1] &&
      clampedPercent <= FADER_CURVE_POINTS[i + 1][1]
    ) {
      upperPoint = FADER_CURVE_POINTS[i]; // e.g., [0 dB, 25%]
      lowerPoint = FADER_CURVE_POINTS[i + 1]; // e.g., [-6 dB, 37.5%]
      break;
    }
  }

  const [dbUpper, percentUpper] = upperPoint;
  const [dbLower, percentLower] = lowerPoint;

  const dbRange = dbUpper - dbLower;
  const percentRange = percentLower - percentUpper;

  // Avoid division by zero
  if (percentRange === 0) return dbUpper;

  // Calculate the proportion of the way the percentage is within its segment
  const percentProportion = (clampedPercent - percentUpper) / percentRange;

  // Linearly interpolate the dB value
  const db = dbUpper - percentProportion * dbRange; // Interpolate downwards in dB

  // Clamp final dB value to range and round
  const finalDb = Math.max(MIN_DB, Math.min(MAX_DB, db));
  return Math.round(finalDb * 10) / 10; // Round to 1 decimal place
};

/**
 * SliderGain Component - Vertical slider for Digital Gain (Custom Curve)
 * @param {object} props
 * @param {number} props.channelIndex - The 0-based channel index.
 */
function SliderGain({ channelIndex }) {
  // --- State & Refs (Unchanged) ---
  const sliderRef = useRef(null);
  const thumbRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- Store Connection (Unchanged) ---
  const digitalGain = useMixerStore(
    (state) => state?.channels?.[channelIndex]?.digital_gain ?? MIN_DB
  );
  const setDigitalGain = useMixerStore((state) => state.setDigitalGain);

  // --- Calculate Thumb Position using NEW Lookup Mapping ---
  const thumbPositionPercent = mapDbToPercentLookup(digitalGain); // <-- USE NEW LOOKUP

  // --- Event Handlers (Use NEW Lookup Mapping) ---
  const handleInteractionStart = useCallback(
    (clientY) => {
      if (!sliderRef.current) return;
      setIsDragging(true);
      document.body.style.cursor = "ns-resize";
      const sliderRect = sliderRef.current.getBoundingClientRect();
      const relativeY = clientY - sliderRect.top;
      const percent = (relativeY / sliderRect.height) * 100;
      const newDb = mapPercentToDbLookup(percent); // <-- USE NEW LOOKUP
      setDigitalGain(channelIndex, newDb);
    },
    [channelIndex, setDigitalGain]
  );

  const handleInteractionMove = useCallback(
    (clientY) => {
      if (!isDragging || !sliderRef.current) return;
      const sliderRect = sliderRef.current.getBoundingClientRect();
      const relativeY = clientY - sliderRect.top;
      const percent = (relativeY / sliderRect.height) * 100;
      const newDb = mapPercentToDbLookup(percent); // <-- USE NEW LOOKUP
      setDigitalGain(channelIndex, newDb);
    },
    [isDragging, channelIndex, setDigitalGain]
  );

  const handleInteractionEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    document.body.style.cursor = "default";
  }, [isDragging]);

  // --- Pointer Event Listeners (Unchanged) ---
  const handlePointerDown = useCallback(
    (event) => {
      event.preventDefault();
      event.target.setPointerCapture(event.pointerId);
      handleInteractionStart(event.clientY);
    },
    [handleInteractionStart]
  );

  const handlePointerMove = useCallback(
    (event) => {
      // Only call if dragging (already checked in handleInteractionMove)
      handleInteractionMove(event.clientY);
    },
    [handleInteractionMove]
  );

  const handlePointerUp = useCallback(
    (event) => {
      // Check if target exists before releasing capture, safety for edge cases
      if (event.target.hasPointerCapture?.(event.pointerId)) {
        event.target.releasePointerCapture(event.pointerId);
      }
      handleInteractionEnd();
    },
    [handleInteractionEnd]
  );

  // --- useEffect for window listeners (Unchanged) ---
  useEffect(() => {
    if (!isDragging) return;
    const moveHandler = (event) => handleInteractionMove(event.clientY);
    const upHandler = (event) => handleInteractionEnd();
    window.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", upHandler);
    window.addEventListener("pointercancel", upHandler);
    return () => {
      window.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("pointerup", upHandler);
      window.removeEventListener("pointercancel", upHandler);
    };
  }, [isDragging, handleInteractionMove, handleInteractionEnd]);

  // --- Ruler Markings (Match the lookup table points) ---
  // Use the dB values from our FADER_CURVE_POINTS for consistency
  const marks = FADER_CURVE_POINTS.map(([value, percent]) => ({
    value: value,
    // Custom labels for clarity
    label:
      value === MIN_DB
        ? "-inf"
        : value > 0
        ? `+${value.toFixed(0)}`
        : value.toFixed(0),
    percent: percent, // Store percent for positioning
  }));

  return (
    <div className="flex-grow flex flex-col items-center w-full min-h-0 py-2 px-1">
      <span className="text-xs text-gray-500 mb-1 flex-shrink-0">
        Digital Gain
      </span>
      <div className="h-full w-full flex items-stretch relative">
        {" "}
        {/* Container for track + labels */}
        {/* --- Track Area --- */}
        <div
          ref={sliderRef}
          className="w-6 h-full bg-gray-700 rounded-full border border-gray-900 shadow-inner relative cursor-pointer touch-none mx-auto" // Darker track
          onPointerDown={handlePointerDown}
        >
          {/* --- Center Line --- */}
          <div className="absolute top-0 left-1/2 w-px h-full bg-gray-500 opacity-50 pointer-events-none"></div>

          {/* --- Filled portion (Below Thumb -> More Gain) --- */}
          {/* Adjust gradient/color as desired */}
          <div
            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-sky-500 to-sky-700 rounded-full pointer-events-none"
            style={{ height: `${100 - thumbPositionPercent}%` }}
          ></div>

          {/* --- Thumb (Triangle Pointer Style) --- */}
          <div
            ref={thumbRef}
            className="absolute right-full w-3 h-4 pointer-events-none z-10 mr-0.5" // Position to the left of the track
            style={{
              top: `calc(${thumbPositionPercent}% - 8px)`, // Center triangle vertically (half height)
              // transition: isDragging ? 'none' : 'top 0.05s ease-out' // Optional smooth snap
            }}
          >
            {/* Triangle pointing right (use borders) */}
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-gray-300"></div>
            {/* Value display next to triangle */}
            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-1 text-[10px] font-semibold text-gray-800 bg-gray-300 px-1 rounded-sm shadow">
              {digitalGain <= MIN_DB + 0.1 ? "-inf" : digitalGain.toFixed(1)}
            </span>
          </div>
        </div>{" "}
        {/* --- End Track Area --- */}
        {/* --- Ruler Markings Area --- */}
        <div className="absolute left-full top-0 h-full w-12 flex flex-col ml-1 pointer-events-none">
          {" "}
          {/* Area to the right */}
          {marks.map((mark) => {
            // Don't render mark for absolute Max/Min if desired
            // if (mark.value === MAX_DB || mark.value === MIN_DB) return null;
            return (
              <div
                key={mark.value}
                className="absolute w-full text-left" // Align text left
                style={{
                  top: `${mark.percent}%`,
                  transform: "translateY(-50%) translateX(-55%)",
                }} // Use precalculated percent
              >
                {/* Tick Mark */}
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-px bg-gray-400"></span>
                {/* Label */}
                <span className="text-[9px] text-gray-500 ml-2.5">
                  {" "}
                  {/* Add margin from tick */}
                  {mark.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* --- End Ruler Markings Area --- */}
      </div>{" "}
      {/* --- End Track + Labels Container --- */}
    </div> // --- End Component Root ---
  );
}

export default SliderGain;
