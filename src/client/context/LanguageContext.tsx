import React, { createContext, useContext, useEffect, useState } from 'react';
import { LANGUAGES, LanguageInfo, SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface LanguageContextType {
  currentLang: SupportedLanguage;
  currentLangInfo: LanguageInfo;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLangState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('app_language') as SupportedLanguage;
      if (saved && TRANSLATIONS[saved]) return saved;
    } catch {}
    return 'uz';
  });

  const currentLangInfo = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLangInfo.dir;
    try {
      localStorage.setItem('app_language', currentLang);
    } catch {}
  }, [currentLang, currentLangInfo]);

  const setLanguage = (lang: SupportedLanguage) => {
    if (TRANSLATIONS[lang]) {
      setCurrentLangState(lang);
    }
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[currentLang];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to Uzbek
    const uzDict = TRANSLATIONS.uz;
    if (uzDict && uzDict[key]) {
      return uzDict[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        currentLangInfo,
        setLanguage,
        t,
        languages: LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
