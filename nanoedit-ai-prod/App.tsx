import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Wand2, Command, AlertCircle, Info, RotateCcw, RotateCw, History, UserSquare2, Scissors, Sun, PenLine, Zap, Film, X, CheckCircle2 } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { ComparisonView } from './components/ComparisonView';
import { generateEditedImage } from './services/geminiService';
import { ProcessedImage, AppStatus } from './types';

// Static data moved outside component to prevent recreation
const PRESET_PROMPTS = [
  { text: "Remove the background", Icon: Scissors },
  { text: "Enhance colors and brightness", Icon: Sun },
  { text: "Turn this into a sketch", Icon: PenLine },
  { text: "Add a cyberpunk neon filter", Icon: Zap },
  { text: "Make it look like a vintage photo", Icon: Film },
  { text: "Remove blemishes and smooth skin", Icon: Sparkles },
] as const;

const PASSPORT_PROMPT = "Convert this into a professional passport photo: solid white background, center the subject, crop to head and shoulders, ensure even lighting, and make it look professional.";

const FEATURES = ["Background Removal", "Portrait Retouching", "Artistic Filters", "Passport Photos", "Color Enhancement"];

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Root application component for NanoEdit AI.
 *
 * Manages a linear edit history (undo/redo) so each AI generation appends a
 * new `ProcessedImage` entry. The first entry is always the original upload;
 * subsequent entries are AI-generated PNG results.
 *
 * Key state:
 * - `history` / `historyIndex` — navigable list of image versions
 * - `prompt` — current textarea value
 * - `status` — `AppStatus` enum driving UI state (idle → ready → processing → completed/error)
 */
