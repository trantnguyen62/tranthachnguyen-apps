import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLiveSession } from './hooks/useLiveSession';
import { LANGUAGES } from './constants';
import { ConnectionState, UserProfile } from './types';
import LanguageSelector from './components/LanguageSelector';
import Visualizer from './components/Visualizer';
import Transcript from './components/Transcript';
import UserProfileModal from './components/UserProfileModal';

const API_URL = import.meta.env.VITE_API_URL || '';

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
    const matches = msg.text.match(/"([a-zA-Z]+)"/g);
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

  // Record session when disconnecting
  useEffect(() => {
    if (connectionState === ConnectionState.DISCONNECTED && userProfile && messages.length > 0) {
      fetch(`${API_URL}/api/users/${userProfile.id}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordsLearned: extractWordsFromMessages(messages)
        })
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
    setTimeout(() => connect(), 100);
  }, [connect]);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              LinguaFlow
            </h1>
            <p className="text-xs text-slate-400">Powered by Gemini Native Audio</p>
          </div>
        </div>

        {/* Main Interaction Area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 min-h-[300px]">
           <Visualizer 
             volume={volume} 
             isActive={isConnected}
             color={visualizerColor}
           />
           
           <div className="text-center space-y-2">
             <h2 className="text-2xl font-light">
               {isConnected ? 'Listening...' : 'Ready to practice?'}
             </h2>
             <p className="text-slate-400 text-sm max-w-md mx-auto">
               {isConnected 
                 ? `Conversation in ${activeLanguage.name} is active. Speak clearly into your microphone.` 
                 : `Select ${activeLanguage.name} or another language below to start your session.`}
             </p>
           </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
           
           {error && (
             <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               {error}
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
                 className={`
                   group relative px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300
                   ${isConnecting 
                     ? 'bg-slate-700 text-slate-400 cursor-wait' 
                     : 'bg-white text-slate-900 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]'}
                 `}
               >
                 {isConnecting ? (
                   <span className="flex items-center gap-2">
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                     <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                     Connecting
                   </span>
                 ) : (
                   <span className="flex items-center gap-2">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
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
                     <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2 border border-slate-700">
                       <span className="text-xs text-slate-400 mr-1">Độ khó:</span>
                       <button
                         onClick={() => adjustDifficulty(-1)}
                         disabled={difficultyLevel <= 1}
                         className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
                       >
                         −
                       </button>
                       <div className="flex gap-1 px-2">
                         {[1, 2, 3, 4, 5].map((level) => (
                           <div
                             key={level}
                             className={`w-2 h-4 rounded-full ${level <= difficultyLevel ? 'bg-yellow-500' : 'bg-slate-600'}`}
                           />
                         ))}
                       </div>
                       <button
                         onClick={() => adjustDifficulty(1)}
                         disabled={difficultyLevel >= 5}
                         className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
                       >
                         +
                       </button>
                     </div>

                     {/* Language Ratio Control */}
                     <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-4 py-2 border border-slate-700">
                       <span className="text-xs text-slate-400">🇬🇧</span>
                       <button
                         onClick={() => adjustLanguageRatio(-10)}
                         disabled={vietnameseRatio <= 10}
                         className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
                       >
                         −
                       </button>
                       <div className="text-center min-w-[60px]">
                         <div className="text-sm font-medium">{vietnameseRatio}%</div>
                         <div className="text-xs text-slate-500">🇻🇳 Việt</div>
                       </div>
                       <button
                         onClick={() => adjustLanguageRatio(10)}
                         disabled={vietnameseRatio >= 90}
                         className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold"
                       >
                         +
                       </button>
                       <span className="text-xs text-slate-400">🇻🇳</span>
                     </div>
                   </div>
                 )}

                 {/* End Session Button */}
                 <div className="flex justify-center">
                   <button
                     onClick={disconnect}
                     className="px-8 py-4 rounded-full font-semibold text-lg bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center gap-2"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     End Session
                   </button>
                 </div>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Right Panel: Transcript (Collapsed on mobile usually, but side-by-side on desktop) */}
      <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col h-[50vh] md:h-screen">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-slate-300 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            Live Transcript
          </h3>
          <span className="text-xs text-slate-500 px-2 py-1 rounded-full bg-slate-800">
            {messages.length} messages
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
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