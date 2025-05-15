import { useState, useEffect } from "react";
import "@fontsource/inter";
import { Toaster } from "@/components/ui/toaster";
import PDFSplitter from "@/components/PDFSplitter";

function App() {
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">PDF Splitter</h1>
          <p className="text-gray-600 mt-2">
            Split your PDF files by page ranges
          </p>
        </div>
        
        <PDFSplitter isMobile={isMobile} />
      </div>
      <Toaster />
    </div>
  );
}

export default App;
