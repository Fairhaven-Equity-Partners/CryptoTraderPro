
/**
 * Confidence Visualization Component
 * Time-series charts for signal confidence and performance trends
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ConfidenceVisualizationProps {
  symbol: string;
  timeframe: string;
}

export function ConfidenceVisualization({ symbol, timeframe }: ConfidenceVisualizationProps) {
  const [confidenceData, setConfidenceData] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfidenceData();
  }, [symbol, timeframe]);

  const fetchConfidenceData = async () => {
    try {
      const response = await fetch(`/api/confidence-history?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&period=7d`);
      const data = await response.json();
      
      setConfidenceData(data.confidence_timeline || []);
      setPerformanceData(data.performance_metrics || []);
    } catch (error) {
      console.error('Error fetching confidence data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Signal Confidence Analysis - {symbol} ({timeframe})</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="confidence" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="confidence">Confidence Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="indicators">Indicator Breakdown</TabsTrigger>
          </TabsList>
          
          <TabsContent value="confidence" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={confidenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confidence" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    name="Signal Confidence"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual_performance" 
                    stroke="#dc2626" 
                    strokeWidth={2}
                    name="Actual Performance"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">
                  {confidenceData.length > 0 ? 
                    (confidenceData.reduce((sum, d) => sum + d.confidence, 0) / confidenceData.length).toFixed(1) : 
                    '0'}%
                </div>
                <div className="text-sm text-blue-700">Average Confidence</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">
                  {performanceData.accuracy || '0'}%
                </div>
                <div className="text-sm text-green-700">Signal Accuracy</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-600">
                  {confidenceData.length}
                </div>
                <div className="text-sm text-purple-700">Total Signals</div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData.timeframe_breakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeframe" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                  <Bar dataKey="accuracy" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="indicators" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(performanceData.indicator_performance || {}).map(([indicator, data]) => (
                <div key={indicator} className="p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium capitalize">{indicator.replace('_', ' ')}</span>
                    <span className="text-sm text-gray-500">Weight: {(data.weight * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {data.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Accuracy ({data.total_signals} signals)
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}