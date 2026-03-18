import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { PassportImage } from '../types';
import { THEME } from '../theme';

interface Props {
  /** The original photo to process. */
  image: PassportImage;
  /** Called with the processed passport photo when the user clicks "Use Photo". */
  onSave: (img: PassportImage) => void;
  /** Called when the user cancels without saving. */
  onCancel: () => void;
}

// Cache the background-removal module import so it's only fetched once per session
let bgRemovalPromise: Promise<typeof import('@imgly/background-removal')> | null = null;
const getBgRemoval = () => {
  if (!bgRemovalPromise) bgRemovalPromise = import('@imgly/background-removal');
  return bgRemovalPromise;
};

// Background color options
const BG_COLORS = ['#FFFFFF', '#F5F5F5', '#E8E8E8', '#DCE8F0'] as const;
const BG_COLOR_NAMES: Record<string, string> = {
  '#FFFFFF': 'White',
  '#F5F5F5': 'Light gray',
  '#E8E8E8': 'Gray',
  '#DCE8F0': 'Light blue',
};

/**
 * Renders a passport-sized image (600×750 px) from a source URL.
 *
 * The source is center-cropped to the 4:5 aspect ratio. When the source is
 * taller than wide, the crop window is shifted 25% down from the top
 * (`sy = (h - sh) * 0.25`) so the face stays centred rather than being cut
 * off at the chin.
 *
 * @param imgUrl - Object URL or data URL of the (background-removed) photo.
 * @param bg     - CSS fill colour for the passport background (e.g. `"#FFFFFF"`).
 * @param b      - Brightness percentage applied via `ctx.filter` (90–120).
 * @param c      - Contrast percentage applied via `ctx.filter` (90–120).
 * @returns JPEG data URL at quality 0.90 suitable for download or re-use.
 */
const createPassport = (imgUrl: string, bg: string, b: number, c: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Failed to load image'));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 750;
      // alpha:false — background is always a solid fill, skipping alpha channel saves memory
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) { reject(new Error('Canvas 2D context unavailable')); return; }
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
      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      canvas.width = 0; canvas.height = 0; // free backing store
      resolve(dataUrl);
    };
    img.src = imgUrl;
  });

