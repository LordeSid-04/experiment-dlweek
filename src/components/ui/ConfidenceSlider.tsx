import { useRef, useState } from "react";
import { snapToClosestBand } from "@/lib/governance";

type ConfidenceSliderProps = {
  value: number;
  onChange: (nextValue: number) => void;
};

const ticks = [0, 50, 100] as const;

function getNextBand(startValue: number, endValue: number) {
  if (endValue === startValue) {
    return snapToClosestBand(startValue);
  }

  const direction = endValue > startValue ? 1 : -1;
  if (direction > 0) {
    return endValue <= 50 ? 50 : 100;
  }
  return endValue >= 50 ? 50 : 0;
}

export function ConfidenceSlider({ value, onChange }: ConfidenceSliderProps) {
  const [draftValue, setDraftValue] = useState<number | null>(null);
  const dragStartValueRef = useRef(value);
  const isDraggingRef = useRef(false);
  const currentValue = draftValue ?? value;

  const handleCommit = () => {
    const snapped = getNextBand(dragStartValueRef.current, currentValue);
    isDraggingRef.current = false;
    setDraftValue(null);
    onChange(snapped);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          className="text-sm font-medium text-white/90"
          htmlFor="confidence-slider"
        >
          Confidence
        </label>
        <span className="rounded-full border border-white/20 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-violet-200">
          {currentValue}%
        </span>
      </div>

      <input
        id="confidence-slider"
        type="range"
        min={0}
        max={100}
        value={currentValue}
        onMouseDown={() => {
          dragStartValueRef.current = value;
          isDraggingRef.current = true;
          setDraftValue(value);
        }}
        onTouchStart={() => {
          dragStartValueRef.current = value;
          isDraggingRef.current = true;
          setDraftValue(value);
        }}
        onChange={(event) => {
          setDraftValue(Number(event.target.value));
        }}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        onBlur={handleCommit}
        onKeyUp={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            if (!isDraggingRef.current) {
              dragStartValueRef.current = value;
              isDraggingRef.current = true;
            }
            handleCommit();
          }
        }}
        className="w-full accent-violet-300"
      />

      <div className="relative mt-3 h-6">
        {ticks.map((tick) => (
          <div
            key={tick}
            className="absolute top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-white/40"
            style={{ left: `${tick}%` }}
          />
        ))}
        {ticks.map((tick) => (
          <span
            key={`label-${tick}`}
            className="absolute top-2 -translate-x-1/2 text-[10px] text-white/65"
            style={{ left: `${tick}%` }}
          >
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}
