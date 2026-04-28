import React, { createContext, useContext, useState } from 'react';

interface CurrencyContextType {
  currency: string;
  updateCurrency: (c: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'IDR',
  updateCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState('IDR');

  const updateCurrency = (c: string) => setCurrency(c);

  return (
    <CurrencyContext.Provider value={{ currency, updateCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
