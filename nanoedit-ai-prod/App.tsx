import React, { useState, useCallback, useEffect, useRef, lazy, Suspense, memo } from 'react';
import { Sparkles, Wand2, Command, AlertCircle, Info, RotateCcw, RotateCw, History, UserSquare2, Scissors, Sun, PenLine, Zap, Film, X, CheckCircle2 } from 'lucide-react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { generateEditedImage } from './services/geminiService';
import { ProcessedImage, AppStatus } from './types';

// Lazy-load ComparisonView so its code is only downloaded once the user has a result to compare.
const ComparisonView = lazy(() => import('./components/ComparisonView').then(m => ({ default: m.ComparisonView })));

// Each history entry holds a full base64 image string; cap at 10 to avoid excessive memory use.
const MAX_HISTORY = 10;
const PROCESSING_MESSAGE_INTERVAL_SECS = 3;

const PROCESSING_MESSAGES = [
  'Analyzing your image…',
  'Sending to Google Gemini…',
  'Applying your edits…',
  'Generating the result…',
  'Adding finishing touches…',
  'Fine-tuning colors and edges…',
  'Almost there…',
  'Rendering your image…',
  'Waiting for Gemini response…',
  'This one is taking a moment…',
] as const;

// Static data moved outside component to prevent recreation
const PRESET_PROMPTS = [
  { label: "Remove Background", text: "Remove the background", Icon: Scissors },
  { label: "Enhance Colors", text: "Enhance colors and brightness", Icon: Sun },
  { label: "Sketch Effect", text: "Turn this into a sketch", Icon: PenLine },
  { label: "Cyberpunk Filter", text: "Add a cyberpunk neon filter", Icon: Zap },
  { label: "Vintage Look", text: "Make it look like a vintage photo", Icon: Film },
  { label: "Smooth Skin", text: "Remove blemishes and smooth skin", Icon: Sparkles },
] as const;

const PASSPORT_PROMPT = "Convert this into a professional passport photo: solid white background, center the subject, crop to head and shoulders, ensure even lighting, and make it look professional.";

const FEATURES = ["Background Removal", "Portrait Retouching", "Artistic Filters", "Passport Photos", "Color Enhancement", "Always Free", "No Account Needed"];

const CURRENT_YEAR = new Date().getFullYear();

