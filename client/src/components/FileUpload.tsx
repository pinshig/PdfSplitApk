import { ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  isDisabled: boolean;
  isMobile: boolean;
}

const FileUpload = ({ onFileSelect, isDisabled, isMobile }: FileUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type !== "application/pdf") {
        alert("Please select a PDF file");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onFileSelect(null);
        return;
      }
      onFileSelect(selectedFile);
    } else {
      onFileSelect(null);
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select PDF File
      </label>
      <div className={isMobile ? "flex flex-col space-y-2" : "flex gap-2"}>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          disabled={isDisabled}
          className="hidden"
          data-testid="pdf-file-input"
        />
        <Button
          type="button"
          onClick={handleButtonClick}
          disabled={isDisabled}
          className="w-full"
          variant="outline"
        >
          Choose PDF File
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;
