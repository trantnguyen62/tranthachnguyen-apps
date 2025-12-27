import React, { useState, useEffect, useCallback, memo } from 'react';
import { getQuestions } from '../data/questions';
import { generateSpeech } from '../services/gemini';
import { Language } from '../types';

interface QuizModeProps {
  language: Language;
}

// Static translations moved outside component
const TRANSLATIONS = {
  en: {
    questionLabel: "Question",
    of: "of",
    score: "Score",
    next: "Next Question",
    finish: "Finish Quiz"
  },
  vi: {
    questionLabel: "Câu hỏi",
    of: "trên",
    score: "Điểm",
    next: "Câu Tiếp Theo",
    finish: "Hoàn Thành"
  }
} as const;

export const QuizMode = memo<QuizModeProps>(({ language }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Reset quiz when language changes to avoid index mismatch if arrays were different lengths (though they are same here)
  useEffect(() => {
    setSelectedOption(null);
    setShowResult(false);
  }, [language]);

  const questions = getQuestions(language);
  const question = questions[currentQuestionIndex];
  const t = TRANSLATIONS[language];

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
    }
  }, [currentQuestionIndex, questions.length]);

  const playAudio = useCallback(async () => {
    try {
      setIsPlayingAudio(true);
      const audioBuffer = await generateSpeech(question.text);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await audioContext.decodeAudioData(audioBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsPlayingAudio(false);
      source.start();
    } catch (err) {
      console.error(err);
      setIsPlayingAudio(false);
    }
  }, [question.text]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            {t.questionLabel} {currentQuestionIndex + 1} {t.of} {questions.length}
          </span>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {t.score}: {score}
          </span>
        </div>

        <div className="flex gap-2 items-start mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex-grow">{question.text}</h2>
          <button 
            onClick={playAudio}
            disabled={isPlayingAudio}
            className={`flex-shrink-0 p-2 rounded-full transition-colors ${isPlayingAudio ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            title={language === 'vi' ? "Đọc câu hỏi" : "Read question aloud"}
          >
             {isPlayingAudio ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
             ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="max-h-48 object-contain rounded-lg shadow-sm border border-slate-200"
            />
          </div>
        )}

        <div className="space-y-3">
          {question.options.map((option, idx) => {
            let className = "w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ";
            if (showResult) {
              if (idx === question.correctIndex) {
                className += "border-green-500 bg-green-50 text-green-900";
              } else if (idx === selectedOption) {
                className += "border-red-500 bg-red-50 text-red-900";
              } else {
                className += "border-slate-100 text-slate-400 opacity-60";
              }
            } else {
              className += "border-slate-200 hover:border-blue-400 hover:bg-slate-50 text-slate-700";
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={showResult}
                className={className}
              >
                <div className="flex items-center">
                  <span className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 flex-shrink-0 ${
                     showResult && idx === question.correctIndex ? "border-green-600 bg-green-600 text-white" :
                     showResult && idx === selectedOption ? "border-red-500 bg-red-500 text-white" :
                     "border-slate-300 text-slate-500"
                  }`}>
                    {showResult && idx === question.correctIndex ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
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
      </div>

      {showResult && (
        <div className="flex justify-end animate-fade-in-up">
          <button
            onClick={nextQuestion}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md flex items-center"
          >
            {currentQuestionIndex === questions.length - 1 ? t.finish : t.next}
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      )}
    </div>
  );
});

QuizMode.displayName = 'QuizMode';
