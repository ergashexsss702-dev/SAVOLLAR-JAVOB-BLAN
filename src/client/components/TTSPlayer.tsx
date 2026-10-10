import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Gauge } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';

interface TTSControllerProps {
  currentlySpeakingText?: string | null;
  onStop: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export function useTTS() {
  const { currentLang } = useLanguage();
  const [isSupported, setIsSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentText(null);
  };

  const speak = (text: string, onEnd?: () => void) => {
    if (!isSupported || !text) return;

    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.pitch = 1.0;

    // Language code mapping
    const langMap: Record<string, string> = {
      uz: 'uz-UZ',
      en: 'en-US',
      ru: 'ru-RU',
      tr: 'tr-TR',
      ar: 'ar-SA',
      fr: 'fr-FR',
      de: 'de-DE',
      es: 'es-ES',
    };

    const targetLangCode = langMap[currentLang] || 'uz-UZ';
    utterance.lang = targetLangCode;

    // Find voice matching target lang
    const matchedVoice = voices.find((v) =>
      v.lang.toLowerCase().startsWith(targetLangCode.toLowerCase().split('-')[0])
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentText(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentText(null);
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsSpeaking(false);
      setCurrentText(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speakSequence = (texts: string[]) => {
    if (texts.length === 0) return;
    let index = 0;

    const playNext = () => {
      if (index < texts.length) {
        speak(texts[index], () => {
          index++;
          playNext();
        });
      }
    };

    playNext();
  };

  return {
    isSupported,
    isSpeaking,
    currentText,
    speed,
    setSpeed,
    speak,
    speakSequence,
    stop,
  };
}

export const TTSControlBar: React.FC<TTSControllerProps> = ({
  currentlySpeakingText,
  onStop,
  speed,
  onSpeedChange,
}) => {
  const { t } = useLanguage();
  if (!currentlySpeakingText) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] bg-slate-900/95 border border-indigo-500/50 shadow-2xl shadow-indigo-500/20 rounded-2xl p-3.5 backdrop-blur-md flex items-center justify-between gap-3 text-slate-100 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 animate-pulse shrink-0">
          <Volume2 className="w-5 h-5" />
        </div>
        <div className="truncate">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
            {t('readingItem')}
          </span>
          <p className="text-xs text-slate-200 truncate">{currentlySpeakingText}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Speed button selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block" />
          {[0.8, 1.0, 1.25].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                speed === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Stop button */}
        <button
          onClick={onStop}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>{t('stopAudio')}</span>
        </button>
      </div>
    </div>
  );
};
