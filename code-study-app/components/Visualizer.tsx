import { memo, useMemo } from 'react';

interface VisualizerProps {
  volume: { input: number; output: number };
  isConnected: boolean;
  color?: string;
}

const BARS = 12;
const MAX_HEIGHT = 60;

const Visualizer = memo<VisualizerProps>(({ volume, isConnected, color = '#10B981' }) => {
  const combinedVolume = useMemo(() => Math.max(volume.input, volume.output), [volume.input, volume.output]);

  return (
    <div className="flex items-center justify-center gap-1 h-20">
      {Array.from({ length: BARS }).map((_, i) => {
        const centerDistance = Math.abs(i - (BARS - 1) / 2);
        const baseHeight = isConnected ? 8 : 4;
        const heightMultiplier = 1 - (centerDistance / (BARS / 2)) * 0.5;
        const dynamicHeight = isConnected 
          ? baseHeight + (combinedVolume * MAX_HEIGHT * heightMultiplier)
          : baseHeight;

        return (
          <div
            key={i}
            className="w-2 rounded-full transition-all duration-75"
            style={{
              height: `${Math.min(dynamicHeight, MAX_HEIGHT)}px`,
              backgroundColor: color,
              opacity: isConnected ? 0.8 + (combinedVolume * 0.2) : 0.3,
            }}
          />
        );
      })}
    </div>
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;
