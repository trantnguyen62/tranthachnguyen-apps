import React, { memo } from 'react';
import { LANGUAGES, FEMALE_VOICES, CONVERSATION_TOPICS } from '../constants';
import { LanguageConfig, DifficultyLevel } from '../types';

interface Props {
  selected: LanguageConfig;
  onSelect: (lang: LanguageConfig) => void;
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
  const handleLevelSelect = (level: DifficultyLevel) => {
    const levelConfig = selected.levels?.find(l => l.level === level);
    if (levelConfig) {
      onSelect({
        ...selected,
        selectedLevel: level,
        systemInstruction: levelConfig.systemInstruction
      });
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    onSelect({
      ...selected,
      voiceName: voiceId
    });
  };

  const handleTopicSelect = (topicId: string) => {
    onSelect({
      ...selected,
      selectedTopic: topicId
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-400">Target Language</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onSelect({ ...lang, selectedLevel: lang.levels ? 'beginner' : undefined })}
              disabled={disabled}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
                ${selected.code === lang.code 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-2xl" role="img" aria-label={lang.name}>{lang.flag}</span>
              <div className="text-left">
                <div className="font-semibold text-sm">{lang.name}</div>
                <div className="text-xs opacity-70">Voice: {selected.code === lang.code ? selected.voiceName : lang.voiceName}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Selection - only for Vietnamese English */}
      {selected.code === 'en-vi' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Chọn giọng nói / Choose Voice</label>
          <div className="flex flex-wrap gap-2">
            {FEMALE_VOICES.map((voice) => {
              const isSelected = selected.voiceName === voice.id;
              return (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceSelect(voice.id)}
                  disabled={disabled}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200
                    ${isSelected 
                      ? 'bg-pink-600 border-pink-500 text-white shadow-lg' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-pink-500'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-lg">👩</span>
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
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Chọn cấp độ / Select Level</label>
          <div className="flex flex-wrap gap-2">
            {selected.levels.map((levelConfig) => {
              const colors = LEVEL_COLORS[levelConfig.level];
              const isSelected = selected.selectedLevel === levelConfig.level;
              return (
                <button
                  key={levelConfig.level}
                  onClick={() => handleLevelSelect(levelConfig.level)}
                  disabled={disabled}
                  className={`
                    flex flex-col items-start px-4 py-3 rounded-xl border transition-all duration-200
                    ${isSelected 
                      ? `${colors.bg} ${colors.border} text-white shadow-lg` 
                      : `bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:${colors.border}`}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${isSelected ? 'text-white' : colors.text}`}>
                      {levelConfig.level === 'beginner' && '🌱'}
                      {levelConfig.level === 'elementary' && '📖'}
                      {levelConfig.level === 'intermediate' && '📚'}
                      {levelConfig.level === 'upper-intermediate' && '💬'}
                      {levelConfig.level === 'advanced' && '🎯'}
                    </span>
                    <div>
                      <div className="font-semibold text-sm">{levelConfig.labelVi}</div>
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
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-400">Chủ đề nói chuyện / Topic (tuỳ chọn)</label>
          <div className="flex flex-wrap gap-2">
            {CONVERSATION_TOPICS.map((topic) => {
              const isSelected = selected.selectedTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic.id)}
                  disabled={disabled}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
                    ${isSelected 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-indigo-500'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="text-base">{topic.icon}</span>
                  <span className="text-sm">{topic.labelVi}</span>
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
