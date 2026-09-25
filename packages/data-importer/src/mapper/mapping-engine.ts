import {
  ColumnDefinition,
  ColumnMapping,
  ImporterSchema,
  MappingStrategy,
  MappingStatus
} from '../types';
import { normalizeHeaderString } from '../parser/header-detector';
import { calculateSimilarity } from './fuzzy/string-similarity';

export interface MappingEngineOptions {
  autoMapThreshold?: number; // default 0.6
  lowConfidenceThreshold?: number; // default 0.75
}

export interface CandidateMatch {
  field: string;
  confidence: number;
  strategy: MappingStrategy;
}

export class MappingEngine {
  private schema: ImporterSchema;
  private autoMapThreshold: number;
  private lowConfidenceThreshold: number;

  constructor(schema: ImporterSchema, options?: MappingEngineOptions) {
    this.schema = schema;
    this.autoMapThreshold = options?.autoMapThreshold ?? 0.6;
    this.lowConfidenceThreshold = options?.lowConfidenceThreshold ?? 0.75;
  }

  /**
   * Generates mappings for a list of source column headers
   */
  mapHeaders(
    sourceHeaders: string[],
    sampleRows: Record<string, unknown>[] = []
  ): ColumnMapping[] {
    const mappings: ColumnMapping[] = [];
    const usedTargetFields = new Set<string>();

    // Pass 1: Find best candidate for each source header
    const candidatesPerHeader: { header: string; candidates: CandidateMatch[] }[] = [];

    for (const header of sourceHeaders) {
      const candidates = this.findCandidates(header);
      candidatesPerHeader.push({ header, candidates });
    }

    // Sort mappings by confidence descending so higher confidence gets priority
    const allPairs: {
      header: string;
      field: string;
      confidence: number;
      strategy: MappingStrategy;
    }[] = [];

    for (const item of candidatesPerHeader) {
      for (const cand of item.candidates) {
        allPairs.push({
          header: item.header,
          field: cand.field,
          confidence: cand.confidence,
          strategy: cand.strategy
        });
      }
    }

    allPairs.sort((a, b) => b.confidence - a.confidence);

    const mappedHeaders = new Map<string, { field: string; confidence: number; strategy: MappingStrategy }>();

    for (const pair of allPairs) {
      if (mappedHeaders.has(pair.header)) continue;
      if (usedTargetFields.has(pair.field)) continue;

      if (pair.confidence >= this.autoMapThreshold) {
        mappedHeaders.set(pair.header, {
          field: pair.field,
          confidence: pair.confidence,
          strategy: pair.strategy
        });
        usedTargetFields.add(pair.field);
      }
    }

    // Assemble final ColumnMapping array
    for (const header of sourceHeaders) {
      const match = mappedHeaders.get(header);
      const samples = sampleRows
        .slice(0, 5)
        .map((r) => r[header])
        .filter((v) => v !== undefined && v !== '');

      if (match) {
        mappings.push({
          sourceColumn: header,
          targetField: match.field,
          confidence: match.confidence,
          strategy: match.strategy,
          sampleValues: samples
        });
      } else {
        // Unmapped
        mappings.push({
          sourceColumn: header,
          targetField: null,
          confidence: 0,
          strategy: 'manual',
          sampleValues: samples
        });
      }
    }

    return mappings;
  }

  /**
   * Evaluates mapping status
   */
  getMappingStatus(mapping: ColumnMapping): MappingStatus {
    if (!mapping.targetField) return 'unmapped';
    if (mapping.confidence < this.lowConfidenceThreshold) return 'low-confidence';
    return 'mapped';
  }

  /**
   * Finds candidate schema fields for a given source column header
   */
  public findCandidates(sourceHeader: string): CandidateMatch[] {
    const candidates: CandidateMatch[] = [];
    const trimmed = sourceHeader.trim();
    const lower = trimmed.toLowerCase();
    const normalized = normalizeHeaderString(trimmed);

    for (const col of this.schema) {
      const colKey = col.key;
      const colKeyLower = colKey.toLowerCase();
      const colLabel = col.label;
      const colLabelLower = colLabel.toLowerCase();

      // 1. Exact match
      if (trimmed === colKey || trimmed === colLabel) {
        candidates.push({ field: colKey, confidence: 1.0, strategy: 'exact' });
        continue;
      }

      // 2. Case-insensitive match
      if (lower === colKeyLower || lower === colLabelLower) {
        candidates.push({ field: colKey, confidence: 0.98, strategy: 'case-insensitive' });
        continue;
      }

      // 3. Alias match
      if (col.aliases && col.aliases.length > 0) {
        let aliasMatch = false;
        for (const alias of col.aliases) {
          if (alias.trim().toLowerCase() === lower) {
            candidates.push({ field: colKey, confidence: 0.95, strategy: 'alias' });
            aliasMatch = true;
            break;
          }
        }
        if (aliasMatch) continue;
      }

      // 4. Normalized match
      const colNormKey = normalizeHeaderString(colKey);
      const colNormLabel = normalizeHeaderString(colLabel);
      if (normalized === colNormKey || normalized === colNormLabel) {
        candidates.push({ field: colKey, confidence: 0.9, strategy: 'normalized' });
        continue;
      }

      // Check normalized aliases
      if (col.aliases && col.aliases.length > 0) {
        let normAliasMatch = false;
        for (const alias of col.aliases) {
          if (normalizeHeaderString(alias) === normalized) {
            candidates.push({ field: colKey, confidence: 0.88, strategy: 'alias' });
            normAliasMatch = true;
            break;
          }
        }
        if (normAliasMatch) continue;
      }

      // 5. Fuzzy match
      const keySim = calculateSimilarity(lower, colKeyLower);
      const labelSim = calculateSimilarity(lower, colLabelLower);
      let maxAliasSim = 0;
      if (col.aliases) {
        for (const alias of col.aliases) {
          const sim = calculateSimilarity(lower, alias.toLowerCase());
          if (sim > maxAliasSim) maxAliasSim = sim;
        }
      }

      const bestSim = Math.max(keySim, labelSim, maxAliasSim);
      if (bestSim >= this.autoMapThreshold) {
        candidates.push({
          field: colKey,
          confidence: Number((bestSim * 0.85).toFixed(3)), // slightly discount fuzzy match
          strategy: 'fuzzy'
        });
      }
    }

    return candidates.sort((a, b) => b.confidence - a.confidence);
  }
}
