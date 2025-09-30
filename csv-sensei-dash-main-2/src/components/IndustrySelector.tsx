import React from 'react';
import { Settings, CalendarClock, Receipt, Shield } from 'lucide-react';
interface IndustrySelectorProps {
  selectedIndustry: string;
  onIndustryChange: (industry: string) => void;
}

const industries = [
  {
    id: 'doctor_roster',
    name: 'Doctor Roster',
    description: 'Doctor schedules and shifts',
    icon: CalendarClock,
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-900',
    borderColor: 'border-blue-300 dark:border-indigo-700',
    hoverColor: 'hover:from-blue-600 hover:to-indigo-700'
  },
  {
    id: 'opbilling',
    name: 'OP Billing',
    description: 'Outpatient billing and payments',
    icon: Receipt,
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-emerald-900 dark:to-teal-900',
    borderColor: 'border-emerald-300 dark:border-teal-700',
    hoverColor: 'hover:from-emerald-600 hover:to-teal-700'
  },
  {
    id: 'compliance',
    name: 'Compliance AI',
    description: 'Compliance analysis',
    icon: Shield,
    gradient: 'from-purple-500 to-pink-600',
    bgColor: 'bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900 dark:to-pink-900',
    borderColor: 'border-purple-300 dark:border-pink-700',
    hoverColor: 'hover:from-purple-600 hover:to-pink-700'
  },
  {
    id: 'others',
    name: 'Others',
    description: 'General data validation',
    icon: Settings,
    gradient: 'from-slate-500 to-slate-700',
    bgColor: 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900',
    borderColor: 'border-slate-300 dark:border-slate-700',
    hoverColor: 'hover:from-slate-600 hover:to-slate-800'
  }
];

export const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  selectedIndustry,
  onIndustryChange,
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Let's validate your data! 🚀
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Choose your industry schema and upload your CSV file
        </p>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-center mb-8 text-gray-800 dark:text-gray-200">
          Select Industry Schema
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {industries.map((industry) => {
            const IconComponent = industry.icon;
            const isSelected = selectedIndustry === industry.id;
            
            return (
              <div
                key={industry.id}
                onClick={() => onIndustryChange(industry.id)}
                className={`
                  relative cursor-pointer rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl
                  ${industry.bgColor}
                  ${isSelected 
                    ? `ring-4 ring-offset-4 ring-blue-500 shadow-2xl scale-105 ${industry.borderColor}` 
                    : `border-2 ${industry.borderColor} hover:shadow-xl`
                  }
                `}
              >
                {/* Background gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${industry.gradient} opacity-0 hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
                
                {/* Icon container */}
                <div className={`relative w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br ${industry.gradient} ${industry.hoverColor} transition-all duration-300 flex items-center justify-center shadow-lg`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                {/* Content */}
                <div className="relative text-center">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    {industry.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {industry.description}
                  </p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};