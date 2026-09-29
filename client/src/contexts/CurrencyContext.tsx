import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency } from '../types/index.js';
import api from '../services/api.js';

interface CurrencyContextType {
  currencies: Currency[];
  currentCurrency: string;
  setCurrency: (code: string) => void;
  formatPrice: (amount: number, fromCurrency?: string) => string;
  formatMoney: (amount: number, fromCurrency?: string) => string;
  convertPrice: (amount: number, fromCurrency: string, toCurrency: string) => number;
}


const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([
    { code: 'MAD', symbol: 'DH', name: 'Dirham Marocain', isBase: true, rateToBase: 1.0 },
    { code: 'EUR', symbol: '€', name: 'Euro', isBase: false, rateToBase: 10.85 },
    { code: 'USD', symbol: '$', name: 'Dollar Américain', isBase: false, rateToBase: 10.10 },
  ]);
  const [currentCurrency, setCurrentCurrency] = useState<string>(
    () => localStorage.getItem('vj_currency') || 'MAD'
  );

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const res = await api.get('/currencies');
        if (res.data.currencies && res.data.currencies.length > 0) {
          setCurrencies(res.data.currencies);
        }
      } catch (err) {
        // Fallback default rates
      }
    };
    fetchCurrencies();
  }, []);

  const setCurrency = (code: string) => {
    setCurrentCurrency(code);
    localStorage.setItem('vj_currency', code);
  };

  const convertPrice = (amount: number, fromCurrency: string = 'MAD', toCurrency: string = currentCurrency): number => {
    const num = Number(amount);
    const safeAmount = !isNaN(num) && isFinite(num) ? num : 0;
    const safeFrom = fromCurrency || 'MAD';
    const safeTo = toCurrency || currentCurrency || 'MAD';

    if (safeFrom === safeTo) return safeAmount;
    const from = currencies.find((c) => c.code === safeFrom) || { rateToBase: 1 };
    const to = currencies.find((c) => c.code === safeTo) || { rateToBase: 1 };

    const fromRate = from && typeof from.rateToBase === 'number' && from.rateToBase > 0 ? from.rateToBase : 1;
    const toRate = to && typeof to.rateToBase === 'number' && to.rateToBase > 0 ? to.rateToBase : 1;

    // Convert to base (MAD) then to target
    const inBase = safeAmount * fromRate;
    const inTarget = inBase / toRate;
    return Math.round(inTarget * 100) / 100;
  };

  const formatPrice = (amount: number, fromCurrency: string = 'MAD'): string => {
    const num = Number(amount);
    const safeAmount = !isNaN(num) && isFinite(num) ? num : 0;
    const converted = convertPrice(safeAmount, fromCurrency, currentCurrency);
    const curr = currencies.find((c) => c.code === currentCurrency);
    const symbol = curr?.symbol || currentCurrency || 'DH';

    const safeConverted = typeof converted === 'number' && !isNaN(converted) && isFinite(converted) ? converted : 0;

    return `${safeConverted.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${symbol}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        currentCurrency,
        setCurrency,
        formatPrice,
        formatMoney: formatPrice,
        convertPrice,
      }}
    >

      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
