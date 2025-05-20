import React, { createContext, useContext, ReactNode } from 'react';
import enTranslations from '../locales/en.json';

type Translations = typeof enTranslations;

interface I18nContextType {
  t: (key: string, params?: Record<string, string>) => string;
  locale: string;
  setLocale: (locale: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  locale?: string;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  locale: initialLocale = 'en',
}) => {
  const [locale, setLocale] = React.useState(initialLocale);
  const [translations, setTranslations] =
    React.useState<Translations>(enTranslations);

  // In a real app, you would load translations dynamically based on the locale
  // For now, we're just using the English translations
  React.useEffect(() => {
    // In a real app, you would load the translations for the current locale here
    // For example: import(`../locales/${locale}.json`).then(setTranslations);
  }, [locale]);

  const t = (key: string, params: Record<string, string> = {}): string => {
    const keys = key.split('.');
    let value: any = translations;

    // Navigate through the nested object structure
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return the key if the path doesn't exist
        return key;
      }
    }

    // If we have a string value, replace any placeholders
    if (typeof value === 'string') {
      return Object.entries(params).reduce(
        (result, [param, paramValue]) =>
          result.replace(new RegExp(`\\{\\{${param}\\}}`, 'g'), paramValue),
        value
      );
    }

    // Return the key if the final value isn't a string
    return key;
  };

  return (
    <I18nContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export default I18nContext;
