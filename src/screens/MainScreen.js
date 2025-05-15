import React, { useState } from 'react';
import { StyleSheet, View, Alert, ScrollView } from 'react-native';
import { Button, TextInput, Card, Title, Text, ProgressBar, MD3Colors } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';

const MainScreen = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageRanges, setPageRanges] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setPdfFile(file);
      setIsProcessing(true);
      setProgress(10);

      try {
        // Load the PDF to get page count
        const pdfBytes = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const pdfDoc = await PDFDocument.load(pdfBytes, { base64: true });
        const numPages = pdfDoc.getPageCount();
        
        setPageCount(numPages);
        setProgress(100);
        Alert.alert('PDF Loaded', `Successfully loaded PDF with ${numPages} pages.`);
      } catch (error) {
        console.error('Error loading PDF:', error);
        Alert.alert('Error', 'Failed to load PDF. Please try a different file.');
        setPdfFile(null);
        setPageCount(0);
      } finally {
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const validatePageRanges = (input, pageCount) => {
    if (!input.trim()) {
      return {
        valid: false,
        error: "Please enter page ranges",
      };
    }

    // Check for basic format: digits and commas and dashes only
    if (!/^[\\d,-]+$/.test(input)) {
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
  };

  const parsePageRanges = (input) => {
    const ranges = [];
    
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
  };

  const splitPDF = async () => {
    if (!pdfFile || !pageCount) {
      Alert.alert('Error', 'Please select a PDF file first.');
      return;
    }

    // Validate page ranges
    const validationResult = validatePageRanges(pageRanges, pageCount);
    if (!validationResult.valid) {
      Alert.alert('Invalid Page Ranges', validationResult.error);
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Load the PDF document
      const pdfBytes = await FileSystem.readAsStringAsync(pdfFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const pdfDoc = await PDFDocument.load(pdfBytes, { base64: true });
      
      // Parse page ranges
      const ranges = parsePageRanges(pageRanges);
      
      if (ranges.length === 0) {
        throw new Error("No valid page ranges specified");
      }

      // Create a directory to save split PDFs
      const splitDir = `${FileSystem.cacheDirectory}pdf-splits/`;
      await FileSystem.makeDirectoryAsync(splitDir, { intermediates: true });
      
      // Keep track of all split PDFs generated
      const splitPDFs = [];
      let rangeIndex = 0;
      
      // Process each range
      for (const range of ranges) {
        setProgress((rangeIndex / ranges.length) * 90);
        
        // Create a new PDF document
        const newPdf = await PDFDocument.create();
        
        // PDF pages are 0-indexed, but user input is 1-indexed
        const startIndex = range.start - 1;
        const endIndex = range.end - 1;
        
        // Copy pages from original to new PDF
        const pages = [];
        for (let i = startIndex; i <= endIndex; i++) {
          pages.push(i);
        }
        
        const copiedPages = await newPdf.copyPages(pdfDoc, pages);
        
        // Add pages to new PDF
        copiedPages.forEach(page => {
          newPdf.addPage(page);
        });
        
        // Save the new PDF to a file
        const newPdfBytes = await newPdf.save();
        const buffer = Buffer.from(newPdfBytes).toString('base64');
        
        const outputFileName = `${splitDir}pages_${range.start}-${range.end}.pdf`;
        await FileSystem.writeAsStringAsync(outputFileName, buffer, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        splitPDFs.push({
          uri: outputFileName,
          name: `pages_${range.start}-${range.end}.pdf`
        });
        
        rangeIndex++;
      }
      
      setProgress(100);
      
      Alert.alert(
        'PDF Split Complete',
        `Successfully split PDF into ${splitPDFs.length} files. Files saved to your device.`
      );
      
    } catch (error) {
      console.error('Error splitting PDF:', error);
      Alert.alert('Error', `Failed to split PDF: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>PDF拆分工具</Title>
            <Text style={styles.subtitle}>选择PDF文件，输入页面范围，然后拆分</Text>
            
            <View style={styles.buttonContainer}>
              <Button 
                mode="outlined" 
                onPress={pickDocument} 
                disabled={isProcessing}
                style={styles.button}
              >
                选择PDF文件
              </Button>
            </View>
            
            {pdfFile && (
              <Text style={styles.fileInfo}>
                已选择: {pdfFile.name}
              </Text>
            )}
            
            {pageCount > 0 && (
              <Text style={styles.pageCount}>
                PDF有 {pageCount} 页
              </Text>
            )}
            
            <TextInput
              label="页面范围"
              value={pageRanges}
              onChangeText={setPageRanges}
              disabled={!pdfFile || isProcessing}
              placeholder="例如: 1-5,7,9-12"
              style={styles.input}
              error={pageRanges && !validatePageRanges(pageRanges, pageCount).valid}
            />
            
            <Text style={styles.hint}>
              指定页面范围，用逗号分隔 (例如: 1-10,15,20-25)
            </Text>
            
            {isProcessing && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>处理中... {Math.round(progress)}%</Text>
                <ProgressBar progress={progress/100} color={MD3Colors.primary50} style={styles.progressBar} />
              </View>
            )}
            
            <Button 
              mode="contained" 
              onPress={splitPDF} 
              disabled={!pdfFile || !pageRanges || isProcessing}
              style={styles.splitButton}
            >
              {isProcessing ? "处理中..." : "拆分PDF"}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginTop: 20,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  fileInfo: {
    marginTop: 8,
    marginBottom: 8,
  },
  pageCount: {
    marginBottom: 16,
    color: '#666',
  },
  input: {
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressText: {
    marginBottom: 4,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  splitButton: {
    marginTop: 16,
  },
});

export default MainScreen;