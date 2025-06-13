import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonteCarloRiskDisplay } from '@/components/MonteCarloRiskDisplay';
import { BarChart3, TrendingUp, Shield } from 'lucide-react';

export default function RiskAnalysis() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');

  const symbols = [
    'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT',
    'ADA/USDT', 'AVAX/USDT', 'DOT/USDT', 'LINK/USDT', 'UNI/USDT'
  ];

  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '30m', label: '30 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '3d', label: '3 Days' },
    { value: '1w', label: '1 Week' },
    { value: '1M', label: '1 Month' }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Advanced Risk Analysis
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Monte Carlo simulations with institutional-grade precision
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analysis Parameters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Cryptocurrency Pair
              </label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger>
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent>
                  {symbols.map((symbol) => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Timeframe
              </label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="w-full space-y-2">
                <div className="text-sm font-medium">Analysis Status</div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Shield className="h-4 w-4" />
                  System Ready
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MonteCarloRiskDisplay 
        symbol={selectedSymbol} 
        timeframe={selectedTimeframe}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Risk Analysis Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Monte Carlo Simulations</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                1000+ iteration risk modeling with geometric Brownian motion for accurate outcome prediction
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Value at Risk (VaR)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                95% confidence interval analysis showing potential losses under normal market conditions
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Portfolio Optimization</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Advanced correlation analysis and risk-adjusted position sizing recommendations
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Sharpe Ratio Analysis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Risk-adjusted return measurement for optimal investment decision making
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Maximum Drawdown</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Peak-to-trough decline analysis to understand worst-case scenario impacts
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Win Probability</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Statistical probability assessment based on current market conditions and signal confidence
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}