/**
 * QuizMode — timed, scored quiz over all 59 official Illinois DMV questions.
 *
 * Flow: question → user selects option → instant right/wrong feedback + explanation
 *       → next question → … → results screen with pass/fail at 80% threshold.
 *
 * Audio: lazily imports the Gemini TTS service on first play. A single shared
 * AudioContext is kept alive across questions and closed on unmount to avoid
 * resource leaks.
 *
 * Keyboard shortcuts: A/B/C/D select an answer; Enter or → advances.
 */
import React, { useState, useEffect, useCallback, memo, useRef, useMemo } from 'react';
import { getQuestions } from '../data/questions';
import { Language } from '../types';

// Illinois DMV requires 80% to pass
const PASSING_SCORE = 80;

interface QuizModeProps {
  language: Language;
  onSwitchToStudy?: () => void;
}

// Static translations moved outside component
const TRANSLATIONS = {
  en: {
    questionLabel: "Question",
    of: "of",
    score: "Score",
    next: "Next Question",
    finish: "Finish Quiz",
    explanation: "Explanation:",
    quizComplete: "Quiz Complete!",
    yourScore: "Your Score",
    passing: "Passing",
    needsWork: "Keep Practicing",
    passingNote: "Illinois DMV requires 80% to pass",
    retake: "Retake Quiz",
    correct: "correct",
    incorrect: "incorrect",
    reviewStudy: "Review Study List",
  },
  vi: {
    questionLabel: "Câu hỏi",
    of: "trên",
    score: "Điểm",
    next: "Câu Tiếp Theo",
    finish: "Hoàn Thành",
    explanation: "Giải thích:",
    quizComplete: "Hoàn Thành Bài Thi!",
    yourScore: "Điểm Của Bạn",
    passing: "Đạt",
    needsWork: "Cần Ôn Thêm",
    passingNote: "Điểm đậu IL DMV là 80%",
    retake: "Làm Lại",
    correct: "đúng",
    incorrect: "sai",
    reviewStudy: "Xem Lại Tài Liệu",
  }
} as const;

