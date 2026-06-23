import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../App';
import type { Language } from '../App'; // Importato come tipo isolato per evitare crash di compilazione

const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'it', name: 'Italiano' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'es', name: 'Español' },
  { code: 'ar', name: 'العربية' },
  { code: 'fr', name: 'Français' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
];

export const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  const currentLanguageName = LANGUAGES.find(l => l.code === language)?.name || 'Italiano';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-brand-border rounded-lg text-xs font-black uppercase tracking-widest hover:border-brand-azure hover:text-brand-azure transition-all duration-300 text-white select-none"
      >
        <Globe className="w-4 h-4 text-brand-azure" />
        <span>{currentLanguageName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full md:bottom-auto md:top-full mb-2 md:mb-0 md:mt-2 w-48 max-h-64 overflow-y-auto bg-brand-card border border-brand-border rounded-xl shadow-2xl z-[150] scrollbar-thin scrollbar-thumb-brand-border scrollbar-track-transparent animate-fade-in">
          <div className="py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-brand-azure hover:text-white transition-colors flex justify-between items-center ${
                  language === lang.code ? 'text-brand-azure bg-brand-azure/5' : 'text-gray-300'
                }`}
              >
                <span>{lang.name}</span>
                {language === lang.code && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-azure" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};