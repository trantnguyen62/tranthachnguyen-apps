import React, { memo } from 'react';
import { getQuestions } from '../data/questions';
import { Language } from '../types';

interface StudyModeProps {
  language: Language;
}

// Static translations moved outside component
const TRANSLATIONS = {
  en: {
    title: "Review All Questions",
    subtitle: "Browse through all practice questions and memorize the correct answers."
  },
  vi: {
    title: "Xem Tất Cả Câu Hỏi",
    subtitle: "Xem qua tất cả các câu hỏi thực hành và ghi nhớ các câu trả lời đúng."
  }
} as const;

export const StudyMode = memo<StudyModeProps>(({ language }) => {
  const questions = getQuestions(language);
  const t = TRANSLATIONS[language];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.title}</h2>
        <p className="text-slate-600">{t.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {questions.map((q) => (
          <div key={q.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg text-slate-800 mb-4">
              <span className="text-slate-500 mr-2">#{q.id}.</span>
              {q.text}
            </h3>
            <div className="space-y-2">
              {q.options.map((opt, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-md flex items-start ${idx === q.correctIndex ? 'bg-green-50 border border-green-200 text-green-900' : 'text-slate-500'}`}
                >
                  <span className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center mr-3 text-sm ${idx === q.correctIndex ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300'}`}>
                    {idx === q.correctIndex ? '✓' : String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

StudyMode.displayName = 'StudyMode';
