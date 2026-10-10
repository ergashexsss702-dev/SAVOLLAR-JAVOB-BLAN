import React, { useRef, useState } from 'react';
import { Image, RotateCcw, Sliders, Trash2, Upload, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface BackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackgroundModal: React.FC<BackgroundModalProps> = ({ isOpen, onClose }) => {
  const { bgImage, overlayOpacity, setCustomBackground, removeCustomBackground, setOverlayOpacity, resetToStarrySky } = useTheme();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Faqat rasm fayllarini (JPG, PNG, WebP) yuklash mumkin.');
      return;
    }

    // Limit size to 4MB
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Rasm hajmi 4 MB dan oshmasligi kerak.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomBackground(result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Rasmni o\'qishda xatolik yuz berdi.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Image className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{t('customBg')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {errorMsg && (
            <div className="p-3 text-sm text-rose-300 bg-rose-950/60 border border-rose-800/50 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Current preview */}
          <div className="relative h-44 rounded-xl border border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center">
            {bgImage ? (
              <>
                <img
                  src={bgImage}
                  alt="Custom Background Preview"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 bg-slate-950 pointer-events-none"
                  style={{ opacity: overlayOpacity }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-indigo-500/80 text-white shadow">
                    Faol fon rasmi
                  </span>
                  <p className="text-xs text-slate-300 mt-2 drop-shadow">
                    Matn o‘qilishi uchun qoraytirilgan namuna
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center p-4 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center mx-auto mb-2 text-indigo-400">
                  <Image className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">Hozirda standart tungi osmon yoqilgan</p>
                <p className="text-xs text-slate-500 mt-1">O‘z rasmingizni yuklashingiz mumkin</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/25 transition active:scale-[0.98]"
            >
              <Upload className="w-4 h-4" />
              {bgImage ? 'Rasmni almashtirish' : t('uploadBgPrompt')}
            </button>

            {bgImage && (
              <button
                onClick={removeCustomBackground}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-sm font-medium transition"
              >
                <Trash2 className="w-4 h-4" />
                {t('removeBg')}
              </button>
            )}

            <button
              onClick={resetToStarrySky}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
            >
              <RotateCcw className="w-4 h-4" />
              {t('resetSky')}
            </button>
          </div>

          {/* Opacity slider */}
          {bgImage && (
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  {t('overlayBrightness')}
                </span>
                <span className="font-mono text-indigo-300">{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.95"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Qoraytirish darajasi yuqori bo‘lsa, yozuvlar va savollar yanada aniq va ravshan ko‘rinadi.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
