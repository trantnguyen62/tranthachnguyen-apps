/**
 * Visualizer — canvas-based audio animation that provides visual feedback
 * during a live conversation session.
 *
 * Two visual states:
 *   - Idle (isActive=false): a slow-pulsing ring drawn with requestAnimationFrame.
 *   - Active (isActive=true): a radial gradient glow whose size is driven by the
 *     current audio volume, plus 20 particles that bounce around the canvas and
 *     draw lines to the centre when the volume exceeds a threshold.
 *
 * The component is memoised to avoid unnecessary re-renders from parent state
 * updates that do not affect its props.
 */
import React, { useEffect, useRef, memo } from 'react';
import { AudioVolume } from '../types';

interface VisualizerProps {
  /** Normalised [0, 1] volume for microphone input and speaker output. */
  volume: AudioVolume;
  /** Whether a live session is currently running. Controls idle vs. active animation. */
  isActive: boolean;
  /** CSS colour string for the active glow (passed from the selected language theme). */
  color: string;
}

const Visualizer = memo<VisualizerProps>(({ volume, isActive, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const requestRef = useRef<number | null>(null);
  const particlesRef = useRef<Array<{x: number, y: number, r: number, vx: number, vy: number}>>([]);
  const volumeRef = useRef<AudioVolume>(volume);
  const colorRef = useRef<string>(color);

  // Sync volume and color into refs so the animation loop reads latest values
  // without being restarted on every volume update.
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { colorRef.current = color; }, [color]);

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
      requestRef.current = null;
      return; // Stop loop; visibilitychange will restart it
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!ctxRef.current) ctxRef.current = canvas.getContext('2d');
    const ctx = ctxRef.current;
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

    // Prefer input volume (user speaking) over output volume (AI speaking).
    // The 0.05 threshold ignores microphone noise floor so the visualizer
    // reacts to the AI when the user is silent.
    const vol = volumeRef.current;
    const currentVol = vol.input > 0.05 ? vol.input : vol.output;
    // Scale ranges from 1× (silence) to 2.5× (max volume), capped to avoid
    // the glow exceeding the canvas bounds at high volumes.
    const scale = 1 + Math.min(currentVol * 2, 1.5); // Cap scale

    // Draw main glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 20 * scale, centerX, centerY, 60 * scale);
    gradient.addColorStop(0, colorRef.current);
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
        
        // Draw spokes from each particle to the centre when volume is loud
        // enough (> 0.3) to add a dynamic "active" feel at higher volumes.
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

  // Only restart the animation loop when isActive changes, not on every volume update.
  // Volume and color are read via refs inside animate(), keeping them current without
  // triggering a loop restart. When the tab is hidden the loop stops itself; a
  // visibilitychange listener restarts it when the tab becomes visible again.
  useEffect(() => {
    const startLoop = () => {
      if (!document.hidden && requestRef.current === null) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    requestRef.current = requestAnimationFrame(animate);
    document.addEventListener('visibilitychange', startLoop);
    return () => {
      document.removeEventListener('visibilitychange', startLoop);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

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
