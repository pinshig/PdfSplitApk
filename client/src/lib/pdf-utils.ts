/**
 * Validates the format and ranges of page ranges input
 */
export function validatePageRanges(input: string, pageCount: number): { valid: boolean; error?: string } {
  if (!input.trim()) {
    return {
      valid: false,
      error: "Please enter page ranges",
    };
  }

  // Check for basic format: digits and commas and dashes only
  if (!/^[\d,-]+$/.test(input)) {
    return {
      valid: false,
      error: "Invalid characters. Use only numbers, commas, and hyphens.",
    };
  }

  // Split by commas to get individual ranges
  const ranges = input.split(",");
  
  for (const range of ranges) {
    if (!range.trim()) {
      return {
        valid: false,
        error: "Empty ranges are not allowed",
      };
    }

    // Split by dash to get start and end page
    const parts = range.split("-");
    
    if (parts.length > 2) {
      return {
        valid: false,
        error: `Invalid range format: ${range}. Use format like 1-5.`,
      };
    }
    
    // Parse start page
    const start = parseInt(parts[0], 10);
    if (isNaN(start)) {
      return {
        valid: false,
        error: `Invalid number: ${parts[0]}`,
      };
    }
    
    if (start < 1) {
      return {
        valid: false,
        error: "Page numbers must start from 1",
      };
    }
    
    if (pageCount && start > pageCount) {
      return {
        valid: false,
        error: `Start page ${start} exceeds document length (${pageCount} pages)`,
      };
    }
    
    // If it's a range with start-end
    if (parts.length === 2) {
      const end = parseInt(parts[1], 10);
      
      if (isNaN(end)) {
        return {
          valid: false,
          error: `Invalid number: ${parts[1]}`,
        };
      }
      
      if (end < 1) {
        return {
          valid: false,
          error: "Page numbers must be positive",
        };
      }
      
      if (pageCount && end > pageCount) {
        return {
          valid: false,
          error: `End page ${end} exceeds document length (${pageCount} pages)`,
        };
      }
      
      if (start > end) {
        return {
          valid: false,
          error: `In range ${range}, start page cannot be greater than end page`,
        };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Parses the page ranges string into an array of page range objects
 */
export function parsePageRanges(input: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  
  const rangeStrings = input.split(",");
  
  for (const rangeStr of rangeStrings) {
    const parts = rangeStr.split("-");
    
    if (parts.length === 1) {
      // Single page
      const page = parseInt(parts[0], 10);
      ranges.push({ start: page, end: page });
    } else {
      // Page range
      const start = parseInt(parts[0], 10);
      const end = parseInt(parts[1], 10);
      ranges.push({ start, end });
    }
  }
  
  return ranges;
}
