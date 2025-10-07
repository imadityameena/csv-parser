import { DOCTOR_ROSTER_SCHEMA, OPBILLING_SCHEMA } from './schemas';

export interface ValidationError {
  field: string;
  message: string;
  type: 'MISSING_FIELD' | 'TYPE_MISMATCH' | 'FORMAT_ERROR' | 'EMPTY_VALUE' | 'OUTLIER' | 'EXTRA_FIELD' | 'DUPLICATE' | 'NEGATIVE_VALUE' | 'INVALID_RANGE' | 'FUTURE_DATE' | 'BILLING_ERROR' | 'DELAYED_PAYMENT';
  row?: number;
  column?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationSummary {
  totalRows: number;
  totalFields: number;
  schemaUsed: string;
  validRows: number;
  errorRows: number;
  warningCount: number;
  emptyValuePercentage: number;
  dataQualityScore: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: ValidationSummary;
  aiSuggestions?: string[];
  fallbackLevel?: 'industry' | 'dynamic' | 'all-purpose';
  fallbackMessage?: string;
  insights?: string[];
}

// Enhanced date format patterns
const DATE_FORMATS = [
  { pattern: /^\d{4}-\d{2}-\d{2}$/, name: 'YYYY-MM-DD (ISO)' },
  { pattern: /^\d{2}\/\d{2}\/\d{4}$/, name: 'MM/DD/YYYY (US)' },
  { pattern: /^\d{2}-\d{2}-\d{4}$/, name: 'MM-DD-YYYY' },
  { pattern: /^\d{4}\/\d{2}\/\d{2}$/, name: 'YYYY/MM/DD' },
  { pattern: /^\d{1,2}\/\d{1,2}\/\d{4}$/, name: 'M/D/YYYY' },
  { pattern: /^\d{1,2}-\d{1,2}-\d{4}$/, name: 'M-D-YYYY' },
  { pattern: /^\d{2}\/\d{2}\/\d{2}$/, name: 'MM/DD/YY' },
  { pattern: /^\d{4}-\d{1,2}-\d{1,2}$/, name: 'YYYY-M-D' },
  { pattern: /^\d{1,2}\/\d{1,2}\/\d{2}$/, name: 'M/D/YY' },
  { pattern: /^\d{2}\.\d{2}\.\d{4}$/, name: 'DD.MM.YYYY (European)' },
  { pattern: /^\d{1,2}\.\d{1,2}\.\d{4}$/, name: 'D.M.YYYY' },
];

// Schema requirements for each industry
const SCHEMA_REQUIREMENTS = {
  doctor_roster: DOCTOR_ROSTER_SCHEMA,
  opbilling: OPBILLING_SCHEMA,
  others: { required: [], optional: [], types: {} }
};

// All-Purpose fallback schema for Layer 3
const ALL_PURPOSE_SCHEMA = {
  required: [],
  optional: [],
  types: {} as Record<string, string>,
  inferTypes: true
};

// Enhanced date validation with multiple format support
const validateDate = (value: string, fieldName: string): ValidationError | null => {
  if (!value || value.toString().trim() === '') return null;
  
  const dateStr = value.toString().trim();
  const validFormat = DATE_FORMATS.find(format => format.pattern.test(dateStr));
  
  if (!validFormat) {
    return {
      field: fieldName,
      message: `Invalid date format for "${fieldName}". Expected formats: ${DATE_FORMATS.map(f => f.name).join(', ')}`,
      type: 'FORMAT_ERROR',
      severity: 'error'
    };
  }
  
  // Additional validation for future dates
  try {
    const date = new Date(dateStr);
    if (date > new Date()) {
  return {
        field: fieldName,
        message: `Future date detected in "${fieldName}": ${dateStr}`,
        type: 'FUTURE_DATE',
        severity: 'warning'
      };
    }
  } catch (error) {
    return {
      field: fieldName,
      message: `Invalid date value for "${fieldName}": ${dateStr}`,
      type: 'FORMAT_ERROR',
      severity: 'error'
    };
  }
  
  return null;
};

// Enhanced number validation
const validateNumber = (value: string, fieldName: string, allowNegative = true): ValidationError | null => {
  if (!value || value.toString().trim() === '') return null;
  
  const numStr = value.toString().trim();
  const num = parseFloat(numStr);
  
  if (isNaN(num)) {
    return {
      field: fieldName,
      message: `Invalid number format for "${fieldName}": ${numStr}`,
      type: 'TYPE_MISMATCH',
      severity: 'error'
    };
  }
  
  if (!allowNegative && num < 0) {
    return {
      field: fieldName,
      message: `Negative value not allowed for "${fieldName}": ${num}`,
      type: 'NEGATIVE_VALUE',
      severity: 'error'
    };
  }

  return null;
};

// Field matching function
const findBestFieldMatch = (requiredField: string, headers: string[]): string | null => {
  const requiredLower = requiredField.toLowerCase();
  
  // Exact match
  const exactMatch = headers.find(h => h.toLowerCase() === requiredLower);
  if (exactMatch) return exactMatch;
  
  // Partial match
  const partialMatch = headers.find(h => 
    h.toLowerCase().includes(requiredLower) || 
    requiredLower.includes(h.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  // Word-based match
  const requiredWords = requiredLower.split(/[\s_-]+/);
  const wordMatch = headers.find(h => {
    const headerWords = h.toLowerCase().split(/[\s_-]+/);
    return requiredWords.some(word => 
      headerWords.some(hWord => hWord.includes(word) || word.includes(hWord))
    );
  });
  
  return wordMatch || null;
};

// Data type inference
const inferDataTypes = (data: any[], headers: string[]): Record<string, string> => {
  const types: Record<string, string> = {};

  headers.forEach(header => {
    const values = data.slice(0, Math.min(10, data.length)).map(row => row[header]);
    const nonEmptyValues = values.filter(val => val !== '' && val !== null && val !== undefined);

    if (nonEmptyValues.length === 0) {
      types[header] = 'string';
      return;
    }

    // Check if all values are numbers
    const allNumbers = nonEmptyValues.every(val => !isNaN(parseFloat(val.toString())));
    if (allNumbers) {
      types[header] = 'number';
      return;
    }
    
    // Check if all values are dates
    const allDates = nonEmptyValues.every(val => {
      const dateStr = val.toString().trim();
      return DATE_FORMATS.some(format => format.pattern.test(dateStr));
    });
    if (allDates) {
      types[header] = 'date';
      return;
    }
    
    // Default to string
    types[header] = 'string';
  });

  return types;
};

// Core validation logic
const runValidation = (
  data: any[],
  schema: any,
  schemaName: string,
  fallbackLevel?: 'industry' | 'dynamic' | 'all-purpose'
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const headers = Object.keys(data[0] || {});

  const { required, optional, types } = schema;

  // Missing headers detection with AI suggestions
  const missingHeaders: string[] = [];
  const mappedHeaders: Record<string, string> = {};
  const aiSuggestions: string[] = [];

  // Check for missing required headers (skip for all-purpose schema)
  if (fallbackLevel !== 'all-purpose') {
    for (const requiredField of required) {
      const matchedHeader = findBestFieldMatch(requiredField, headers);
      if (matchedHeader) {
        mappedHeaders[requiredField] = matchedHeader;
      } else {
        missingHeaders.push(requiredField);
        errors.push({
          field: requiredField,
          message: `Required field "${requiredField}" is missing from your CSV headers`,
          type: 'MISSING_FIELD',
          severity: 'error'
        });

        // AI suggestions for missing headers
        const suggestions = headers.filter(h =>
          h.toLowerCase().includes(requiredField.toLowerCase().split(' ')[0])
        );
        if (suggestions.length > 0) {
          aiSuggestions.push(`Consider mapping "${suggestions[0]}" to "${requiredField}"`);
        }
      }
    }
  } else {
    // For all-purpose schema, map all headers directly
    headers.forEach(header => {
      mappedHeaders[header] = header;
    });
  }

  // Extra unexpected fields (soft warning, skip for all-purpose)
  if (fallbackLevel !== 'all-purpose') {
    const expectedFields = [...required, ...optional];
    headers.forEach(header => {
      const isExpected = expectedFields.some(field => 
        findBestFieldMatch(field, [header]) === header
    );
      if (!isExpected) {
      warnings.push({
          field: header,
          message: `Unexpected field "${header}" found. Consider removing or mapping to a schema field.`,
        type: 'EXTRA_FIELD',
        severity: 'warning'
      });
      }
    });
  }

  // Data validation
  let validRows = 0;
  let errorRows = 0;
  let emptyValueCount = 0;
  let totalValueCount = 0;

  data.forEach((row, rowIndex) => {
    let rowHasErrors = false;
    let rowEmptyValues = 0;
    let rowTotalValues = 0;

    // Validate each field
    Object.entries(mappedHeaders).forEach(([schemaField, csvField]) => {
      const value = row[csvField];
      rowTotalValues++;
      totalValueCount++;

      if (value === '' || value === null || value === undefined) {
        rowEmptyValues++;
        emptyValueCount++;
        
        if (required.includes(schemaField)) {
          errors.push({
            field: schemaField,
            message: `Required field "${schemaField}" is empty in row ${rowIndex + 1}`,
          type: 'EMPTY_VALUE',
          row: rowIndex + 1,
            column: csvField,
            severity: 'error'
          });
          rowHasErrors = true;
        }
      } else {
        // Type validation
        const expectedType = types[schemaField];
      if (expectedType) {
          let validationError: ValidationError | null = null;
          
          if (expectedType === 'date') {
            validationError = validateDate(value.toString(), schemaField);
          } else if (expectedType === 'number') {
            validationError = validateNumber(value.toString(), schemaField);
          }
          
          if (validationError) {
            validationError.row = rowIndex + 1;
            validationError.column = csvField;
            errors.push(validationError);
          rowHasErrors = true;
          }
        }
      }
    });

    if (rowHasErrors) {
      errorRows++;
    } else {
      validRows++;
    }
  });

  // Calculate data quality score
  const emptyValuePercentage = totalValueCount > 0 ? (emptyValueCount / totalValueCount) * 100 : 0;
  const dataQualityScore = Math.max(0, 100 - (errors.length * 2) - (warnings.length * 1) - (emptyValuePercentage / 2));

  // Generate insights
  const insights = [
    `Dataset contains ${data.length} records with ${headers.length} fields`,
    `Data quality score: ${Math.round(dataQualityScore)}% based on completeness and validation`,
    `Found ${validRows} valid rows out of ${data.length} total records`,
    `Empty value rate: ${emptyValuePercentage.toFixed(1)}% across all fields`,
    `Schema compliance: ${schemaName} validation completed`,
    `Recommendation: ${errors.length > 0 ? 'Address validation errors for better data quality' : 'Data quality is excellent, ready for analysis'}`
  ];

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRows: data.length,
      totalFields: headers.length,
      schemaUsed: schemaName,
      validRows,
      errorRows,
      warningCount: warnings.length,
      emptyValuePercentage,
      dataQualityScore
    },
    aiSuggestions,
    fallbackLevel,
    insights
  };
};

// 3-Layer Fallback Validation System
export const validateCSVData = (data: any[], industry: string): ValidationResult => {
  console.log('🚀 Starting 3-Layer Fallback Validation System...');

  if (!data || data.length === 0) {
    return {
      isValid: false,
      errors: [{ field: 'File', message: 'No data found in CSV file', type: 'FORMAT_ERROR', severity: 'error' }],
      warnings: [],
      summary: {
        totalRows: 0,
        totalFields: 0,
        schemaUsed: 'None',
        validRows: 0,
        errorRows: 0,
        warningCount: 0,
        emptyValuePercentage: 0,
        dataQualityScore: 0
      }
    };
  }

  const headers = Object.keys(data[0] || {});

  // LAYER 1: Selected Industry Format
  console.log(`🎯 Layer 1: Testing selected industry format: ${industry}`);

  const selectedSchema = SCHEMA_REQUIREMENTS[industry as keyof typeof SCHEMA_REQUIREMENTS] || SCHEMA_REQUIREMENTS.others;

  const industryResult = runValidation(data, selectedSchema, industry === 'others' ? 'Generic' : industry.charAt(0).toUpperCase() + industry.slice(1), 'industry');

  // If industry validation is successful, return it
  if (industryResult.isValid || industry === 'others') {
    console.log('✅ Layer 1: Industry format validation successful!');
    return industryResult;
  }

  // Check if the failure is due to structural issues (many missing fields or type mismatches)
  const structuralErrors = industryResult.errors.filter(e =>
    e.type === 'MISSING_FIELD' || e.type === 'TYPE_MISMATCH' || e.type === 'FORMAT_ERROR'
  ).length;

  // If we have too many structural errors, try fallback
  if (structuralErrors > headers.length * 0.5) {
    console.log('🔄 Layer 2: Too many structural errors, trying dynamic fallback...');
    
    // LAYER 2: Dynamic Schema Generation
    const inferredTypes = inferDataTypes(data, headers);
    const dynamicSchema = {
      required: [],
      optional: headers,
      types: inferredTypes
    };

    const dynamicResult = runValidation(data, dynamicSchema, 'Dynamic Schema', 'dynamic');
    
    if (dynamicResult.isValid || dynamicResult.errors.length < industryResult.errors.length) {
      console.log('✅ Layer 2: Dynamic schema validation successful!');
      return dynamicResult;
    }
    
    console.log('🔄 Layer 3: Trying all-purpose fallback...');
    
    // LAYER 3: All-Purpose Fallback
    const allPurposeResult = runValidation(data, ALL_PURPOSE_SCHEMA, 'All-Purpose Schema', 'all-purpose');
    console.log('✅ Layer 3: All-purpose fallback completed!');
    return allPurposeResult;
  }

  // If structural errors are manageable, return the industry result with suggestions
  console.log('⚠️ Layer 1: Industry validation completed with errors, but manageable');
  return industryResult;
};