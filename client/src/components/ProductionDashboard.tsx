
/**
 * Production Dashboard - Enhanced Cryptocurrency Intelligence Platform
 * Professional interface with all AI optimizations and features
 */

import React, { useState, useEffect } from 'react';
import { AdvancedSignalDashboard } from './components/AdvancedSignalDashboard';
import { EnhancedSignalReasoning } from './components/EnhancedSignalReasoning';
import { ConfidenceVisualization } from './components/ConfidenceVisualization';
import { TechnicalAnalysisSummary } from './components/TechnicalAnalysisSummary';
import { RiskAssessmentDashboard } from './components/RiskAssessmentDashboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CRYPTOCURRENCY_PAIRS = [
  'BTC/USDT', 'ETH/USDT', 'XRP/USDT', 'SOL/USDT', 'BNB/USDT',
  'ADA/USDT', 'DOGE/USDT', 'MATIC/USDT', 'DOT/USDT', 'LINK/USDT'
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' }
];

export function ProductionDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('4h');
  const [currentSignal, setCurrentSignal] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const health = await response.json();
      setSystemHealth(health);
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  const handleSignalUpdate = (signal) => {
    setCurrentSignal(signal);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Cryptocurrency Intelligence Platform
              </h1>
              {systemHealth && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {systemHealth.status === 'operational' ? 'Operational' : 'Maintenance'}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRYPTOCURRENCY_PAIRS.map(pair => (
                    <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="signals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="signals">Trading Signals</TabsTrigger>
            <TabsTrigger value="analysis">Technical Analysis</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reasoning">AI Reasoning</TabsTrigger>
          </TabsList>

          <TabsContent value="signals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AdvancedSignalDashboard
                  symbol={selectedSymbol}
                  onTimeframeSelect={setSelectedTimeframe}
                  onAnalysisComplete={handleSignalUpdate}
                />
              </div>
              <div>
                <ConfidenceVisualization
                  symbol={selectedSymbol}
                  timeframe={selectedTimeframe}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <TechnicalAnalysisSummary symbol={selectedSymbol} />
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <RiskAssessmentDashboard symbol={selectedSymbol} timeframe={selectedTimeframe} />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {systemHealth && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 rounded-lg bg-blue-50">
                          <div className="text-2xl font-bold text-blue-600">
                            {systemHealth.performance?.api_response_time_ms}ms
                          </div>
                          <div className="text-sm text-blue-700">API Response</div>
                        </div>
                        <div className="text-center p-3 rounded-lg bg-green-50">
                          <div className="text-2xl font-bold text-green-600">
                            {(systemHealth.performance?.cache_hit_rate * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-green-700">Cache Hit Rate</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Signals Generated: {systemHealth.performance?.total_signals_generated?.toLocaleString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reasoning" className="space-y-6">
            {currentSignal && (
              <EnhancedSignalReasoning signal={currentSignal} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}