const App: React.FC = () => {
  // History management
  const [history, setHistory] = useState<ProcessedImage[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const downloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (downloadTimerRef.current !== null) {
        clearTimeout(downloadTimerRef.current);
      }
    };
  }, []);

  // Derived state
  const currentImage = history[historyIndex] || null;
  const originalImage = history[0] || null;
  const canUndo = historyIndex > 0 && status !== AppStatus.PROCESSING;
  const canRedo = historyIndex < history.length - 1 && status !== AppStatus.PROCESSING;

  /** Resets history to a single entry when a new image is selected, or clears state when removed. */
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

  /**
   * Sends the current image and prompt to the AI service.
   * On success, appends the result to history (truncating any future redo states).
   */
  const handleGenerate = useCallback(async () => {
    if (!currentImage) return;
    if (!prompt.trim()) return;
    if (status === AppStatus.PROCESSING) return;

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
        setPrompt('');
      } else {
        throw new Error("Failed to generate image. Please try again.");
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try a different prompt or image.";
      setErrorMsg(message);
      setStatus(AppStatus.ERROR);
    }
  }, [currentImage, prompt, history, historyIndex, status]);

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

  /** Triggers a browser download of the current image and briefly shows a success toast. */
  const handleDownload = useCallback(() => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.data;
    link.download = `nano-edit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    if (downloadTimerRef.current !== null) clearTimeout(downloadTimerRef.current);
    downloadTimerRef.current = setTimeout(() => setDownloadSuccess(false), 2500);
  }, [currentImage]);

  const handlePresetClick = useCallback((text: string) => {
    setPrompt(text);
  }, []);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  }, [handleGenerate]);

  const handleClearPrompt = useCallback(() => {
    setPrompt('');
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-brand-200 selection:text-brand-900">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              NanoEdit AI
            </h1>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Powered by </span><span>Gemini</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Intro Section - Only show if no history */}
        {history.length === 0 && (
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              AI Image Editor — Edit Photos with <span className="text-brand-600">Natural Language</span>
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              Upload any photo and describe what you want. Remove backgrounds, enhance colors, create passport photos, retouch portraits, or apply artistic effects — all in seconds with Google Gemini AI.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {FEATURES.map((feat) => (
                <span key={feat} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium shadow-sm">
                  {feat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column: Controls (Upload + Input) */}
          <div className={`flex flex-col gap-6 ${historyIndex > 0 ? 'lg:col-span-4' : 'lg:col-span-6 lg:col-start-4'}`}>

            {/* Upload Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">1</span>
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Upload Image</h2>
                </div>
                {history.length > 0 && (
                  <span className="text-xs text-slate-500">Original Source</span>
                )}
              </div>
              <ImageUploader
                onImageSelected={handleImageSelected}
                currentImage={originalImage}
                isProcessing={status === AppStatus.PROCESSING}
              />
            </div>

            {/* Prompt Area - Only visible if image is uploaded */}
            {originalImage && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">2</span>
                    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Describe Changes</h2>
                  </div>

                  {/* History Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Undo"
                      aria-label="Undo"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <span className="text-xs text-slate-400 select-none" aria-label={`Step ${historyIndex + 1} of ${history.length}`}>
                      {historyIndex + 1} of {history.length}
                    </span>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Redo"
                      aria-label="Redo"
                    >
                      <RotateCw className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all">
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={handlePromptChange}
                      aria-label="Describe the image changes you want"
                      aria-describedby="prompt-hint"
                      onKeyDown={handleKeyDown}
                      placeholder={historyIndex === 0
                        ? "E.g., 'Remove the person in the background' or 'Make it look vintage'"
                        : "Describe the next change..."}
                      className="w-full p-4 pr-10 text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none bg-transparent rounded-lg text-base"
                      rows={3}
                    />
                    {prompt && (
                      <button
                        onClick={handleClearPrompt}
                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        aria-label="Clear prompt"
                        tabIndex={-1}
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="px-2 pb-2 flex justify-between items-center gap-2">
                    {status === AppStatus.PROCESSING ? (
                      <span className="text-xs text-brand-600 pl-2 flex items-center gap-1.5 animate-pulse" role="status" aria-live="polite">
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        Generating your edit…
                      </span>
                    ) : (
                      <span id="prompt-hint" className="text-xs text-slate-400 pl-2 flex items-center gap-2">
                        <span className="hidden sm:inline">
                          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono">Enter</kbd> to generate
                        </span>
                        {prompt.length > 0 && (
                          <span className="tabular-nums">{prompt.length} chars</span>
                        )}
                      </span>
                    )}
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
                <div className="space-y-2.5" role="group" aria-label="Quick action prompts">
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Command className="w-3 h-3" aria-hidden="true" /> Try a quick action:
                  </p>

                  {/* Passport Photo — full-width featured action */}
                  <button
                    onClick={() => handlePresetClick(PASSPORT_PROMPT)}
                    aria-pressed={prompt === PASSPORT_PROMPT}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg transition-colors text-sm font-medium ${prompt === PASSPORT_PROMPT ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}
                  >
                    <UserSquare2 className="w-4 h-4" />
                    Passport Photo
                  </button>

                  <div className="flex flex-wrap gap-2">
                    {PRESET_PROMPTS.map(({ text, Icon }) => {
                      const isActive = prompt === text;
                      return (
                        <button
                          key={text}
                          onClick={() => handlePresetClick(text)}
                          aria-pressed={isActive}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-full transition-colors ${isActive ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200'}`}
                        >
                          <Icon className="w-3 h-3" aria-hidden="true" />
                          {text}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div role="alert" className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700 animate-fadeIn">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Unable to generate — try again</p>
                      <p className="text-sm opacity-90">{errorMsg}</p>
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim()}
                      className="flex-shrink-0 text-xs font-medium px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Retry
                    </button>
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
                  <History className="w-4 h-4" aria-hidden="true" />
                  <span>Version {historyIndex} of {history.length - 1}</span>
                </div>
                <ComparisonView
                  originalImage={originalImage.data}
                  processedImage={currentImage.data}
                  processedMimeType={currentImage.mimeType}
                  onDownload={handleDownload}
                  isProcessing={status === AppStatus.PROCESSING}
                />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Download toast */}
      {downloadSuccess && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl shadow-lg animate-fadeIn text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          Image downloaded!
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-auto py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            NanoEdit AI is a free AI-powered image editor. Remove backgrounds, retouch portraits, create passport photos, and apply artistic filters — all with simple text prompts.
          </p>
          <p className="text-slate-400 text-xs">
            &copy; {CURRENT_YEAR} NanoEdit AI &middot; Powered by Google Gemini &middot; Free online photo editor
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
