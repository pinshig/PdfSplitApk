import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
import { parsePageRanges } from "../client/src/lib/pdf-utils";

interface SplitPDFResult {
  path: string;
  name: string;
}

/**
 * Splits a PDF file based on specified page ranges
 * @param pdfPath Path to the original PDF file
 * @param pageRangesString String with page ranges (e.g. "1-5,7,9-12")
 * @param outputDir Directory to save the split PDFs
 * @returns Array of split PDF file paths and names
 */
export async function splitPDF(
  pdfPath: string,
  pageRangesString: string,
  outputDir: string
): Promise<SplitPDFResult[]> {
  try {
    // Load the PDF document
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    // Parse page ranges
    const pageRanges = parsePageRanges(pageRangesString);

    if (pageRanges.length === 0) {
      throw new Error("No valid page ranges specified");
    }

    // Make sure page ranges are valid
    for (const range of pageRanges) {
      if (range.start < 1 || range.start > pageCount) {
        throw new Error(`Start page ${range.start} is out of bounds (1-${pageCount})`);
      }
      if (range.end < 1 || range.end > pageCount) {
        throw new Error(`End page ${range.end} is out of bounds (1-${pageCount})`);
      }
      if (range.start > range.end) {
        throw new Error(`Start page ${range.start} is greater than end page ${range.end}`);
      }
    }

    // Create a new PDF for each range
    const results: SplitPDFResult[] = [];

    for (let i = 0; i < pageRanges.length; i++) {
      const range = pageRanges[i];
      const newPdf = await PDFDocument.create();
      
      // PDF pages are 0-indexed, but user input is 1-indexed
      const startIndex = range.start - 1;
      const endIndex = range.end - 1;
      
      // Copy pages from original to new PDF
      const copiedPages = await newPdf.copyPages(pdfDoc, Array.from(
        { length: endIndex - startIndex + 1 },
        (_, i) => startIndex + i
      ));
      
      // Add pages to new PDF
      copiedPages.forEach(page => {
        newPdf.addPage(page);
      });
      
      // Save the new PDF
      const outputFileName = `pages_${range.start}-${range.end}.pdf`;
      const outputPath = path.join(outputDir, outputFileName);
      
      const newPdfBytes = await newPdf.save();
      fs.writeFileSync(outputPath, newPdfBytes);
      
      results.push({
        path: outputPath,
        name: outputFileName
      });
    }

    return results;
  } catch (error) {
    console.error("Error splitting PDF:", error);
    throw error;
  }
}
