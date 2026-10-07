import React, { createContext, useContext } from 'react';
import { useDataImporter, UseDataImporterReturn } from '../hooks/useDataImporter';
import { ImporterOptions } from '../types';

export const DataImporterContext = createContext<UseDataImporterReturn | null>(null);

export interface DataImporterProviderProps extends ImporterOptions {
  children?: React.ReactNode | ((api: UseDataImporterReturn) => React.ReactNode);
  value?: UseDataImporterReturn;
}

export const DataImporterProvider: React.FC<DataImporterProviderProps> = ({
  children,
  value,
  ...options
}) => {
  const importerApi = useDataImporter(options as ImporterOptions);
  const contextValue = value || importerApi;

  return (
    <DataImporterContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(contextValue) : children}
    </DataImporterContext.Provider>
  );
};

export function useDataImporterContext(): UseDataImporterReturn {
  const context = useContext(DataImporterContext);
  if (!context) {
    throw new Error(
      'useDataImporterContext must be used within a DataImporterProvider or DataImporter component.'
    );
  }
  return context;
}
