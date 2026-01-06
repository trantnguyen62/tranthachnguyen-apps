import React, { useEffect, useRef, useCallback, memo } from 'react';
import { AudioVolume } from '../types';

interface VisualizerProps {
  volume: AudioVolume;
  isActive: boolean;
  color: string;
}

const Visualizer = memo<VisualizerProps>(({ volume, isActive, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const particlesRef = useRef<Array<{x: number, y: number, r: number, vx: number, vy: number}>>([]);

  // Initialize particles
  useEffect(() => {
      particlesRef.current = Array.from({ length: 20 }, () => ({
          x: Math.random() * 200,
          y: Math.random() * 200,
          r: Math.random() * 3 + 2,
          vx: (Math.random() - 0.5) * 1,
          vy: (Math.random() - 0.5) * 1
      }));
  }, []);

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isActive) {
        // Idle animation
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = 100;

    // Use input volume if user is talking, else output volume
    const currentVol = volume.input > 0.05 ? volume.input : volume.output;
    const scale = 1 + Math.min(currentVol * 2, 1.5); // Cap scale

    // Draw main glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 20 * scale, centerX, centerY, 60 * scale);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 60 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Draw orbiting particles
    particlesRef.current.forEach((p, i) => {
        p.x += p.vx * scale;
        p.y += p.vy * scale;

        // Bounce off walls (virtual box)
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + currentVol})`;
        ctx.fill();
        
        // Connect to center if loud enough
        if (currentVol > 0.3) {
             ctx.beginPath();
             ctx.moveTo(centerX, centerY);
             ctx.lineTo(p.x, p.y);
             ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
             ctx.lineWidth = 1;
             ctx.stroke();
        }
    });

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, volume, color]);

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className="w-full h-full"
      />
    </div>
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;
