
import React from 'react';

export const Logo = () => {
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-xl flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 bg-white/90 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-br from-blue-600 to-purple-700 rounded-sm"></div>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
          The BI <span className="text-purple-600">Agentic</span>
        </h1>
        <div className="flex space-x-2 mt-1">
          <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-medium">
            AI-POWERED
          </span>
          <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full font-medium">
            REAL-TIME
          </span>
        </div>
      </div>
    </div>
  );
};
