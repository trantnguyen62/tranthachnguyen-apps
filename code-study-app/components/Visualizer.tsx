import { memo, useMemo } from 'react';

interface VisualizerProps {
  volume: { input: number; output: number };
  isConnected: boolean;
}

const BARS = 12;
const HALF = BARS / 2;
const MAX_HEIGHT = 60;

// Pre-compute static per-bar geometry — never changes
const BAR_MULTIPLIERS = Array.from({ length: BARS }, (_, i) => {
  const centerDistance = Math.abs(i - (BARS - 1) / 2);
  return 1 - (centerDistance / (BARS / 2)) * 0.5;
});

const Visualizer = memo<VisualizerProps>(({ volume, isConnected }) => {
  const combinedVolume = useMemo(() => Math.max(volume.input, volume.output), [volume.input, volume.output]);
  const baseHeight = isConnected ? 8 : 4;
  const opacity = isConnected ? 0.8 + combinedVolume * 0.2 : 0.3;

  const volumeLabel = isConnected
    ? `Audio active — mic ${Math.round(volume.input * 100)}%, AI ${Math.round(volume.output * 100)}%`
    : 'Audio inactive';

  return (
    <div
      role="img"
      aria-label={volumeLabel}
      className="flex flex-col items-center gap-2"
    >
      <div className="flex items-center justify-center gap-1 h-16">
        {BAR_MULTIPLIERS.map((heightMultiplier, i) => {
          // Left half = AI output (emerald), right half = user input (blue)
          const isInputSide = i >= HALF;
          const vol = isConnected
            ? (isInputSide ? volume.input : volume.output)
            : 0;
          const dynamicHeight = isConnected
            ? baseHeight + vol * MAX_HEIGHT * heightMultiplier
            : baseHeight;
          const barColor = isInputSide ? '#60A5FA' : '#10B981';

          return (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-75${!isConnected ? ' visualizer-idle-bar' : ''}`}
              style={{
                height: `${Math.min(dynamicHeight, MAX_HEIGHT)}px`,
                backgroundColor: barColor,
                opacity,
                animationDelay: !isConnected ? `${i * 120}ms` : undefined,
              }}
            />
          );
        })}
      </div>
      {isConnected && (
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400/60" aria-hidden="true" />
            AI
          </span>
          <span className="flex items-center gap-1.5 text-blue-400/70">
            <span className="w-2 h-2 rounded-full bg-blue-400/60" aria-hidden="true" />
            Mic
          </span>
        </div>
      )}
    </div>
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;
