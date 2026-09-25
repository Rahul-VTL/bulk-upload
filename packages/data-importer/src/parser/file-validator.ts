import { FileError } from '../core/errors';

export interface FileValidationOptions {
  acceptedFiles?: string[]; // e.g. ['csv', 'tsv', 'xls', 'xlsx'] or mime types
  maxFileSize?: number; // bytes, e.g. 50 * 1024 * 1024
}

const DEFAULT_ACCEPTED = ['csv', 'tsv', 'xls', 'xlsx'];
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

const MIME_MAP: Record<string, string[]> = {
  csv: ['text/csv', 'application/csv', 'text/x-csv', 'text/plain', 'application/vnd.ms-excel'],
  tsv: ['text/tab-separated-values', 'text/tsv', 'text/plain'],
  xls: ['application/vnd.ms-excel'],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/zip'
  ]
};

export class FileValidator {
  private acceptedExtensions: string[];
  private maxFileSize: number;

  constructor(options?: FileValidationOptions) {
    this.acceptedExtensions = (options?.acceptedFiles || DEFAULT_ACCEPTED).map((ext) =>
      ext.toLowerCase().replace(/^\./, '')
    );
    this.maxFileSize = options?.maxFileSize ?? DEFAULT_MAX_SIZE;
  }

  validate(file: File): void {
    if (!file) {
      throw new FileError({
        code: 'FILE_MISSING',
        message: 'No file was provided for import.'
      });
    }

    // Size check
    if (file.size === 0) {
      throw new FileError({
        code: 'FILE_EMPTY',
        message: `The file "${file.name}" is completely empty.`
      });
    }

    if (file.size > this.maxFileSize) {
      const maxMb = Math.round(this.maxFileSize / (1024 * 1024));
      const fileMb = (file.size / (1024 * 1024)).toFixed(2);
      throw new FileError({
        code: 'FILE_TOO_LARGE',
        message: `File size (${fileMb} MB) exceeds maximum allowed size of ${maxMb} MB.`,
        metadata: { size: file.size, maxSize: this.maxFileSize }
      });
    }

    // Extension check
    const extension = this.getExtension(file.name);
    if (!extension || !this.acceptedExtensions.includes(extension)) {
      throw new FileError({
        code: 'FILE_TYPE_UNSUPPORTED',
        message: `File type ".${extension || 'unknown'}" is not supported. Supported formats: ${this.acceptedExtensions.map((e) => `.${e}`).join(', ')}.`,
        metadata: { extension, supported: this.acceptedExtensions }
      });
    }

    // MIME type sanity check (some browsers provide empty MIME type, so check if present)
    if (file.type) {
      const allowedMimes = this.acceptedExtensions.flatMap((ext) => MIME_MAP[ext] || []);
      if (allowedMimes.length > 0 && !allowedMimes.includes(file.type)) {
        // Warning or loose accept if extension matches
        // Some systems send generic application/octet-stream
        if (file.type !== 'application/octet-stream' && !file.type.startsWith('text/')) {
          // Log or accept if extension is trusted
        }
      }
    }
  }

  getExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length <= 1) return '';
    return parts.pop()!.toLowerCase().trim();
  }
}
