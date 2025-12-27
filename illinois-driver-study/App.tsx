import React, { useState, useCallback, memo } from 'react';
import { QuizMode } from './components/QuizMode';
import { StudyMode } from './components/StudyMode';
import { LivePractice } from './components/LivePractice';
import { AppMode, Language } from './types';

// Static translations moved outside component
const TRANSLATIONS = {
  en: {
    appTitle: "Illinois Driver Study",
    shortTitle: "IL Driver",
    quizMode: "Quiz Mode",
    studyList: "Study List",
    livePractice: "Live Practice",
    footerText: "Illinois Driver Study Helper.",
    footerSub: "Content based on official study materials."
  },
  vi: {
    appTitle: "Ôn Thi Bằng Lái Xe Illinois",
    shortTitle: "IL Driver VN",
    quizMode: "Trắc Nghiệm",
    studyList: "Ôn Tập",
    livePractice: "Luyện Tập Trực Tiếp",
    footerText: "Hỗ Trợ Ôn Thi Bằng Lái Xe Illinois.",
    footerSub: "Nội dung dựa trên tài liệu học tập chính thức."
  }
} as const;

// Memoized NavButton component
const NavButton = memo<{ targetMode: AppMode; icon: React.ReactNode; label: string; currentMode: AppMode; onClick: (mode: AppMode) => void }>(({ 
  targetMode, icon, label, currentMode, onClick 
}) => (
  <button
    onClick={() => onClick(targetMode)}
    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 w-full sm:w-auto flex-1 ${
      currentMode === targetMode
        ? 'bg-blue-600 text-white shadow-lg scale-105'
        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
    }`}
  >
    <div className="mb-2">{icon}</div>
    <span className="font-medium text-sm">{label}</span>
  </button>
));
NavButton.displayName = 'NavButton';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.QUIZ);
  const [language, setLanguage] = useState<Language>('en');

  const t = TRANSLATIONS[language];

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(l => l === 'en' ? 'vi' : 'en');
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">{t.appTitle}</h1>
            <h1 className="text-xl font-bold text-slate-800 sm:hidden">{t.shortTitle}</h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button
               onClick={toggleLanguage}
               className="px-3 py-1 rounded-full text-xs font-bold border border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
             >
               {language === 'en' ? '🇺🇸 EN' : '🇻🇳 VN'}
             </button>
             <div className="text-xs text-slate-400 font-mono hidden sm:block">
               v1.2.0
             </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 w-full flex-grow flex flex-col">
        <nav className="flex flex-wrap gap-3 mb-8 justify-center">
          <NavButton 
            targetMode={AppMode.QUIZ} 
            currentMode={mode}
            onClick={handleModeChange}
            label={t.quizMode}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
          />
          <NavButton 
            targetMode={AppMode.STUDY} 
            currentMode={mode}
            onClick={handleModeChange}
            label={t.studyList}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          />
          <NavButton 
            targetMode={AppMode.LIVE_PRACTICE} 
            currentMode={mode}
            onClick={handleModeChange}
            label={t.livePractice}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>}
          />
        </nav>

        <div className="flex-grow animate-fade-in">
          {mode === AppMode.QUIZ && <QuizMode language={language} />}
          {mode === AppMode.STUDY && <StudyMode language={language} />}
          {mode === AppMode.LIVE_PRACTICE && <LivePractice language={language} />}
        </div>
      </div>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} {t.footerText}</p>
          <p className="mt-1">{t.footerSub}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
