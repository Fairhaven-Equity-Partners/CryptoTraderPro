import { useMacroIndicators } from '../hooks/useMacroIndicators';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LucideArrowDown, LucideArrowUp, LucideActivity, LucideTrendingUp, LucideTrendingDown, LucideInfo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MacroData } from '../lib/macroIndicators';

interface MacroIndicatorsPanelProps {
  symbol?: string;
}

export default function MacroIndicatorsPanel({ symbol }: MacroIndicatorsPanelProps) {
  const { 
    macroData, 
    macroScore, 
    macroClassification, 
    macroInsights, 
    isLoading, 
    error,
    refreshData 
  } = useMacroIndicators();

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-accent/20">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-md flex items-center">
            <LucideActivity className="mr-2 size-4" />
            Macro Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="text-center text-muted-foreground py-4">
            Loading macro data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-accent/20">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-md flex items-center">
            <LucideActivity className="mr-2 size-4" />
            Macro Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="text-center text-red-500 py-4">
            Error loading macro data
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColorClass = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 60) return 'text-green-400';
    if (score >= 45) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreProgressClass = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 60) return 'bg-green-400';
    if (score >= 45) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatNumberWithSuffix = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(0);
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-accent/20">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-md flex items-center justify-between">
          <div className="flex items-center">
            <LucideActivity className="mr-2 size-4" />
            Macro Indicators
          </div>
          <Badge variant="outline" className="ml-2 text-xs">Global data</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-4">
          {/* Macro score section */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Macro Environment</span>
              <span className={cn("font-bold", getScoreColorClass(macroScore))}>
                {macroScore}/100
              </span>
            </div>
            <Progress value={macroScore} className={`h-2 ${getScoreProgressClass(macroScore)}`} />
            <div className="mt-1 text-xs text-center font-medium text-muted-foreground">
              Classification: {macroClassification}
            </div>
          </div>
          
          <Separator className="my-2" />
          
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-secondary/20 rounded-md flex justify-between items-center">
              <span>BTC Dominance</span>
              <Badge variant="outline">{macroData.btcDominance.toFixed(1)}%</Badge>
            </div>
            <div className="p-2 bg-secondary/20 rounded-md flex justify-between items-center">
              <span>USDT Dominance</span>
              <Badge variant="outline">{macroData.usdtDominance.toFixed(1)}%</Badge>
            </div>
            <div className="p-2 bg-secondary/20 rounded-md flex justify-between items-center">
              <span>Fear & Greed</span>
              <Badge variant="outline" className={
                macroData.fearGreedIndex > 75 ? "border-green-500 text-green-500" :
                macroData.fearGreedIndex > 55 ? "border-green-400 text-green-400" :
                macroData.fearGreedIndex > 45 ? "border-yellow-500 text-yellow-500" :
                macroData.fearGreedIndex > 25 ? "border-orange-500 text-orange-500" :
                "border-red-500 text-red-500"
              }>
                {macroData.fearGreedIndex}
              </Badge>
            </div>
            <div className="p-2 bg-secondary/20 rounded-md flex justify-between items-center">
              <span>M2 Supply YoY</span>
              <Badge variant={macroData.m2ChangeYoY >= 0 ? "outline" : "destructive"} className={
                macroData.m2ChangeYoY >= 5 ? "border-green-500 text-green-500" :
                macroData.m2ChangeYoY >= 0 ? "border-yellow-500 text-yellow-500" :
                "border-red-500 text-red-500"
              }>
                {macroData.m2ChangeYoY > 0 ? "+" : ""}{macroData.m2ChangeYoY.toFixed(1)}%
              </Badge>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          {/* On-chain metrics */}
          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-sm font-semibold">On-Chain Activity</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-secondary/20 rounded-md flex justify-between items-center">
                <span>Exchange Flows</span>
                <Badge variant={macroData.exchangeFlowsNet < 0 ? "outline" : "destructive"} className={
                  macroData.exchangeFlowsNet < 0 ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
                }>
                  {macroData.exchangeFlowsNet < 0 ? "Outflow" : "Inflow"}
                </Badge>
              </div>
              <div className="p-2 bg-secondary/20 rounded-md flex justify-between items-center">
                <span>Whale Transactions</span>
                <Badge variant="outline">
                  {formatNumberWithSuffix(macroData.whaleTransactions)}
                </Badge>
              </div>
              <div className="p-2 bg-secondary/20 rounded-md flex justify-between items-center">
                <span>Active Addresses</span>
                <Badge variant="outline">
                  {formatNumberWithSuffix(macroData.activeBTCAddresses)}
                </Badge>
              </div>
              <div className="p-2 bg-secondary/20 rounded-md flex justify-between items-center">
                <span>Avg. Tx Fee</span>
                <Badge variant="outline">
                  ${macroData.averageTransactionFee.toFixed(2)}
                </Badge>
              </div>
            </div>
          </div>
          
          <Separator className="my-2" />
          
          {/* Macro insights */}
          <div>
            <div className="flex items-center mb-2">
              <h3 className="text-sm font-semibold">Key Insights</h3>
              <Badge variant="outline" className="ml-2 text-xs">Analysis</Badge>
            </div>
            <div className="space-y-1">
              {macroInsights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex text-xs">
                  <LucideInfo className="mr-1 size-3 text-primary mt-0.5 shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}