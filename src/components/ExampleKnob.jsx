import React, { useState } from 'react';
import { KnobHeadless } from 'react-knob-headless';
// If you want keyboard controls, you'd also import:
// import { useKnobKeyboardControls } from 'react-knob-headless';

// --- Constants ---
const MIN_VALUE = 0;
const MAX_VALUE = 100;
const INITIAL_VALUE = 50; // Start in the middle
const DRAG_SENSITIVITY = 0.006; // Recommended value from docs

function ExampleKnob() {
  // --- State ---
  const [currentValue, setCurrentValue] = useState(INITIAL_VALUE);

  // --- Required Functions ---

  // Handles the raw value change from the knob interaction
  const handleValueChange = (newValue) => {
    // IMPORTANT: Do NOT round the value here. Store the raw value.
    // Rounding happens in valueRawRoundFn for ARIA, and valueRawDisplayFn for display.
    setCurrentValue(newValue);
  };

  // Provides the rounded value for ARIA attributes (aria-valuenow)
  const roundValueForAria = (rawValue) => {
    // Example: Round to nearest integer
    return Math.round(rawValue);
  };

  // Provides the human-readable string representation for ARIA (aria-valuetext)
  // and can also be used for visual display.
  const displayValueAsString = (rawValue) => {
    // Example: Show rounded value with a percentage sign
    const roundedValue = Math.round(rawValue);
    return `${roundedValue}%`;
  };

  // --- Optional: Keyboard Controls ---
  // If you want keyboard support, uncomment the import and this section:
  /*
  const keyboardControlProps = useKnobKeyboardControls({
    valueRaw: currentValue,
    valueMin: MIN_VALUE,
    valueMax: MAX_VALUE,
    step: 1, // e.g., 1% change with arrow keys
    stepLarger: 10, // e.g., 10% change with PageUp/PageDown
    onValueRawChange: (newValue, event) => {
      // We can reuse the same state update function
      handleValueChange(newValue);
      // Default behavior prevents page scroll on arrow keys, which is usually desired.
    },
    // noDefaultPrevention: false, // Default is false, usually fine
  });
  */

  // --- Render ---
  return (
    <div>
      <KnobHeadless
        // --- Required Props ---
        valueRaw={currentValue}
        valueMin={MIN_VALUE}
        valueMax={MAX_VALUE}
        dragSensitivity={DRAG_SENSITIVITY}
        onValueRawChange={handleValueChange}
        valueRawRoundFn={roundValueForAria}
        valueRawDisplayFn={displayValueAsString}
        // --- Accessibility ---
        aria-label="Mixer Level Control" // Or use aria-labelledby with KnobHeadlessLabel
        // --- Basic Styling (to make it visible) ---
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '2px solid #555',
          backgroundColor: '#ccc',
          display: 'inline-flex', // Or block
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          touchAction: 'none', // Crucial for use-gesture on touch devices
          outline: 'none', // Remove default browser focus outline if needed
          position: 'relative', // For potential internal styling/indicators
        }}
        // --- Optional: Keyboard ---
        // Spread the keyboard props here if using the hook:
        // {...keyboardControlProps}

        // --- Optional: Tab Order ---
        // includeIntoTabOrder={true} // Only if you want keyboard tab focus AND use the hook
      >
        {/* You can add visual elements inside the div if needed */}
        {/* Example: A simple indicator line */}
        <div
          style={{
            width: '4px',
            height: '50%', // Half the height
            backgroundColor: 'black',
            position: 'absolute',
            top: '0%', // Start below the center
            left: 'calc(50% - 2px)', // Center horizontally
            transformOrigin: 'bottom center', // Rotate around the bottom center
            transform: `rotate(${(currentValue / MAX_VALUE - 0.5) * 270}deg)`, // Example rotation (adjust range as needed)
            pointerEvents: 'none', // Prevent line from interfering with drag
          }}
        />
      </KnobHeadless>

      {/* Display the current value visually */}
      <div style={{ marginTop: '10px', fontSize: '14px', width: '60px', textAlign: 'center' }}>
        Value: {displayValueAsString(currentValue)}
      </div>
    </div>
  );
}

export default ExampleKnob;