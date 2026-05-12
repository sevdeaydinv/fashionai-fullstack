import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Lang } from './translations';

type DeepStringify<T> = T extends string
  ? string
  : T extends object
  ? { [K in keyof T]: DeepStringify<T[K]> }
  : T;

export type TranslationDict = DeepStringify<typeof translations['tr']>;

interface LangCtx {
  lang: Lang;
  t: TranslationDict;
  setLang: (l: Lang) => void;
}

const Ctx = createContext<LangCtx>({
  lang: 'tr',
  t: translations.tr as TranslationDict,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('tr');

  useEffect(() => {
    AsyncStorage.getItem('fashionai_lang').then((saved) => {
      if (saved === 'en' || saved === 'tr') setLangState(saved);
    });
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem('fashionai_lang', l);
  };

  return (
    <Ctx.Provider value={{ lang, t: translations[lang] as TranslationDict, setLang }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLanguage = () => useContext(Ctx);
