
export const MAX_UPLOAD_ROWS = 100000; // 1 lakh limit

export interface RowLimitResult {
  isValid: boolean;
  actualRows: number;
  maxRows: number;
  message: string;
  canTruncate: boolean;
}

export const validateRowLimit = (data: any[]): RowLimitResult => {
  const actualRows = data.length;
  const isValid = actualRows <= MAX_UPLOAD_ROWS;

  if (isValid) {
    return {
      isValid: true,
      actualRows,
      maxRows: MAX_UPLOAD_ROWS,
      message: `File contains ${actualRows.toLocaleString()} rows (within limit)`,
      canTruncate: false
    };
  }

  return {
    isValid: false,
    actualRows,
    maxRows: MAX_UPLOAD_ROWS,
    message: `Cannot support large data files. File contains ${actualRows.toLocaleString()} rows, but maximum supported is ${MAX_UPLOAD_ROWS.toLocaleString()} rows. Please reduce your file size or split it into smaller files.`,
    canTruncate: false
  };
};

export const truncateDataToLimit = (data: any[]): any[] => {
  if (data.length <= MAX_UPLOAD_ROWS) {
    return data;
  }
  
  console.warn(`Data truncated from ${data.length} to ${MAX_UPLOAD_ROWS} rows`);
  return data.slice(0, MAX_UPLOAD_ROWS);
};
