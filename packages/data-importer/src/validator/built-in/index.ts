import { ValidationError, ValidationRule, ValidationSeverity } from '../../types';

export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export const PHONE_REGEX =
  /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

export const builtInValidators = {
  required: (
    message = 'This field is required',
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'required',
    severity,
    validator: (value, _row, context) => {
      const isEmpty =
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '');
      if (isEmpty) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'REQUIRED',
          message,
          severity,
          value
        };
      }
      return null;
    }
  }),

  email: (
    message = 'Invalid email address format',
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'email',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const str = String(value).trim();
      if (!EMAIL_REGEX.test(str)) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'INVALID_EMAIL',
          message,
          severity,
          value
        };
      }
      return null;
    }
  }),

  phone: (
    message = 'Invalid phone number format',
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'phone',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const str = String(value).trim();
      if (!PHONE_REGEX.test(str)) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'INVALID_PHONE',
          message,
          severity,
          value
        };
      }
      return null;
    }
  }),

  number: (
    message = 'Must be a valid number',
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'number',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const num = typeof value === 'number' ? value : Number(value);
      if (isNaN(num)) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'INVALID_NUMBER',
          message,
          severity,
          value
        };
      }
      return null;
    }
  }),

  integer: (
    message = 'Must be an integer',
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'integer',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const num = typeof value === 'number' ? value : Number(value);
      if (isNaN(num) || !Number.isInteger(num)) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'INVALID_INTEGER',
          message,
          severity,
          value
        };
      }
      return null;
    }
  }),

  date: (
    message = 'Must be a valid date',
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'date',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      let isValid = false;
      if (value instanceof Date) {
        isValid = !isNaN(value.getTime());
      } else if (typeof value === 'string' || typeof value === 'number') {
        const time = Date.parse(String(value));
        isValid = !isNaN(time);
      }
      if (!isValid) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'INVALID_DATE',
          message,
          severity,
          value
        };
      }
      return null;
    }
  }),

  min: (
    minVal: number,
    message?: string,
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'min',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      if (!isNaN(num) && num < minVal) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'MIN_VALUE',
          message: message || `Value must be greater than or equal to ${minVal}`,
          severity,
          value
        };
      }
      return null;
    }
  }),

  max: (
    maxVal: number,
    message?: string,
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'max',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const num = Number(value);
      if (!isNaN(num) && num > maxVal) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'MAX_VALUE',
          message: message || `Value must be less than or equal to ${maxVal}`,
          severity,
          value
        };
      }
      return null;
    }
  }),

  minLength: (
    length: number,
    message?: string,
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'minLength',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const str = String(value);
      if (str.length < length) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'MIN_LENGTH',
          message: message || `Length must be at least ${length} characters`,
          severity,
          value
        };
      }
      return null;
    }
  }),

  maxLength: (
    length: number,
    message?: string,
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'maxLength',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const str = String(value);
      if (str.length > length) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'MAX_LENGTH',
          message: message || `Length cannot exceed ${length} characters`,
          severity,
          value
        };
      }
      return null;
    }
  }),

  regex: (
    pattern: RegExp,
    message = 'Value does not match required format',
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'regex',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const str = String(value);
      if (!pattern.test(str)) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'REGEX_MISMATCH',
          message,
          severity,
          value
        };
      }
      return null;
    }
  }),

  enum: (
    allowedValues: unknown[],
    message?: string,
    severity: ValidationSeverity = 'error'
  ): ValidationRule => ({
    name: 'enum',
    severity,
    validator: (value, _row, context) => {
      if (value === null || value === undefined || value === '') return null;
      const matches = allowedValues.some((v) =>
        typeof v === 'string' && typeof value === 'string'
          ? v.toLowerCase() === value.toLowerCase()
          : v === value
      );
      if (!matches) {
        return {
          rowId: String(context.rowIndex),
          field: context.field,
          code: 'INVALID_ENUM',
          message: message || `Value must be one of: ${allowedValues.join(', ')}`,
          severity,
          value
        };
      }
      return null;
    }
  })
};

export const {
  required,
  email,
  phone,
  number,
  integer,
  date,
  min,
  max,
  minLength,
  maxLength,
  regex,
  enum: isEnum
} = builtInValidators;
