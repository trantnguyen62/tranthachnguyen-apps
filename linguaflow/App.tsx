import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import { LANGUAGES } from './constants';
import { ConnectionState, UserProfile } from './types';
import LanguageSelector from './components/LanguageSelector';
import Visualizer from './components/Visualizer';
import Transcript from './components/Transcript';
import UserProfileModal from './components/UserProfileModal';

const API_URL = import.meta.env.VITE_API_URL || '';

const formatElapsed = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// Color mapping moved outside component
const VISUALIZER_COLORS: Record<string, string> = {
  'es': '#F59E0B', // Amber
  'fr': '#3B82F6', // Blue
  'de': '#EF4444', // Red
  'ja': '#EC4899', // Pink
  'vi': '#EAB308', // Yellow
  'en-vi': '#10B981', // Emerald for Vietnamese learners
} as const;

// Utility function moved outside component
const extractWordsFromMessages = (msgs: { text: string }[]): string[] => {
  const words: string[] = [];
  msgs.forEach(msg => {
    const matches = msg.text.match(/"([\p{L}\p{N}'-]+)"/gu);
    if (matches) {
      matches.forEach(m => words.push(m.replace(/"/g, '').toLowerCase()));
    }
  });
  return [...new Set(words)];
};

function App() {
  const [activeLanguage, setActiveLanguage] = useState(LANGUAGES[0]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [difficultyLevel, setDifficultyLevel] = useState(3); // 1-5 scale
  const [vietnameseRatio, setVietnameseRatio] = useState(70); // percentage of Vietnamese
  const sessionRecordedRef = useRef(false);
  const pendingConnectRef = useRef(false);
  
  const { 
    connectionState, 
    connect, 
    disconnect, 
    sendInstruction,
    messages, 
    volume, 
    error 
  } = useLiveSession(activeLanguage, userProfile);

  const adjustDifficulty = useCallback((delta: number) => {
    const newLevel = Math.max(1, Math.min(5, difficultyLevel + delta));
    setDifficultyLevel(newLevel);
    const levelNames = ['rất dễ', 'dễ', 'trung bình', 'khó', 'rất khó'];
    sendInstruction(`[HỆ THỐNG] Học viên muốn thay đổi độ khó. Hãy điều chỉnh sang mức ${levelNames[newLevel - 1]} (${newLevel}/5). Nói ${newLevel <= 2 ? 'chậm hơn, dùng từ đơn giản hơn' : newLevel >= 4 ? 'nhanh hơn, dùng từ phức tạp hơn' : 'ở mức bình thường'}.`);
  }, [difficultyLevel, sendInstruction]);

  const adjustLanguageRatio = useCallback((delta: number) => {
    const newRatio = Math.max(10, Math.min(90, vietnameseRatio + delta));
    setVietnameseRatio(newRatio);
    const englishRatio = 100 - newRatio;
    sendInstruction(`[HỆ THỐNG] Học viên muốn thay đổi tỷ lệ ngôn ngữ. Từ giờ hãy nói ${newRatio}% tiếng Việt và ${englishRatio}% tiếng Anh.`);
  }, [vietnameseRatio, sendInstruction]);

  // Reset session recorded flag when a new session starts
  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTING) {
      sessionRecordedRef.current = false;
    }
  }, [connectionState]);

  // Record session once when disconnecting after a conversation
  useEffect(() => {
    if (connectionState === ConnectionState.DISCONNECTED && userProfile && messages.length > 0 && !sessionRecordedRef.current) {
      sessionRecordedRef.current = true;
      fetch(`${API_URL}/api/users/${userProfile.id}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordsLearned: extractWordsFromMessages(messages)
        })
      }).then(res => {
        if (!res.ok) console.error('Failed to record session:', res.status, res.statusText);
      }).catch(console.error);
    }
  }, [connectionState, userProfile, messages]);

  const handleConnect = useCallback(() => {
    if (activeLanguage.requiresUserProfile && !userProfile) {
      setShowProfileModal(true);
    } else {
      connect();
    }
  }, [activeLanguage.requiresUserProfile, userProfile, connect]);

  const handleProfileReady = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    setShowProfileModal(false);
    pendingConnectRef.current = true;
  }, []);

  useEffect(() => {
    if (pendingConnectRef.current && userProfile) {
      pendingConnectRef.current = false;
      connect();
    }
  }, [userProfile, connect]);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  useEffect(() => {
    if (error) setErrorDismissed(false);
  }, [error]);

  useEffect(() => {
    if (isConnected) {
      setSessionStart(Date.now());
      setElapsed(0);
    } else {
      setSessionStart(null);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!sessionStart) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart]);

  const handleCloseModal = useCallback(() => {
    setShowProfileModal(false);
  }, []);

  const visualizerColor = useMemo(() => 
    VISUALIZER_COLORS[activeLanguage.code] || '#10B981', 
    [activeLanguage.code]
  );

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row text-slate-100 overflow-hidden">
      
      {/* Left Panel: Controls & Visuals */}
      <div className="flex-1 flex flex-col p-6 gap-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                LinguaFlow
              </h1>
              <p className="text-xs text-slate-400">Speak naturally. Get instant pronunciation feedback.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {userProfile && (
              <div role="img" className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0" aria-label={`User: ${userProfile.name}`} title={userProfile.name}>
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs" aria-live="polite" aria-atomic="true">
              {isConnected ? (
                <>
                  <span className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-green-400 font-mono tabular-nums">{formatElapsed(elapsed)}</span>
                  </span>
                </>
              ) : isConnecting ? (
                <>
                  <span className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2 py-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                    <span className="text-yellow-400">Connecting</span>
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
                  <span className="text-slate-400">Ready</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Interaction Area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 min-h-[300px]">
           <Visualizer 
             volume={volume} 
             isActive={isConnected}
             color={visualizerColor}
           />
           
           <div className="text-center space-y-2" aria-live="polite" aria-atomic="true">
             <h2 className="text-2xl font-light flex items-center justify-center gap-2">
               {isConnected ? (
                 <>
                   <span role="img" aria-hidden="true">{activeLanguage.flag}</span>
                   <span>Listening...</span>
                 </>
               ) : 'Practice real conversations with AI'}
             </h2>
             <p className="text-slate-400 text-sm max-w-md mx-auto">
               {isConnected
                 ? `Your AI tutor is listening. Speak naturally — you'll get real-time pronunciation guidance and corrections.`
                 : 'Choose a language below, then press Start Conversation. Your AI tutor will speak with you, guide your pronunciation, and help you improve.'}
             </p>
           </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
           
           {error && !errorDismissed && (
             <div role="alert" className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
               <svg className="w-5 h-5 shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span className="flex-1">{error}</span>
               <button
                 onClick={() => setErrorDismissed(true)}
                 aria-label="Dismiss error"
                 className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
               >
                 <svg className="w-3.5 h-3.5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
           )}

           {!isConnected && !isConnecting && (
              <LanguageSelector 
                selected={activeLanguage} 
                onSelect={setActiveLanguage} 
                disabled={isConnected || isConnecting}
              />
           )}

           <div className="flex justify-center pt-2">
             {!isConnected ? (
               <button
                 onClick={handleConnect}
                 disabled={isConnecting}
                 aria-busy={isConnecting}
                 className={`
                   group relative px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                   ${isConnecting
                     ? 'bg-slate-700 text-slate-400 cursor-wait'
                     : 'bg-white text-slate-900 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]'}
                 `}
               >
                 {isConnecting ? (
                   <span className="flex items-center gap-2">
                     <span aria-hidden="true" className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                     <span aria-hidden="true" className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                     <span aria-hidden="true" className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                     Connecting
                   </span>
                 ) : (
                   <span className="flex items-center gap-2">
                     <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                     Start Conversation
                   </span>
                 )}
               </button>
             ) : (
               <div className="flex flex-col gap-4 w-full">
                 {/* Live Session Controls - only for Vietnamese English */}
                 {activeLanguage.code === 'en-vi' && (
                   <div className="flex flex-wrap justify-center gap-4">
                     {/* Difficulty Control */}
                     <div className="flex flex-col items-center gap-1 bg-slate-800 rounded-xl px-4 py-2 border border-slate-700">
                       <span className="text-xs text-slate-400">Độ khó</span>
                       <div className="flex gap-1 px-1" role="group" aria-label={`Độ khó: ${difficultyLevel}/5`}>
                         {[1, 2, 3, 4, 5].map((level) => (
                           <button
                             key={level}
                             onClick={() => adjustDifficulty(level - difficultyLevel)}
                             aria-label={`Độ khó ${level}/5`}
                             aria-pressed={difficultyLevel === level}
                             className="flex items-center justify-center w-6 h-7 rounded transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                           >
                             <span aria-hidden="true" className={`w-2.5 h-5 rounded-full block transition-all duration-150 hover:scale-110 ${level <= difficultyLevel ? 'bg-yellow-500' : 'bg-slate-600 hover:bg-slate-500'}`} />
                           </button>
                         ))}
                       </div>
                       <span className="text-xs text-yellow-400/80 tabular-nums" aria-hidden="true">
                         {['Rất dễ', 'Dễ', 'Trung bình', 'Khó', 'Rất khó'][difficultyLevel - 1]}
                       </span>
                     </div>

                     {/* Language Ratio Control */}
                     <div role="group" className="flex flex-col items-center gap-1 bg-slate-800 rounded-xl px-4 py-2 border border-slate-700" aria-label={`Language ratio: ${100 - vietnameseRatio}% English, ${vietnameseRatio}% Vietnamese`}>
                       <span className="text-xs text-slate-400">Tỷ lệ ngôn ngữ</span>
                       <div className="flex items-center gap-2">
                         <span className="text-sm" aria-hidden="true">🇬🇧</span>
                         <div className="flex gap-1">
                           {Array.from({ length: 9 }, (_, i) => {
                             const barRatio = (i + 1) * 10; // 10..90 Vietnamese ratio
                             const isActive = barRatio <= vietnameseRatio;
                             return (
                               <button
                                 key={i}
                                 onClick={() => adjustLanguageRatio(barRatio - vietnameseRatio)}
                                 aria-label={`${barRatio}% Vietnamese`}
                                 aria-pressed={barRatio === vietnameseRatio}
                                 className="flex items-center justify-center w-5 h-6 rounded transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                               >
                                 <span aria-hidden="true" className={`w-2 h-4 rounded-sm block transition-all duration-150 hover:scale-110 ${isActive ? 'bg-emerald-500' : 'bg-slate-600 hover:bg-slate-500'}`} />
                               </button>
                             );
                           })}
                         </div>
                         <span className="text-sm" aria-hidden="true">🇻🇳</span>
                       </div>
                       <div className="text-xs text-emerald-400/80 tabular-nums" aria-hidden="true">{100 - vietnameseRatio}% EN · {vietnameseRatio}% VI</div>
                     </div>
                   </div>
                 )}

                 {/* End Session Button */}
                 <div className="flex flex-col items-center gap-2">
                   <button
                     onClick={disconnect}
                     className="px-8 py-4 rounded-full font-semibold text-lg bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white hover:scale-105 hover:shadow-[0_0_30px_-8px_rgba(239,68,68,0.5)] transition-all duration-300 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                   >
                     <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     End Session
                   </button>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Right Panel: Transcript */}
      <div className={`w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col md:h-screen transition-all duration-300 ${transcriptOpen ? 'h-[55vh]' : 'h-auto'}`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Live Transcript
          </h3>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <span className="text-xs text-slate-500 px-2 py-1 rounded-full bg-slate-800">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </span>
            )}
            <button
              onClick={() => setTranscriptOpen(o => !o)}
              aria-label={transcriptOpen ? 'Collapse transcript' : 'Expand transcript'}
              className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <svg className={`w-4 h-4 transition-transform duration-300 ${transcriptOpen ? 'rotate-180' : ''}`} aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className={`flex-1 overflow-hidden ${transcriptOpen ? '' : 'hidden md:block'}`}>
          <Transcript messages={messages} />
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={handleCloseModal}
        onProfileReady={handleProfileReady}
        apiUrl={API_URL}
      />
    </div>
  );
}

export default App;