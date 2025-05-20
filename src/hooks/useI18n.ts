import { useI18n as useI18nContext } from '@/contexts/I18nContext';

export const useI18n = () => {
  const { t, locale, setLocale } = useI18nContext();

  // Helper function to get a namespaced t function
  const createNamespacedT = (namespace: string) => {
    return (key: string, params?: Record<string, string>) => {
      return t(`${namespace}.${key}`, params);
    };
  };

  return {
    getText: t,
    locale,
    setLocale,
    createNamespacedT,
  };
};

export default useI18n;
