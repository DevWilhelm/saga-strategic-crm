export interface ColumnDefinition {
  key: string;
  header: string; // e.g. "Name*"
  label: string;
  required: boolean;
  aliases: string[];
  example?: string;
  description?: string;
  acceptedValues?: string;
  maxLength?: number;
  exportOnly?: boolean;
}

export interface ImportExportConfig<TModel = Record<string, unknown>, TRow = Record<string, unknown>> {
  entityName: string;
  templateFilename: string;
  defaultSheetName: string;
  columns: ColumnDefinition[];
  maxRows: number;
  maxSizeBytes: number;
  instructions: {
    title: string;
    rules: string[];
  };
  transformRow?: (rawRow: Record<string, unknown>, context?: unknown) => TRow;
  modelToExportRow?: (model: TModel, context?: unknown) => Record<string, unknown>;
}

export type DelimiterType = ',' | ';' | '\t';

export interface ParseSheetResult {
  sheetName: string;
  sheetNames: string[];
  headers: string[];
  rawRows: Record<string, string>[];
  totalDataRows: number;
  delimiter?: DelimiterType;
}

export type RowValidationStatus = 'VALID' | 'ERROR' | 'DUPLICATE';

export interface RowValidationError {
  field: string;
  message: string;
}

export interface ValidatedImportRow<T = Record<string, unknown>> {
  rowNumber: number;
  status: RowValidationStatus;
  data: T;
  raw: Record<string, string>;
  errors: RowValidationError[];
  duplicateReason?: string;
}
