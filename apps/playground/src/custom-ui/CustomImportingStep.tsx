import React from 'react';
import { UseDataImporterReturn } from 'data-importer/react';

interface CustomImportingStepProps {
  api: UseDataImporterReturn;
}

export const CustomImportingStep: React.FC<CustomImportingStepProps> = ({ api }) => {
  const { progress, rows } = api.state;
  const percentage = progress ? progress.percentage : 10;
  const processed = progress ? progress.processed : 0;
  const total = progress ? progress.total : rows.length;

  return (
    <div style={{ maxWidth: 540, margin: '60px auto', textAlign: 'center', width: '100%' }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--c-primary-light)',
          color: 'var(--c-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 32
        }}
      >
        ⚡
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>
        Importing Records into System...
      </h2>
      <p style={{ fontSize: 14, color: 'var(--c-text-muted)', marginBottom: 28 }}>
        Processing and transmitting batch data to destination database.
      </p>

      {/* Progress Bar */}
      <div
        style={{
          height: 12,
          background: '#e2e8f0',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 16
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, var(--c-primary), #6366f1)',
            transition: 'width 0.3s ease',
            borderRadius: 8
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-text-muted)' }}>
        <span>Processed: {processed} / {total} records</span>
        <span style={{ fontWeight: 600, color: 'var(--c-primary)' }}>{percentage}%</span>
      </div>
    </div>
  );
};
