import React, { useRef, useState, useCallback, useEffect, memo } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { ProcessedImage } from '../types';

interface ImageUploaderProps {
  onImageSelected: (image: ProcessedImage | null) => void;
  currentImage: ProcessedImage | null;
}

export const ImageUploader = memo<ImageUploaderProps>(({ onImageSelected, currentImage }) => {
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

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file (PNG, JPEG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File size too large. Please upload an image under 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      onImageSelected({
        data,
        mimeType: file.type
      });
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsDataURL(file);
  }, [onImageSelected]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setError(null);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const data = canvas.toDataURL('image/png');
        onImageSelected({
          data,
          mimeType: 'image/png'
        });
        stopCamera();
      }
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    onImageSelected(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // View: Current Image Loaded
  if (currentImage) {
    return (
      <div className="relative w-full h-64 sm:h-80 md:h-96 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group shadow-inner">
        <img 
          src={currentImage.data} 
          alt="Original upload" 
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 right-2">
          <button 
            onClick={clearImage}
            className="p-1.5 bg-white/80 backdrop-blur-sm text-slate-700 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
            title="Remove image"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
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
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Camera Overlay Controls */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={stopCamera}
            className="p-2 bg-black/40 text-white rounded-full hover:bg-black/60 backdrop-blur-sm transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-8">
           <button 
             onClick={stopCamera}
             className="text-white text-sm font-medium px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm"
           >
             Cancel
           </button>
           
           <button 
             onClick={capturePhoto}
             className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 transition-all active:scale-95"
           >
             <div className="w-12 h-12 bg-white rounded-full"></div>
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
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative w-full h-64 sm:h-80 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 ease-in-out
          ${isDragging 
            ? 'border-brand-500 bg-brand-50' 
            : 'border-slate-300 bg-white'
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
        />
        
        <div className="flex flex-col items-center p-6 text-center space-y-6 z-10">
          <div className="space-y-2">
            <div 
              onClick={() => inputRef.current?.click()}
              className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 ${isDragging ? 'bg-brand-200 text-brand-600' : 'bg-slate-100 text-slate-400 hover:bg-brand-50 hover:text-brand-500'}`}
            >
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-slate-700">
              {isDragging ? 'Drop it here!' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-slate-400">
              PNG, JPG, WebP (Max 10MB)
            </p>
          </div>

          <div className="flex items-center w-full max-w-xs">
            <div className="flex-grow h-px bg-slate-200"></div>
            <span className="px-3 text-xs font-medium text-slate-400 uppercase">Or</span>
            <div className="flex-grow h-px bg-slate-200"></div>
          </div>

          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm font-medium text-sm"
          >
            <Camera className="w-4 h-4" />
            Take a Photo
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-2"></span>
          {error}
        </p>
      )}
    </div>
  );
});

ImageUploader.displayName = 'ImageUploader';