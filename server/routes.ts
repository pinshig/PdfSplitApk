import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { splitPDF } from "./pdf-service";
import archiver from "archiver";

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

// Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  
  // Route to split PDF
  app.post("/api/pdf/split", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No PDF file uploaded");
      }

      const pageRanges = req.body.pageRanges;
      if (!pageRanges) {
        return res.status(400).send("No page ranges specified");
      }

      // Create a unique directory for this request
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const requestDir = path.join(tmpDir, requestId);
      fs.mkdirSync(requestDir, { recursive: true });

      // Save the uploaded PDF to the temp directory
      const originalPdfPath = path.join(requestDir, "original.pdf");
      fs.writeFileSync(originalPdfPath, req.file.buffer);

      // Split the PDF
      const splitResults = await splitPDF(originalPdfPath, pageRanges, requestDir);
      
      // Create a zip file to hold all the split PDFs
      const zipPath = path.join(requestDir, "split_pdfs.zip");
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Maximum compression
      });

      // Listen for archive warnings
      archive.on("warning", (err) => {
        if (err.code === "ENOENT") {
          console.log("Archive warning:", err);
        } else {
          throw err;
        }
      });

      // Listen for archive errors
      archive.on("error", (err) => {
        throw err;
      });

      // Pipe archive data to the file
      archive.pipe(output);

      // Add the split PDFs to the archive
      for (const file of splitResults) {
        archive.file(file.path, { name: file.name });
      }

      // Finalize the archive
      await archive.finalize();

      // Wait for the output stream to finish
      await new Promise<void>((resolve, reject) => {
        output.on("close", () => {
          resolve();
        });
        output.on("error", (err) => {
          reject(err);
        });
      });

      // Send the zip file
      res.download(zipPath, "split_pdfs.zip", (err) => {
        if (err) {
          console.error("Error sending zip file:", err);
        }
        
        // Clean up the temp directory
        setTimeout(() => {
          try {
            fs.rmSync(requestDir, { recursive: true, force: true });
          } catch (err) {
            console.error("Error cleaning up temporary files:", err);
          }
        }, 60000); // Clean up after 1 minute
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      res.status(500).send(`Error processing PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
