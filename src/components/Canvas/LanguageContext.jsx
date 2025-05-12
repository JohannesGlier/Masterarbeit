import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const savedLanguage = localStorage.getItem('appLanguage');
      return savedLanguage ? savedLanguage : 'de';
    } catch (error) {
      console.error("Could not read language from localStorage", error);
      return 'de';
    }
  });

  // Effekt, um die Sprache im localStorage zu speichern, wenn sie sich ändert
  useEffect(() => {
    try {
      localStorage.setItem('appLanguage', language);
    } catch (error) {
      console.error("Could not save language to localStorage", error);
    }
  }, [language]);

  // Funktion zum Ändern der Sprache (wird im Context bereitgestellt)
  const setLanguage = (lang) => {
    if (['de', 'en'].includes(lang)) { // Nur erlaubte Sprachen zulassen
        setLanguageState(lang);
    } else {
        console.warn(`Unsupported language selected: ${lang}`);
    }
  };

  // useMemo verwenden, um sicherzustellen, dass sich der Context-Wert nur ändert,
  // wenn sich die Sprache tatsächlich ändert.
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
  }), [language]);


  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// 3. Custom Hook für einfachen Zugriff auf den Context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};