import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { PassportImage } from '../types';

interface Props {
  onImageSelected: (img: PassportImage | null) => void;
  currentImage: PassportImage | null;
}

// Theme constants
const THEME = {
  accentPink: '#E94560',
  accentGold: '#F4A261',
  accentPurple: '#9D4EDD',
} as const;

export const ImageUploader = memo<Props>(({ onImageSelected, currentImage }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImageSelected({ data: reader.result, mimeType: file.type || 'image/jpeg' });
      }
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } } 
      });
      streamRef.current = stream;
      setCameraMode(true);
      
      // Wait for video element to mount
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err?.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera permissions.');
      } else if (err?.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Unable to access camera.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraMode(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    
    onImageSelected({ data: dataUrl, mimeType: 'image/jpeg' });
    stopCamera();
  }, [onImageSelected, stopCamera]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files?.[0] || null); }, [handleFile]);
  const handleClear = useCallback(() => onImageSelected(null), [onImageSelected]);

  const { accentPink, accentGold, accentPurple } = THEME;

  // Show captured/uploaded image
  if (currentImage) {
    return (
      <div style={{ 
        position: 'relative', borderRadius: 20, overflow: 'hidden', 
        border: '1px solid rgba(255,255,255,0.1)', 
        background: '#0D0D0D',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`
      }}>
        <img src={currentImage.data} alt="Preview" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }} />
        <button
          onClick={handleClear}
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${accentPink}, ${accentGold})`,
            border: 'none',
            color: '#fff', cursor: 'pointer', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 16px ${accentPink}44`,
            transition: 'transform 0.2s'
          }}
        >×</button>
      </div>
    );
  }

  // Camera mode
  if (cameraMode) {
    return (
      <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0D0D0D' }}>
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }}
          />
          {/* Face guide overlay */}
          <div style={{ 
            position: 'absolute', inset: 0, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{ 
              width: 150, height: 190, 
              border: `2px dashed ${accentGold}88`, 
              borderRadius: 75,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)'
            }} />
          </div>
          <div style={{
            position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            padding: '6px 14px', borderRadius: 20, fontSize: 12, color: accentGold
          }}>
            Align face within guide
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10, padding: 16, background: 'rgba(13,13,13,0.8)' }}>
          <button
            onClick={stopCamera}
            style={{
              flex: 1, padding: '14px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: 'rgba(255,255,255,0.6)', fontWeight: 500, cursor: 'pointer',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            style={{
              flex: 2, padding: '14px', borderRadius: 12,
              border: 'none', background: `linear-gradient(135deg, ${accentPink}, ${accentGold})`,
              color: '#fff', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: `0 8px 24px ${accentPink}33`,
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            📸 Capture
          </button>
        </div>
      </div>
    );
  }

  // Default upload view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          border: isDragging ? `2px dashed ${accentGold}` : '2px dashed rgba(255,255,255,0.15)',
          borderRadius: 20, padding: '48px 20px',
          textAlign: 'center', cursor: 'pointer',
          background: isDragging ? `${accentGold}08` : 'rgba(255,255,255,0.02)',
          transition: 'all 0.3s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        <div style={{ 
          width: 72, height: 72, borderRadius: 20, 
          background: `linear-gradient(135deg, ${accentPink}22, ${accentGold}22)`,
          border: `1px solid ${accentPink}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          fontSize: 28
        }}>
          📁
        </div>
        <p style={{ color: '#F8F8F8', fontWeight: 600, marginBottom: 6, fontFamily: "'Syne', sans-serif" }}>
          Drop your photo here
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>or click to browse files</p>
      </div>

      <button
        onClick={startCamera}
        style={{
          padding: '16px', borderRadius: 14,
          border: `1px solid ${accentPurple}44`, background: `${accentPurple}11`,
          color: accentPurple, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'all 0.3s ease',
          fontFamily: "'Space Grotesk', sans-serif"
        }}
      >
        📷 Take Photo
      </button>

      {cameraError && (
        <p style={{ color: accentPink, fontSize: 12, textAlign: 'center', marginTop: 4 }}>{cameraError}</p>
      )}
    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';
