export interface HeaderDetectionResult {
  headers: string[];
  dataRows: string[][];
  confidence: number;
  hasHeaders: boolean;
}

/**
 * Detects headers from rows.
 * If hasHeaders is explicit, uses first row or generates generic headers.
 * Otherwise uses heuristics: type difference between row 0 and subsequent rows, uniqueness, string ratio.
 */
export function detectHeaders(
  records: string[][],
  assumeHeaders = true
): HeaderDetectionResult {
  if (records.length === 0) {
    return { headers: [], dataRows: [], confidence: 0, hasHeaders: false };
  }

  if (records.length === 1) {
    if (assumeHeaders) {
      return {
        headers: records[0],
        dataRows: [],
        confidence: 0.5,
        hasHeaders: true
      };
    }
    return {
      headers: records[0].map((_, i) => `Column_${i + 1}`),
      dataRows: records,
      confidence: 0.5,
      hasHeaders: false
    };
  }

  const firstRow = records[0];
  const sampleDataRows = records.slice(1, Math.min(records.length, 10));

  let score = 0;
  // 1. Are all first row items strings and non-empty?
  const firstRowNonEmpty = firstRow.filter((c) => c !== undefined && c.trim().length > 0);
  const nonEmptyRatio = firstRowNonEmpty.length / (firstRow.length || 1);
  if (nonEmptyRatio >= 0.8) score += 0.3;

  // 2. Are values in row 0 distinct?
  const uniqueCount = new Set(firstRow.map((c) => c.trim().toLowerCase())).size;
  if (uniqueCount === firstRow.length) score += 0.3;

  // 3. Are row 0 values mostly non-numeric while row 1+ have numbers?
  let row0HasNumbers = 0;
  for (const c of firstRow) {
    if (c.trim().length > 0 && !isNaN(Number(c.trim()))) {
      row0HasNumbers++;
    }
  }

  let subsequentHasNumbers = 0;
  let subsequentTotal = 0;
  for (const row of sampleDataRows) {
    for (const c of row) {
      subsequentTotal++;
      if (c && c.trim().length > 0 && !isNaN(Number(c.trim()))) {
        subsequentHasNumbers++;
      }
    }
  }

  if (row0HasNumbers === 0 && subsequentHasNumbers > 0) {
    score += 0.4;
  } else if (row0HasNumbers < firstRow.length / 2) {
    score += 0.2;
  }

  const confidence = Math.min(1, Math.max(0, score));
  const hasHeaders = assumeHeaders || confidence >= 0.5;

  if (hasHeaders) {
    return {
      headers: firstRow,
      dataRows: records.slice(1),
      confidence,
      hasHeaders: true
    };
  } else {
    const generatedHeaders = firstRow.map((_, i) => `Column_${i + 1}`);
    return {
      headers: generatedHeaders,
      dataRows: records,
      confidence,
      hasHeaders: false
    };
  }
}

/**
 * Cleans header names:
 * - Replaces empty headers with `Column_{index}`
 * - Resolves duplicates by appending `_1`, `_2`, etc.
 * - Trims whitespace
 */
export function sanitizeHeaders(rawHeaders: string[]): string[] {
  const result: string[] = [];
  const counts = new Map<string, number>();

  for (let i = 0; i < rawHeaders.length; i++) {
    let header = (rawHeaders[i] ?? '').trim();
    if (!header) {
      header = `Column_${i + 1}`;
    }

    const lower = header.toLowerCase();
    const count = counts.get(lower) ?? 0;
    counts.set(lower, count + 1);

    if (count > 0) {
      result.push(`${header}_${count}`);
    } else {
      result.push(header);
    }
  }

  return result;
}

/**
 * Normalizes header string for comparison (lowercased, spaces/hyphens/underscores stripped)
 */
export function normalizeHeaderString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
}
