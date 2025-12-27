import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  BookOpen
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

  // Load projects on mount
  useEffect(() => {
    fetch(`${API_URL}/api/projects`)
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error('Failed to load projects:', err));
  }, []);

  // Load file tree when project changes
  useEffect(() => {
    if (selectedProject) {
      fetch(`${API_URL}/api/projects/${selectedProject.path}/tree`)
        .then(res => res.json())
        .then(data => setFileTree(data))
        .catch(err => console.error('Failed to load file tree:', err));
    } else {
      setFileTree([]);
    }
    setSelectedFile(null);
  }, [selectedProject]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: FileNode) => {
    if (file.type !== 'file') return;
    
    setIsLoadingFile(true);
    try {
      const filePath = selectedProject 
        ? `${selectedProject.path}/${file.path}` 
        : file.path;
      
      const res = await fetch(`${API_URL}/api/file?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      
      setSelectedFile({
        ...file,
        content: data.content,
        language: data.language
      });
    } catch (err) {
      console.error('Failed to load file:', err);
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

    setIsSearching(true);
    try {
      const projectParam = selectedProject ? `&project=${selectedProject.path}` : '';
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}${projectParam}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedProject]);

  // Handle code selection for context
  const handleCodeSelect = useCallback((code: string) => {
    setSelectedCode(code);
  }, []);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 bg-slate-800/50 border-r border-slate-700/50 flex flex-col">
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
              onChange={useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
                const project = projects.find(p => p.path === e.target.value);
                setSelectedProject(project || null);
              }, [projects])}
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
          <div className="flex border-b border-slate-700/50">
            <button
              onClick={useCallback(() => setActiveTab('files'), [])}
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'files' 
                  ? 'text-emerald-400 border-b-2 border-emerald-400' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Files
            </button>
            <button
              onClick={useCallback(() => setActiveTab('search'), [])}
              className={`flex-1 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 ${
                activeTab === 'search' 
                  ? 'text-emerald-400 border-b-2 border-emerald-400' 
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === 'files' ? (
              selectedProject ? (
                <FileTree 
                  nodes={fileTree} 
                  onFileSelect={handleFileSelect}
                  selectedPath={selectedFile?.path}
                />
              ) : (
                <div className="text-center text-slate-500 py-8">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a project to browse files</p>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search files..."
                    className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </div>
                {searchResults.length > 0 ? (
                  <FileTree 
                    nodes={searchResults} 
                    onFileSelect={handleFileSelect}
                    selectedPath={selectedFile?.path}
                  />
                ) : searchQuery && !isSearching ? (
                  <p className="text-center text-slate-500 py-4">No results found</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-14 bg-slate-800/30 border-b border-slate-700/50 flex items-center px-4 gap-4">
          <button
            onClick={useCallback(() => setShowSidebar(s => !s), [])}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform ${showSidebar ? '' : 'rotate-180'}`} />
          </button>
          
          {selectedFile && (
            <div className="flex items-center gap-2 text-sm">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 code-font">{selectedFile.path}</span>
            </div>
          )}

          <div className="flex-1" />

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            <button
              onClick={isConnected ? disconnect : connect}
              disabled={isConnecting}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isConnected
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : isConnecting
                  ? 'bg-slate-700/50 text-slate-400'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : isConnected ? (
                <>
                  <MicOff className="w-5 h-5" />
                  End Session
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Voice Session
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Viewer */}
          <div className="flex-1 p-4 flex flex-col">
            {isLoadingFile ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              </div>
            ) : (
              <CodeViewer file={selectedFile} onCodeSelect={handleCodeSelect} />
            )}
          </div>

          {/* Chat Panel */}
          <div className="w-96 bg-slate-800/30 border-l border-slate-700/50 flex flex-col">
            {/* Visualizer */}
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium">AI Tutor</span>
                {isConnected && (
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">
                    Live
                  </span>
                )}
              </div>
              <Visualizer volume={volume} isConnected={isConnected} color="#10B981" />
            </div>

            {/* Transcript */}
            <div className="flex-1 p-4 flex flex-col overflow-hidden">
              <Transcript messages={messages} />
            </div>

            {/* Selected Code Context */}
            {selectedCode && (
              <div className="p-4 border-t border-slate-700/50">
                <div className="text-xs text-slate-500 mb-2">Selected code context:</div>
                <div className="bg-slate-700/30 rounded p-2 text-xs code-font text-slate-400 max-h-20 overflow-auto">
                  {selectedCode.substring(0, 200)}
                  {selectedCode.length > 200 && '...'}
                </div>
                <button
                  onClick={() => setSelectedCode('')}
                  className="text-xs text-slate-500 hover:text-slate-400 mt-1"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
