import JSZip from 'jszip';

export interface ZipManifest {
  fileName: string;
  fileCount: number;
  fileNames: Set<string>;
  rawList: string[];
  fileMap: Map<string, JSZip.JSZipObject>;
  errors: string[];
}

/**
 * Parses a ZIP file in milliseconds and extracts all file names (normalized without folder prefixes)
 */
export async function parseZipArchive(file: File): Promise<ZipManifest> {
  const fileNames = new Set<string>();
  const rawList: string[] = [];
  const fileMap = new Map<string, JSZip.JSZipObject>();
  const errors: string[] = [];

  try {
    const zip = await JSZip.loadAsync(file);

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return; // Skip directories

      // Extract filename without parent directories
      const baseName = relativePath.split('/').pop() || relativePath;
      const normalized = baseName.trim().toLowerCase();

      if (fileNames.has(normalized)) {
        errors.push(`Duplicate filename inside ZIP: "${baseName}"`);
      }

      fileNames.add(normalized);
      rawList.push(baseName);
      fileMap.set(normalized, zipEntry);
    });

    return {
      fileName: file.name,
      fileCount: fileNames.size,
      fileNames,
      rawList,
      fileMap,
      errors
    };
  } catch (err: any) {
    throw new Error(`Failed to read ZIP archive "${file.name}": ${err?.message || 'Invalid ZIP format'}`);
  }
}

/**
 * Creates a downloadable Blob URL for a generated or fetched dummy file
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
