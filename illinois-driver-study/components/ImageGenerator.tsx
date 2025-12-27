import React, { useState } from 'react';
import { generateStudyImage } from '../services/gemini';
import { ImageSize, Language } from '../types';

interface ImageGeneratorProps {
  language: Language;
}

const translations = {
  en: {
    title: "Visual Aid Generator",
    desc: "Create custom visual scenarios to help you understand driving rules better.",
    promptLabel: "Describe a scenario (e.g., \"A car hydroplaning on wet road\")",
    promptPlaceholder: "Enter prompt here...",
    quality: "Image Quality",
    generate: "Generate Visualization",
    generating: "Generating Scene...",
    error: "Failed to generate image. Please ensure you have selected a valid API key and try again."
  },
  vi: {
    title: "Tạo Hình Ảnh Hỗ Trợ",
    desc: "Tạo các tình huống hình ảnh tùy chỉnh để giúp bạn hiểu luật lái xe tốt hơn.",
    promptLabel: "Mô tả tình huống (ví dụ: \"Xe bị trượt nước trên đường ướt\")",
    promptPlaceholder: "Nhập mô tả tại đây...",
    quality: "Chất Lượng Hình Ảnh",
    generate: "Tạo Hình Ảnh",
    generating: "Đang Tạo...",
    error: "Không thể tạo hình ảnh. Vui lòng đảm bảo bạn đã chọn khóa API hợp lệ và thử lại."
  }
};

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ language }) => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [loading, setLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const t = translations[language];

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setError(null);
    setImageSrc(null);

    try {
      // Prepend context if Vietnamese to ensure better understanding, or rely on model
      const result = await generateStudyImage(prompt, size);
      setImageSrc(result);
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          <h2 className="text-2xl font-bold mb-2">{t.title}</h2>
          <p className="text-indigo-100">{t.desc}</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t.promptLabel}
            </label>
            <textarea
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              rows={3}
              placeholder={t.promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t.quality}</label>
            <div className="flex gap-4">
              {[ImageSize.SIZE_1K, ImageSize.SIZE_2K, ImageSize.SIZE_4K].map((s) => (
                <label key={s} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="size"
                    value={s}
                    checked={size === s}
                    onChange={() => setSize(s)}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-slate-700 font-medium">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all ${
              loading || !prompt 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t.generating}
              </span>
            ) : (
              t.generate
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {imageSrc && (
            <div className="mt-8 rounded-lg overflow-hidden shadow-xl border border-slate-200">
              <img src={imageSrc} alt="Generated driving scenario" className="w-full h-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
