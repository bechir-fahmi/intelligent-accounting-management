import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Update document direction for Arabic
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  const isRTL = i18n.language === 'ar';
  
  return {
    t,
    i18n,
    changeLanguage,
    isRTL,
    currentLanguage: i18n.language,
  };
};

export default useTranslation;