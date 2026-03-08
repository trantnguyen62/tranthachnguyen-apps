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
    if (document.hidden) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isActive) {
        // Idle pulsing animation
        const now = Date.now() / 1000;
        const pulse = 0.5 + 0.5 * Math.sin(now * 2);
        const radius = 36 + pulse * 6;
        const alpha = 0.2 + pulse * 0.25;

        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(100, 116, 139, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 116, 139, 0.5)`;
        ctx.fill();

        requestRef.current = requestAnimationFrame(animate);
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

        // Bounce off walls (virtual box), clamp position to stay in bounds
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        else if (p.x > canvas.width) { p.x = canvas.width; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        else if (p.y > canvas.height) { p.y = canvas.height; p.vy = -Math.abs(p.vy); }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.5 + currentVol, 1)})`;
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
        role="img"
        aria-label={isActive ? 'Audio visualizer — conversation is active' : 'Audio visualizer — idle'}
      />
    </div>
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;
