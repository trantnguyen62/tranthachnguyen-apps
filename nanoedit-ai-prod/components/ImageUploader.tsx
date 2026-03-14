/**
 * Image uploader component with three view states:
 * 1. **Upload** – drag & drop or file picker (default)
 * 2. **Camera** – live camera preview for capturing a photo
 * 3. **Loaded** – displays the selected image with a remove button
 *
 * Accepts PNG, JPEG, and WebP files up to 10 MB.
 */
import React, { useRef, useState, useCallback, useEffect, memo } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { ProcessedImage } from '../types';

interface ImageUploaderProps {
  /** Called with the selected/captured image, or `null` when the image is removed. */
  onImageSelected: (image: ProcessedImage | null) => void;
  /** The image currently displayed in the loaded view; `null` shows the upload/camera UI. */
  currentImage: ProcessedImage | null;
  /** When `true`, the remove button is hidden and the image is dimmed (edit in progress). */
  isProcessing?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DIMENSION = 2048; // Max px on longest side before compressing

/** Resize + compress an image file using canvas, capping the longest side at MAX_DIMENSION. */
const compressImage = (file: File): Promise<{ data: string; mimeType: string }> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const data = outMime === 'image/jpeg'
        ? canvas.toDataURL('image/jpeg', 0.85)
        : canvas.toDataURL('image/png');
      resolve({ data, mimeType: outMime });
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Failed to load image')); };
    img.src = objectUrl;
  });

export const ImageUploader = memo<ImageUploaderProps>(({ onImageSelected, currentImage, isProcessing = false }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Attach stream to video element when camera is open
  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file (PNG, JPEG, WebP).");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size too large. Please upload an image under 10MB.");
      return;
    }

    try {
      const { data, mimeType } = await compressImage(file);
      onImageSelected({ data, mimeType });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file.");
    }
  }, [onImageSelected]);

  const startCamera = useCallback(async () => {
    try {
      // 'environment' prefers the rear camera on mobile; falls back to front camera or webcam.
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setError(null);
    } catch {
      setError("Unable to access camera. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const { videoWidth, videoHeight } = videoRef.current;
    if (!videoWidth || !videoHeight) {
      setError("Camera is not ready yet. Please wait a moment.");
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      // 0.85 quality: good visual fidelity with ~30% smaller file vs. lossless
      const data = canvas.toDataURL('image/jpeg', 0.85);
      onImageSelected({ data, mimeType: 'image/jpeg' });
      stopCamera();
    } else {
      setError('Failed to capture photo. Please try again.');
    }
  }, [onImageSelected, stopCamera]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only clear the drag state when leaving the dropzone entirely, not when
    // moving between child elements inside it.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const clearImage = useCallback(() => {
    onImageSelected(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onImageSelected]);

  // View: Current Image Loaded
  if (currentImage) {
    return (
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group shadow-inner">
        <img
          src={currentImage.data}
          alt="Your uploaded photo"
          className={`w-full h-full object-contain transition-opacity duration-300 ${isProcessing ? 'opacity-40' : 'opacity-100'}`}
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-white/30" aria-hidden="true" />
        )}
        {!isProcessing && (
          <div className="absolute top-2 right-2">
            <button
              onClick={clearImage}
              className="p-1.5 bg-white/80 backdrop-blur-sm text-slate-700 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
              title="Remove image"
              aria-label="Remove image"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs text-white font-medium">
          Original Image
        </div>
      </div>
    );
  }

  // View: Camera Open
  if (isCameraOpen) {
    return (
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-black rounded-xl overflow-hidden flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Camera preview"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Camera Overlay Controls */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={stopCamera}
            className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-sm transition-colors"
            aria-label="Close camera"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-8">
           <button
             onClick={stopCamera}
             className="text-white text-sm font-medium px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
             aria-label="Cancel and close camera"
           >
             Cancel
           </button>

           <button
             onClick={capturePhoto}
             className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
             aria-label="Take photo"
           >
             <div className="w-12 h-12 bg-white rounded-full" aria-hidden="true"></div>
           </button>

           <div className="w-16"></div> {/* Spacer for balance */}
        </div>
      </div>
    );
  }

  // View: Upload / Start Camera
  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload image — click or drag and drop"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          group relative w-full h-64 sm:h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
          ${isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50/40'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleChange}
          aria-hidden="true"
          tabIndex={-1}
        />
        
        <div className="flex flex-col items-center p-6 text-center space-y-6 z-10">
          <div className="space-y-2">
            <div
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${isDragging ? 'bg-brand-200 text-brand-600' : 'bg-slate-100 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500'}`}
            >
              <Upload className="w-8 h-8" aria-hidden="true" />
            </div>
            <p className="text-lg font-semibold text-slate-700">
              {isDragging ? 'Drop it here!' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-slate-500">
              PNG, JPG, WebP (Max 10MB)
            </p>
          </div>

          <div className="flex items-center w-full max-w-xs" aria-hidden="true">
            <div className="flex-grow h-px bg-slate-200"></div>
            <span className="px-3 text-xs font-medium text-slate-500 uppercase">Or</span>
            <div className="flex-grow h-px bg-slate-200"></div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); startCamera(); }}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm font-medium text-sm"
            aria-label="Take a photo using your camera"
          >
            <Camera className="w-4 h-4" aria-hidden="true" />
            Take a Photo
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2" aria-hidden="true"></span>
          {error}
        </p>
      )}
    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';