import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart, Area, AreaChart } from 'recharts';
import { useChartData } from '../hooks/useMarketData';
import { TimeFrame } from '../types';

interface ChartComponentProps {
  symbol: string;
  timeframe: TimeFrame;
  onChangeTimeframe: (timeframe: TimeFrame) => void;
}

const timeframes: TimeFrame[] = ['1h', '4h', '1d', '1w'];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-secondary p-2 border border-border rounded shadow-lg">
        <p className="text-xs text-white">{`Time: ${new Date(label).toLocaleString()}`}</p>
        <p className="text-xs text-success-foreground">{`Open: ${payload[0].payload.open.toFixed(2)}`}</p>
        <p className="text-xs text-white">{`High: ${payload[0].payload.high.toFixed(2)}`}</p>
        <p className="text-xs text-white">{`Low: ${payload[0].payload.low.toFixed(2)}`}</p>
        <p className="text-xs text-danger-foreground">{`Close: ${payload[0].payload.close.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};

const ChartComponent: React.FC<ChartComponentProps> = ({ 
  symbol, 
  timeframe, 
  onChangeTimeframe 
}) => {
  const { chartData, isLoading } = useChartData(symbol, timeframe);
  
  // Format data for Recharts
  const formattedData = chartData.map(candle => ({
    time: candle.time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    // Add a color property to determine if it's an up or down candle
    color: candle.close >= candle.open ? "#0ECB81" : "#E84142",
  }));
  
  return (
    <div className="mb-3 bg-secondary rounded-lg p-3 mx-2">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white text-lg font-medium">{symbol} Chart</h2>
        <div className="flex space-x-1">
          {timeframes.map(tf => (
            <button
              key={tf}
              className={`py-1 px-2 text-xs font-medium rounded ${
                tf === timeframe 
                  ? 'bg-accent text-primary' 
                  : 'bg-gray-700 text-neutral'
              }`}
              onClick={() => onChangeTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-secondary bg-opacity-50 flex items-center justify-center z-10">
            <span className="text-white">Loading chart data...</span>
          </div>
        )}
        
        <div className="relative w-full h-64 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={formattedData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ECB81" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0ECB81" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis 
                dataKey="time" 
                tick={{ fill: '#B7BDC6' }}
                tickFormatter={(time) => {
                  const date = new Date(time);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fill: '#B7BDC6' }}
                tickFormatter={(value) => value.toFixed(2)}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke="#0ECB81" 
                fillOpacity={1} 
                fill="url(#colorClose)" 
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend overlay */}
        <div className="absolute bottom-2 left-2 text-xs bg-secondary bg-opacity-60 p-1 rounded">
          <div className="flex items-center">
            <span className="h-2 w-2 bg-[#7B3FE4] rounded-full mr-1"></span>
            <span>RSI (78)</span>
          </div>
          <div className="flex items-center">
            <span className="h-2 w-2 bg-[#2196F3] rounded-full mr-1"></span>
            <span>MACD</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartComponent;
