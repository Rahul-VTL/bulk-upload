import React from 'react';
import { DataImporter, builtInValidators, builtInTransformers } from 'data-importer/react';
import 'data-importer/styles.css';

// Consumer-defined schema
const invoiceSchema = [
  {
    key: 'invoice_number',
    label: 'Invoice #',
    type: 'string',
    required: true,
    unique: true,
    aliases: ['inv_no', 'invoice_id']
  },
  {
    key: 'client_name',
    label: 'Client Name',
    type: 'string',
    required: true,
    transformers: [builtInTransformers.trim()]
  },
  {
    key: 'client_email',
    label: 'Billing Email',
    type: 'email',
    required: true,
    validators: [builtInValidators.email()]
  },
  {
    key: 'amount_due',
    label: 'Amount Due ($)',
    type: 'number',
    required: true,
    transformers: [builtInTransformers.stringToNumber()],
    validators: [builtInValidators.min(0.01)]
  }
];

export function InvoiceImportView() {
  const handleImport = async (rows, onProgress) => {
    // Application backend API call
    console.log('Sending sanitized invoice records to backend:', rows);
    // Simulate API batch processing
    for (let i = 0; i <= rows.length; i++) {
      await new Promise((r) => setTimeout(r, 50));
      onProgress({
        processed: i,
        total: rows.length,
        percentage: Math.round((i / rows.length) * 100),
        successCount: i,
        failureCount: 0
      });
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', height: 600 }}>
      <h1>Billing & Invoices - Bulk Record Ingestion</h1>
      <DataImporter
        schema={invoiceSchema}
        acceptedFiles={['csv', 'xlsx']}
        onImport={handleImport}
        onComplete={(res) => {
          alert(`Import completed! ${res.importedRows} records processed.`);
        }}
      />
    </div>
  );
}
