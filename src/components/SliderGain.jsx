// src/components/SliderGain.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import useMixerStore from '../store/mixerStore'; // Import store hook

// Constants for the range (from schema)
const MIN_DB = -60.0;
const MAX_DB = 6.0;
const DB_RANGE = MAX_DB - MIN_DB;

// Helper to map dB value to vertical percentage (0% at top, 100% at bottom)
// This is non-linear if we want perceptual feel, but start linear for simplicity
const mapDbToPercent = (db) => {
    // Clamp value within range
    const clampedDb = Math.max(MIN_DB, Math.min(MAX_DB, db));
    // Linear mapping: higher dB = lower percentage (closer to top)
    return 100 - ((clampedDb - MIN_DB) / DB_RANGE) * 100;
};

// Helper to map vertical percentage (0-100, top to bottom) back to dB value
const mapPercentToDb = (percent) => {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    // Linear mapping: lower percentage = higher dB
    const db = (100 - clampedPercent) / 100 * DB_RANGE + MIN_DB;
    // Round to reasonable precision (e.g., 1 decimal place)
    return Math.round(db * 10) / 10;
};


/**
 * SliderGain Component - Vertical slider for Digital Gain
 * @param {object} props
 * @param {number} props.channelIndex - The 0-based channel index.
 */