/** Cycles through processing messages and shows elapsed seconds without re-rendering the parent App. */
const ProcessingMessage = memo(() => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const timerId = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timerId);
  }, []);
  const idx = Math.floor(elapsed / PROCESSING_MESSAGE_INTERVAL_SECS) % PROCESSING_MESSAGES.length;
  return (
    <span className="text-xs text-brand-600 pl-2 flex items-center gap-1.5">
      <Sparkles className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
      <span role="status" aria-live="polite" aria-atomic="true">{PROCESSING_MESSAGES[idx]}</span>
      <span className="text-slate-400 tabular-nums" aria-hidden="true">{elapsed}s</span>
    </span>
  );
});


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
  const [errorDismissed, setErrorDismissed] = useState(false);
  const downloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelControllerRef = useRef<AbortController | null>(null);
  const userCancelledRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (downloadTimerRef.current !== null) clearTimeout(downloadTimerRef.current);
    };
  }, []);

  // Scroll to the result panel when an edit completes — mainly helps mobile users
  // where the comparison view is below the fold.
  useEffect(() => {
    if (status === AppStatus.COMPLETED && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [status]);

  // Move focus to the error message when it appears so screen reader users are notified.
  useEffect(() => {
    if (errorMsg && !errorDismissed && errorRef.current) {
      errorRef.current.focus();
    }
  }, [errorMsg, errorDismissed]);

  const clearError = useCallback(() => {
    setErrorMsg(null);
    setErrorDismissed(false);
  }, []);

  // Derived state
  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;
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
    clearError();
    setPrompt('');
  }, [clearError]);

  /**
   * Sends the current image and prompt to the AI service.
   * On success, appends the result to history (truncating any future redo states).
   */
  const handleGenerate = useCallback(async () => {
    if (!currentImage) return;
    if (!prompt.trim()) return;
    if (status === AppStatus.PROCESSING) return;

    setStatus(AppStatus.PROCESSING);
    clearError();
    userCancelledRef.current = false;
    const abortController = new AbortController();
    cancelControllerRef.current = abortController;

    try {
      const result = await generateEditedImage(currentImage.data, currentImage.mimeType, prompt, abortController.signal);

      if (result) {
        const mimeMatch = result.match(/^data:([^;]+);/);
        const newImage: ProcessedImage = {
          data: result,
          mimeType: mimeMatch ? mimeMatch[1] : 'image/png'
        };

        // Add to history, removing any future redo states if we were in the middle.
        // Cap at MAX_HISTORY entries to prevent unbounded memory growth from base64 strings.
        const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
        truncated.push(newImage);
        const newHistory = truncated.length > MAX_HISTORY
          ? truncated.slice(truncated.length - MAX_HISTORY)
          : truncated;

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setStatus(AppStatus.COMPLETED);
        setPrompt('');
      } else {
        throw new Error("Failed to generate image. Please try again.");
      }
    } catch (err: unknown) {
      // If the user explicitly cancelled, swallow the error — status already reset
      if (err instanceof Error && err.name === 'AbortError' && userCancelledRef.current) {
        return;
      }
      console.error('[handleGenerate]', err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try a different prompt or image.";
      setErrorMsg(message);
      setErrorDismissed(false);
      setStatus(AppStatus.ERROR);
    }
  }, [currentImage, prompt, status, clearError]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      clearError();
    }
  }, [canUndo, clearError]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      clearError();
    }
  }, [canRedo, clearError]);

  const handleCancel = useCallback(() => {
    userCancelledRef.current = true;
    cancelControllerRef.current?.abort();
    setStatus(AppStatus.READY_TO_EDIT);
    clearError();
  }, [clearError]);

  // Use refs so the keyboard listener is registered once and stays current
  const canUndoRef = useRef(canUndo);
  const canRedoRef = useRef(canRedo);
  const clearErrorRef = useRef(clearError);
  canUndoRef.current = canUndo;
  canRedoRef.current = canRedo;
  clearErrorRef.current = clearError;

  // Refs for history state used inside handleGenerate — avoids recreating the callback on every edit
  const historyRef = useRef(history);
  const historyIndexRef = useRef(historyIndex);
  historyRef.current = history;
  historyIndexRef.current = historyIndex;

  // Global keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      // Don't intercept shortcuts while the user is typing in a form field
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndoRef.current) {
          setHistoryIndex(prev => prev - 1);
          clearErrorRef.current();
        }
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        if (canRedoRef.current) {
          setHistoryIndex(prev => prev + 1);
          clearErrorRef.current();
        }
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  /** Triggers a browser download of the current image and briefly shows a success toast. */
  const handleDownload = useCallback(() => {
    if (!currentImage) return;
    const link = document.createElement('a');
    link.href = currentImage.data;
    const editLabel = historyIndex > 0 ? `edit${historyIndex}-` : '';
    const ext = currentImage.mimeType === 'image/jpeg' ? 'jpg' : 'png';
    link.download = `nano-edit-${editLabel}${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(true);
    if (downloadTimerRef.current !== null) clearTimeout(downloadTimerRef.current);
    downloadTimerRef.current = setTimeout(() => setDownloadSuccess(false), 5000);
  }, [currentImage, historyIndex]);

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
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm" aria-hidden="true">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">
              <a href="/" aria-label="NanoEdit AI — Home" className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
                NanoEdit AI
              </a>
            </h1>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Powered by Google Gemini</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Intro Section - Only show if no history */}
        {history.length === 0 && (
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Edit Any Photo Instantly — Just <span className="text-brand-600">Describe What You Want</span>
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              Upload any photo and describe the edit you want in plain English. NanoEdit AI uses Google Gemini to apply your changes — no account, no signup, and your photos are never stored.
            </p>
            <ul className="flex flex-wrap justify-center gap-2 list-none" aria-label="Features">
              {FEATURES.map((feat) => (
                <li key={feat} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" aria-hidden="true" />
                  {feat}
                </li>
              ))}
            </ul>
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
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Upload Image</h3>
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
                    <h3 id="describe-changes-heading" className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Describe Changes</h3>
                  </div>

                  {/* History Controls */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="p-2.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Undo (Ctrl+Z)"
                      aria-label="Undo — go back one version (Ctrl+Z)"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full select-none mx-0.5" aria-label={`Version ${historyIndex + 1} of ${history.length}`} aria-live="polite" aria-atomic="true" title={historyIndex === 0 ? 'Original upload' : `AI edit ${historyIndex} of ${history.length - 1}`}>
                      {historyIndex === 0 ? 'Original' : `Edit ${historyIndex}`}
                      {history.length > 1 && <span className="text-slate-400 ml-1 font-normal">/ {history.length - 1}</span>}
                    </span>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="p-2.5 rounded-md hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Redo (Ctrl+Y)"
                      aria-label="Redo — go forward one version (Ctrl+Y)"
                    >
                      <RotateCw className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="relative bg-white p-1 rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all overflow-hidden">
                  {status === AppStatus.PROCESSING && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-100" aria-hidden="true">
                      <div className="h-full bg-brand-500 animate-progress-bar" />
                    </div>
                  )}
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={handlePromptChange}
                      aria-labelledby="describe-changes-heading"
                      aria-describedby="prompt-hint"
                      onKeyDown={handleKeyDown}
                      placeholder="E.g., 'Remove the background', 'Make it look vintage', or 'Smooth skin'"
                      className="w-full p-4 pr-10 text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none bg-transparent rounded-lg text-base"
                      rows={3}
                      maxLength={2000}
                    />
                    {prompt && (
                      <button
                        onClick={handleClearPrompt}
                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        aria-label="Clear prompt"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className="px-2 pb-2 flex justify-between items-center gap-2">
                    {status === AppStatus.PROCESSING ? (
                      <ProcessingMessage />
                    ) : (
                      <span id="prompt-hint" className="text-xs text-slate-400 pl-2 flex items-center gap-2">
                        <span className="hidden sm:flex items-center gap-1.5">
                          <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono">Enter</kbd> to generate <span className="text-slate-300">·</span> <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono">Shift+Enter</kbd> for newline
                        </span>
                        <span className="sm:hidden">Tap Generate to apply</span>
                        <span className="sr-only">Maximum 2000 characters.</span>
                        {prompt.length > 0 && (
                          <span aria-live="polite" aria-atomic="true" className={`tabular-nums transition-all ${prompt.length > 1800 ? 'text-red-500 font-medium' : prompt.length > 1500 ? 'text-amber-500 font-medium' : 'text-slate-300'}`}>
                            {prompt.length} / 2000
                            {prompt.length > 1800 && <span className="sr-only"> — character limit nearly reached</span>}
                          </span>
                        )}
                      </span>
                    )}
                    <div className="flex gap-2 ml-auto w-full sm:w-auto">
                      {status === AppStatus.PROCESSING && (
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          className="flex-1 sm:flex-initial rounded-lg"
                          leftIcon={<X className="w-4 h-4" />}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        onClick={handleGenerate}
                        disabled={!prompt.trim() || status === AppStatus.PROCESSING}
                        isLoading={status === AppStatus.PROCESSING}
                        className="flex-1 sm:flex-initial rounded-lg shadow-sm"
                        leftIcon={<Wand2 className="w-4 h-4" />}
                      >
                        {status === AppStatus.PROCESSING ? 'Generating…' : 'Generate'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Presets */}
                <div className="space-y-2.5" role="group" aria-label="Quick action prompts">
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Command className="w-3 h-3" aria-hidden="true" /> Popular edits:
                  </p>

                  {/* Passport Photo — full-width featured action */}
                  <button
                    onClick={() => handlePresetClick(PASSPORT_PROMPT)}
                    aria-pressed={prompt === PASSPORT_PROMPT}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 border rounded-lg transition-colors text-sm font-medium ${prompt === PASSPORT_PROMPT ? 'bg-brand-600 border-brand-600 text-white' : 'bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100'}`}
                  >
                    <UserSquare2 className="w-4 h-4" aria-hidden="true" />
                    Passport Photo
                  </button>

                  <div className="flex flex-wrap gap-2">
                    {PRESET_PROMPTS.map(({ label, text, Icon }) => {
                      const isActive = prompt === text;
                      return (
                        <button
                          key={text}
                          onClick={() => handlePresetClick(text)}
                          aria-pressed={isActive}
                          title={text}
                          className={`flex items-center gap-1.5 text-xs px-3 py-2 border rounded-full transition-colors active:scale-95 ${isActive ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200'}`}
                        >
                          <Icon className="w-3 h-3" aria-hidden="true" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Error Message */}
                {errorMsg && !errorDismissed && (
                  <div ref={errorRef} tabIndex={-1} role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-fadeIn focus:outline-none">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Generation failed — try a different prompt or image</p>
                      <p className="text-sm">{errorMsg}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <button
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                        title={!prompt.trim() ? "Enter a prompt above to retry" : undefined}
                        aria-label="Retry generating image"
                        className="text-xs font-medium px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Retry
                      </button>
                      <button
                        onClick={() => setErrorDismissed(true)}
                        aria-label="Dismiss error"
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Results (Only visible if we have a result beyond original) */}
          {historyIndex > 0 && currentImage && originalImage && (
            <div ref={resultRef} className="lg:col-span-8 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full">
                <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm" aria-label={`Edit ${historyIndex} of ${history.length - 1}`}>
                  <History className="w-4 h-4" aria-hidden="true" />
                  <span aria-hidden="true">
                    {history.length - 1 === 1 ? 'Edit 1' : `Edit ${historyIndex} of ${history.length - 1}`}
                  </span>
                  {history.length > 2 && (
                    <span className="text-xs text-slate-400">— use undo/redo to compare versions</span>
                  )}
                </div>
                <Suspense fallback={null}>
                  <ComparisonView
                    originalImage={originalImage.data}
                    processedImage={currentImage.data}
                    processedMimeType={currentImage.mimeType}
                    onDownload={handleDownload}
                    isProcessing={status === AppStatus.PROCESSING}
                  />
                </Suspense>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Download toast */}
      {downloadSuccess && (
        <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 flex items-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-xl shadow-lg animate-fadeIn text-sm font-medium whitespace-nowrap">
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
            Your photos are processed by Google Gemini and are never stored or retained.
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
