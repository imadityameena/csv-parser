import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, ArrowLeft, Receipt, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BillingUploadProps {
  onFileUpload: (file: File) => void;
  onBack?: () => void;
}

export const BillingUpload: React.FC<BillingUploadProps> = ({ onFileUpload, onBack }) => {
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
    <div className="max-w-4xl mx-auto">
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

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          OP Billing Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto">
          Upload your outpatient billing CSV file to analyze billing patterns, payments, and revenue insights
        </p>
      </div>

      {/* Upload Area */}
      <Card className={`transition-all duration-300 ${uploadedFile ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-200'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2 text-purple-600" />
            OP Billing Data
            {uploadedFile && <CheckCircle className="w-5 h-5 ml-2 text-green-600" />}
          </CardTitle>
          <CardDescription>
            Upload your outpatient billing CSV file with visit/charge records and payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
              ${isDragActive 
                ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-900/20 scale-105' 
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
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
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {isDragActive ? 'Drop your CSV file here' : 'Upload Billing CSV'}
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
        </CardContent>
      </Card>

      {/* Expected Fields Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="w-5 h-5 mr-2 text-purple-600" />
            Expected Billing Fields
          </CardTitle>
          <CardDescription>
            Your CSV should contain these fields for optimal analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Required Fields</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Bill_ID</li>
                <li>• Bill_Date</li>
                <li>• Patient_ID</li>
                <li>• Patient_Name</li>
                <li>• Doctor_ID</li>
                <li>• Doctor_Name</li>
                <li>• Department</li>
                <li>• Service_Code</li>
                <li>• Service_Description</li>
                <li>• Quantity</li>
                <li>• Unit_Price</li>
                <li>• Total_Amount</li>
                <li>• Payment_Status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Optional Fields</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Visit_ID</li>
                <li>• Visit_Date</li>
                <li>• Age</li>
                <li>• Procedure_Code</li>
                <li>• Consent_Flag</li>
                <li>• Payer_Type</li>
                <li>• Payment_Method</li>
                <li>• Discount_Amount</li>
                <li>• Tax_Amount</li>
                <li>• Net_Amount</li>
                <li>• Currency</li>
                <li>• Insurance_Provider</li>
                <li>• Policy_Number</li>
                <li>• Due_Date</li>
                <li>• Paid_Date</li>
                <li>• Notes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


