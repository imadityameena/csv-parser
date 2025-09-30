
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, BarChart3, TrendingUp, PieChart, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Demo = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();

  const handleStartDemo = () => {
    navigate('/app');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header with User Info and Logout */}
      <div className="absolute top-4 right-4 flex items-center space-x-4">
        {isLoggedIn && user && (
          <div className="flex items-center space-x-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <div className="text-sm">
              <div className="font-medium text-gray-800 dark:text-gray-200">{user.company}</div>
              <div className="text-gray-600 dark:text-gray-400">{user.email}</div>
            </div>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggedIn ? 'Logout' : 'Back to Login'}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Business Intelligence
            </h1>
            <h2 className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-200">
              AI-Powered Dashboard
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Transform your CSV data into beautiful visualizations with intelligent insights. 
              Get AI-powered analysis and actionable recommendations for your business data.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Smart Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                AI-powered data validation and insights generation
              </p>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Interactive Charts
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Beautiful visualizations with real-time interactions
              </p>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Multi-Industry
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Optimized for Sales, Finance, Retail, Healthcare & more
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="space-y-4">
            <Button
              onClick={handleStartDemo}
              size="lg"
              className="px-12 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-2xl"
            >
              <Play className="w-6 h-6 mr-3" />
              Start Demo
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoggedIn ? 'Welcome to your dashboard!' : 'No signup required • Try with sample data'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;