function SliderGain({ channelIndex }) {
    // --- State & Refs ---
    const sliderRef = useRef(null); // Ref to the slider track div
    const thumbRef = useRef(null);   // Ref to the draggable thumb div
    const [isDragging, setIsDragging] = useState(false);

    // --- Store Connection ---
    const digitalGain = useMixerStore(
        (state) => state?.channels?.[channelIndex]?.digital_gain ?? MIN_DB
    );
    const setDigitalGain = useMixerStore(state => state.setDigitalGain); // Gets the throttled action

    // --- Calculate Thumb Position ---
    // Position based on the value from the store
    const thumbPositionPercent = mapDbToPercent(digitalGain);

    // --- Event Handlers ---
    const handleInteractionStart = useCallback((clientY) => {
        if (!sliderRef.current) return;
        setIsDragging(true);
        document.body.style.cursor = 'ns-resize'; // Indicate vertical drag

        const sliderRect = sliderRef.current.getBoundingClientRect();
        const relativeY = clientY - sliderRect.top;
        const percent = (relativeY / sliderRect.height) * 100;
        const newDb = mapPercentToDb(percent);

        // Update store immediately on click/touch start
        setDigitalGain(channelIndex, newDb);

    }, [channelIndex, setDigitalGain]);

    const handleInteractionMove = useCallback((clientY) => {
        if (!isDragging || !sliderRef.current) return;

        const sliderRect = sliderRef.current.getBoundingClientRect();
        const relativeY = clientY - sliderRect.top;
        const percent = (relativeY / sliderRect.height) * 100;
        const newDb = mapPercentToDb(percent);

        // Update store - the action itself is throttled
        setDigitalGain(channelIndex, newDb);

    }, [isDragging, channelIndex, setDigitalGain]);

    const handleInteractionEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        document.body.style.cursor = 'default'; // Reset cursor
        // No need to send final value here, throttle handles trailing edge
    }, [isDragging]);

    // --- Pointer Event Listeners (Unified Touch & Mouse) ---
    const handlePointerDown = useCallback((event) => {
        // Prevent text selection during drag
        event.preventDefault();
        // Capture pointer events to handle moves outside the element
        event.target.setPointerCapture(event.pointerId);
        handleInteractionStart(event.clientY);
    }, [handleInteractionStart]);

    const handlePointerMove = useCallback((event) => {
        handleInteractionMove(event.clientY);
    }, [handleInteractionMove]); // Dependency doesn't strictly need isDragging here

    const handlePointerUp = useCallback((event) => {
        event.target.releasePointerCapture(event.pointerId);
        handleInteractionEnd();
    }, [handleInteractionEnd]);

    // Add listeners to window for move/up to handle dragging outside bounds
    useEffect(() => {
        if (!isDragging) return;

        // Need to bind handlers that correctly use the *current* state/props
        const moveHandler = (event) => handleInteractionMove(event.clientY);
        const upHandler = (event) => handleInteractionEnd(); // Use pointerup for consistency

        window.addEventListener('pointermove', moveHandler);
        window.addEventListener('pointerup', upHandler);
        window.addEventListener('pointercancel', upHandler); // Handle cancels too

        return () => {
            window.removeEventListener('pointermove', moveHandler);
            window.removeEventListener('pointerup', upHandler);
            window.removeEventListener('pointercancel', upHandler);
        };
    }, [isDragging, handleInteractionMove, handleInteractionEnd]); // Re-bind if handlers change


    // --- Ruler Markings ---
    const marks = [
        { value: MAX_DB, label: `+${MAX_DB.toFixed(0)}` }, // Top: +6
        { value: 0, label: "0dB" },                     // Middle: 0
        { value: MIN_DB, label: "-inf" }                   // Bottom: -60
    ];


    return (
        // --- Container for the Slider & Label ---
        <div className="flex-grow flex flex-col items-center w-full min-h-0 py-2">
             <span className="text-xs text-gray-500 mb-1 flex-shrink-0">Digital Gain</span>

             {/* --- Track Area --- */}
             <div
                 ref={sliderRef}
                 className="w-6 h-full bg-gray-200 rounded-full border border-gray-300 relative cursor-pointer touch-none" // touch-none prevents scrolling on drag
                 onPointerDown={handlePointerDown} // Use pointer events for unified input
             >
                 {/* --- Filled portion (Track Below Thumb) --- */}
                 <div
                     className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-400 to-blue-600 rounded-full pointer-events-none" // Ignore pointer events
                     style={{ height: `${100 - thumbPositionPercent}%` }}
                 ></div>

                 {/* --- Thumb --- */}
                 <div
                     ref={thumbRef}
                     className="absolute left-1/2 -translate-x-1/2 w-8 h-5 bg-white rounded border-2 border-blue-600 shadow flex items-center justify-center pointer-events-none" // Ignore pointer events on thumb itself
                     style={{
                         top: `calc(${thumbPositionPercent}% - 10px)`, // Center thumb vertically (adjust -10px based on half thumb height)
                         // Add transitions only when NOT dragging for smoother snaps
                         // transition: isDragging ? 'none' : 'top 0.05s ease-out'
                         }}
                 >
                     {/* Display dB Value inside Thumb */}
                     <span className="text-[10px] font-semibold text-blue-800 whitespace-nowrap">
                         {digitalGain <= MIN_DB + 1 ? "-inf" : digitalGain.toFixed(1)}
                     </span>
                 </div>

                 {/* --- Ruler Markings --- */}
                 <div className="absolute right-full top-0 h-full mr-1 flex flex-col justify-between pointer-events-none">
                    {marks.map((mark) => {
                        // Skip rendering mark if value is same as min/max (already implied by track ends)
                        // if (mark.value === MIN_DB || mark.value === MAX_DB) return null;

                        const markPercent = mapDbToPercent(mark.value);
                        return (
                            <div
                                key={mark.value}
                                className="absolute w-4 text-right -translate-y-1/2" // Position relative to track, center vertically
                                style={{ top: `${markPercent}%`, right: '4px' }} // Position from right edge
                            >
                                <span className="text-[9px] text-gray-500">{mark.label}</span>
                                {/* Optional Tick Mark */}
                                {/* <div className="absolute right-0 top-1/2 w-1 h-px bg-gray-400"></div> */}
                            </div>
                        );
                    })}
                 </div>

             </div> {/* --- End Track Area --- */}
        </div> // --- End Container ---
    );
}

export default SliderGain;