export const QuizMode = memo<QuizModeProps>(({ language, onSwitchToStudy }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const optionsLengthRef = useRef(4);

  useEffect(() => {
    return () => {
      currentSourceRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  // Stop any playing audio and reset state when question changes
  useEffect(() => {
    currentSourceRef.current?.stop();
    currentSourceRef.current = null;
    setIsPlayingAudio(false);
  }, [currentQuestionIndex]);

  // Move focus to question heading when question changes
  useEffect(() => {
    questionRef.current?.focus();
  }, [currentQuestionIndex]);

  // Reset quiz when language changes to avoid index mismatch if arrays were different lengths (though they are same here)
  useEffect(() => {
    setSelectedOption(null);
    setShowResult(false);
  }, [language]);

  const questions = useMemo(() => getQuestions(language), [language]);
  const question = questions[currentQuestionIndex];
  const t = TRANSLATIONS[language];
  optionsLengthRef.current = question.options.length;

  const handleOptionSelect = useCallback((index: number) => {
    if (showResult) return;
    setSelectedOption(index);
    setShowResult(true);
    if (index === question.correctIndex) {
      setScore(s => s + 1);
    }
  }, [showResult, question.correctIndex]);

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  }, [currentQuestionIndex, questions.length]);

  // Keyboard shortcuts: A/B/C/D to select answer, Enter/ArrowRight to advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizCompleted) return;
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (!showResult) {
        const keyMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
        const idx = keyMap[e.key.toLowerCase()];
        if (idx !== undefined && idx < optionsLengthRef.current) {
          e.preventDefault();
          handleOptionSelect(idx);
        }
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextQuestion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizCompleted, showResult, handleOptionSelect, nextQuestion]);

  // Auto-focus Next button when answer is revealed
  useEffect(() => {
    if (showResult) nextButtonRef.current?.focus();
  }, [showResult]);

  const restartQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
  }, []);

  const playAudio = useCallback(async () => {
    try {
      // Stop any currently playing audio
      currentSourceRef.current?.stop();
      currentSourceRef.current = null;

      setIsPlayingAudio(true);
      const { generateSpeech } = await import('../services/gemini');
      const audioBuffer = await generateSpeech(question.text);

      // Reuse audio context across calls
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const buffer = await ctx.decodeAudioData(audioBuffer);
      const source = ctx.createBufferSource();
      currentSourceRef.current = source;
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlayingAudio(false);
        currentSourceRef.current = null;
      };
      source.start();
    } catch (err) {
      console.error("Failed to play audio:", err);
      setIsPlayingAudio(false);
    }
  }, [question.text]);

  if (quizCompleted) {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= PASSING_SCORE;
    return (
      <div className="max-w-2xl mx-auto p-4 animate-fade-in">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-100' : 'bg-amber-100'}`}>
            {passed ? (
              <svg aria-hidden="true" className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg aria-hidden="true" className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" /></svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">{t.quizComplete}</h2>
          <p className={`text-lg font-semibold mb-6 ${passed ? 'text-green-600' : 'text-amber-600'}`}>{passed ? t.passing : t.needsWork}</p>

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center" aria-label={`${score} ${t.correct} out of ${questions.length}`}>
              <div aria-hidden="true" className="text-4xl font-bold text-green-600">{score}<span className="text-xl text-slate-400">/{questions.length}</span></div>
              <div className="text-sm text-slate-500 mt-1">{t.correct}</div>
            </div>
            <div aria-hidden="true" className="w-px bg-slate-200" />
            <div className="text-center" aria-label={`${questions.length - score} ${t.incorrect} out of ${questions.length}`}>
              <div aria-hidden="true" className="text-4xl font-bold text-red-400">{questions.length - score}<span className="text-xl text-slate-400">/{questions.length}</span></div>
              <div className="text-sm text-slate-500 mt-1">{t.incorrect}</div>
            </div>
            <div aria-hidden="true" className="w-px bg-slate-200" />
            <div className="text-center" aria-label={`${t.yourScore}: ${pct}%`}>
              <div aria-hidden="true" className={`text-4xl font-bold ${passed ? 'text-green-600' : 'text-amber-600'}`}>{pct}%</div>
              <div className="text-sm text-slate-500 mt-1">{t.yourScore}</div>
            </div>
          </div>

          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${t.yourScore}: ${pct}%. ${passed ? t.passing : t.needsWork}. ${t.passingNote}`}
            className="w-full bg-slate-100 rounded-full h-3 mb-2 relative overflow-hidden"
          >
            <div
              className={`h-3 rounded-full transition-all duration-700 ${passed ? 'bg-green-500' : 'bg-amber-400'}`}
              style={{ width: `${pct}%` }}
            />
            <div aria-hidden="true" className="absolute top-0 bottom-0 w-0.5 bg-slate-400/60" style={{ left: '80%' }} />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mb-6" aria-hidden="true">
            <span>0%</span>
            <span className="text-slate-500">80% — {t.passingNote}</span>
            <span>100%</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!passed && onSwitchToStudy && (
              <button
                onClick={onSwitchToStudy}
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 outline-none"
              >
                {t.reviewStudy}
              </button>
            )}
            <button
              onClick={restartQuiz}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 outline-none"
            >
              {t.retake}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = currentQuestionIndex + (showResult ? 1 : 0);
  const scorePct = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : null;

  const scoreBadgeClass = scorePct === null
    ? 'text-blue-600 bg-blue-50'
    : scorePct >= PASSING_SCORE
      ? 'text-green-700 bg-green-50'
      : 'text-amber-700 bg-amber-50';

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-3">
          <span aria-live="polite" aria-atomic="true" className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {t.questionLabel} {currentQuestionIndex + 1} {t.of} {questions.length}
          </span>
          <span aria-live="polite" aria-atomic="true" className={`text-sm font-bold px-3 py-1 rounded-full transition-colors duration-300 ${scoreBadgeClass}`}>
            {t.score}: {score}{scorePct !== null ? ` (${scorePct}%)` : ''}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6" role="progressbar" aria-valuenow={currentQuestionIndex + 1} aria-valuemin={1} aria-valuemax={questions.length} aria-label={language === 'vi' ? `Câu hỏi ${currentQuestionIndex + 1} trên ${questions.length}` : `Question ${currentQuestionIndex + 1} of ${questions.length}`}>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
        </div>

        <div className="flex gap-2 items-start mb-6">
          <h2 ref={questionRef} tabIndex={-1} className="text-xl font-bold text-slate-800 flex-grow outline-none">{question.text}</h2>
          <button
            onClick={playAudio}
            disabled={isPlayingAudio}
            aria-label={language === 'vi' ? (isPlayingAudio ? 'Đang đọc...' : 'Đọc câu hỏi') : (isPlayingAudio ? 'Playing...' : 'Read question aloud')}
            className={`flex-shrink-0 p-2 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 outline-none ${isPlayingAudio ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title={language === 'vi' ? "Đọc câu hỏi" : "Read question aloud"}
          >
             {isPlayingAudio ? (
               <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                 <rect x="6" y="6" width="4" height="12" rx="1" /><rect x="14" y="6" width="4" height="12" rx="1" />
               </svg>
             ) : (
               <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
               </svg>
             )}
          </button>
        </div>

        {question.image && (
          <div className="mb-6 flex justify-center">
            <img
              src={question.image}
              alt={question.text}
              loading="lazy"
              className="max-h-48 object-contain rounded-lg shadow-sm border border-slate-200"
            />
          </div>
        )}

        <div role="radiogroup" aria-label={language === 'vi' ? 'Các lựa chọn' : 'Answer options'} aria-describedby={!showResult ? 'kb-hint' : undefined} className="space-y-3">
          {question.options.map((option, idx) => {
            let className = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer disabled:cursor-default ";
            const isCorrect = showResult && idx === question.correctIndex;
            const isWrong = showResult && idx === selectedOption && idx !== question.correctIndex;
            if (showResult) {
              if (isCorrect) {
                className += "border-green-500 bg-green-50 text-green-900";
              } else if (isWrong) {
                className += "border-red-500 bg-red-50 text-red-900";
              } else {
                className += "border-slate-100 text-slate-400 opacity-75";
              }
            } else {
              className += "border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-sm hover:scale-[1.005] text-slate-700";
            }

            const ariaLabel = `${String.fromCharCode(65 + idx)}: ${option}${isCorrect ? (language === 'vi' ? ' — Đúng' : ' — Correct') : isWrong ? (language === 'vi' ? ' — Sai' : ' — Incorrect') : ''}`;

            return (
              <button
                key={idx}
                role="radio"
                aria-checked={selectedOption === idx}
                aria-label={ariaLabel}
                onClick={() => handleOptionSelect(idx)}
                disabled={showResult}
                className={className}
              >
                <div className="flex items-center">
                  <span aria-hidden="true" className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 flex-shrink-0 text-xs font-semibold ${
                     isCorrect ? "border-green-600 bg-green-600 text-white" :
                     isWrong ? "border-red-500 bg-red-500 text-white" :
                     "border-slate-300 text-slate-500"
                  }`}>
                    {isCorrect ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : isWrong ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                      String.fromCharCode(65 + idx)
                    )}
                  </span>
                  {option}
                </div>
              </button>
            );
          })}
        </div>
        {!showResult && (
          <p id="kb-hint" className="mt-3 text-xs text-slate-400 text-right select-none">
            {language === 'vi' ? 'Nhấn A–D để chọn' : 'Press A–D to select'}
          </p>
        )}
        {showResult && (
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {selectedOption === question.correctIndex
              ? (language === 'vi' ? 'Đúng!' : 'Correct!')
              : (language === 'vi'
                  ? `Sai. Đáp án đúng là: ${question.options[question.correctIndex]}`
                  : `Incorrect. The correct answer is: ${question.options[question.correctIndex]}`)}
          </div>
        )}
        {showResult && (
          <div className={`mt-4 p-4 rounded-lg border-l-4 text-sm animate-fade-in-up ${selectedOption === question.correctIndex ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-400 bg-red-50 text-red-900'}`}>
            <div className="flex items-center gap-1.5 font-bold mb-1">
              {selectedOption === question.correctIndex ? (
                <>
                  <svg aria-hidden="true" className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  <span className="text-green-700">{language === 'vi' ? 'Đúng!' : 'Correct!'}</span>
                </>
              ) : (
                <>
                  <svg aria-hidden="true" className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  <span className="text-red-600">{language === 'vi' ? 'Chưa đúng!' : 'Incorrect!'}</span>
                </>
              )}
            </div>
            {question.explanation && (
              <p><span className="font-semibold">{t.explanation}</span>{' '}{question.explanation}</p>
            )}
          </div>
        )}
        {showResult && (
          <div className="mt-5 flex justify-end animate-fade-in-up">
            <button
              ref={nextButtonRef}
              onClick={nextQuestion}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 outline-none"
            >
              {currentQuestionIndex === questions.length - 1 ? t.finish : t.next}
              <svg aria-hidden="true" className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

QuizMode.displayName = 'QuizMode';
