import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SignalHeatMap from "@/components/SignalHeatMap";

const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];

export default function HeatMap() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('4h');

  return (
    <div className="flex flex-col min-h-screen bg-background p-4 space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold gradient-text">Market Signal Heatmap</h1>
        <p className="text-muted-foreground">
          Real-time signal analysis across all 50 cryptocurrency pairs with authenticated market data
        </p>
      </div>

      {/* Timeframe Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Timeframe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {timeframes.map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
                className="min-w-[60px]"
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Signal Heatmap */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Market Signals - {selectedTimeframe}</span>
            <Badge variant="outline" className="text-xs">
              Live Data
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <SignalHeatMap selectedTimeframe={selectedTimeframe} />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Signal Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>LONG - Buy Signal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>SHORT - Sell Signal</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>NEUTRAL - Hold</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}