import React, { createContext, useContext, useState, useMemo } from 'react';
import type { DashboardFilters } from '../../../types/dashboard';

interface FilterContextType {
  filters: DashboardFilters;
  setBusinessLine: (line: string) => void;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: DashboardFilters = {
  businessLine: 'All lines',
  ownerId: 'ALL',
  tier: 'ALL',
  dealSide: 'ALL',
  country: 'ALL',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const setBusinessLine = (line: string) => {
    setFilters((prev: DashboardFilters) => ({ ...prev, businessLine: line }));
  };

  const setFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((prev: DashboardFilters) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const value = useMemo(
    () => ({
      filters,
      setBusinessLine,
      setFilter,
      resetFilters,
    }),
    [filters]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDashboardFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useDashboardFilters must be used within a FilterProvider');
  }
  return context;
};
