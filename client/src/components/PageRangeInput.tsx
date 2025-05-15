import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface PageRangeInputProps {
  value: string;
  onChange: (value: string) => void;
  isDisabled: boolean;
  pageCount: number;
}

const PageRangeInput = ({ value, onChange, isDisabled, pageCount }: PageRangeInputProps) => {
  const [error, setError] = useState<string | null>(null);

  // Check input format
  useEffect(() => {
    if (!value) {
      setError(null);
      return;
    }

    // Basic pattern check for page ranges
    const rangePattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/;
    if (!rangePattern.test(value)) {
      setError("Invalid format. Use: 1-5,7,9-12");
      return;
    }

    // Check each range
    const ranges = value.split(",");
    for (const range of ranges) {
      const parts = range.split("-");
      if (parts.length === 1) {
        const page = parseInt(parts[0]);
        if (isNaN(page) || page < 1 || (pageCount > 0 && page > pageCount)) {
          setError(`Page ${parts[0]} is out of range (1-${pageCount})`);
          return;
        }
      } else if (parts.length === 2) {
        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);
        
        if (isNaN(start) || isNaN(end)) {
          setError("Page numbers must be numeric");
          return;
        }
        
        if (start < 1 || (pageCount > 0 && start > pageCount)) {
          setError(`Start page ${start} is out of range (1-${pageCount})`);
          return;
        }
        
        if (end < 1 || (pageCount > 0 && end > pageCount)) {
          setError(`End page ${end} is out of range (1-${pageCount})`);
          return;
        }
        
        if (start > end) {
          setError(`Start page ${start} cannot be greater than end page ${end}`);
          return;
        }
      }
    }

    setError(null);
  }, [value, pageCount]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Page Ranges
      </label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
        placeholder="e.g. 1-5,7,9-12"
        className={error ? "border-red-500" : ""}
        data-testid="page-range-input"
      />
      {error && (
        <p className="text-red-500 text-xs mt-1" data-testid="page-range-error">
          {error}
        </p>
      )}
      <p className="text-xs text-gray-500">
        Specify page ranges separated by commas (e.g., 1-10,15,20-25)
      </p>
    </div>
  );
};

export default PageRangeInput;
