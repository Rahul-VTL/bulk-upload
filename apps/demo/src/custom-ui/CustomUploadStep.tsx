import React, { useState, useRef } from 'react';
import { PresetConfig } from '../presets';
import { UseDataImporterReturn } from 'data-importer/react';
import { ZipManifest, parseZipArchive } from '../utils/zipUtils';

interface CustomUploadStepProps {
  api: UseDataImporterReturn;
  preset: PresetConfig;
  zipManifest: ZipManifest | null;
  onZipLoaded: (manifest: ZipManifest | null, file: File | null) => void;
  zipFile: File | null;
}

export const CustomUploadStep: React.FC<CustomUploadStepProps> = ({
  api,
  preset,
  zipManifest,
  onZipLoaded,
  zipFile
}) => {
  const [isCsvDragOver, setIsCsvDragOver] = useState(false);
  const [isZipDragOver, setIsZipDragOver] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [oneClickLoading, setOneClickLoading] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [isProceeding, setIsProceeding] = useState(false);

  // --- CSV Handlers ---
  const handleCsvDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsCsvDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      api.loadFile(e.dataTransfer.files[0]);
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      api.loadFile(e.target.files[0]);
    }
  };

  // --- ZIP Handlers ---
  const processZipFile = async (file: File) => {
    setZipLoading(true);
    setZipError(null);
    try {
      const manifest = await parseZipArchive(file);
      onZipLoaded(manifest, file);
      await api.loadZipFile(file);
    } catch (err: any) {
      setZipError(err?.message || 'Failed to parse ZIP archive');
      onZipLoaded(null, null);
      api.removeZipFile();
    } finally {
      setZipLoading(false);
    }
  };

  const handleZipDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsZipDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processZipFile(e.dataTransfer.files[0]);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processZipFile(e.target.files[0]);
    }
  };

  // --- 1-Click Load Dummy CSV & ZIP ---
  const handleOneClickTest = async () => {
    setOneClickLoading(true);
    setZipError(null);
    try {
      // 1. Fetch Dummy ZIP
      const zipRes = await fetch('/sample-files/sample_assets.zip');
      if (!zipRes.ok) throw new Error('Could not fetch sample_assets.zip');
      const zipBlob = await zipRes.blob();
      const dummyZipFile = new File([zipBlob], 'sample_assets.zip', { type: 'application/zip' });
      const manifest = await parseZipArchive(dummyZipFile);
      onZipLoaded(manifest, dummyZipFile);
      await api.loadZipFile(dummyZipFile);

      // 2. Fetch Dummy CSV
      const csvRes = await fetch('/sample-files/sample_candidates.csv');
      if (!csvRes.ok) throw new Error('Could not fetch sample_candidates.csv');
      const csvText = await csvRes.text();
      const dummyCsvFile = new File([csvText], 'sample_candidates.csv', { type: 'text/csv' });

      // 3. Load CSV into Data Importer
      await api.loadFile(dummyCsvFile);
    } catch (err: any) {
      setZipError(err?.message || 'Failed to load dummy sample files');
    } finally {
      setOneClickLoading(false);
    }
  };

  const isZipPreset = !!preset.enableZipUpload;
  const hasCsv = !!api.state.file;
  const hasZip = !!(zipFile || api.state.zipFile || zipManifest);
  const hasBothFiles = hasCsv && hasZip;

  const handleProceed = async () => {
    if (!api.state.file) return;
    if (isZipPreset && !hasZip) return;
    setIsProceeding(true);
    try {
      if (isZipPreset && !api.state.zipFile && zipFile) {
        await api.loadZipFile(zipFile);
      }
      await api.proceedToMapping();
    } catch (err: any) {
      setZipError(err?.message || 'Failed to proceed to mapping');
    } finally {
      setIsProceeding(false);
    }
  };

  const loadStandardSample = (format: 'csv' | 'tsv') => {
    const content = format === 'csv' ? preset.sampleCsv : preset.sampleTsv;
    const mime = format === 'csv' ? 'text/csv' : 'text/tab-separated-values';
    const filename = `${preset.id}-sample.${format}`;
    const sampleFile = new File([content], filename, { type: mime });
    api.loadFile(sampleFile);
  };

  return (
    <div style={{ maxWidth: 860, margin: '20px auto', width: '100%' }}>
      {/* Intro info */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>
          {isZipPreset ? 'Upload Candidates CSV & Image ZIP Bundle' : 'Upload Data File'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--c-text-muted)', maxWidth: 680, margin: '0 auto' }}>
          {preset.description}
        </p>
      </div>

      {/* 1-Click Dummy Test Banner for ZIP Companion Preset */}
      {isZipPreset && (
        <div
          style={{
            marginBottom: 24,
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
            border: '1.5px solid #bfdbfe',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>🚀</span>
              <strong style={{ fontSize: 14, color: '#1e3a8a' }}>
                Test 10k Users + 20k Images Workflow Instantly
              </strong>
              <span
                style={{
                  fontSize: 11,
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 600
                }}
              >
                Dummy Files Ready
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
              Dummy CSV (7 users with intentional missing image cases) + Dummy ZIP (12 photos & signatures)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              disabled={oneClickLoading}
              onClick={handleOneClickTest}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: oneClickLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)'
              }}
            >
              {oneClickLoading ? 'Loading Dummy Data...' : '⚡ 1-Click Test: Load Both CSV + ZIP'}
            </button>
          </div>
        </div>
      )}

      {/* Upload Dropzones Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isZipPreset ? '1fr 1fr' : '1fr',
          gap: 20,
          marginBottom: 24
        }}
      >
        {/* Dropzone 1: Primary CSV File */}
        <div
          className={`c-upload-dropzone ${isCsvDragOver ? 'dragover' : ''}`}
          onDrop={handleCsvDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsCsvDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsCsvDragOver(false);
          }}
          onClick={() => csvInputRef.current?.click()}
          style={{
            minHeight: 220,
            borderColor: hasCsv ? '#10b981' : undefined,
            backgroundColor: hasCsv ? '#f0fdf4' : undefined
          }}
        >
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,.tsv,.xls,.xlsx"
            style={{ display: 'none' }}
            onChange={handleCsvChange}
          />

          <div
            className="c-upload-icon-circle"
            style={{
              backgroundColor: hasCsv ? '#dcfce7' : undefined,
              color: hasCsv ? '#10b981' : undefined
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            1. Data File (<span style={{ color: 'var(--c-primary)' }}>CSV / Excel</span>)
          </h3>

          {hasCsv ? (
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                ✓ {api.state.fileName || api.state.file?.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#15803d',
                  marginTop: 2,
                  background: '#bbf7d0',
                  padding: '2px 8px',
                  borderRadius: 10,
                  display: 'inline-block'
                }}
              >
                {api.state.originalRows?.length || 0} Records Loaded
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    csvInputRef.current?.click();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--c-primary)',
                    fontSize: 11,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Change CSV File
                </button>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 8 }}>
                User rows with photo/sign filename columns
              </p>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--c-primary)',
                  textDecoration: 'underline',
                  fontWeight: 500
                }}
              >
                {api.state.isLoading ? 'Parsing CSV structure...' : 'Click to Browse or Drag File'}
              </span>
            </>
          )}

          {api.state.isLoading && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--c-primary)', fontWeight: 500 }}>
              Parsing CSV structure...
            </div>
          )}
        </div>

        {/* Dropzone 2: Companion ZIP Archive */}
        {isZipPreset && (
          <div
            className={`c-upload-dropzone ${isZipDragOver ? 'dragover' : ''}`}
            onDrop={handleZipDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsZipDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsZipDragOver(false);
            }}
            onClick={() => zipInputRef.current?.click()}
            style={{
              minHeight: 220,
              borderColor: zipManifest ? '#10b981' : undefined,
              backgroundColor: zipManifest ? '#f0fdf4' : undefined
            }}
          >
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              onChange={handleZipChange}
            />

            <div
              className="c-upload-icon-circle"
              style={{
                backgroundColor: zipManifest ? '#dcfce7' : '#ede9fe',
                color: zipManifest ? '#10b981' : '#7c3aed'
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8v13H3V8"></path>
                <path d="M1 3h22v5H1z"></path>
                <path d="M10 12h4"></path>
              </svg>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              2. Photos & Signatures (<span style={{ color: '#7c3aed' }}>ZIP Archive</span>)
            </h3>

            {zipManifest ? (
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>
                  ✓ {zipFile?.name || zipManifest.fileName}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#15803d',
                    marginTop: 2,
                    background: '#bbf7d0',
                    padding: '2px 8px',
                    borderRadius: 10,
                    display: 'inline-block'
                  }}
                >
                  {zipManifest.fileCount} files indexed in &lt;50ms
                </div>
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onZipLoaded(null, null);
                      api.removeZipFile();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: 11,
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Remove ZIP
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: 'var(--c-text-muted)', marginBottom: 8 }}>
                  Archive containing all 20k photo & signature files
                </p>
                <span
                  style={{
                    fontSize: 12,
                    color: '#7c3aed',
                    textDecoration: 'underline',
                    fontWeight: 500
                  }}
                >
                  {zipLoading ? 'Scanning ZIP table of contents...' : 'Click to Browse or Drag ZIP'}
                </span>
              </>
            )}

            {zipError && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#dc2626', fontWeight: 500 }}>
                {zipError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dual Upload Gate Status & Mapping Navigation */}
      {isZipPreset && (
        <div
          style={{
            marginBottom: 24,
            padding: '16px 20px',
            backgroundColor: hasBothFiles ? '#f0fdf4' : '#fffbeb',
            border: `1.5px solid ${hasBothFiles ? '#86efac' : '#fde68a'}`,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: hasBothFiles ? '0 4px 14px rgba(34,197,94,0.15)' : 'none'
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: hasBothFiles ? '#166534' : '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 2
              }}
            >
              <span>{hasBothFiles ? '🎉' : '⚠️'}</span>
              <span>
                {hasBothFiles
                  ? 'Both CSV Data File & Image ZIP Archive Ready!'
                  : !hasCsv && !hasZip
                  ? 'Both CSV and Companion ZIP Archive are Required'
                  : !hasCsv
                  ? 'Waiting for CSV Data File...'
                  : 'Waiting for Companion ZIP Archive (Photos & Signatures)...'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: hasBothFiles ? '#15803d' : '#b45309', margin: 0 }}>
              {hasBothFiles
                ? `Ready to map columns! (${api.state.originalRows?.length || 0} candidate rows, ${zipManifest?.fileCount || api.state.zipFileCount || 0} archive assets).`
                : !hasCsv && !hasZip
                ? 'You must upload both the CSV data spreadsheet and the companion ZIP archive before column mapping can begin.'
                : !hasCsv
                ? `ZIP archive verified (${zipManifest?.fileCount || 0} images). Please upload the candidate CSV file to proceed.`
                : `CSV loaded (${api.state.originalRows?.length || 0} records). Please upload the companion ZIP file to proceed.`}
            </p>
          </div>

          <button
            type="button"
            disabled={!hasBothFiles || isProceeding}
            onClick={handleProceed}
            style={{
              backgroundColor: hasBothFiles ? '#16a34a' : '#cbd5e1',
              color: '#ffffff',
              border: 'none',
              padding: '11px 22px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: hasBothFiles && !isProceeding ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              boxShadow: hasBothFiles ? '0 2px 10px rgba(22,163,74,0.3)' : 'none'
            }}
          >
            {isProceeding ? 'Preparing Mapping...' : 'Proceed to Field Mapping →'}
          </button>
        </div>
      )}

      {/* Preset Quick Actions & Downloads */}
      <div
        style={{
          padding: '18px 20px',
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid var(--c-border)'
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--c-text)',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6
          }}
        >
          <span>🧪 Test Files & Download Options:</span>
          {isZipPreset && (
            <span style={{ fontSize: 12, color: '#64748b' }}>
              ZIP Status: {zipManifest ? `✓ ${zipManifest.fileCount} Files Verified` : 'No ZIP attached'}
            </span>
          )}
        </div>

        <div className="c-sample-pills" style={{ justifyContent: 'flex-start' }}>
          {isZipPreset ? (
            <>
              <button
                type="button"
                className="c-pill-btn"
                onClick={() => loadStandardSample('csv')}
              >
                <span>📄 Load Candidate CSV Only</span>
              </button>

              <a
                href="/sample-files/sample_candidates.csv"
                download="sample_candidates.csv"
                className="c-pill-btn"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>📥 Download Dummy CSV</span>
              </a>

              <a
                href="/sample-files/sample_assets.zip"
                download="sample_assets.zip"
                className="c-pill-btn"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>📦 Download Dummy ZIP (Photos & Signs)</span>
              </a>
            </>
          ) : (
            <>
              <button
                type="button"
                className="c-pill-btn"
                onClick={() => loadStandardSample('csv')}
              >
                <span>📄 Load {preset.title} Sample CSV</span>
                <span
                  style={{
                    fontSize: 11,
                    background: '#e2e8f0',
                    padding: '2px 6px',
                    borderRadius: 10
                  }}
                >
                  Includes duplicates & validation errors
                </span>
              </button>
              <button
                type="button"
                className="c-pill-btn"
                onClick={() => loadStandardSample('tsv')}
              >
                <span>📑 Load Sample TSV</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
