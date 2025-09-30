
import React, { useState } from 'react';
import { Brain, Loader2, CheckCircle, XCircle, ArrowRight, ArrowLeft, Upload, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeCsvSchema } from '@/integrations/mongodb/client';
import type { ValidationError } from '@/utils/validationEngine';

interface AISchemaFixerProps {
  csvHeaders: string[];
  selectedIndustry: string;
  validationErrors: ValidationError[];
  onSuccess: (mappings: any) => void;
  onBack: () => void;
  onGoHome?: () => void;
  onChangeFile?: () => void;
  onContinueWithErrorData?: () => void;
}

interface AIAnalysis {
  canProceed: boolean;
  mappings: Record<string, string>;
  transformations: string[];
  reasoning: string;
  confidence: number;
}

export const AISchemaFixer: React.FC<AISchemaFixerProps> = ({
  csvHeaders,
  selectedIndustry,
  validationErrors,
  onSuccess,
  onBack,
  onGoHome,
  onChangeFile,
  onContinueWithErrorData,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeSchema = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const data = await analyzeCsvSchema({ csvHeaders, selectedIndustry, validationErrors });
      setAnalysis(data);
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setError(err.message || 'Failed to analyze schema with AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProceedWithAI = () => {
    if (analysis) {
      onSuccess(analysis.mappings);
    }
  };

  const handleGoHome = () => {
    console.log('Go Home clicked');
    if (onGoHome) {
      onGoHome();
    }
  };

  const handleChangeFile = () => {
    console.log('Change File clicked');
    if (onChangeFile) {
      onChangeFile();
    }
  };

  const handleContinueWithErrorData = () => {
    console.log('Continue with AI Dashboard clicked');
    if (onContinueWithErrorData) {
      onContinueWithErrorData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-purple-50 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-3xl p-8 border-2 border-purple-200 dark:border-purple-800">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Schema Assistant
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Let AI analyze your data and suggest how to proceed with the dashboard
          </p>
        </div>

        {!analysis && !error && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                What AI can do for you:
              </h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Analyze your CSV structure and map fields to the required schema
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Suggest data transformations to make your file compatible
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Generate insights even with non-standard column names
                </li>
              </ul>
            </div>

            <div className="text-center">
              <Button
                onClick={analyzeSchema}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Schema...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>

            {/* Navigation buttons for initial state */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex items-center space-x-2 px-6 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex items-center space-x-2 px-6 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </Button>
              <Button
                onClick={handleChangeFile}
                variant="outline"
                className="flex items-center space-x-2 px-6 py-2"
              >
                <Upload className="w-4 h-4" />
                <span>Change File</span>
              </Button>
              <Button
                onClick={handleContinueWithErrorData}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-2"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Continue with AI Dashboard
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
            <div className="flex items-center mb-4">
              <XCircle className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
                Analysis Failed
              </h3>
            </div>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={analyzeSchema} variant="outline">
                Try Again
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Cancel</span>
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </Button>
              <Button
                onClick={handleChangeFile}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Change File</span>
              </Button>
              <Button
                onClick={handleContinueWithErrorData}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Continue with AI Dashboard
              </Button>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 border ${
              analysis.canProceed 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center mb-4">
                {analysis.canProceed ? (
                  <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                ) : (
                  <XCircle className="w-6 h-6 text-yellow-500 mr-2" />
                )}
                <h3 className="text-lg font-semibold">
                  {analysis.canProceed ? 'Ready to Proceed!' : 'Partial Match Found'}
                </h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {analysis.reasoning}
              </p>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Confidence:</strong> {Math.round(analysis.confidence * 100)}%
              </div>
            </div>

            {Object.keys(analysis.mappings).length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Suggested Field Mappings:
                </h4>
                <div className="space-y-2">
                  {Object.entries(analysis.mappings).map(([csvField, schemaField]) => (
                    <div key={csvField} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {csvField}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {schemaField}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.transformations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">
                  Recommended Transformations:
                </h4>
                <ul className="space-y-2">
                  {analysis.transformations.map((transformation, index) => (
                    <li key={index} className="text-blue-700 dark:text-blue-300 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {transformation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onBack}
                variant="outline"
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex items-center space-x-2 px-6 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </Button>
              <Button
                onClick={handleChangeFile}
                variant="outline"
                className="flex items-center space-x-2 px-6 py-2"
              >
                <Upload className="w-4 h-4" />
                <span>Change File</span>
              </Button>
              {analysis.canProceed && (
                <Button
                  onClick={handleProceedWithAI}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-2"
                >
                  Proceed with AI Mapping
                </Button>
              )}
              <Button
                onClick={handleContinueWithErrorData}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-2"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Continue with AI Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
