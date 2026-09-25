import { TransformFn, TransformRule } from '../../types';

export const builtInTransformers: Record<string, () => TransformRule> = {
  trim: (): TransformRule => ({
    name: 'trim',
    transform: (value) => (typeof value === 'string' ? value.trim() : value)
  }),

  uppercase: (): TransformRule => ({
    name: 'uppercase',
    transform: (value) => (typeof value === 'string' ? value.toUpperCase() : value)
  }),

  lowercase: (): TransformRule => ({
    name: 'lowercase',
    transform: (value) => (typeof value === 'string' ? value.toLowerCase() : value)
  }),

  capitalize: (): TransformRule => ({
    name: 'capitalize',
    transform: (value) => {
      if (typeof value !== 'string' || !value) return value;
      return value.replace(/\b\w/g, (char) => char.toUpperCase());
    }
  }),

  removeWhitespace: (): TransformRule => ({
    name: 'removeWhitespace',
    transform: (value) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value)
  }),

  stringToNumber: (): TransformRule => ({
    name: 'stringToNumber',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'number') return isNaN(value) ? null : value;
      if (typeof value === 'string') {
        // Strip common currency symbols, spaces, commas
        const cleaned = value.replace(/[$€£¥₹\s,]/g, '').trim();
        const num = Number(cleaned);
        return isNaN(num) ? value : num;
      }
      return value;
    }
  }),

  stringToBoolean: (): TransformRule => ({
    name: 'stringToBoolean',
    transform: (value) => {
      if (typeof value === 'boolean') return value;
      if (value === null || value === undefined || value === '') return null;
      const str = String(value).trim().toLowerCase();
      if (['true', 'yes', 'y', '1', 't', 'active'].includes(str)) return true;
      if (['false', 'no', 'n', '0', 'f', 'inactive'].includes(str)) return false;
      return value;
    }
  }),

  stringToDate: (): TransformRule => ({
    name: 'stringToDate',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return null;
      if (value instanceof Date) return isNaN(value.getTime()) ? null : value.toISOString();
      const str = String(value).trim();
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        return new Date(parsed).toISOString();
      }
      return value;
    }
  }),

  normalizeDate: (format = 'YYYY-MM-DD'): TransformRule => ({
    name: 'normalizeDate',
    transform: (value) => {
      if (value === null || value === undefined || value === '') return null;
      const str = String(value).trim();
      // Handle common formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD
      let date: Date | null = null;
      if (value instanceof Date) {
        date = value;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      } else {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
          date = d;
        }
      }

      if (date && !isNaN(date.getTime())) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        if (format === 'YYYY-MM-DD') return `${y}-${m}-${d}`;
        if (format === 'DD-MM-YYYY') return `${d}-${m}-${y}`;
        if (format === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
        return `${y}-${m}-${d}`;
      }
      return value;
    }
  })
};

export const {
  trim,
  uppercase,
  lowercase,
  capitalize,
  removeWhitespace,
  stringToNumber,
  stringToBoolean,
  stringToDate,
  normalizeDate
} = builtInTransformers;
