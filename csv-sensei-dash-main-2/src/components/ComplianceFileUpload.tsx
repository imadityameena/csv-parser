import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, ArrowLeft, CheckCircle, Users, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ComplianceFileUploadProps {
  onFilesUpload: (opBillingFile: File, doctorRosterFile: File) => void;
  onBack?: () => void;
}

export const ComplianceFileUpload: React.FC<ComplianceFileUploadProps> = ({ onFilesUpload, onBack }) => {
  const [opBillingFile, setOpBillingFile] = useState<File | null>(null);
  const [doctorRosterFile, setDoctorRosterFile] = useState<File | null>(null);
  const [currentUpload, setCurrentUpload] = useState<'billing' | 'roster' | null>(null);

  const onDropBilling = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setOpBillingFile(file);
      setCurrentUpload(null);
    }
  }, []);

  const onDropRoster = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      setDoctorRosterFile(file);
      setCurrentUpload(null);
    }
  }, []);

  const { getRootProps: getBillingRootProps, getInputProps: getBillingInputProps, isDragActive: isBillingDragActive, fileRejections: billingRejections } = useDropzone({
    onDrop: onDropBilling,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const { getRootProps: getRosterRootProps, getInputProps: getRosterInputProps, isDragActive: isRosterDragActive, fileRejections: rosterRejections } = useDropzone({
    onDrop: onDropRoster,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const handleAnalyze = () => {
    if (opBillingFile && doctorRosterFile) {
      onFilesUpload(opBillingFile, doctorRosterFile);
    }
  };

  const isReady = opBillingFile && doctorRosterFile;

  return (
    <div className="max-w-6xl mx-auto">
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
          Compliance AI - Phase 1 Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-3xl mx-auto">
          Upload your OP Billing and Doctor Roster CSV files to run compliance analysis against R1-R10 rules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* OP Billing Upload */}
        <Card className={`transition-all duration-300 ${opBillingFile ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-200'}`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-blue-600" />
              OP Billing Data
              {opBillingFile && <CheckCircle className="w-5 h-5 ml-2 text-green-600" />}
            </CardTitle>
            <CardDescription>
              Upload your outpatient billing CSV file with visit/charge records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getBillingRootProps()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                ${isBillingDragActive 
                  ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 scale-105' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                }
                ${opBillingFile ? 'bg-green-50 dark:bg-green-900/20 border-green-400' : ''}
              `}
            >
              <input {...getBillingInputProps()} />
              
              <div className="flex flex-col items-center space-y-4">
                {opBillingFile ? (
                  <>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        {opBillingFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {(opBillingFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {isBillingDragActive ? 'Drop billing CSV here' : 'Upload Billing CSV'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Drag and drop or click to browse
                      </p>
                    </div>
                  </>
                )}
              </div>

              {billingRejections.length > 0 && (
                <div className="mt-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Please upload a valid CSV file
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Doctor Roster Upload */}
        <Card className={`transition-all duration-300 ${doctorRosterFile ? 'border-green-200 bg-green-50 dark:bg-green-900/20' : 'border-gray-200'}`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Doctor Roster Data
              {doctorRosterFile && <CheckCircle className="w-5 h-5 ml-2 text-green-600" />}
            </CardTitle>
            <CardDescription>
              Upload your doctor master data CSV file with doctor information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRosterRootProps()}
              className={`
                relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                ${isRosterDragActive 
                  ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-900/20 scale-105' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                }
                ${doctorRosterFile ? 'bg-green-50 dark:bg-green-900/20 border-green-400' : ''}
              `}
            >
              <input {...getRosterInputProps()} />
              
              <div className="flex flex-col items-center space-y-4">
                {doctorRosterFile ? (
                  <>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        {doctorRosterFile.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {(doctorRosterFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {isRosterDragActive ? 'Drop roster CSV here' : 'Upload Roster CSV'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Drag and drop or click to browse
                      </p>
                    </div>
                  </>
                )}
              </div>

              {rosterRejections.length > 0 && (
                <div className="mt-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Please upload a valid CSV file
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Rules Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
            Compliance Rules (R1-R10)
          </CardTitle>
          <CardDescription>
            The system will validate your data against these compliance rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">HIGH</Badge>
                <span className="text-sm font-medium">R1-R8, R11: Critical Rules</span>
              </div>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                <li>• Patient_ID validation & uniqueness</li>
                <li>• Age range validation (0-120)</li>
                <li>• Visit_Date future check</li>
                <li>• Doctor_ID existence in roster</li>
                <li>• License expiry validation</li>
                <li>• Procedure code validation</li>
                <li>• Amount range validation</li>
                <li>• Consent flag for OP300</li>
                <li>• Off-shift billing validation (R11)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">MEDIUM</Badge>
                <span className="text-sm font-medium">R9: Specialty Match</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">LOW</Badge>
                <span className="text-sm font-medium">R10: Payer Type</span>
              </div>
              <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 ml-4">
                <li>• Doctor specialty vs procedure mapping</li>
                <li>• Payer type validation (CASH/INSURANCE/GOVT)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyze Button */}
      {isReady && (
        <div className="text-center">
          <Button 
            onClick={handleAnalyze}
            size="lg"
            className="px-12 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-2xl"
          >
            <CheckCircle className="w-6 h-6 mr-3" />
            Run Compliance Analysis
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Both files uploaded successfully. Click to analyze compliance violations.
          </p>
        </div>
      )}

      {!isReady && (
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Upload both CSV files to begin compliance analysis
          </p>
        </div>
      )}
    </div>
  );
};


