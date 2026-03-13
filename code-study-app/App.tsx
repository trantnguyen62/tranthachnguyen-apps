import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import { ConnectionState, FileNode, Project, StudyContext } from './types';
import FileTree from './components/FileTree';
import CodeViewer from './components/CodeViewer';
import Visualizer from './components/Visualizer';
import Transcript from './components/Transcript';
import {
  Mic,
  MicOff,
  FolderOpen,
  Code2,
  MessageSquare,
  Search,
  ChevronLeft,
  Loader2,
  AlertCircle,
  BookOpen,
  X
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

function App() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileNode[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState<'files' | 'search'>('files');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const fileCache = useRef<Map<string, { content: string; language: string }>>(new Map());
  const fileFetchAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Study context for AI - memoized to prevent unnecessary re-renders
  const studyContext = useMemo<StudyContext>(() => ({
    currentFile: selectedFile,
    currentProject: selectedProject,
    selectedCode
  }), [selectedFile, selectedProject, selectedCode]);

  const {
    connectionState,
    connect,
    disconnect,
    messages,
    volume,
    error
  } = useLiveSession(studyContext);

  // Reset dismissed error when a new error arrives
  useEffect(() => {
    if (error) setDismissedError(null);
  }, [error]);

  // Load projects on mount
  useEffect(() => {
    fetch(`${API_URL}/api/projects`)
      .then(res => { if (!res.ok) throw new Error(`Server returned ${res.status}`); return res.json(); })
      .then(data => setProjects(data))
      .catch(err => console.error('Failed to load projects:', err));
  }, []);

  // Load file tree when project changes
  useEffect(() => {
    fileCache.current.clear();
    if (selectedProject) {
      setIsLoadingTree(true);
      fetch(`${API_URL}/api/projects/${encodeURIComponent(selectedProject.path)}/tree`)
        .then(res => { if (!res.ok) throw new Error(`Server returned ${res.status}`); return res.json(); })
        .then(data => setFileTree(data))
        .catch(err => console.error('Failed to load file tree:', err))
        .finally(() => setIsLoadingTree(false));
    } else {
      setFileTree([]);
    }
    setSelectedFile(null);
  }, [selectedProject]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: FileNode) => {
    if (file.type !== 'file') return;

    const filePath = selectedProject
      ? `${selectedProject.path}/${file.path}`
      : file.path;

    const cached = fileCache.current.get(filePath);
    if (cached) {
      // Refresh position in Map so LRU eviction keeps recently accessed files
      fileCache.current.delete(filePath);
      fileCache.current.set(filePath, cached);
      setFileLoadError(null);
      setSelectedFile({ ...file, content: cached.content, language: cached.language });
      return;
    }

    fileFetchAbortRef.current?.abort();
    const abortCtrl = new AbortController();
    fileFetchAbortRef.current = abortCtrl;

    setIsLoadingFile(true);
    setFileLoadError(null);
    try {
      const res = await fetch(`${API_URL}/api/file?path=${encodeURIComponent(filePath)}`, { signal: abortCtrl.signal });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      fileCache.current.set(filePath, { content: data.content, language: data.language });
      if (fileCache.current.size > 50) {
        fileCache.current.delete(fileCache.current.keys().next().value!);
      }
      setSelectedFile({
        ...file,
        content: data.content,
        language: data.language
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Failed to load file:', err);
      setFileLoadError(file.name);
    } finally {
      setIsLoadingFile(false);
    }
  }, [selectedProject]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    searchAbortRef.current?.abort();
    const abortCtrl = new AbortController();
    searchAbortRef.current = abortCtrl;

    setIsSearching(true);
    try {
      const projectParam = selectedProject ? `&project=${encodeURIComponent(selectedProject.path)}` : '';
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}${projectParam}`, { signal: abortCtrl.signal });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedProject]);

  // Handle code selection for context
  const handleCodeSelect = useCallback((code: string) => {
    setSelectedCode(code);
  }, []);

  const handleProjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const project = projects.find(p => p.path === e.target.value);
    setSelectedProject(project || null);
  }, [projects]);

  const handleTabFiles = useCallback(() => setActiveTab('files'), []);
  const handleTabSearch = useCallback(() => setActiveTab('search'), []);
  const handleToggleSidebar = useCallback(() => setShowSidebar(s => !s), []);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100">
      {/* Sidebar */}
      {showSidebar && (
        <nav id="sidebar" aria-label="File browser" className="w-80 bg-slate-800/50 border-r border-slate-700/50 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                  Code Study
                </h1>
                <p className="text-xs text-slate-500">Learn your codebase with AI</p>
              </div>
            </div>

            {/* Project Selector */}
            <select
              value={selectedProject?.path || ''}
              onChange={handleProjectChange}
              aria-label="Select project"
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Select a project...</option>
              {projects.map(project => (
                <option key={project.path} value={project.path}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Sidebar navigation"
            className="flex border-b border-slate-700/50"
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                e.preventDefault();
                if (activeTab === 'files') handleTabSearch();
                else handleTabFiles();
              }
            }}
          >
            <button
              id="tab-files"
              role="tab"
              aria-selected={activeTab === 'files'}
              aria-controls="tabpanel-sidebar"
              tabIndex={activeTab === 'files' ? 0 : -1}
              onClick={handleTabFiles}
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'files'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              <FolderOpen className="w-4 h-4" aria-hidden="true" />
              Files
            </button>
            <button
              id="tab-search"
              role="tab"
              aria-selected={activeTab === 'search'}
              aria-controls="tabpanel-sidebar"
              tabIndex={activeTab === 'search' ? 0 : -1}
              onClick={handleTabSearch}
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'search'
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              Search
            </button>
          </div>

          {/* Content */}
          <div
            id="tabpanel-sidebar"
            role="tabpanel"
            aria-labelledby={activeTab === 'files' ? 'tab-files' : 'tab-search'}
            className="flex-1 overflow-y-auto p-2"
          >
            {activeTab === 'files' ? (
              selectedProject ? (
                isLoadingTree ? (
                  <div className="flex items-center justify-center py-8" role="status" aria-label="Loading file tree">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" aria-hidden="true" />
                  </div>
                ) : (
                  <FileTree
                    nodes={fileTree}
                    onFileSelect={handleFileSelect}
                    selectedPath={selectedFile?.path}
                  />
                )
              ) : (
                <div className="text-center text-slate-500 py-8 px-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                    <FolderOpen className="w-6 h-6 opacity-40" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-slate-400 mb-1">No project selected</p>
                  <p className="text-xs">Choose a project above to browse its files</p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by filename or content..."
                      aria-label="Search files"
                      className={`w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${searchQuery ? 'pr-8' : ''}`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    aria-label={isSearching ? 'Searching...' : 'Search'}
                    className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Search className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                <p className="text-xs text-slate-600 px-1">
                  {selectedProject ? `Searching in ${selectedProject.name}` : 'Searching all projects'}
                </p>
                {searchResults.length > 0 ? (
                  <>
                    <p className="text-xs text-slate-500 px-2">
                      {searchResults.length} file{searchResults.length !== 1 ? 's' : ''} found
                      {searchResults.length === 50 && (
                        <span className="text-amber-500/80 ml-1">(limit reached — refine your query)</span>
                      )}
                    </p>
                    <FileTree
                      nodes={searchResults}
                      onFileSelect={handleFileSelect}
                      selectedPath={selectedFile?.path}
                    />
                  </>
                ) : searchQuery && !isSearching ? (
                  <div className="text-center text-slate-500 py-6 space-y-2">
                    <Search className="w-6 h-6 mx-auto opacity-30" aria-hidden="true" />
                    <p className="text-sm">No results found</p>
                    <p className="text-xs text-slate-600">Try a different search term</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-slate-800/30 border-b border-slate-700/50 flex items-center px-4 gap-4">
          <button
            onClick={handleToggleSidebar}
            aria-label={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
            aria-expanded={showSidebar}
            aria-controls="sidebar"
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${showSidebar ? '' : 'rotate-180'}`} aria-hidden="true" />
          </button>
          
          {selectedFile ? (
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <Code2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="flex items-center min-w-0 code-font">
                {selectedProject && (
                  <span className="text-slate-500 text-xs hidden sm:inline flex-shrink-0">
                    {selectedProject.name}
                    <span className="mx-1 text-slate-600">/</span>
                  </span>
                )}
                {selectedFile.path.includes('/') && (
                  <span className="text-slate-500 truncate text-xs hidden sm:block">
                    {selectedFile.path.split('/').slice(0, -1).join('/')}/
                  </span>
                )}
                <span className="text-slate-200 font-medium flex-shrink-0 text-sm">{selectedFile.name}</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-500">Open a file from the sidebar to view it here</span>
          )}

          <div className="flex-1" />

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
              aria-label={isConnecting ? 'Connecting to AI tutor' : isConnected ? 'End voice session' : 'Start voice session'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isConnected
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                  : isConnecting
                  ? 'bg-slate-700/50 text-slate-400'
                  : 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/25'
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" aria-hidden="true" />
                  <MicOff className="w-5 h-5" />
                  End Session
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span className="hidden sm:inline">Start Voice Session</span>
                  <span className="sm:hidden">Start</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && error !== dismissedError && (
          <div role="alert" className="flex items-center gap-3 px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" aria-hidden="true" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setDismissedError(error)}
              aria-label="Dismiss error"
              className="p-0.5 hover:bg-red-500/20 rounded transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Viewer */}
          <div className="flex-1 p-4 flex flex-col">
            {isLoadingFile ? (
              <div className="flex-1 flex items-center justify-center" role="status" aria-label="Loading file">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" aria-hidden="true" />
              </div>
            ) : fileLoadError ? (
              <div className="flex-1 flex items-center justify-center bg-slate-800/50 rounded-lg" role="alert">
                <div className="text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-red-400/70 mx-auto" aria-hidden="true" />
                  <div>
                    <p className="text-slate-300 font-medium">Failed to load file</p>
                    <p className="text-slate-500 text-sm mt-1 code-font">{fileLoadError}</p>
                  </div>
                  <p className="text-xs text-slate-600">Check that the API server is running</p>
                </div>
              </div>
            ) : selectedFile ? (
              <CodeViewer file={selectedFile} onCodeSelect={handleCodeSelect} />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto">
                    <Code2 className="w-8 h-8 text-slate-600" aria-hidden="true" />
                  </div>
                  <p className="text-slate-400 font-medium">No file open</p>
                  <p className="text-xs text-slate-600">Select a file from the sidebar to view its contents</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="w-96 bg-slate-800/30 border-l border-slate-700/50 flex flex-col">
            {/* Visualizer */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span className="text-sm font-medium">AI Tutor</span>
                </div>
                <span aria-live="polite" aria-atomic="true">
                  {isConnected ? (
                    <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                      Live
                    </span>
                  ) : isConnecting ? (
                    <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full">
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      Connecting
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-slate-700/40 text-slate-500 rounded-full border border-slate-700/50">
                      Idle
                    </span>
                  )}
                </span>
              </div>
              <Visualizer volume={volume} isConnected={isConnected} color="#10B981" />
            </div>

            {/* Transcript */}
            <div className="flex-1 p-4 flex flex-col overflow-hidden">
              <Transcript messages={messages} />
            </div>

            {/* Selected Code Context */}
            {selectedCode && (() => {
              const codeLines = selectedCode.split('\n');
              const MAX_PREVIEW_LINES = 8;
              const previewLines = codeLines.slice(0, MAX_PREVIEW_LINES);
              const hiddenLines = codeLines.length - MAX_PREVIEW_LINES;
              return (
                <div className="p-4 border-t border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                      <span className="text-xs text-emerald-400 font-medium">Context</span>
                      <span className="text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                        {codeLines.length} line{codeLines.length !== 1 ? 's' : ''}
                      </span>
                      {selectedFile && (
                        <span className="text-xs text-slate-500 code-font truncate max-w-[10rem]" title={selectedFile.name}>
                          {selectedFile.name}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedCode('')}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-400/10"
                      aria-label="Clear selected code context"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg text-xs code-font text-slate-300 border border-emerald-500/20 overflow-hidden">
                    <div className="p-3 overflow-x-auto">
                      {previewLines.map((line, i) => (
                        <div key={i} className="flex leading-5">
                          <span className="w-6 text-right pr-2 text-slate-600 select-none flex-shrink-0">{i + 1}</span>
                          <span className="whitespace-pre">{line || ' '}</span>
                        </div>
                      ))}
                    </div>
                    {hiddenLines > 0 && (
                      <div className="px-3 py-1.5 bg-slate-800/50 border-t border-emerald-500/10 text-slate-500">
                        +{hiddenLines} more line{hiddenLines !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
