import React, { useState, useCallback, memo } from 'react';
import { Sparkles, Wand2, Command, AlertCircle, Info, RotateCcw, RotateCw, History, UserSquare2 } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { ComparisonView } from './components/ComparisonView';
import { generateEditedImage } from './services/geminiService';
import { ProcessedImage, AppStatus } from './types';

// Static data moved outside component to prevent recreation
const PRESET_PROMPTS = [
  "Remove the background",
  "Turn this into a sketch",
  "Add a cyberpunk neon filter",
  "Make it look like a vintage photo",
] as const;

const PASSPORT_PROMPT = "Convert this into a professional passport photo: solid white background, center the subject, crop to head and shoulders, ensure even lighting, and make it look professional.";

const App: React.FC = () => {
  // History management
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derived state
  const currentImage = history[historyIndex] || null;
  const originalImage = history[0] || null;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleImageSelected = useCallback((image: ProcessedImage | null) => {
    if (image) {
      setHistory([image]);
      setHistoryIndex(0);
      setStatus(AppStatus.READY_TO_EDIT);
    } else {
      setHistory([]);
      setHistoryIndex(-1);
      setStatus(AppStatus.IDLE);
    }
    setErrorMsg(null);
    setPrompt('');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) return;
    if (!prompt.trim()) return;

    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);

    try {
      const result = await generateEditedImage(currentImage.data, currentImage.mimeType, prompt);

      if (result) {
        const newImage: ProcessedImage = {
          data: result,
          mimeType: 'image/png'
        };

        // Add to history, removing any future redo states if we were in the middle
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newImage);

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setStatus(AppStatus.COMPLETED);
      } else {
        throw new Error("Failed to generate image. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong. Please try a different prompt or image.");
      setStatus(AppStatus.ERROR);
    }
  }, [currentImage, prompt, history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      setErrorMsg(null);
    }
  }, [canUndo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      setErrorMsg(null);
    }
  }, [canRedo]);

  const handleDownload = useCallback(() => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.data;
    link.download = `nano-edit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentImage]);

  const handlePresetClick = useCallback((text: string) => {
    setPrompt(text);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-200 selection:text-brand-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              NanoEdit AI
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Info className="w-3.5 h-3.5" />
            <span>Powered by Gemini</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Intro Section - Only show if no history */}
        {history.length === 0 && (
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Edit images with <span className="text-brand-600">Magic</span>
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Simply upload an image and tell our AI how to change it. Remove backgrounds, add effects, or transform your photos.
            </p>
          </div>
        )}

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column: Controls (Upload + Input) */}
          <div className={`flex flex-col gap-6 ${historyIndex > 0 ? 'lg:col-span-4' : 'lg:col-span-6 lg:col-start-4'}`}>

            {/* Upload Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                  1. Upload Image
                </h3>
                {history.length > 0 && (
                  <span className="text-xs text-slate-500">Original Source</span>
                )}
              </div>
              <ImageUploader
                onImageSelected={handleImageSelected}
                currentImage={originalImage}
              />
            </div>

            {/* Prompt Area - Only visible if image is uploaded */}
            {originalImage && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    2. Describe Changes
                  </h3>

                  {/* History Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Undo"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-slate-400 select-none">
                      {historyIndex + 1}/{history.length}
                    </span>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Redo"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder={historyIndex === 0
                      ? "E.g., 'Remove the person in the background' or 'Make it look vintage'"
                      : "Describe the next change..."}
                    className="w-full p-4 text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none bg-transparent rounded-lg text-base"
                    rows={3}
                  />
                  <div className="px-2 pb-2 flex justify-between items-center gap-2">
                    <span className="text-xs text-slate-400 pl-2 hidden sm:block">
                      Be descriptive
                    </span>
                    <div className="flex gap-2 ml-auto w-full sm:w-auto">
                      <Button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || status === AppStatus.PROCESSING}
                        isLoading={status === AppStatus.PROCESSING}
                        className="flex-1 sm:flex-initial rounded-lg shadow-sm"
                        leftIcon={<Wand2 className="w-4 h-4" />}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Command className="w-3 h-3" /> Quick actions:
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Passport Photo Button */}
                    <button
                      onClick={() => handlePresetClick(PASSPORT_PROMPT)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-xs sm:text-sm font-medium col-span-2"
                    >
                      <UserSquare2 className="w-4 h-4" />
                      Passport Photo
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PRESET_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handlePresetClick(p)}
                        className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700 animate-fadeIn">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Generation Failed</p>
                      <p className="text-sm opacity-90">{errorMsg}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Results (Only visible if we have a result beyond original) */}
          {historyIndex > 0 && currentImage && originalImage && (
            <div className="lg:col-span-8 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full">
                <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm">
                  <History className="w-4 h-4" />
                  <span>Viewing step {historyIndex} of {history.length - 1}</span>
                </div>
                <ComparisonView
                  originalImage={originalImage.data}
                  processedImage={currentImage.data}
                  processedMimeType={currentImage.mimeType}
                  onDownload={handleDownload}
                />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Basic Footer */}
      <footer className="border-t border-slate-200 mt-auto py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>&copy; {new Date().getFullYear()} NanoEdit AI. Built with React & Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