/**
 * Modal dialog for AI-powered background removal and passport photo formatting.
 *
 * State machine: `idle` → (click Auto-Fix) → `processing` → `done`.
 * In the `done` state the user can tweak background colour, brightness, and
 * contrast; every change re-renders the canvas preview via a 400 ms debounce.
 * Background removal runs entirely in the browser via `@imgly/background-removal`.
 */
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

  /**
   * Runs the full processing pipeline:
   * 1. Fetch the image blob from the data URL.
   * 2. Remove the background (tracks library progress at 30–80%).
   * 3. Call `createPassport` with the current settings to produce the result.
   */
  const process = useCallback(async () => {
    setStep('processing');
    setProcessError(null);
    setProgress(10);
    
    try {
      const blob = await fetch(image.data).then(r => r.blob());
      setProgress(30);
      
      const { removeBackground } = await getBgRemoval();
      const removed = await removeBackground(blob, {
        progress: (_, cur, total) => setProgress(30 + (total > 0 ? Math.round((cur / total) * 50) : 0)),
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
    const bgUrl = removedBgRef.current;
    if (step === 'done' && bgUrl) {
      const id = setTimeout(() => {
        createPassport(bgUrl, bgColor, brightness, contrast).then(setResult);
      }, 400);
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

  const handleDownload = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result;
    a.download = 'passport-photo.jpg';
    a.click();
  }, [result]);

  const handleBrightnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBrightness(+e.target.value);
  }, []);

  const handleContrastChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContrast(+e.target.value);
  }, []);

  const { accentPink, accentGold, accentPurple } = THEME;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-title"
      aria-describedby="editor-description"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onCancel}
    >
      <div
        style={{ background: 'rgba(17,17,17,0.95)', borderRadius: 24, width: '90%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: 28, border: '1px solid rgba(255,255,255,0.08)', boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)` }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 id="editor-title" style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, background: `linear-gradient(135deg, #fff 0%, ${accentGold} 60%, ${accentPink} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Photo Studio</h2>
          <p id="editor-description" className="sr-only">Remove the background from your passport photo and adjust brightness and contrast before saving.</p>
          <button onClick={onCancel} aria-label="Close editor" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.75)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
          <div style={{ flex: '1 1 200px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Original</p>
            <img src={image.data} alt="Original passport photo before processing" loading="lazy" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <div style={{ flex: '1 1 200px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#10B981', marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Result</p>
            {result ? (
              <img src={result} alt="Processed passport photo with background removed" loading="lazy" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }} />
            ) : (
              <div style={{ height: 200, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                <span style={{ fontSize: 28, opacity: 0.5 }}>✨</span>
                <span>Click <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Auto-Fix</strong> to start</span>
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
                aria-valuetext={`${progress}% — ${progress <= 10 ? 'Preparing image' : progress <= 30 ? 'Loading AI model' : progress < 80 ? 'Removing background' : progress < 100 ? 'Finalizing' : 'Done'}`}
                style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${accentPurple}, ${accentPink})`, transition: 'width 0.3s', borderRadius: 2 }}
              />
            </div>
            <p aria-hidden="true" style={{ fontSize: 12, color: accentPurple, textAlign: 'center', fontWeight: 500 }}>
              {progress <= 10 ? 'Preparing image…' : progress <= 30 ? 'Loading AI model…' : progress < 80 ? 'Removing background…' : progress < 100 ? 'Finalizing…' : 'Done!'} {progress}%
            </p>
            {progress <= 30 && (
              <p aria-hidden="true" style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 4 }}>
                First-time setup downloads the AI model (~20 MB)
              </p>
            )}
          </div>
        )}

        {processError && (
          <div role="alert" style={{ background: `${accentPink}15`, border: `1px solid ${accentPink}44`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: accentPink }}>
            {processError}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)', alignItems: 'flex-start' }}>
          <fieldset style={{ flexShrink: 0, border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase', padding: 0 }}>Background</legend>
            <div style={{ display: 'flex', gap: 8 }}>
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  disabled={step !== 'done'}
                  aria-label={`Background color: ${BG_COLOR_NAMES[c]}`}
                  aria-pressed={bgColor === c}
                  title={BG_COLOR_NAMES[c]}
                  style={{ width: 30, height: 30, borderRadius: 8, background: c, border: bgColor === c ? `2px solid ${accentPurple}` : '2px solid rgba(255,255,255,0.15)', cursor: step === 'done' ? 'pointer' : 'not-allowed', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: bgColor === c ? `0 0 0 3px ${accentPurple}33` : 'none' }}
                />
              ))}
            </div>
          </fieldset>
          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.06)', borderRadius: 1, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label htmlFor="brightness-range" style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Brightness: {brightness}%</label>
            </div>
            <input id="brightness-range" type="range" min="90" max="120" value={brightness} onChange={handleBrightnessChange} disabled={step !== 'done'} aria-valuetext={`${brightness}%`} style={{ width: '100%', accentColor: accentGold }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <label htmlFor="contrast-range" style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Contrast: {contrast}%</label>
            </div>
            <input id="contrast-range" type="range" min="90" max="120" value={contrast} onChange={handleContrastChange} disabled={step !== 'done'} aria-valuetext={`${contrast}%`} style={{ width: '100%', accentColor: accentGold }} />
          </div>
          {step === 'done' && (brightness !== 105 || contrast !== 108) && (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: -8 }}>
              <button
                onClick={() => { setBrightness(105); setContrast(108); }}
                aria-label="Reset brightness and contrast to defaults"
                title="Reset brightness and contrast to defaults"
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: "'Space Grotesk', sans-serif", textDecoration: 'underline', transition: 'color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)'; }}
              >
                Reset adjustments
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '11px 22px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, transition: 'all 0.2s' }}>Cancel</button>
          {step !== 'done' ? (
            <button onClick={process} disabled={step === 'processing'} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: step === 'processing' ? 'rgba(157,78,221,0.4)' : `linear-gradient(135deg, ${accentPurple}, ${accentPink})`, color: '#fff', fontWeight: 600, cursor: step === 'processing' ? 'not-allowed' : 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: step !== 'processing' ? `0 8px 24px ${accentPurple}44` : 'none', transition: 'all 0.3s' }}>
              {step === 'processing' ? 'Processing...' : 'Auto-Fix'}
            </button>
          ) : (
            <>
              <button onClick={handleDownload} style={{ padding: '11px 22px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
              <button onClick={handleSave} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #10B981, #34D399)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '0 8px 24px rgba(16,185,129,0.35)', transition: 'all 0.3s' }}>
                Use Photo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

PhotoEditor.displayName = 'PhotoEditor';
