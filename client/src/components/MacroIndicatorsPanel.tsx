import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart4,
  DollarSign,
  AlertTriangle,
  Globe,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useMacroIndicators } from '../hooks/useMacroIndicators';
import { formatPercentage } from '../lib/calculations';

interface MacroIndicatorsPanelProps {
  symbol?: string;
}

export default function MacroIndicatorsPanel({ symbol }: MacroIndicatorsPanelProps) {
  const { macroData, macroScore, macroClassification, macroInsights, isLoading, error } = useMacroIndicators();

  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="h-4 w-full bg-primary/10 animate-pulse rounded"></div>
            <div className="h-12 w-full bg-primary/10 animate-pulse rounded"></div>
            <div className="h-4 w-3/4 bg-primary/10 animate-pulse rounded"></div>
            <div className="h-4 w-full bg-primary/10 animate-pulse rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="shadow-md border-red-400">
        <CardContent className="pt-6">
          <div className="flex items-center text-red-500 mb-2">
            <AlertTriangle className="mr-2" />
            <span>Error loading macro data</span>
          </div>
          <p className="text-sm opacity-80">
            Check connection or try again later
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-red-500';
    if (score < 50) return 'text-orange-500';
    if (score < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getScoreBadge = (score: number) => {
    if (score < 30) return 'destructive';
    if (score < 50) return 'secondary';
    if (score < 70) return 'outline';
    return 'outline';
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-3 w-3 text-green-500" />;
    if (value < 0) return <ArrowDownRight className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <Card className="shadow-md">
      <CardContent className="pt-6">
        {/* Macro Score */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium">Macro Score</span>
          <Badge variant={getScoreBadge(macroScore)}>{macroScore}/100</Badge>
        </div>
        
        <Progress value={macroScore} className="h-2 mb-4" />
        
        <div className="text-sm font-medium mb-1">Classification</div>
        <div className="p-2 bg-secondary/20 rounded-md mb-4">
          <span className={getScoreColor(macroScore)}>{macroClassification}</span>
        </div>
        
        {/* Market Metrics */}
        <div className="text-sm font-medium mb-1">Market Metrics</div>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center p-2 bg-secondary/20 rounded-md">
            <span className="text-xs">BTC Dominance</span>
            <div className="flex items-center">
              {getChangeIcon(macroData.btcDominance - 50)}
              <span>{formatPercentage(macroData.btcDominance)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-secondary/20 rounded-md">
            <span className="text-xs">USDT Dominance</span>
            <div className="flex items-center">
              {getChangeIcon(macroData.usdtDominance - 7)}
              <span>{formatPercentage(macroData.usdtDominance)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-secondary/20 rounded-md">
            <span className="text-xs">Fear & Greed</span>
            <div className="flex items-center">
              <Badge variant={macroData.fearGreedIndex > 50 ? "outline" : 
                              macroData.fearGreedIndex < 30 ? "destructive" : 
                              "secondary"} 
                     className={`text-xs ${macroData.fearGreedIndex > 50 ? "text-green-500 border-green-500" : ""}`}>
                {macroData.fearGreedClassification}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Key Insights */}
        <div className="text-sm font-medium mb-1">Key Insights</div>
        <div className="space-y-1 text-xs">
          {macroInsights.map((insight, i) => (
            <div key={i} className="flex items-start p-2 bg-secondary/20 rounded-md">
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}