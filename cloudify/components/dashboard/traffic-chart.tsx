"use client";

import { useMemo } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface TrafficChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

export function TrafficChart({
  data,
  height = 300,
  color = "#0070f3",
  showGrid = true,
}: TrafficChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = 0;
    const range = maxValue - minValue || 1;

    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = 800;
    const chartHeight = height;
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1 || 1)) * innerWidth,
      y: padding.top + innerHeight - ((d.value - minValue) / range) * innerHeight,
      ...d,
    }));

    // Create smooth curve path
    const linePath = points
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = points[i - 1];
        const cpx = (prev.x + p.x) / 2;
        return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
      })
      .join(" ");

    // Area path (fill under curve)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${
      padding.top + innerHeight
    } L ${points[0].x} ${padding.top + innerHeight} Z`;

    // Y-axis labels
    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const value = minValue + (range * (4 - i)) / 4;
      const y = padding.top + (innerHeight * i) / 4;
      return { value: formatValue(value), y };
    });

    // X-axis labels (show every nth label based on data length)
    const step = Math.max(1, Math.floor(data.length / 7));
    const xLabels = data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map((d, idx) => {
        const originalIndex = data.indexOf(d);
        return {
          label: d.label,
          x: padding.left + (originalIndex / (data.length - 1 || 1)) * innerWidth,
        };
      });

    return {
      points,
      linePath,
      areaPath,
      yLabels,
      xLabels,
      padding,
      chartWidth,
      chartHeight,
      innerWidth,
      innerHeight,
    };
  }, [data, height]);

  if (!chartData || !data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-background"
        style={{ height }}
      >
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${chartData.chartWidth} ${chartData.chartHeight}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {showGrid &&
          chartData.yLabels.map((label, i) => (
            <line
              key={i}
              x1={chartData.padding.left}
              y1={label.y}
              x2={chartData.padding.left + chartData.innerWidth}
              y2={label.y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeDasharray="4 4"
            />
          ))}

        {/* Area fill */}
        <path d={chartData.areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={chartData.linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.points.map((point, i) => (
          <g key={i}>
            <circle cx={point.x} cy={point.y} r="4" fill={color} opacity="0" className="hover:opacity-100 transition-opacity">
              <title>{`${point.label}: ${formatValue(point.value)}`}</title>
            </circle>
          </g>
        ))}

        {/* Y-axis labels */}
        {chartData.yLabels.map((label, i) => (
          <text
            key={i}
            x={chartData.padding.left - 10}
            y={label.y + 4}
            textAnchor="end"
            className="[fill:hsl(var(--muted-foreground))]"
            fontSize="11"
            fontFamily="sans-serif"
          >
            {label.value}
          </text>
        ))}

        {/* X-axis labels */}
        {chartData.xLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={chartData.chartHeight - 8}
            textAnchor="middle"
            className="[fill:hsl(var(--muted-foreground))]"
            fontSize="11"
            fontFamily="sans-serif"
          >
            {label.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

function formatValue(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return Math.round(value).toString();
}
