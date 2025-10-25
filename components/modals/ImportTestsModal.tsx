'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';

interface ImportTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestsImported: () => void;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  duplicates: number;
}

export default function ImportTestsModal({ isOpen, onClose, onTestsImported }: ImportTestsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `code,name,category,price,turnaroundTime,sampleType,containerType,storageRequirements
HEM001,Complete Blood Count (CBC),HEMATOLOGY,25000,2 hours,Blood,EDTA Tube,Store at room temperature
BIO001,Fasting Blood Sugar,BIOCHEMISTRY,15000,1 hour,Serum,Plain Tube,Process within 2 hours
MIC001,Malaria Test,MICROBIOLOGY,10000,30 minutes,Blood,EDTA Tube,Store at room temperature
SER001,HIV Test,SEROLOGY,20000,1 hour,Serum,Plain Tube,Store at 2-8°C
HOR001,Thyroid Function Test,HORMONES,45000,24 hours,Serum,Plain Tube,Store at 2-8°C`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'test_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      data.push(row);
    }

    return data;
  };

  const validateTestData = (test: any): string[] => {
    const errors: string[] = [];

    if (!test.code) errors.push('Test code is required');
    if (!test.name) errors.push('Test name is required');
    if (!test.category) errors.push('Category is required');
    if (!test.price || isNaN(parseFloat(test.price))) errors.push('Valid price is required');
    if (!test.turnaroundTime) errors.push('Turnaround time is required');
    if (!test.sampleType) errors.push('Sample type is required');

    return errors;
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const tests = parseCSV(text);
      
      let imported = 0;
      let duplicates = 0;
      const errors: string[] = [];

      for (const testData of tests) {
        const validationErrors = validateTestData(testData);
        
        if (validationErrors.length > 0) {
          errors.push(`Row ${imported + duplicates + 1}: ${validationErrors.join(', ')}`);
          continue;
        }

        try {
          // Check for existing test with same code
          const existingTests = await firestoreService.queryDocuments(
            COLLECTIONS.TESTS,
            []
          );
          
          const duplicate = existingTests.find((t: any) => t.code === testData.code);
          if (duplicate) {
            duplicates++;
            continue;
          }

          // Create the test
          await firestoreService.create(COLLECTIONS.TESTS, {
            code: testData.code.toUpperCase(),
            name: testData.name,
            category: testData.category.toUpperCase(),
            price: parseFloat(testData.price),
            turnaroundTime: testData.turnaroundTime,
            sampleType: testData.sampleType,
            containerType: testData.containerType || '',
            storageRequirements: testData.storageRequirements || '',
            isActive: true,
          });

          imported++;
        } catch (err: any) {
          errors.push(`Row ${imported + duplicates + 1}: ${err.message}`);
        }
      }

      setResult({
        success: imported > 0,
        imported,
        errors,
        duplicates,
      });

      if (imported > 0) {
        onTestsImported();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import tests');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Import Tests</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Import Instructions</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Download the CSV template below</li>
                <li>Fill in your test data following the template format</li>
                <li>Upload the completed CSV file</li>
                <li>Review and confirm the import</li>
              </ol>
            </div>

            {/* Download Template */}
            <div className="text-center">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </button>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {file ? (
                <div className="space-y-2">
                  <FileText className="w-12 h-12 mx-auto text-green-500" />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:text-primary-dark text-sm"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to select CSV file or drag and drop
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                  >
                    Select File
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import Tests'}
              </button>
            </div>
          </div>
        ) : (
          /* Results */
          <div className="space-y-6">
            <div className="text-center">
              {result.success ? (
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              ) : (
                <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              )}
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Import {result.success ? 'Completed' : 'Failed'}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-sm text-green-700">Imported</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{result.duplicates}</p>
                <p className="text-sm text-yellow-700">Duplicates</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                <p className="text-sm text-red-700">Errors</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                <div className="max-h-32 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={resetModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Import More
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}