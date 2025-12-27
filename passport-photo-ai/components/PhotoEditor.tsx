import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { PassportImage } from '../types';

interface Props {
  image: PassportImage;
  onSave: (img: PassportImage) => void;
  onCancel: () => void;
}

// Background color options
const BG_COLORS = ['#FFFFFF', '#F5F5F5', '#E8E8E8', '#DCE8F0'] as const;

export const PhotoEditor = memo<Props>(({ image, onSave, onCancel }) => {
  const [step, setStep] = useState<'idle' | 'processing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(105);
  const [contrast, setContrast] = useState(108);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const removedBgRef = useRef<string | null>(null);

  const createPassport = async (imgUrl: string, bg: string, b: number, c: number) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
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
  };

  const process = useCallback(async () => {
    setStep('processing');
    setProgress(10);
    
    try {
      const img = new Image();
      img.src = image.data;
      await new Promise((r) => img.onload = r);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      
      const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
      setProgress(30);
      
      const removed = await removeBackground(blob, {
        progress: (_, cur, total) => setProgress(30 + Math.round((cur / total) * 50)),
      });
      
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
    }
  }, [image, bgColor, brightness, contrast]);

  useEffect(() => {
    if (step === 'done' && removedBgRef.current) {
      createPassport(removedBgRef.current, bgColor, brightness, contrast).then(setResult);
    }
  }, [bgColor, brightness, contrast, step]);

  useEffect(() => () => { if (removedBgRef.current) URL.revokeObjectURL(removedBgRef.current); }, []);

  const handleSave = useCallback(() => {
    if (result) onSave({ data: result, mimeType: 'image/jpeg' });
  }, [result, onSave]);

  const handleBrightnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBrightness(+e.target.value);
  }, []);

  const handleContrastChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContrast(+e.target.value);
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#111', borderRadius: 16, width: '90%', maxWidth: 700, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2>🎨 AI Photo Studio</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>ORIGINAL</p>
            <img src={image.data} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: '#10B981', marginBottom: 8 }}>RESULT</p>
            {result ? (
              <img src={result} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }} />
            ) : (
              <div style={{ height: 200, background: '#222', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                Click "Auto-Fix" to start
              </div>
            )}
          </div>
        </div>

        {step === 'processing' && (
          <div style={{ background: 'rgba(0,217,255,0.1)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ height: 4, background: '#333', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#00D9FF', transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: 12, color: '#00D9FF', textAlign: 'center' }}>Processing... {progress}%</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Background</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  disabled={step !== 'done'}
                  style={{ width: 28, height: 28, borderRadius: 6, background: c, border: bgColor === c ? '2px solid #00D9FF' : '2px solid transparent', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Brightness: {brightness}%</p>
            <input type="range" min="90" max="120" value={brightness} onChange={handleBrightnessChange} disabled={step !== 'done'} style={{ width: '100%' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Contrast: {contrast}%</p>
            <input type="range" min="90" max="120" value={contrast} onChange={handleContrastChange} disabled={step !== 'done'} style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #444', background: 'transparent', color: '#888', cursor: 'pointer' }}>Cancel</button>
          {step !== 'done' ? (
            <button onClick={process} disabled={step === 'processing'} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#8B5CF6', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              {step === 'processing' ? '⏳ Processing...' : '✨ Auto-Fix'}
            </button>
          ) : (
            <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              ✓ Use Photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

PhotoEditor.displayName = 'PhotoEditor';


