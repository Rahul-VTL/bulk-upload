import { ImporterOptions } from '../../types';
import { DataImporterCore } from './data-importer';

/**
 * Public Factory function to initialize a framework-agnostic Data Importer instance
 * @param options Importer configuration including schema and callbacks
 * @returns DataImporterCore controller instance
 */
export function createImporter(options: ImporterOptions): DataImporterCore {
  if (!options || !options.schema || !Array.isArray(options.schema)) {
    throw new Error('createImporter requires a valid options object with a schema array.');
  }

  return new DataImporterCore(options);
}
