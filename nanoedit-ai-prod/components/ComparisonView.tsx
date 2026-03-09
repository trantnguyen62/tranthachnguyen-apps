/**
 * Side-by-side before/after comparison view for AI-edited images.
 * Supports fullscreen mode, a loading overlay while a new edit is generating,
 * and video output when the processed result is a video MIME type.
 */
import React, { useState, useEffect, memo } from 'react';
import { Download, Maximize2, Minimize2, ArrowRight, Play, Loader2, Sparkles } from 'lucide-react';

interface ComparisonViewProps {
  originalImage: string;
  processedImage: string;
  processedMimeType?: string;
  onDownload: () => void;
  isProcessing?: boolean;
}

export const ComparisonView = memo<ComparisonViewProps>(({
  originalImage,
  processedImage,
  processedMimeType = 'image/png',
  onDownload,
  isProcessing = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isVideo = processedMimeType.startsWith('video/');

  // Close fullscreen on Escape key press
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <div
      className={`transition-all duration-500 ease-in-out ${isExpanded ? 'fixed inset-0 z-50 bg-slate-900/95 p-4 overflow-y-auto' : 'w-full'}`}
      {...(isExpanded ? { role: 'dialog', 'aria-modal': true, 'aria-label': 'Fullscreen image comparison' } : {})}
    >
      
      {isExpanded && (
        <div className="fixed top-4 right-4 z-50">
           <button
            onClick={() => setIsExpanded(false)}
            className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-sm"
            aria-label="Exit fullscreen"
          >
            <Minimize2 className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className={`flex flex-col ${isExpanded ? 'h-full justify-center' : ''} gap-6`}>
        
        {!isExpanded && (
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-slate-800">Result</h3>
            <div className="flex gap-2">
               <button
                onClick={() => setIsExpanded(true)}
                className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                title="Fullscreen"
                aria-label="View fullscreen"
              >
                <Maximize2 className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                onClick={onDownload}
                aria-label="Download edited image"
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm text-sm font-medium"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                Download
              </button>
            </div>
          </div>
        )}

        <div className={`grid ${isExpanded ? 'grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
          
          {/* Original */}
          <div className="space-y-3">
             <div className={`relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm ${isExpanded ? 'h-[50vh] lg:h-[80vh]' : 'h-64 sm:h-80 md:h-96'}`}>
               <img
                 src={originalImage}
                 alt="Original image before editing"
                 className="w-full h-full object-contain"
               />
               <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-semibold tracking-wide" aria-hidden="true">
                 BEFORE
               </div>
             </div>
          </div>

          {/* Mobile separator */}
          <div className="lg:hidden flex items-center gap-3 text-xs font-medium text-slate-500" aria-hidden="true">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" /> AI Result
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Processed (Image or Video) */}
          <div className="space-y-3 relative">
             <div className={`relative rounded-xl overflow-hidden border-2 bg-slate-100 shadow-xl transition-colors ${isProcessing ? 'border-slate-300' : 'border-brand-500'} ${isExpanded ? 'h-[50vh] lg:h-[80vh]' : 'h-64 sm:h-80 md:h-96'}`}>
               {isVideo ? (
                 <video
                    src={processedImage}
                    controls
                    autoPlay
                    loop
                    aria-label="AI-processed result video"
                    className="w-full h-full object-contain bg-black"
                 />
               ) : (
                 <img
                   src={processedImage}
                   alt="AI-processed result"
                   className={`w-full h-full object-contain transition-opacity duration-300 ${isProcessing ? 'opacity-30' : 'opacity-100'}`}
                 />
               )}

               {isProcessing && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" role="status" aria-live="polite">
                   <Loader2 className="w-8 h-8 text-brand-600 animate-spin" aria-hidden="true" />
                   <span className="text-xs font-medium text-slate-600 bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm">
                     Generating new edit…
                   </span>
                 </div>
               )}

               <div className="absolute bottom-4 left-4 px-3 py-1 bg-brand-600/90 backdrop-blur-md rounded-full text-white text-xs font-semibold tracking-wide shadow-lg flex items-center gap-1" aria-hidden="true">
                 {isVideo ? <Play className="w-3 h-3 fill-current" /> : <Sparkles className="w-3 h-3" />}
                 {isVideo ? 'VIDEO RESULT' : 'AFTER'}
               </div>
             </div>
             
             {/* Mobile Indicator arrow between images if stacked */}
             <div className="hidden lg:block absolute top-1/2 -left-3 -translate-y-1/2 -translate-x-1/2 z-10 bg-white rounded-full p-1 shadow-md border border-slate-200" aria-hidden="true">
                <ArrowRight className="w-4 h-4 text-slate-400" />
             </div>
          </div>
        </div>

        {isExpanded && (
           <div className="flex justify-center mt-6">
             <button
                onClick={onDownload}
                aria-label="Download edited image"
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors shadow-lg text-lg font-medium"
              >
                <Download className="w-5 h-5" />
                Download Result
              </button>
           </div>
        )}
      </div>
    </div>
  );
});

ComparisonView.displayName = 'ComparisonView';
