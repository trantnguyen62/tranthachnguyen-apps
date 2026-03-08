import { memo, useMemo } from 'react';

interface VisualizerProps {
  volume: { input: number; output: number };
  isConnected: boolean;
  color?: string;
}

const BARS = 12;
const MAX_HEIGHT = 60;

// Pre-compute static per-bar geometry — never changes
const BAR_MULTIPLIERS = Array.from({ length: BARS }, (_, i) => {
  const centerDistance = Math.abs(i - (BARS - 1) / 2);
  return 1 - (centerDistance / (BARS / 2)) * 0.5;
});

const Visualizer = memo<VisualizerProps>(({ volume, isConnected, color = '#10B981' }) => {
  const combinedVolume = useMemo(() => Math.max(volume.input, volume.output), [volume.input, volume.output]);
  const baseHeight = isConnected ? 8 : 4;
  const opacity = isConnected ? 0.8 + combinedVolume * 0.2 : 0.3;

  const volumeLabel = isConnected
    ? `Audio active, volume level ${Math.round(combinedVolume * 100)}%`
    : 'Audio inactive';

  return (
    <div
      role="img"
      aria-label={volumeLabel}
      className="flex items-center justify-center gap-1 h-20"
    >
      {BAR_MULTIPLIERS.map((heightMultiplier, i) => {
        const dynamicHeight = isConnected
          ? baseHeight + combinedVolume * MAX_HEIGHT * heightMultiplier
          : baseHeight;

        return (
          <div
            key={i}
            className={`w-2 rounded-full transition-all duration-75${!isConnected ? ' visualizer-idle-bar' : ''}`}
            style={{
              height: `${Math.min(dynamicHeight, MAX_HEIGHT)}px`,
              backgroundColor: color,
              opacity,
              animationDelay: !isConnected ? `${i * 120}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;
