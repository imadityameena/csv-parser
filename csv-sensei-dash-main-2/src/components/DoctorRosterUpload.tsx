import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, ArrowLeft, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DoctorRosterUploadProps {
  onFileUpload: (file: File) => void;
  onBack?: () => void;
}

export const DoctorRosterUpload: React.FC<DoctorRosterUploadProps> = ({ onFileUpload, onBack }) => {
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
          Doctor Roster Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-2xl mx-auto">
          Upload your doctor roster CSV file to analyze doctor schedules, shifts, and roster management
        </p>
      </div>

      {/* Upload Area */}
      <Card className={`transition-all duration-300 ${uploadedFile ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-200'}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Doctor Roster Data
            {uploadedFile && <CheckCircle className="w-5 h-5 ml-2 text-green-600" />}
          </CardTitle>
          <CardDescription>
            Upload your doctor master data CSV file with doctor information, schedules, and shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
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
                      {isDragActive ? 'Drop your CSV file here' : 'Upload Doctor Roster CSV'}
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
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Expected Doctor Roster Fields
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
                <li>• Doctor_ID</li>
                <li>• Doctor_Name</li>
                <li>• Specialization</li>
                <li>• Department</li>
                <li>• Date</li>
                <li>• Shift</li>
                <li>• Start_Time</li>
                <li>• End_Time</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Optional Fields</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Location</li>
                <li>• Room_No</li>
                <li>• On_Call</li>
                <li>• Contact</li>
                <li>• Email</li>
                <li>• Max_Appointments</li>
                <li>• Notes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


