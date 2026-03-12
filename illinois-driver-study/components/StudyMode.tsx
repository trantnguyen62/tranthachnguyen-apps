import React, { memo, useState, useMemo } from 'react';
import { getQuestions } from '../data/questions';
import { Language } from '../types';

interface StudyModeProps {
  language: Language;
}

// Static translations moved outside component
const TRANSLATIONS = {
  en: {
    title: "Review All Questions",
    subtitle: "Browse through all practice questions and memorize the correct answers.",
    correctAnswer: "(correct answer)",
    explanation: "Explanation:",
    questions: "questions",
    search: "Search questions...",
    noResults: "No questions match your search.",
  },
  vi: {
    title: "Xem Tất Cả Câu Hỏi",
    subtitle: "Xem qua tất cả các câu hỏi thực hành và ghi nhớ các câu trả lời đúng.",
    correctAnswer: "(đáp án đúng)",
    explanation: "Giải thích:",
    questions: "câu hỏi",
    search: "Tìm kiếm câu hỏi...",
    noResults: "Không tìm thấy câu hỏi phù hợp.",
  }
} as const;

export const StudyMode = memo<StudyModeProps>(({ language }) => {
  const questions = useMemo(() => getQuestions(language), [language]);
  const t = TRANSLATIONS[language];
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(qn =>
      qn.text.toLowerCase().includes(q) ||
      qn.options.some(o => o.toLowerCase().includes(q))
    );
  }, [questions, search]);

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.title}</h2>
            <p className="text-slate-600">{t.subtitle}</p>
          </div>
          <span aria-live="polite" aria-atomic="true" className="flex-shrink-0 bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-blue-100">
            {filtered.length}{search ? `/${questions.length}` : ''} {t.questions}
          </span>
        </div>
        <div className="relative">
          <label htmlFor="search-questions" className="sr-only">{t.search}</label>
          <svg aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
          <input
            id="search-questions"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.search}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={language === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <svg aria-hidden="true" className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/></svg>
          <p className="text-sm">{t.noResults}</p>
        </div>
      )}
      <div className="grid gap-4">
        {filtered.map((q) => (
          <div key={q.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow" style={{ contain: 'content' }}>
            <h3 className="font-bold text-lg text-slate-800 mb-4">
              <span className="text-slate-500 mr-2">#{q.id}.</span>
              {q.text}
            </h3>
            {q.image && (
              <div className="mb-4 flex justify-center">
                <img
                  src={q.image}
                  alt={q.text}
                  loading="lazy"
                  className="max-h-36 object-contain rounded-lg border border-slate-200"
                />
              </div>
            )}
            <ul role="list" className="space-y-2">
              {q.options.map((opt, idx) => (
                <li
                  key={idx}
                  className={`p-3 rounded-md flex items-start ${idx === q.correctIndex ? 'bg-green-50 border border-green-200 text-green-900' : 'text-slate-500'}`}
                >
                  <span aria-hidden="true" className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center mr-3 text-sm ${idx === q.correctIndex ? 'border-green-600 bg-green-600 text-white' : 'border-slate-300'}`}>
                    {idx === q.correctIndex ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}{idx === q.correctIndex && <span className="ml-2 text-xs font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">{t.correctAnswer}</span>}</span>
                </li>
              ))}
            </ul>
            {q.explanation && (
              <div className="mt-4 p-3 border-l-4 border-blue-300 bg-blue-50 rounded-r-md text-sm text-slate-700">
                <span className="font-semibold text-blue-800">{t.explanation}</span>{' '}{q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

StudyMode.displayName = 'StudyMode';
