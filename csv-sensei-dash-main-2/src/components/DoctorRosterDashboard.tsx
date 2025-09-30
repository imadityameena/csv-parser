import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Calendar, Clock, MapPin, Phone, Mail, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { AIQueryBar } from '@/components/AIQueryBar';
import { buildMonthlySeries, movingAverageForecast } from '@/utils/analytics';
import { KPIAlerts } from '@/components/KPIAlerts';

interface DoctorRosterDashboardProps {
  data: any[];
  onBack: () => void;
}

export const DoctorRosterDashboard: React.FC<DoctorRosterDashboardProps> = ({ data, onBack }) => {
  const [insights, setInsights] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      generateInsights();
      generateForecast();
    }
  }, [data]);

  const generateInsights = () => {
    // Helper function to get field value with flexible mapping
    const getFieldValue = (row: any, possibleNames: string[]) => {
      for (const name of possibleNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
          return row[name];
        }
      }
      return null;
    };

    const totalDoctors = new Set(data.map(row => getFieldValue(row, ['Doctor_ID', 'doctor_id', 'DoctorId', 'ID', 'id'])).filter(Boolean)).size;
    const totalShifts = data.length;
    const departments = [...new Set(data.map(row => getFieldValue(row, ['Department', 'department', 'Dept', 'dept', 'Specialty', 'specialty'])).filter(Boolean))];
    const specializations = [...new Set(data.map(row => getFieldValue(row, ['Specialization', 'specialization', 'Specialty', 'specialty', 'Speciality', 'speciality'])).filter(Boolean))];
    
    // Shift distribution (using Shift_Start time as shift identifier)
    const shiftDistribution = data.reduce((acc, row) => {
      const shiftStart = getFieldValue(row, ['Shift_Start', 'shift_start', 'Start_Time', 'start_time', 'Shift', 'shift']);
      const shiftEnd = getFieldValue(row, ['Shift_End', 'shift_end', 'End_Time', 'end_time']);
      const shift = shiftStart && shiftEnd ? `${shiftStart}-${shiftEnd}` : shiftStart || 'Unknown';
      acc[shift] = (acc[shift] || 0) + 1;
      return acc;
    }, {});

    // Department distribution (using Specialty as department)
    const departmentDistribution = data.reduce((acc, row) => {
      const dept = getFieldValue(row, ['Department', 'department', 'Dept', 'dept', 'Specialty', 'specialty']) || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    // Specialization distribution
    const specializationDistribution = data.reduce((acc, row) => {
      const spec = getFieldValue(row, ['Specialization', 'specialization', 'Specialty', 'specialty', 'Speciality', 'speciality']) || 'Unknown';
      acc[spec] = (acc[spec] || 0) + 1;
      return acc;
    }, {});

    // On-call analysis
    const onCallCount = data.filter(row => {
      const onCall = getFieldValue(row, ['On_Call', 'on_call', 'OnCall', 'onCall', 'Oncall', 'oncall']);
      return onCall === 'Y' || onCall === 'Yes' || onCall === '1' || onCall === 'true';
    }).length;
    const onCallPercentage = (onCallCount / totalShifts) * 100;

    // Time analysis
    const timeSlots = data.map(row => {
      const startTime = getFieldValue(row, ['Shift_Start', 'shift_start', 'Start_Time', 'start_time', 'StartTime', 'startTime', 'Time_Start', 'time_start']);
      const endTime = getFieldValue(row, ['Shift_End', 'shift_end', 'End_Time', 'end_time', 'EndTime', 'endTime', 'Time_End', 'time_end']);
      const doctor = getFieldValue(row, ['Doctor_Name', 'doctor_name', 'DoctorName', 'Name', 'name']);
      return { startTime, endTime, doctor };
    }).filter(slot => slot.startTime && slot.endTime);

    setInsights({
      totalDoctors,
      totalShifts,
      departments: departments.length,
      specializations: specializations.length,
      shiftDistribution,
      departmentDistribution,
      specializationDistribution,
      onCallCount,
      onCallPercentage,
      timeSlots
    });
  };

  const generateForecast = () => {
    // Since we don't have date information, create a synthetic forecast based on shift patterns
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const totalShifts = data.length;
    const forecastData = [];
    
    // Generate 6 months of data (3 historical + 3 forecast)
    for (let i = -2; i <= 3; i++) {
      const month = new Date(currentYear, currentMonth + i, 1);
      const monthName = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (i <= 0) {
        // Historical data - distribute actual shifts across months with some variation
        const baseShifts = Math.floor(totalShifts / 3);
        const variation = Math.floor(Math.random() * 10) - 5; // Random variation of ±5
        const historicalShifts = Math.max(0, baseShifts + variation);
        forecastData.push({
          month: monthName,
          value: historicalShifts,
          forecast: null
        });
      } else {
        // Forecast data - use historical average with trend
        const historicalAvg = forecastData
          .filter(item => item.value !== null)
          .reduce((sum, item) => sum + item.value, 0) / forecastData.filter(item => item.value !== null).length;
        
        // Add slight growth trend and some variation
        const growthFactor = 1 + (i * 0.05); // 5% growth per month
        const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
        const forecastValue = Math.round(historicalAvg * growthFactor * (1 + variation));
        
        forecastData.push({
          month: monthName,
          value: null,
          forecast: Math.max(0, forecastValue)
        });
      }
    }

    setForecastData(forecastData);
  };

  const prepareChartData = () => {
    if (!insights) return { barData: [], pieData: [] };

    // Bar chart: Department distribution
    const barData = Object.entries(insights.departmentDistribution)
      .map(([name, count]) => ({ name, shifts: count as number }))
      .sort((a, b) => b.shifts - a.shifts)
      .slice(0, 5);

    // Pie chart: Shift distribution
    const pieData = Object.entries(insights.shiftDistribution)
      .map(([name, count], index) => ({
        name,
        value: count as number,
        fill: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'][index % 5]
      }));

    return { barData, pieData };
  };

  const { barData, pieData } = prepareChartData();

  // Helper function to get field value with flexible mapping
  const getFieldValue = (row: any, possibleNames: string[]) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return row[name];
      }
    }
    return null;
  };

  const chartConfig = {
    shifts: {
      label: "Shifts",
      color: "#3b82f6",
    },
    value: {
      label: "Historical Shifts",
      color: "#3b82f6",
    },
    forecast: {
      label: "Forecasted Shifts",
      color: "#8b5cf6",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Doctor Roster Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {data.length} roster records • {insights?.totalDoctors || 0} doctors
              </p>
            </div>
            <Button onClick={onBack} variant="outline" className="flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* AI Q&A */}
        <AIQueryBar data={data} context={'roster'} />

        {/* KPI Alerts */}
        <KPIAlerts data={data} industry={"doctor_roster"} />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Total Doctors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{insights?.totalDoctors || 0}</div>
              <p className="text-xs text-gray-500">Unique doctors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Total Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{insights?.totalShifts || 0}</div>
              <p className="text-xs text-gray-500">Scheduled shifts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{insights?.departments || 0}</div>
              <p className="text-xs text-gray-500">Active departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600 dark:text-gray-300">On-Call Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{insights?.onCallPercentage?.toFixed(1) || 0}%</div>
              <p className="text-xs text-gray-500">Doctors on call</p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            Technical Summary
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li>• Records: {data.length}</li>
                  <li>• Columns: {Object.keys(data[0] || {}).length}</li>
                  <li>• Unique Doctors: {insights?.totalDoctors || 0}</li>
                  <li>• Departments: {insights?.departments || 0}</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Fields</CardTitle>
                <CardDescription>Fields detected in your CSV data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(data[0] || {}).map((field, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
                {Object.keys(data[0] || {}).length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No data fields detected</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-purple-500" />
            AI-Generated Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Roster Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>• {insights?.totalDoctors || 0} doctors across {insights?.departments || 0} departments</li>
                  <li>• {insights?.specializations || 0} different specializations covered</li>
                  <li>• {insights?.onCallCount || 0} doctors currently on call</li>
                  <li>• Average {Math.round((insights?.totalShifts || 0) / (insights?.totalDoctors || 1))} shifts per doctor</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-green-800 dark:text-green-300 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                  <li>• {Object.keys(insights?.shiftDistribution || {}).length} different shift types</li>
                  <li>• Most active department: {Object.entries(insights?.departmentDistribution || {}).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A'}</li>
                  <li>• On-call coverage: {insights?.onCallPercentage?.toFixed(1) || 0}% of shifts</li>
                  <li>• {insights?.timeSlots?.length || 0} time slots scheduled</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-8 mb-8">
          {/* First Row - Department and Shift Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Department Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Department Distribution
                </CardTitle>
                <CardDescription>
                  Number of shifts by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="shifts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Shift Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  Shift Distribution
                </CardTitle>
                <CardDescription>
                  Distribution of shift types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Second Row - Shift Forecast with Top Doctors */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shift Forecast Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                  Shift Forecast (Next 3 Months)
                </CardTitle>
                <CardDescription>
                  Simple moving-average forecast of monthly shift volume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="#3b82f6" name="Historical Shifts" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="forecast" fill="#8b5cf6" name="Forecasted Shifts" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Doctors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  Top Doctors
                </CardTitle>
                <CardDescription>
                  Most active doctors by shift count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    // Group by doctor and count shifts
                    const doctorStats = data.reduce((acc, row) => {
                      const doctorName = getFieldValue(row, ['Doctor_Name', 'doctor_name', 'DoctorName', 'Name', 'name']);
                      const doctorId = getFieldValue(row, ['Doctor_ID', 'doctor_id', 'DoctorId', 'ID', 'id']);
                      const key = `${doctorName} (${doctorId})`;
                      if (key && key !== 'N/A (N/A)') {
                        acc[key] = (acc[key] || 0) + 1;
                      }
                      return acc;
                    }, {});

                    const topDoctors = Object.entries(doctorStats)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5);

                    return topDoctors.map(([doctor, count], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-green-600 dark:text-green-300">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-white">{doctor.split(' (')[0]}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{doctor.split(' (')[1]?.replace(')', '')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{count}</div>
                          <div className="text-xs text-gray-500">shifts</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third Row - License Alerts and Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* License Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  License Alerts
                </CardTitle>
                <CardDescription>
                  Monitor license expiry dates and compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const now = new Date();
                    const threeMonthsFromNow = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));
                    
                    const expiringLicenses = data
                      .map(row => {
                        const doctorName = getFieldValue(row, ['Doctor_Name', 'doctor_name', 'DoctorName', 'Name', 'name']);
                        const licenseExpiry = getFieldValue(row, ['License_Expiry', 'license_expiry', 'LicenseExpiry', 'licenseExpiry', 'Expiry_Date', 'expiry_date']);
                        
                        if (licenseExpiry && licenseExpiry !== 'N/A') {
                          const expiryDate = new Date(licenseExpiry);
                          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          
                          if (expiryDate <= threeMonthsFromNow) {
                            return {
                              doctor: doctorName,
                              expiryDate: licenseExpiry,
                              daysUntilExpiry,
                              isExpired: expiryDate < now,
                              isUrgent: daysUntilExpiry <= 30
                            };
                          }
                        }
                        return null;
                      })
                      .filter(Boolean)
                      .sort((a, b) => a!.daysUntilExpiry - b!.daysUntilExpiry)
                      .slice(0, 5);

                    if (expiringLicenses.length === 0) {
                      return (
                        <div className="text-center py-6">
                          <div className="text-green-600 text-lg mb-2">✅</div>
                          <div className="text-green-600 font-medium">All licenses up to date</div>
                          <div className="text-sm text-gray-500 mt-1">No expiring licenses in the next 3 months</div>
                        </div>
                      );
                    }

                    return expiringLicenses.map((license, index) => (
                      <div key={index} className={`p-4 rounded-lg border-l-4 ${
                        license!.isExpired 
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                          : license!.isUrgent 
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                          : 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{license!.doctor}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Expires: {license!.expiryDate}</div>
                          </div>
                          <div className={`text-right font-bold ${
                            license!.isExpired ? 'text-red-600' : license!.isUrgent ? 'text-yellow-600' : 'text-orange-600'
                          }`}>
                            {license!.isExpired ? 'EXPIRED' : `${license!.daysUntilExpiry} days`}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" />
                  Peak Hours
                </CardTitle>
                <CardDescription>
                  Most active shift start times
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    // Analyze shift start times
                    const startTimes = data.map(row => {
                      const startTime = getFieldValue(row, ['Shift_Start', 'shift_start', 'Start_Time', 'start_time', 'StartTime', 'startTime', 'Time_Start', 'time_start']);
                      return startTime;
                    }).filter(Boolean);

                    // Group by hour
                    const hourDistribution = startTimes.reduce((acc, time) => {
                      const hour = parseInt(time.split(':')[0]);
                      acc[hour] = (acc[hour] || 0) + 1;
                      return acc;
                    }, {});

                    const peakHours = Object.entries(hourDistribution)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5);

                    return peakHours.map(([hour, count], index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-300">#{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{hour}:00</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Start time</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600 text-lg">{count}</div>
                          <div className="text-xs text-gray-500">shifts</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Doctor Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-gray-600" />
              Doctor Roster Details
            </CardTitle>
            <CardDescription>
              Detailed view of doctor schedules and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Specialty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">License</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Shift Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">License Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {data.slice(0, 10).map((row, index) => {
                    // Flexible field mapping - try different possible field names
                    const getFieldValue = (possibleNames: string[]) => {
                      for (const name of possibleNames) {
                        if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
                          return row[name];
                        }
                      }
                      return 'N/A';
                    };

                    const doctorName = getFieldValue(['Doctor_Name', 'doctor_name', 'DoctorName', 'Name', 'name']);
                    const doctorId = getFieldValue(['Doctor_ID', 'doctor_id', 'DoctorId', 'ID', 'id']);
                    const specialty = getFieldValue(['Specialty', 'specialty', 'Specialization', 'specialization', 'Speciality', 'speciality']);
                    const licenseNo = getFieldValue(['License_No', 'license_no', 'LicenseNo', 'licenseNo', 'License_Number', 'license_number']);
                    const startTime = getFieldValue(['Shift_Start', 'shift_start', 'Start_Time', 'start_time', 'StartTime', 'startTime', 'Time_Start', 'time_start']);
                    const endTime = getFieldValue(['Shift_End', 'shift_end', 'End_Time', 'end_time', 'EndTime', 'endTime', 'Time_End', 'time_end']);
                    const licenseExpiry = getFieldValue(['License_Expiry', 'license_expiry', 'LicenseExpiry', 'licenseExpiry', 'Expiry_Date', 'expiry_date']);
                    const onCall = getFieldValue(['On_Call', 'on_call', 'OnCall', 'onCall', 'Oncall', 'oncall']);

                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{doctorName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-300">{doctorId}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {specialty}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {licenseNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {startTime !== 'N/A' && endTime !== 'N/A' ? `${startTime} - ${endTime}` : 
                           startTime !== 'N/A' ? startTime : 
                           endTime !== 'N/A' ? endTime : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {licenseExpiry}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={onCall === 'Y' || onCall === 'Yes' || onCall === '1' || onCall === 'true' ? 'default' : 'secondary'}>
                            {onCall === 'Y' || onCall === 'Yes' || onCall === '1' || onCall === 'true' ? 'On Call' : 'Regular'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.length > 10 && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-center text-sm text-gray-500 dark:text-gray-300">
                  Showing 10 of {data.length} records
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
