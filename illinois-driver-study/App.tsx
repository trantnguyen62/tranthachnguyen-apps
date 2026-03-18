import React, { useState, useCallback, memo, lazy, Suspense, useEffect } from 'react';
import { AppMode, Language } from './types';

const QuizMode = lazy(() =>
  import('./components/QuizMode').then(m => ({ default: m.QuizMode }))
);

const StudyMode = lazy(() =>
  import('./components/StudyMode').then(m => ({ default: m.StudyMode }))
);

const LivePractice = lazy(() =>
  import('./components/LivePractice').then(m => ({ default: m.LivePractice }))
);

// Static icon elements defined at module level so NavButton memo checks pass (stable references)
const ICON_QUIZ = <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const ICON_STUDY = <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const ICON_LIVE = <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;

// Static translations moved outside component
const TRANSLATIONS = {
  en: {
    appTitle: "Illinois Driver Study",
    shortTitle: "IL Driver",
    quizMode: "Quiz Mode",
    quizDesc: "Test your knowledge",
    studyList: "Study List",
    studyDesc: "Browse all Q&As",
    livePractice: "Live Practice",
    liveDesc: "AI voice instructor",
    footerText: "Illinois Driver Study Helper.",
    footerSub: "Content based on official study materials."
  },
  vi: {
    appTitle: "Ôn Thi Bằng Lái Xe Illinois",
    shortTitle: "IL Driver VN",
    quizMode: "Trắc Nghiệm",
    quizDesc: "Kiểm tra kiến thức",
    studyList: "Ôn Tập",
    studyDesc: "Xem tất cả câu hỏi",
    livePractice: "Luyện Tập Trực Tiếp",
    liveDesc: "Giáo viên AI",
    footerText: "Hỗ Trợ Ôn Thi Bằng Lái Xe Illinois.",
    footerSub: "Nội dung dựa trên tài liệu học tập chính thức."
  }
} as const;

const CURRENT_YEAR = new Date().getFullYear();

// Shared Suspense fallback — extracted to avoid duplicating the same JSX three times
const LoadingFallback: React.FC<{ language: Language }> = ({ language }) => (
  <div role="status" className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
    <svg aria-hidden="true" className="w-8 h-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <span className="text-sm">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</span>
  </div>
);

