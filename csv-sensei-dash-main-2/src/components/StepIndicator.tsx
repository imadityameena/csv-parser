
import React from 'react';
import { Upload, CheckCircle, BarChart3, PieChart } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

const stepIcons = [Upload, CheckCircle, BarChart3, PieChart];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps }) => {
  return (
    <div className="relative flex items-center justify-center mb-12 px-4">
      <div className="relative flex items-center justify-between w-full max-w-4xl">
        {/* Background line */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full transform -translate-y-1/2" />
        
        {/* Progress overlay */}
        <div 
          className="absolute top-8 left-0 h-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-full transform -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => {
          const IconComponent = stepIcons[index];
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={step} className="flex flex-col items-center group">
              {/* Step circle */}
              <div className={`
                relative flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-500 transform hover:scale-110
                ${isCompleted 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-500/30' 
                  : isCurrent 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-500 text-white shadow-xl shadow-blue-500/40 animate-pulse' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }
              `}>
                {/* Animated ring for current step */}
                {isCurrent && (
                  <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping opacity-75" />
                )}
                
                {/* Icon or checkmark */}
                {isCompleted ? (
                  <CheckCircle className="w-8 h-8 text-white" />
                ) : (
                  <IconComponent className="w-7 h-7" />
                )}
                
                {/* Step number badge */}
                <div className={`
                  absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-500 text-white animate-bounce' 
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {index + 1}
                </div>
              </div>
              
              {/* Step label */}
              <div className="mt-4 text-center">
                <span className={`
                  text-sm font-semibold transition-colors duration-300
                  ${isCompleted 
                    ? 'text-green-600 dark:text-green-400' 
                    : isCurrent 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }
                `}>
                  {step}
                </span>
                
                {/* Progress description */}
                <div className={`
                  text-xs mt-1 transition-opacity duration-300
                  ${isCurrent ? 'opacity-100' : 'opacity-60'}
                  ${isCompleted 
                    ? 'text-green-500 dark:text-green-400' 
                    : isCurrent 
                      ? 'text-blue-500 dark:text-blue-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }
                `}>
                  {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                </div>
              </div>
              

            </div>
          );
        })}
      </div>
    </div>
  );
};
