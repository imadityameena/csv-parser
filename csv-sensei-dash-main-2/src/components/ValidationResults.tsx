
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Info, ArrowLeft, Home, Zap, Shield, TrendingUp, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ValidationError, ValidationSummary } from '@/utils/validationEngine';

interface ValidationResultsProps {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
  summary: ValidationSummary;
  aiSuggestions?: string[];
  insights?: string[];
  csvHeaders: string[];
  selectedIndustry: string;
  fallbackLevel?: 'industry' | 'dynamic' | 'all-purpose';
  fallbackMessage?: string;
  onContinue: () => void;
  onProceedWithAI: (mappings: any) => void;
  onBack: () => void;
  onGoHome: () => void;
  onContinueWithErrorData: () => void;
}

export const ValidationResults: React.FC<ValidationResultsProps> = ({
  isValid,
  errors,
  warnings = [],
  summary,
  aiSuggestions = [],
  insights = [],
  csvHeaders,
  selectedIndustry,
  fallbackLevel,
  fallbackMessage,
  onContinue,
  onProceedWithAI,
  onBack,
  onGoHome,
  onContinueWithErrorData,
}) => {
  console.log('ValidationResults received insights:', insights);
  console.log('ValidationResults selectedIndustry:', selectedIndustry);
  const [showAIFixer, setShowAIFixer] = useState(false);

  const getErrorIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <Info className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getErrorColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20';
    }
  };

  const getTextColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-700 dark:text-red-300';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            {isValid ? (
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            )}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isValid ? 'Validation Successful' : 'Validation Issues Found'}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalRows}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Total Rows</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.validRows}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Valid Rows</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.errorRows}</div>
              <div className="text-sm text-red-700 dark:text-red-300">Error Rows</div>
            </div>
          </div>
        </div>

        {/* Fallback Notification */}
        {fallbackLevel && fallbackLevel !== 'industry' && (
          <div className="mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    {fallbackLevel === 'dynamic' ? 'Auto-Detection Applied' : 'All-Purpose Format Applied'}
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                    {fallbackMessage}
                  </p>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {fallbackLevel === 'dynamic' 
                      ? 'We automatically detected a different industry format that better matches your data structure.'
                      : 'We applied our flexible All-Purpose format to handle your unique data structure with basic validation and insights.'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display errors - show count only */}
        {errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Validation Errors ({errors.length})
            </h3>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">
                {errors.length} validation errors found
              </p>
            </div>
          </div>
        )}

        {/* Display warnings - show count only */}
        {warnings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Info className="w-5 h-5 text-yellow-500 mr-2" />
              Warnings ({warnings.length})
            </h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {warnings.length} warnings found
              </p>
            </div>
          </div>
        )}

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <Lightbulb className="w-5 h-5 text-purple-500 mr-2" />
              AI Suggestions
            </h3>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <ul className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-purple-700 dark:text-purple-300 flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Industry-Specific Insights */}
        {insights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
              {selectedIndustry === 'doctor_roster' ? 'Doctor Roster Insights' :
               selectedIndustry === 'opbilling' ? 'OP Billing Insights' :
               selectedIndustry === 'compliance' ? 'Compliance AI Insights' :
               'Business Insights'}
            </h3>
                         <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
               <ul className="space-y-2">
                 {insights.slice(0, 6).map((insight, index) => (
                   <li key={index} className="text-green-700 dark:text-green-300 flex items-start">
                     <span className="text-green-500 mr-2">•</span>
                     {insight}
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {isValid ? (
            <Button 
              onClick={onContinue}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
            >
              Continue to Analysis
            </Button>
          ) : (
            <Button 
              onClick={onContinueWithErrorData}
              variant="outline"
              className="px-6 py-3"
            >
              Continue Anyway
            </Button>
          )}
          
          <Button 
            onClick={onBack}
            variant="outline"
            className="px-6 py-3 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>
          
          <Button 
            onClick={onGoHome}
            variant="outline"
            className="px-6 py-3 flex items-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>
      </div>
    </div>
  );
};
