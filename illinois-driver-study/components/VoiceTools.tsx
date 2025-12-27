import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../services/gemini';
import { Language } from '../types';

interface VoiceToolsProps {
  language: Language;
}

const translations = {
  en: {
    title: "Voice Study Notes",
    desc: "Record yourself explaining a rule or asking a question, and get it transcribed instantly.",
    start: "Tap the microphone to start recording.",
    recording: "Recording... Tap to stop",
    transcription: "Transcription",
    error: "Error transcribing audio.",
    micError: "Could not access microphone. Please check permissions."
  },
  vi: {
    title: "Ghi Chú Giọng Nói Ôn Tập",
    desc: "Ghi âm lại lời bạn giải thích quy tắc hoặc đặt câu hỏi, và nhận bản chép lời ngay lập tức.",
    start: "Nhấn vào micro để bắt đầu ghi âm.",
    recording: "Đang ghi âm... Nhấn để dừng",
    transcription: "Bản Chép Lời",
    error: "Lỗi khi chép lời âm thanh.",
    micError: "Không thể truy cập micro. Vui lòng kiểm tra quyền truy cập."
  }
};

export const VoiceTools: React.FC<VoiceToolsProps> = ({ language }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const t = translations[language];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleTranscription(blob);
        stream.getTracks().forEach(track => track.stop()); // Clean up
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setTranscription(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(t.micError);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setProcessing(true);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    try {
      const text = await transcribeAudio(blob);
      setTranscription(text);
    } catch (err) {
      console.error(err);
      setTranscription(t.error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 bg-teal-600 text-white">
          <h2 className="text-2xl font-bold mb-2">{t.title}</h2>
          <p className="text-teal-100">{t.desc}</p>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="mb-8 relative">
            {processing ? (
               <div className="w-24 h-24 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin"></div>
            ) : (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-teal-600 hover:bg-teal-700 hover:scale-105'
                }`}
              >
                {isRecording ? (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                  </svg>
                )}
              </button>
            )}
            {isRecording && (
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-red-500 font-semibold animate-pulse whitespace-nowrap">
                    {t.recording}
                </span>
            )}
          </div>

          {!isRecording && !processing && !transcription && (
            <p className="text-slate-500 text-center">
              {t.start}
            </p>
          )}

          {transcription && (
            <div className="w-full bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t.transcription}</h3>
              <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap">{transcription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
