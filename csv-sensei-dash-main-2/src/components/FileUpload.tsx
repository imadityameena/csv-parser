import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  selectedIndustry: string;
  onBack?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, selectedIndustry, onBack }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setUploadedFile(file);
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Go Back Button */}
      {onBack && (
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center space-x-2 mb-4 hover:shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Upload Your CSV File
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center">
          Drag and drop your CSV file here, or click to browse
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 scale-105' 
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }
          ${uploadedFile ? 'bg-green-50 dark:bg-green-900/20 border-green-400' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {uploadedFile ? (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center animate-bounce">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-green-700 dark:text-green-400">
                  File Uploaded Successfully!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Size: {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {isDragActive ? 'Drop your CSV file here' : 'Upload Your CSV File'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Drag and drop your CSV file here, or click to browse
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                Select CSV File
              </Button>
            </>
          )}
        </div>

        {fileRejections.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">
                Please upload a valid CSV file only
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedIndustry && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            <strong>Selected Schema:</strong> {selectedIndustry === 'others' ? 'Others (General Insight)' : selectedIndustry.charAt(0).toUpperCase() + selectedIndustry.slice(1)}
          </p>
        </div>
      )}
    </div>
  );
};
