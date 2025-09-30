
import React, { useState } from 'react';
import { Logo } from '@/components/Logo';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { StepIndicator } from '@/components/StepIndicator';
import { IndustrySelector } from '@/components/IndustrySelector';
import { FileUpload } from '@/components/FileUpload';
import { ComplianceFileUpload } from '@/components/ComplianceFileUpload';
import { DoctorRosterUpload } from '@/components/DoctorRosterUpload';
import { BillingUpload } from '@/components/BillingUpload';
import { ValidationResults } from '@/components/ValidationResults';
import { Dashboard } from '@/components/Dashboard';
import { validateCSVData } from '@/utils/validationEngine';
import { validateRowLimit, truncateDataToLimit } from '@/utils/rowLimitValidator';
import type { ValidationError, ValidationSummary } from '@/utils/validationEngine';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';

const steps = ['Upload', 'Validate', 'Analyze', 'Visualize'];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [validationResults, setValidationResults] = useState<{
    isValid: boolean;
    errors: ValidationError[];
    warnings?: ValidationError[];
    summary: ValidationSummary;
    aiSuggestions?: string[];
    insights?: string[];
    fallbackLevel?: 'industry' | 'dynamic' | 'all-purpose';
    fallbackMessage?: string;
  } | null>(null);
  const [aiMappings, setAiMappings] = useState<any>(null);
  
  // Compliance mode state
  const [complianceMode, setComplianceMode] = useState(false);
  const [opBillingData, setOpBillingData] = useState<any[]>([]);
  const [doctorRosterData, setDoctorRosterData] = useState<any[]>([]);
  
  const { toast } = useToast();

  const handleIndustryChange = (industry: string) => {
    setSelectedIndustry(industry);
    // Check if compliance mode should be activated (only for dual file upload)
    if (industry === 'compliance') {
      setComplianceMode(true);
      setCurrentStep(1);
    } else if (industry && currentStep === 0) {
      setComplianceMode(false);
      setCurrentStep(1);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as any[];
        const filteredData = data.filter(row => Object.values(row).some(val => val !== ''));
        
        // Validate row limit with strict enforcement
        const rowLimitResult = validateRowLimit(filteredData);
        if (!rowLimitResult.isValid) {
          toast({
            title: "File Too Large - Cannot Process",
            description: rowLimitResult.message,
            variant: "destructive",
          });
          // Don't process the file at all if it exceeds the limit
          return;
        }
        
        setCsvData(filteredData);
        toast({
          title: "File Uploaded Successfully",
          description: rowLimitResult.message,
          variant: "default",
        });
        
        // Store headers for AI analysis
        const headers = Object.keys(filteredData[0] || {});
        setCsvHeaders(headers);
        
        // For single-file uploads (doctor_roster, opbilling), skip validation and go directly to dashboard
        if (selectedIndustry === 'doctor_roster' || selectedIndustry === 'opbilling') {
          setCurrentStep(3); // Go directly to dashboard
        } else {
          // Perform enhanced validation for other industries
          const validation = validateCSVData(filteredData, selectedIndustry);
          setValidationResults(validation);
          setCurrentStep(2);
        }
      },
      header: true,
      skipEmptyLines: true
    });
  };

  const handleContinueToAnalysis = () => {
    if (validationResults?.isValid) {
      setCurrentStep(3);
    }
  };

  const handleProceedWithAI = (mappings: any) => {
    setAiMappings(mappings);
    setCurrentStep(3);
  };

  const handleContinueWithErrorData = () => {
    // Continue to dashboard even with validation errors
    setCurrentStep(3);
  };

  const handleBackToUpload = () => {
    setCurrentStep(1);
    setUploadedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setValidationResults(null);
    setAiMappings(null);
  };

  const handleBackToIndustrySelection = () => {
    setCurrentStep(0);
    setUploadedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setValidationResults(null);
    setAiMappings(null);
  };

  const handleComplianceFilesUpload = (opBillingFile: File, doctorRosterFile: File) => {
    // Parse OP Billing file
    Papa.parse(opBillingFile, {
      complete: (results) => {
        const billingData = results.data as any[];
        const filteredBillingData = billingData.filter(row => Object.values(row).some(val => val !== ''));
        
        // Parse Doctor Roster file
        Papa.parse(doctorRosterFile, {
          complete: (rosterResults) => {
            const rosterData = rosterResults.data as any[];
            const filteredRosterData = rosterData.filter(row => Object.values(row).some(val => val !== ''));
            
            setOpBillingData(filteredBillingData);
            setDoctorRosterData(filteredRosterData);
            setCurrentStep(3); // Go directly to compliance dashboard
            
            toast({
              title: "Files Uploaded Successfully",
              description: `OP Billing: ${filteredBillingData.length} records, Doctor Roster: ${filteredRosterData.length} records`,
              variant: "default",
            });
          },
          header: true,
          skipEmptyLines: true
        });
      },
      header: true,
      skipEmptyLines: true
    });
  };

  const handleGoHome = () => {
    setCurrentStep(0);
    setSelectedIndustry('');
    setUploadedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setValidationResults(null);
    setAiMappings(null);
    setComplianceMode(false);
    setOpBillingData([]);
    setDoctorRosterData([]);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Next-Generation Business Intelligence Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
              Upload your CSV file and get AI-powered insights with beautiful visualizations
            </p>
            <IndustrySelector 
              selectedIndustry={selectedIndustry}
              onIndustryChange={handleIndustryChange}
            />
          </div>
        );
      case 1:
        if (complianceMode) {
          return (
            <ComplianceFileUpload 
              onFilesUpload={handleComplianceFilesUpload}
              onBack={handleBackToIndustrySelection}
            />
          );
        } else if (selectedIndustry === 'doctor_roster') {
          return (
            <DoctorRosterUpload 
              onFileUpload={handleFileUpload}
              onBack={handleBackToIndustrySelection}
            />
          );
        } else if (selectedIndustry === 'opbilling') {
          return (
            <BillingUpload 
              onFileUpload={handleFileUpload}
              onBack={handleBackToIndustrySelection}
            />
          );
        } else {
          return (
            <FileUpload 
              onFileUpload={handleFileUpload}
              selectedIndustry={selectedIndustry}
              onBack={handleBackToIndustrySelection}
            />
          );
        }
      case 2:
        return validationResults ? (
          <ValidationResults
            isValid={validationResults.isValid}
            errors={validationResults.errors}
            warnings={validationResults.warnings}
            summary={validationResults.summary}
            aiSuggestions={validationResults.aiSuggestions}
            insights={validationResults.insights}
            csvHeaders={csvHeaders}
            selectedIndustry={selectedIndustry}
            fallbackLevel={validationResults.fallbackLevel}
            fallbackMessage={validationResults.fallbackMessage}
            onContinue={handleContinueToAnalysis}
            onProceedWithAI={handleProceedWithAI}
            onBack={handleBackToUpload}
            onGoHome={handleGoHome}
            onContinueWithErrorData={handleContinueWithErrorData}
          />
        ) : null;
      case 3:
        if (complianceMode) {
          return (
            <Dashboard
              data={csvData}
              industry={selectedIndustry}
              aiMappings={aiMappings}
              onBack={handleBackToUpload}
              aiCaptionEnabled={true}
              complianceMode={true}
              opBillingData={opBillingData}
              doctorRosterData={doctorRosterData}
            />
          );
        } else {
          return (
            <Dashboard
              data={csvData}
              industry={selectedIndustry}
              aiMappings={aiMappings}
              onBack={handleBackToUpload}
              aiCaptionEnabled={true}
            />
          );
        }
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo />
            <ModeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {currentStep < 3 && (
          <StepIndicator currentStep={currentStep} steps={steps} />
        )}
        
        <div className="mt-8">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default Index;
