import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import FileUpload from "./FileUpload";
import PageRangeInput from "./PageRangeInput";
import SplitButton from "./SplitButton";
import ProgressIndicator from "./ProgressIndicator";
import { validatePageRanges } from "@/lib/pdf-utils";
import { useToast } from "@/components/ui/use-toast";

interface PDFSplitterProps {
  isMobile: boolean;
}

const PDFSplitter = ({ isMobile }: PDFSplitterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [pageRanges, setPageRanges] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const { toast } = useToast();

  const handleFileSelect = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPageCount(0);
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setProgress(10);

    try {
      // Load PDF to get page count
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Using PDFjs to get the page count
      const loadingTask = (window as any).pdfjsLib.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;
      
      setPageCount(pdf.numPages);
      setProgress(100);
      
      toast({
        title: "PDF Loaded",
        description: `Successfully loaded PDF with ${pdf.numPages} pages.`,
      });
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to load PDF. Please try a different file.",
        variant: "destructive",
      });
      setFile(null);
      setPageCount(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!file || !pageCount) {
      toast({
        title: "Error",
        description: "Please upload a PDF file first.",
        variant: "destructive",
      });
      return;
    }

    // Validate page ranges
    const validationResult = validatePageRanges(pageRanges, pageCount);
    if (!validationResult.valid) {
      toast({
        title: "Invalid Page Ranges",
        description: validationResult.error,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Create form data to send to the server
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("pageRanges", pageRanges);

      // Send the request to the server
      const response = await fetch("/api/pdf/split", {
        method: "POST",
        body: formData,
      });

      // Start tracking progress
      let progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error splitting PDF");
      }

      // Get the split PDFs as a zip file
      const blob = await response.blob();
      clearInterval(progressInterval);
      setProgress(100);

      // Create a download link for the zip file
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name.replace(".pdf", "")}_split.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Your PDF has been split successfully!",
      });
    } catch (error) {
      console.error("Error splitting PDF:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to split PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>PDF Splitter</CardTitle>
        <CardDescription>
          Upload a PDF and specify page ranges to split
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload 
          onFileSelect={handleFileSelect} 
          isDisabled={isProcessing}
          isMobile={isMobile}
        />
        
        {pageCount > 0 && (
          <div className="text-sm text-gray-500">
            PDF has {pageCount} pages
          </div>
        )}
        
        <PageRangeInput 
          value={pageRanges} 
          onChange={setPageRanges}
          isDisabled={!file || isProcessing}
          pageCount={pageCount}
        />
        
        {isProcessing && (
          <ProgressIndicator progress={progress} />
        )}
      </CardContent>
      <CardFooter>
        <SplitButton 
          onClick={handleSplit} 
          isDisabled={!file || !pageRanges || isProcessing} 
          isProcessing={isProcessing}
        />
      </CardFooter>
    </Card>
  );
};

export default PDFSplitter;
