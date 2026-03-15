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

interface VisualizerProps {
  /**
   * Ref to the Web Audio AnalyserNode for the output stream. Sampled each
   * animation frame instead of via a React state polling interval, so volume
   * changes never cause a React re-render.
   */
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  /** Ref to the latest normalised [0, 1] microphone RMS volume. */
  inputVolumeRef: React.MutableRefObject<number>;
  /** Whether a live session is currently running. Controls idle vs. active animation. */
  isActive: boolean;
  /** CSS colour string for the active glow (passed from the selected language theme). */
  color: string;
}

const Visualizer = memo<VisualizerProps>(({ analyserRef, inputVolumeRef, isActive, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const requestRef = useRef<number | null>(null);
  const particlesRef = useRef<Array<{x: number, y: number, r: number, vx: number, vy: number}>>([]);
  const colorRef = useRef<string>(color);
  // Reusable typed array for analyser data — allocated once per analyser fftSize
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const prefersReducedMotionRef = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Sync color into a ref so the animation loop reads the latest value without
  // being restarted on every color change.
  useEffect(() => { colorRef.current = color; }, [color]);

  // Initialize particles
  useEffect(() => {
      const canvas = canvasRef.current;
      const w = canvas ? canvas.width : 300;
      const h = canvas ? canvas.height : 300;
      particlesRef.current = Array.from({ length: 20 }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
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
        if (prefersReducedMotionRef.current) {
            // Static ring — no animation loop
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 40, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
            ctx.fill();
            return; // Do not schedule next frame
        }

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

    // Sample output volume from the AnalyserNode each frame — no React state
    // involved, so volume changes never trigger a re-render.
    const analyser = analyserRef.current;
    let outputVol = 0;
    if (analyser) {
      if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      analyser.getByteFrequencyData(dataArrayRef.current);
      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i];
      outputVol = sum / dataArrayRef.current.length / 255;
    }
    // Prefer input volume (user speaking) over output volume (AI speaking).
    // The 0.05 threshold ignores microphone noise floor so the visualizer
    // reacts to the AI when the user is silent.
    const currentVol = inputVolumeRef.current > 0.05 ? inputVolumeRef.current : outputVol;
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

    // Draw orbiting particles — hoist shared canvas state outside the loop to
    // avoid redundant assignments on every particle (20× per frame).
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.5 + currentVol, 1)})`;
    particlesRef.current.forEach((p) => {
        p.x += p.vx * scale;
        p.y += p.vy * scale;

        // Bounce off walls (virtual box), clamp position to stay in bounds
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        else if (p.x > canvas.width) { p.x = canvas.width; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        else if (p.y > canvas.height) { p.y = canvas.height; p.vy = -Math.abs(p.vy); }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * scale, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw spokes from each particle to the centre when volume is loud enough
    // (> 0.3) to add a dynamic "active" feel at higher volumes. Batch all 20
    // spokes into a single path + stroke call instead of 20 separate strokes.
    if (currentVol > 0.3) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        particlesRef.current.forEach((p) => {
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
    }

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
      >
        {isActive ? 'Audio visualizer — conversation is active' : 'Audio visualizer — idle'}
      </canvas>
    </div>
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;
