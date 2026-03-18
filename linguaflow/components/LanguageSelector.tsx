/**
 * LanguageSelector — control panel for choosing the active language / course,
 * voice, difficulty level, and conversation topic.
 *
 * Rendered above the session controls in App.tsx and disabled while a live
 * session is running (to prevent mid-session config changes).
 *
 * The voice picker and topic picker only render for the Vietnamese-to-English
 * course (`en-vi`); the level picker renders for any language that defines a
 * `levels` array in its `LanguageConfig`.
 */
import React, { memo, useCallback } from 'react';
import { LANGUAGES, FEMALE_VOICES, CONVERSATION_TOPICS } from '../constants';
import { LanguageConfig, DifficultyLevel } from '../types';

interface Props {
  /** Currently active language configuration, including any selected level and topic. */
  selected: LanguageConfig;
  /**
   * Called whenever the user changes language, difficulty level, voice, or topic.
   * The parent is responsible for persisting the returned config.
   */
  onSelect: (lang: LanguageConfig) => void;
  /** When `true`, all buttons are non-interactive (e.g. during an active session). */
  disabled: boolean;
}

const LEVEL_COLORS: Record<DifficultyLevel, { bg: string; border: string; text: string }> = {
  beginner: { bg: 'bg-green-600', border: 'border-green-500', text: 'text-green-400' },
  elementary: { bg: 'bg-teal-600', border: 'border-teal-500', text: 'text-teal-400' },
  intermediate: { bg: 'bg-yellow-600', border: 'border-yellow-500', text: 'text-yellow-400' },
  'upper-intermediate': { bg: 'bg-orange-600', border: 'border-orange-500', text: 'text-orange-400' },
  advanced: { bg: 'bg-red-600', border: 'border-red-500', text: 'text-red-400' },
};

const LanguageSelector = memo<Props>(({ selected, onSelect, disabled }) => {
  const handleLevelSelect = useCallback((level: DifficultyLevel) => {
    const levelConfig = selected.levels?.find(l => l.level === level);
    if (levelConfig) {
      onSelect({
        ...selected,
        selectedLevel: level,
        systemInstruction: levelConfig.systemInstruction
      });
    }
  }, [selected, onSelect]);

  const handleVoiceSelect = useCallback((voiceId: string) => {
    onSelect({
      ...selected,
      voiceName: voiceId
    });
  }, [selected, onSelect]);

  const handleTopicSelect = useCallback((topicId: string) => {
    onSelect({
      ...selected,
      selectedTopic: selected.selectedTopic === topicId ? undefined : topicId
    });
  }, [selected, onSelect]);

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-labelledby="lang-selector-label" className="flex flex-col gap-2">
        <span id="lang-selector-label" className="text-sm font-medium text-slate-400">Choose a Language</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelect({ ...lang, selectedLevel: lang.levels ? 'beginner' : undefined })}
              disabled={disabled}
              aria-pressed={selected.code === lang.code}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                ${selected.code === lang.code
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:border-slate-600'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-2xl" role="img" aria-label={lang.name}>{lang.flag}</span>
              <div className="text-left">
                <div className="font-semibold text-sm">{lang.name}</div>
                {selected.code === lang.code && selected.voiceName ? (
                  <div className="text-xs opacity-60 flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                    {selected.voiceName}
                  </div>
                ) : lang.tagline ? (
                  <div className="text-xs opacity-60">{lang.tagline}</div>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Selection - only for Vietnamese English */}
      {selected.code === 'en-vi' && (
        <div role="group" aria-labelledby="voice-selector-label" className="flex flex-col gap-2">
          <span id="voice-selector-label" className="text-sm font-medium text-slate-400">Chọn giọng nói / Choose Voice</span>
          <div className="flex flex-wrap gap-2">
            {FEMALE_VOICES.map((voice) => {
              const isSelected = selected.voiceName === voice.id;
              return (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceSelect(voice.id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400
                    ${isSelected
                      ? 'bg-pink-600 border-pink-500 text-white shadow-lg'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:border-pink-500'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-lg" aria-hidden="true">👩</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{voice.name}</div>
                    <div className="text-xs opacity-70">{voice.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Level Selection - shows when a language with levels is selected */}
      {selected.levels && selected.levels.length > 0 && (
        <div role="group" aria-labelledby="level-selector-label" className="flex flex-col gap-2">
          <span id="level-selector-label" className="text-sm font-medium text-slate-400">Chọn cấp độ / Select Level</span>
          <div className="flex flex-wrap gap-2">
            {selected.levels.map((levelConfig) => {
              const colors = LEVEL_COLORS[levelConfig.level];
              const isSelected = selected.selectedLevel === levelConfig.level;
              return (
                <button
                  key={levelConfig.level}
                  onClick={() => handleLevelSelect(levelConfig.level)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`
                    flex flex-col items-start px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70
                    ${isSelected
                      ? `${colors.bg} ${colors.border} text-white shadow-lg`
                      : `bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:${colors.border}`}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${isSelected ? 'text-white' : colors.text}`} aria-hidden="true">
                      {levelConfig.level === 'beginner' && '🌱'}
                      {levelConfig.level === 'elementary' && '📖'}
                      {levelConfig.level === 'intermediate' && '📚'}
                      {levelConfig.level === 'upper-intermediate' && '💬'}
                      {levelConfig.level === 'advanced' && '🎯'}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{levelConfig.labelVi}<span aria-hidden="true"> · </span>{levelConfig.label}</div>
                      <div className="text-xs opacity-70">{levelConfig.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Topic Selection - shows when Vietnamese English is selected and has a level */}
      {selected.code === 'en-vi' && selected.selectedLevel && (
        <div role="group" aria-labelledby="topic-selector-label" className="flex flex-col gap-2">
          <span id="topic-selector-label" className="text-sm font-medium text-slate-400">Chủ đề / Topic <span className="font-normal text-slate-500">(optional — skip to let the conversation flow freely)</span></span>
          <div className="flex flex-wrap gap-2">
            {CONVERSATION_TOPICS.map((topic) => {
              const isSelected = selected.selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic.id)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
                    ${isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/80 hover:border-indigo-500'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-base" aria-hidden="true">{topic.icon}</span>
                  <span className="text-sm">{topic.labelVi} · {topic.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;
