import { describe, it, expect } from 'vitest';
import { createImporter } from '../src';

describe('Custom UI & Headless API Capabilities', () => {
  const testSchema = [
    { key: 'name', label: 'Full Name', type: 'string', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true }
  ];

  it('allows headless interaction and manual step navigation with setStep', () => {
    const importer = createImporter({
      schema: testSchema
    });

    expect(importer.getState().currentStep).toBe('upload');

    // Custom UI can change steps directly
    importer.setStep('mapping');
    expect(importer.getState().currentStep).toBe('mapping');

    importer.setStep('review');
    expect(importer.getState().currentStep).toBe('review');

    // Backward navigation back to mapping and upload
    importer.setStep('mapping');
    expect(importer.getState().currentStep).toBe('mapping');

    importer.setStep('upload');
    expect(importer.getState().currentStep).toBe('upload');

    // Custom UI can retrieve display rows
    const displayRows = importer.getDisplayRows();
    expect(displayRows.rows).toEqual([]);
    expect(displayRows.rowIds).toEqual([]);
  });

  it('provides all necessary headless actions to build a completely custom UI', () => {
    const importer = createImporter({
      schema: testSchema
    });

    expect(typeof importer.loadFile).toBe('function');
    expect(typeof importer.selectSheet).toBe('function');
    expect(typeof importer.setMapping).toBe('function');
    expect(typeof importer.autoMap).toBe('function');
    expect(typeof importer.confirmMappingAndPrepare).toBe('function');
    expect(typeof importer.updateCell).toBe('function');
    expect(typeof importer.updateCells).toBe('function');
    expect(typeof importer.addRow).toBe('function');
    expect(typeof importer.deleteRows).toBe('function');
    expect(typeof importer.setFilter).toBe('function');
    expect(typeof importer.setSearch).toBe('function');
    expect(typeof importer.setSorting).toBe('function');
    expect(typeof importer.import).toBe('function');
    expect(typeof importer.exportErrors).toBe('function');
    expect(typeof importer.reset).toBe('function');
  });
});
