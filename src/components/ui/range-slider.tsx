'use client';

type RangeSliderProps = {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  label?: string;
};

export function RangeSlider({ min, max, valueMin, valueMax, onChange, label }: RangeSliderProps) {
  return (
    <div className="space-y-3">
      {label ? <p className="text-sm font-medium">{label}</p> : null}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{valueMin}</span>
        <span>{valueMax}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Min age</label>
          <input
            type="range"
            min={min}
            max={max}
            value={valueMin}
            onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax - 1), valueMax)}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Max age</label>
          <input
            type="range"
            min={min}
            max={max}
            value={valueMax}
            onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin + 1))}
            className="w-full accent-primary"
          />
        </div>
      </div>
    </div>
  );
}

type DistanceSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function DistanceSlider({ value, onChange, min = 5, max = 200 }: DistanceSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Max distance</span>
        <span className="text-muted-foreground">{value} km</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
