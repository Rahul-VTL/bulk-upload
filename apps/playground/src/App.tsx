import React, { useState, useMemo } from 'react';
import { DataImporter } from 'data-importer/react';
import { ThemeConfig, ImportResult, ImportProgress } from 'data-importer';
import { PRESETS, PresetConfig } from './presets';

const THEMES: Record<string, { name: string; theme: ThemeConfig }> = {
  default: {
    name: 'Default Slate',
    theme: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      background: '#f8fafc',
      surface: '#ffffff',
      border: '#e2e8f0',
      text: '#0f172a'
    }
  },
  indigo: {
    name: 'Deep Indigo',
    theme: {
      primary: '#4f46e5',
      primaryHover: '#4338ca',
      background: '#f5f3ff',
      surface: '#ffffff',
      border: '#e0e7ff',
      text: '#1e1b4b'
    }
  },
  emerald: {
    name: 'Emerald Teal',
    theme: {
      primary: '#059669',
      primaryHover: '#047857',
      background: '#f0fdf4',
      surface: '#ffffff',
      border: '#d1fae5',
      text: '#064e3b'
    }
  },
  dark: {
    name: 'Modern Dark',
    theme: {
      primary: '#38bdf8',
      primaryHover: '#0ea5e9',
      background: '#0f172a',
      surface: '#1e293b',
      surfaceSecondary: '#334155',
      border: '#334155',
      text: '#f8fafc',
      textSecondary: '#94a3b8',
      muted: '#64748b'
    }
  }
};

export const App: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('customer');
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>('default');
  const [allowImportWithErrors, setAllowImportWithErrors] = useState<boolean>(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'importer' | 'code' | 'schema'>('importer');
  const [keyCounter, setKeyCounter] = useState(0);

  const currentPreset = useMemo(
    () => PRESETS.find((p) => p.id === selectedPresetId) || PRESETS[0],
    [selectedPresetId]
  );

  const currentTheme = THEMES[selectedThemeKey].theme;

  const handleDownloadSample = () => {
    const blob = new Blob([currentPreset.sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${currentPreset.id}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSimulatedImport = async (
    rows: Record<string, unknown>[],
    onProgress: (p: ImportProgress) => void
  ): Promise<ImportResult> => {
    setImportLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Starting import of ${rows.length} records...`,
      ...prev
    ]);

    const total = rows.length;
    const batchSize = Math.max(1, Math.floor(total / 5));

    for (let processed = 0; processed <= total; processed += batchSize) {
      await new Promise((r) => setTimeout(r, 200));
      const current = Math.min(processed, total);
      onProgress({
        processed: current,
        total,
        percentage: Math.round((current / total) * 100),
        successCount: current,
        failureCount: 0
      });
    }

    setImportLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Import completed successfully!`,
      ...prev
    ]);

    return {
      totalRows: total,
      validRows: total,
      invalidRows: 0,
      warningRows: 0,
      importedRows: total,
      failedRows: 0,
      duration: 1100
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: currentTheme.background || '#f8fafc' }}>
      {/* Top Navbar */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 16
              }}
            >
              DI
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                Data Importer
              </span>
              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6, fontWeight: 500 }}>
                v1.0.0
              </span>
            </div>
          </div>

          <div style={{ height: 20, width: 1, backgroundColor: '#cbd5e1' }} />

          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: 6 }}>
            {PRESETS.map((p) => {
              const isActive = p.id === selectedPresetId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPresetId(p.id);
                    setKeyCounter((k) => k + 1);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: 13,
                    fontWeight: 500,
                    borderRadius: 6,
                    border: '1px solid',
                    borderColor: isActive ? '#2563eb' : '#e2e8f0',
                    backgroundColor: isActive ? '#eff6ff' : '#ffffff',
                    color: isActive ? '#2563eb' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {p.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Theme Selector */}
          <select
            value={selectedThemeKey}
            onChange={(e) => setSelectedThemeKey(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              outline: 'none'
            }}
          >
            {Object.entries(THEMES).map(([k, t]) => (
              <option key={k} value={k}>
                Theme: {t.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleDownloadSample}
            style={{
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            Download Sample CSV
          </button>

          <div style={{ height: 20, width: 1, backgroundColor: '#cbd5e1' }} />

          {/* Tab buttons */}
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: 6, padding: 2 }}>
            <button
              type="button"
              onClick={() => setActiveTab('importer')}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                backgroundColor: activeTab === 'importer' ? '#ffffff' : 'transparent',
                color: activeTab === 'importer' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: activeTab === 'importer' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Importer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                backgroundColor: activeTab === 'code' ? '#ffffff' : 'transparent',
                color: activeTab === 'code' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: activeTab === 'code' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Code Example
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                backgroundColor: activeTab === 'schema' ? '#ffffff' : 'transparent',
                color: activeTab === 'schema' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: activeTab === 'schema' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              Schema JSON
            </button>
          </div>
        </div>
      </nav>

      {/* Main View Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'importer' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16 }}>
            <div
              style={{
                flex: 1,
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <DataImporter
                key={`${selectedPresetId}-${selectedThemeKey}-${keyCounter}`}
                schema={currentPreset.schema}
                theme={currentTheme}
                allowImportWithErrors={allowImportWithErrors}
                onImport={handleSimulatedImport}
              />
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div style={{ flex: 1, padding: 32, overflowY: 'auto', backgroundColor: '#ffffff' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              Consuming Application Integration
            </h2>
            <p style={{ color: '#64748b', marginBottom: 20, fontSize: 14 }}>
              The consumer owns the backend API, state, and permissions. The Data Importer owns the parsing, mapping, editing, and preparation.
            </p>
            <pre
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: 24,
                borderRadius: 8,
                fontSize: 13,
                lineHeight: 1.6,
                overflowX: 'auto'
              }}
            >{`import React from 'react';
import { DataImporter, builtInValidators, builtInTransformers } from 'data-importer/react';
import 'data-importer/styles.css';

const schema = ${JSON.stringify(
  currentPreset.schema.map((c) => ({
    key: c.key,
    label: c.label,
    type: c.type,
    required: c.required,
    aliases: c.aliases
  })),
  null,
  2
)};

export function AppImportView() {
  const handleImport = async (rows, onProgress) => {
    // Call application API
    return await myBackendApi.bulkImport(rows);
  };

  return (
    <DataImporter
      schema={schema}
      acceptedFiles={['csv', 'tsv', 'xlsx']}
      onImport={handleImport}
      onComplete={(result) => {
        console.log('Import finished:', result);
      }}
    />
  );
}`}</pre>
          </div>
        )}

        {activeTab === 'schema' && (
          <div style={{ flex: 1, padding: 32, overflowY: 'auto', backgroundColor: '#ffffff' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              Active Schema Definition ({currentPreset.title})
            </h2>
            <pre
              style={{
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
                padding: 24,
                borderRadius: 8,
                fontSize: 13,
                lineHeight: 1.6,
                overflowX: 'auto'
              }}
            >
              {JSON.stringify(currentPreset.schema, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
