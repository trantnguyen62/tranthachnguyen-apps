import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { PassportImage } from '../types';

interface Props {
  image: PassportImage;
  onSave: (img: PassportImage) => void;
  onCancel: () => void;
}

// Background color options
const BG_COLORS = ['#FFFFFF', '#F5F5F5', '#E8E8E8', '#DCE8F0'] as const;
const BG_COLOR_NAMES: Record<string, string> = {
  '#FFFFFF': 'White',
  '#F5F5F5': 'Light gray',
  '#E8E8E8': 'Gray',
  '#DCE8F0': 'Light blue',
};

const createPassport = (imgUrl: string, bg: string, b: number, c: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Failed to load image'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 750;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 600, 750);

      const ratio = 600 / 750;
      const imgRatio = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (imgRatio > ratio) {
        sw = img.height * ratio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / ratio;
        sy = (img.height - sh) * 0.25;
      }

      ctx.filter = `brightness(${b}%) contrast(${c}%)`;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 600, 750);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = imgUrl;
  });

export const PhotoEditor = memo<Props>(({ image, onSave, onCancel }) => {
  const [step, setStep] = useState<'idle' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(105);
  const [contrast, setContrast] = useState(108);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const removedBgRef = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const process = useCallback(async () => {
    setStep('processing');
    setProcessError(null);
    setProgress(10);
    
    try {
      const blob = await fetch(image.data).then(r => r.blob());
      setProgress(30);
      
      const { removeBackground } = await import('@imgly/background-removal');
      const removed = await removeBackground(blob, {
        progress: (_, cur, total) => setProgress(30 + Math.round((cur / total) * 50)),
      });
      
      if (removedBgRef.current) URL.revokeObjectURL(removedBgRef.current);
      const url = URL.createObjectURL(removed);
      removedBgRef.current = url;
      setProgress(90);
      
      const passport = await createPassport(url, bgColor, brightness, contrast);
      setResult(passport);
      setProgress(100);
      setStep('done');
    } catch (e) {
      console.error(e);
      setStep('idle');
      setProcessError('Background removal failed. Please try again with a different image.');
    }
  }, [image, bgColor, brightness, contrast]);

  useEffect(() => {
    if (step === 'done' && removedBgRef.current) {
      const id = setTimeout(() => {
        createPassport(removedBgRef.current!, bgColor, brightness, contrast).then(setResult);
      }, 150);
      return () => clearTimeout(id);
    }
  }, [bgColor, brightness, contrast, step]);

  useEffect(() => () => { if (removedBgRef.current) URL.revokeObjectURL(removedBgRef.current); }, []);

  // Focus management: focus close button on open, return focus on close
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const closeBtn = dialogRef.current?.querySelector<HTMLElement>('button[aria-label="Close editor"]');
    closeBtn?.focus();
    return () => { previousFocus?.focus(); };
  }, []);

  // Tab trap within dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCancel(); return; }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSave = useCallback(() => {
    if (result) onSave({ data: result, mimeType: 'image/jpeg' });
  }, [result, onSave]);

  const handleBrightnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBrightness(+e.target.value);
  }, []);

  const handleContrastChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContrast(+e.target.value);
  }, []);

  const accentPink = '#E94560';
  const accentGold = '#F4A261';
  const accentPurple = '#9D4EDD';

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="editor-title" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'rgba(17,17,17,0.95)', borderRadius: 24, width: '90%', maxWidth: 700, padding: 28, border: '1px solid rgba(255,255,255,0.08)', boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 id="editor-title" style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, background: `linear-gradient(135deg, #fff 0%, ${accentGold} 60%, ${accentPink} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Photo Studio</h2>
          <button onClick={onCancel} aria-label="Close editor" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Original</p>
            <img src={image.data} alt="Original photo" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#10B981', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Result</p>
            {result ? (
              <img src={result} alt="Processed passport photo" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }} />
            ) : (
              <div style={{ height: 200, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                Click "Auto-Fix" to start
              </div>
            )}
          </div>
        </div>

        {step === 'processing' && (
          <div style={{ background: `linear-gradient(135deg, ${accentPurple}15, ${accentPink}08)`, border: `1px solid ${accentPurple}33`, borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 }}>
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Processing progress"
                style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${accentPurple}, ${accentPink})`, transition: 'width 0.3s', borderRadius: 2 }}
              />
            </div>
            <p style={{ fontSize: 12, color: accentPurple, textAlign: 'center', fontWeight: 500 }}>Processing... {progress}%</p>
          </div>
        )}

        {processError && (
          <div role="alert" style={{ background: `${accentPink}15`, border: `1px solid ${accentPink}44`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: accentPink }}>
            {processError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Background</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  disabled={step !== 'done'}
                  aria-label={`Background color: ${BG_COLOR_NAMES[c]}`}
                  aria-pressed={bgColor === c}
                  style={{ width: 30, height: 30, borderRadius: 8, background: c, border: bgColor === c ? `2px solid ${accentPurple}` : '2px solid rgba(255,255,255,0.15)', cursor: step === 'done' ? 'pointer' : 'not-allowed', transition: 'border-color 0.2s', boxShadow: bgColor === c ? `0 0 0 3px ${accentPurple}33` : 'none' }}
                />
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="brightness-range" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, display: 'block', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Brightness: {brightness}%</label>
            <input id="brightness-range" type="range" min="90" max="120" value={brightness} onChange={handleBrightnessChange} disabled={step !== 'done'} style={{ width: '100%', accentColor: accentGold }} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="contrast-range" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, display: 'block', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Contrast: {contrast}%</label>
            <input id="contrast-range" type="range" min="90" max="120" value={contrast} onChange={handleContrastChange} disabled={step !== 'done'} style={{ width: '100%', accentColor: accentGold }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '11px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, transition: 'all 0.2s' }}>Cancel</button>
          {step !== 'done' ? (
            <button onClick={process} disabled={step === 'processing'} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: step === 'processing' ? 'rgba(157,78,221,0.4)' : `linear-gradient(135deg, ${accentPurple}, ${accentPink})`, color: '#fff', fontWeight: 600, cursor: step === 'processing' ? 'not-allowed' : 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: step !== 'processing' ? `0 8px 24px ${accentPurple}44` : 'none', transition: 'all 0.3s' }}>
              {step === 'processing' ? 'Processing...' : 'Auto-Fix'}
            </button>
          ) : (
            <button onClick={handleSave} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10B981, #34D399)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 8px 24px rgba(16,185,129,0.35)', transition: 'all 0.3s' }}>
              Use Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

PhotoEditor.displayName = 'PhotoEditor';


