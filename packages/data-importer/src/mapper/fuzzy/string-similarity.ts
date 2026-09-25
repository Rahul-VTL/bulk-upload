/**
 * String similarity computation using Levenshtein distance and Trigram similarity
 */

export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1, // deletion
        currRow[j - 1] + 1, // insertion
        prevRow[j - 1] + cost // substitution
      );
    }
    for (let j = 0; j <= n; j++) {
      prevRow[j] = currRow[j];
    }
  }

  return prevRow[n];
}

export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(a, b);
  return 1.0 - distance / maxLen;
}

export function trigramSimilarity(a: string, b: string): number {
  const s1 = '  ' + a.toLowerCase() + '  ';
  const s2 = '  ' + b.toLowerCase() + '  ';

  const trigrams1 = new Set<string>();
  for (let i = 0; i < s1.length - 2; i++) {
    trigrams1.add(s1.slice(i, i + 3));
  }

  const trigrams2 = new Set<string>();
  for (let i = 0; i < s2.length - 2; i++) {
    trigrams2.add(s2.slice(i, i + 3));
  }

  let intersection = 0;
  for (const t of trigrams1) {
    if (trigrams2.has(t)) {
      intersection++;
    }
  }

  const union = trigrams1.size + trigrams2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const lev = levenshteinSimilarity(a, b);
  const tri = trigramSimilarity(a, b);
  return Number(((lev * 0.4 + tri * 0.6)).toFixed(3));
}