// Memoized NavButton component
const NavButton = memo<{ targetMode: AppMode; icon: React.ReactNode; label: string; description: string; currentMode: AppMode; onClick: (mode: AppMode) => void }>(({
  targetMode, icon, label, description, currentMode, onClick
}) => {
  const isActive = currentMode === targetMode;
  return (
    <button
      type="button"
      onClick={() => onClick(targetMode)}
      aria-current={isActive ? 'page' : undefined}
      className={`flex flex-col items-center justify-center gap-0.5 p-3 sm:px-5 sm:py-2.5 rounded-xl transition-all duration-200 w-full sm:w-auto flex-1 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none ${
        isActive
          ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 ring-offset-1'
          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
      }`}
    >
      <div aria-hidden="true">{icon}</div>
      <span className="font-medium text-sm">{label}</span>
      <span className={`text-xs hidden sm:block ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{description}</span>
    </button>
  );
});
NavButton.displayName = 'NavButton';

/**
 * Root application component.
 *
 * Manages global state: the active study mode (`AppMode`) and the display language
 * (`en` | `vi`). Renders the sticky header with navigation and language toggle,
 * lazy-loads StudyMode and LivePractice to keep the initial bundle small, and
 * updates `<title>` and `<meta name="description">` on each mode change for SEO.
 */
const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.QUIZ);
  const [language, setLanguage] = useState<Language>('en');

  const t = TRANSLATIONS[language];

  const handleModeChange = useCallback((newMode: AppMode) => {
    setMode(newMode);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const titles: Record<AppMode, string> = {
      [AppMode.QUIZ]: `Illinois DMV Practice Quiz ${CURRENT_YEAR} - Free IL Written Test | Illinois Driver Study`,
      [AppMode.STUDY]: `Study IL Traffic Laws & Road Signs ${CURRENT_YEAR} - Illinois Driver Study`,
      [AppMode.LIVE_PRACTICE]: 'AI-Powered Illinois Driving Practice - Illinois Driver Study',
    };
    const descriptions: Record<AppMode, string> = {
      [AppMode.QUIZ]: 'Take a free Illinois DMV practice quiz with instant feedback. 59 practice questions covering traffic laws, road signs, and safe driving rules for the IL written knowledge test.',
      [AppMode.STUDY]: 'Study all Illinois driver\'s license test topics: traffic laws, road signs, right-of-way rules, speed limits, and Illinois-specific regulations. Free study list with explanations.',
      [AppMode.LIVE_PRACTICE]: 'Practice for the Illinois DMV written test with an AI-powered instructor. Ask questions, get explanations, and learn Illinois traffic laws through interactive voice conversation.',
    };
    document.title = titles[mode];
    document.querySelector('meta[name="description"]')?.setAttribute('content', descriptions[mode]);
  }, [mode]);

  const toggleLanguage = useCallback(() => {
    setLanguage(l => l === 'en' ? 'vi' : 'en');
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-semibold"
      >
        {language === 'vi' ? 'Chuyển đến nội dung chính' : 'Skip to main content'}
      </a>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h1 aria-label={t.appTitle} className="text-xl font-bold text-slate-800">
              <span aria-hidden="true" className="hidden sm:inline">{t.appTitle}</span>
              <span aria-hidden="true" className="sm:hidden">{t.shortTitle}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button
               onClick={toggleLanguage}
               aria-label={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none"
             >
               <span aria-hidden="true">{language === 'en' ? '🇺🇸' : '🇻🇳'}</span>
               <span>{language === 'en' ? 'EN' : 'VN'}</span>
             </button>
             <div className="text-xs text-slate-400 font-mono hidden sm:block">
               v1.2.0
             </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-5xl mx-auto px-4 py-6 w-full flex-grow flex flex-col">
        <nav aria-label="Study modes" className="flex flex-wrap gap-3 mb-8 justify-center">
          <NavButton
            targetMode={AppMode.QUIZ}
            currentMode={mode}
            onClick={handleModeChange}
            label={t.quizMode}
            description={t.quizDesc}
            icon={ICON_QUIZ}
          />
          <NavButton
            targetMode={AppMode.STUDY}
            currentMode={mode}
            onClick={handleModeChange}
            label={t.studyList}
            description={t.studyDesc}
            icon={ICON_STUDY}
          />
          <NavButton
            targetMode={AppMode.LIVE_PRACTICE}
            currentMode={mode}
            onClick={handleModeChange}
            label={t.livePractice}
            description={t.liveDesc}
            icon={ICON_LIVE}
          />
        </nav>

        <div className="flex-grow animate-fade-in">
          {mode === AppMode.QUIZ && (
            <Suspense fallback={<LoadingFallback language={language} />}>
              <QuizMode language={language} onSwitchToStudy={() => handleModeChange(AppMode.STUDY)} />
            </Suspense>
          )}
          {mode === AppMode.STUDY && (
            <Suspense fallback={<LoadingFallback language={language} />}>
              <StudyMode language={language} />
            </Suspense>
          )}
          {mode === AppMode.LIVE_PRACTICE && (
            <Suspense fallback={<LoadingFallback language={language} />}>
              <LivePractice language={language} />
            </Suspense>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {CURRENT_YEAR} {t.footerText}</p>
          <p className="mt-1">{t.footerSub}</p>
          {language === 'en' && (
            <p className="mt-2 text-xs text-slate-500 max-w-xl mx-auto">
              Free Illinois driver&apos;s license practice test for the IL Secretary of State written knowledge exam. Covers traffic laws, road signs, right-of-way rules, and safe driving — in English and Vietnamese.
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;
