import type { ColumnDefinition } from '../types';

/**
 * Normalizes a raw column header string:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips all spaces, underscores, dashes, and asterisks
 * Example: " Business line* " -> "businessline"
 * Example: "Account_Name" -> "accountname"
 */
export function normalizeHeader(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s_\-*]+/g, '');
}

/**
 * Finds the matching ColumnDefinition for a given raw header string.
 */
export function matchHeaderToColumn(
  rawHeader: string,
  columns: ColumnDefinition[]
): ColumnDefinition | null {
  const normalized = normalizeHeader(rawHeader);
  if (!normalized) return null;

  for (const col of columns) {
    if (normalizeHeader(col.header) === normalized) return col;
    if (normalizeHeader(col.label) === normalized) return col;
    if (normalizeHeader(col.key) === normalized) return col;
    if (col.aliases.some((alias) => normalizeHeader(alias) === normalized)) {
      return col;
    }
  }

  return null;
}

export interface HeaderAnalysisResult {
  matchedColumns: Map<string, ColumnDefinition>; // header -> ColumnDefinition
  missingRequiredColumns: ColumnDefinition[];
  unknownHeaders: string[];
}

/**
 * Analyzes an array of raw headers against expected column definitions.
 */
export function analyzeHeaders(
  rawHeaders: string[],
  expectedColumns: ColumnDefinition[]
): HeaderAnalysisResult {
  const matchedColumns = new Map<string, ColumnDefinition>();
  const recognizedColKeys = new Set<string>();
  const unknownHeaders: string[] = [];

  for (const rawHeader of rawHeaders) {
    const col = matchHeaderToColumn(rawHeader, expectedColumns);
    if (col) {
      matchedColumns.set(rawHeader, col);
      recognizedColKeys.add(col.key);
    } else if (rawHeader.trim()) {
      unknownHeaders.push(rawHeader.trim());
    }
  }

  // Find missing required columns
  const missingRequiredColumns = expectedColumns.filter(
    (col) => col.required && !recognizedColKeys.has(col.key)
  );

  return {
    matchedColumns,
    missingRequiredColumns,
    unknownHeaders,
  };
}
