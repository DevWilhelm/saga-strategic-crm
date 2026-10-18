import type { DelimiterType, ParseSheetResult } from '../types';

export const SUPPORTED_EXTENSIONS = [
  '.xlsx',
  '.xlsm',
  '.xlsb',
  '.xls',
  '.ods',
  '.csv',
  '.tsv',
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMPORT_ROWS = 500;

/**
 * Detects whether a file name ends with one of the supported spreadsheet extensions.
 */
export function isSupportedSpreadsheetFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Detects CSV/TSV delimiter based on the first line (comma, semicolon, or tab).
 */
export function detectDelimiter(headerLine: string): DelimiterType {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semiCount = (headerLine.match(/;/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) return '\t';
  if (semiCount > commaCount && semiCount > tabCount) return ';';
  return ',';
}

/**
 * Reads a spreadsheet file (Excel or CSV/TSV) and extracts raw sheet data.
 *
 * Rules enforced:
 * 1. File size <= 5 MB.
 * 2. UTF-8 decoding for CSV/TSV with BOM stripping (handles Burmese, Thai, accented text).
 * 3. Never evaluate formulas: raw cell values only, kept as plain text.
 * 4. Password-protected workbook error handling ("Remove the password and try again").
 * 5. Skips fully empty rows.
 * 6. Returns sheet names and lets caller pick sheet (default: "Accounts" or first).
 */
export async function parseSpreadsheetFile(
  file: File,
  targetSheetName?: string
): Promise<ParseSheetResult> {
  // 1. File size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds the 5 MB size limit. Please choose a smaller file.');
  }

  // 2. Extension validation
  if (!isSupportedSpreadsheetFile(file.name)) {
    throw new Error(
      `Unsupported file type. Please choose a file ending in: ${SUPPORTED_EXTENSIONS.join(', ')}`
    );
  }

  const XLSX = await import('xlsx');
  const lowerName = file.name.toLowerCase();
  const isCsvOrTsv = lowerName.endsWith('.csv') || lowerName.endsWith('.tsv');

  let workbook: import('xlsx').WorkBook;
  let detectedDelimiter: DelimiterType | undefined;

  try {
    if (isCsvOrTsv) {
      // Read raw text as UTF-8 so international scripts (Burmese, Thai, Chinese) survive
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let text = decoder.decode(arrayBuffer);

      // Strip UTF-8 BOM if present
      if (text.charCodeAt(0) === 0xfeff) {
        text = text.slice(1);
      }

      // Detect delimiter from first non-empty line
      const firstLine = text.split(/\r?\n/).find((line) => line.trim().length > 0) || '';
      detectedDelimiter = detectDelimiter(firstLine);

      // Read text using raw string parser without evaluating formulas
      workbook = XLSX.read(text, {
        type: 'string',
        raw: true,
        cellFormula: false,
        cellHTML: false,
      });
    } else {
      // Read binary buffer for Excel / ODS
      const buffer = await file.arrayBuffer();
      workbook = XLSX.read(buffer, {
        type: 'array',
        raw: true,
        cellFormula: false,
        cellHTML: false,
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    if (
      errorMsg.includes('password') ||
      errorMsg.includes('encrypted') ||
      errorMsg.includes('protected')
    ) {
      throw new Error('Remove the password and try again', { cause: err });
    }
    throw new Error(
      `Failed to read spreadsheet: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err }
    );
  }

  const sheetNames = workbook.SheetNames || [];
  if (sheetNames.length === 0) {
    throw new Error('The workbook contains no sheets or data.');
  }

  // Determine active sheet: user selected -> sheet named "Accounts" (case-insensitive) -> first sheet
  let selectedSheet = targetSheetName;
  if (!selectedSheet || !sheetNames.includes(selectedSheet)) {
    const accountsMatch = sheetNames.find(
      (name) => name.trim().toLowerCase() === 'accounts'
    );
    selectedSheet = accountsMatch || sheetNames[0];
  }

  const worksheet = workbook.Sheets[selectedSheet];
  if (!worksheet) {
    throw new Error(`Sheet "${selectedSheet}" could not be opened.`);
  }

  // Convert sheet to JSON array-of-arrays without formula evaluation
  const rawRowsAoa = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (!rawRowsAoa || rawRowsAoa.length === 0) {
    throw new Error('The selected sheet is completely empty.');
  }

  // Extract header row (first non-empty row)
  let headerRowIndex = 0;
  while (
    headerRowIndex < rawRowsAoa.length &&
    (!rawRowsAoa[headerRowIndex] ||
      rawRowsAoa[headerRowIndex].every((c) => !String(c).trim()))
  ) {
    headerRowIndex++;
  }

  if (headerRowIndex >= rawRowsAoa.length) {
    throw new Error('No header row found in the selected sheet.');
  }

  const headers = (rawRowsAoa[headerRowIndex] || []).map((h) => String(h || '').trim());
  const dataRowsAoa = rawRowsAoa.slice(headerRowIndex + 1);

  // Filter out fully empty rows
  const rawRows: Record<string, string>[] = [];
  dataRowsAoa.forEach((rowArray) => {
    const isFullyEmpty = rowArray.every((cell) => !cell || !String(cell).trim());
    if (isFullyEmpty) return;

    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const cellVal = rowArray[idx];
      rowObj[header] = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
    });
    rawRows.push(rowObj);
  });

  return {
    sheetName: selectedSheet,
    sheetNames,
    headers,
    rawRows,
    totalDataRows: rawRows.length,
    delimiter: detectedDelimiter,
  };
}
