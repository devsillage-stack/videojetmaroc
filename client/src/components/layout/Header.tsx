import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Coins, Bell } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext.js';
import { useAuth } from '../../contexts/AuthContext.js';
import { NetworkStatus } from '../common/NetworkStatus.js';

export const Header: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { currentCurrency, setCurrency, currencies } = useCurrency();
  const { user } = useAuth();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <NetworkStatus />
      </div>

      <div className="flex items-center gap-4">
        {/* Currency Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <Coins className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => setCurrency(curr.code)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currentCurrency === curr.code
                  ? 'bg-white text-videojet-blue font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {curr.code}
            </button>
          ))}
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <button
            onClick={() => handleLanguageChange('fr')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              i18n.language === 'fr'
                ? 'bg-white text-videojet-blue font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => handleLanguageChange('ar')}
            className={`px-2.5 py-1 rounded-lg transition-all font-arabic ${
              i18n.language === 'ar'
                ? 'bg-white text-videojet-blue font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            العربية (RTL)
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              i18n.language === 'en'
                ? 'bg-white text-videojet-blue font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
        </div>

        {/* Notification Bell */}
        <div className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-videojet-orange" />
        </div>
      </div>
    </header>
  );
};
