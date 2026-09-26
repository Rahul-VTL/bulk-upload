import React, { useState } from 'react';
import { DataImporter } from 'data-importer/react';

// Example schema for your project
const schema = [
  { key: 'name', label: 'Full Name', type: 'string', required: true, aliases: ['name', 'full_name', 'client'] },
  { key: 'email', label: 'Email Address', type: 'email', required: true, unique: true, aliases: ['email', 'e-mail', 'mail'] },
  { key: 'phone', label: 'Phone Number', type: 'phone', aliases: ['phone', 'mobile', 'contact'] },
  { key: 'role', label: 'Role', type: 'enum', options: [{ label: 'Admin', value: 'Admin' }, { label: 'Member', value: 'Member' }] }
];

export const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Theme coming from your project (simply set your project's brand color here)
  const projectTheme = {
    primary: '#2563eb', // Change this to your project's primary color
    primaryHover: '#1d4ed8'
  };

  const handleImport = async (rows: Record<string, unknown>[]) => {
    console.log('Sending data to project backend API:', rows);
    // Simulate backend API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    alert(`Successfully imported ${rows.length} records!`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      {/* 1. Aapke project me jaha bhi button chahiye waha ye button hoga */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          padding: '12px 24px',
          fontSize: '15px',
          fontWeight: 600,
          borderRadius: '8px',
          border: 'none',
          backgroundColor: projectTheme.primary,
          color: '#ffffff',
          cursor: 'pointer',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}
      >
        Import Data
      </button>

      {/* 2. Button click par aapka modal open hoga aur uske andar DataImporter render hoga */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Container */}
          <div
            style={{
              width: '90vw',
              maxWidth: '1100px',
              height: '85vh',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Close Button */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#ffffff'
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 16 }}>Import Data</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#64748b',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Simple Generic DataImporter Component */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <DataImporter
                theme={projectTheme}
                schema={schema}
                onImport={handleImport}
                onComplete={() => setIsOpen(false)}
                onCancel={() => setIsOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
