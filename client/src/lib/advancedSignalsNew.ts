export function calculateTimeframeConfidence(
  chartData: ChartData[],
  timeframe: TimeFrame,
  weights: SignalWeights = DEFAULT_WEIGHTS,
  symbol: string
): AdvancedSignal {
  console.log(`[DETAIL] calculateTimeframeConfidence called with symbol: ${symbol}, timeframe: ${timeframe}, data length: ${chartData.length}`);
  
  try {
    // Validate input data
    if (!Array.isArray(chartData)) {
      console.error(`[ERROR] chartData is not an array for ${symbol} (${timeframe})`);
      throw new Error(`Invalid chart data: not an array`);
    }
    
    if (!symbol) {
      console.error(`[ERROR] symbol is missing for timeframe ${timeframe}`);
      throw new Error(`Missing symbol parameter`);
    }
    
    // Log first data point
    if (chartData.length > 0) {
      console.log(`[DETAIL] First data point for ${symbol} (${timeframe}):`, JSON.stringify(chartData[0]));
      console.log(`[DETAIL] Last data point for ${symbol} (${timeframe}):`, JSON.stringify(chartData[chartData.length - 1]));
    }
    
    if (chartData.length < 50) {
      throw new Error(`Insufficient data for analysis: ${chartData.length} data points (need at least 50)`);
    }
    
    const lastCandle = chartData[chartData.length - 1];
    const lastPrice = lastCandle.close;
    
    // Detect market environment
    const environment = detectMarketEnvironment(chartData, timeframe);
    
    // Get basic indicators
    const calculatedIndicators = indicators.analyzeIndicators(chartData);
    
    // Organize indicators by category
    const categorizedIndicators = {
      trend: calculatedIndicators.filter(i => i.category === 'TREND'),
      momentum: calculatedIndicators.filter(i => i.category === 'MOMENTUM'),
      volatility: calculatedIndicators.filter(i => i.category === 'VOLATILITY'),
      volume: calculatedIndicators.filter(i => i.category === 'VOLUME'),
      pattern: calculatedIndicators.filter(i => i.category === 'PATTERN')
    };
    
    // Calculate category scores
    const scores = {
      trend: calculateCategoryScore(categorizedIndicators.trend),
      momentum: calculateCategoryScore(categorizedIndicators.momentum),
      volatility: calculateCategoryScore(categorizedIndicators.volatility),
      volume: calculateCategoryScore(categorizedIndicators.volume),
      pattern: calculateCategoryScore(categorizedIndicators.pattern)
    };
    
    // Detect support and resistance levels
    const levels = detectSupportResistanceLevels(chartData, lastPrice);
    const levelsScore = calculateLevelsScore(levels, lastPrice);
    
    // Detect chart patterns
    const patterns = detectChartPatterns(chartData, symbol);
    
    // Calculate weighted score and direction
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, score] of Object.entries(scores)) {
      const weight = weights[category as keyof SignalWeights] || 0;
      totalScore += score.value * weight;
      totalWeight += weight;
    }
    
    // Add environment score
    const environmentScore = getEnvironmentScore(environment);
    totalScore += environmentScore * weights.marketCondition;
    totalWeight += weights.marketCondition;
    
    // Add levels score
    totalScore += levelsScore * weights.supportResistance;
    totalWeight += weights.supportResistance;
    
    // Include macro score if available
    const macroData = getMacroIndicators();
    const macroScore = macroData.economicHealth;
    const macroClass = getMacroEnvironmentClassification(macroData);
    const macroInsights = getMacroInsights(macroData);
    
    totalScore += macroScore * weights.macroeconomic;
    totalWeight += weights.macroeconomic;
    
    // Calculate final normalized score (0-100)
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 50;
    
    // Determine direction
    let direction: 'LONG' | 'SHORT' | 'NEUTRAL' = 'NEUTRAL';
    
    if (finalScore >= 60) {
      direction = 'LONG';
    } else if (finalScore <= 40) {
      direction = 'SHORT';
    }
    
    // Set confidence based on distance from neutral
    const confidence = Math.round(Math.abs(finalScore - 50) * 2);
    
    // Calculate key price levels
    const volatility = indicators.calculateATR(chartData, 14) / lastPrice;
    
    // Dynamic stop loss based on volatility and timeframe
    let stopLossMultiplier = 1.5;
    let takeProfitMultiplier = 2.0;
    
    // Adjust multipliers based on timeframe
    if (['1d', '3d', '1w', '1M'].includes(timeframe)) {
      stopLossMultiplier = 2.0;
      takeProfitMultiplier = 3.0;
    } else if (['4h', '1h'].includes(timeframe)) {
      stopLossMultiplier = 1.75;
      takeProfitMultiplier = 2.5;
    }
    
    // Calculate stop loss and take profit levels
    const atr = indicators.calculateATR(chartData, 14);
    
    let stopLoss: number;
    let takeProfit: number;
    
    if (direction === 'LONG') {
      stopLoss = lastPrice - (atr * stopLossMultiplier);
      takeProfit = lastPrice + (atr * takeProfitMultiplier);
    } else if (direction === 'SHORT') {
      stopLoss = lastPrice + (atr * stopLossMultiplier);
      takeProfit = lastPrice - (atr * takeProfitMultiplier);
    } else {
      // For neutral signals, set symmetric levels
      stopLoss = lastPrice - (atr * stopLossMultiplier);
      takeProfit = lastPrice + (atr * takeProfitMultiplier);
    }
    
    // Calculate risk-reward ratio
    const riskAmount = Math.abs(lastPrice - stopLoss);
    const rewardAmount = Math.abs(takeProfit - lastPrice);
    const riskReward = rewardAmount / (riskAmount || 1); // Avoid division by zero
    
    // Recommended leverage - calculated based on volatility, confidence, and timeframe
    const riskParams: LeverageParams = {
      symbol,
      currentPrice: lastPrice,
      timeframe,
      volatility: volatility * 100, // Convert to percentage
      signalStrength: confidence,
      riskTolerance: 'MEDIUM',
      strategy: 'TREND',
      riskPercentage: 1 // Default 1% risk per trade
    };
    
    // If we have a macro score, use it to adjust recommendation
    if (macroScore < 30) {
      riskParams.riskTolerance = 'LOW';
      riskParams.riskPercentage = 0.5;
    } else if (macroScore > 70) {
      riskParams.riskTolerance = 'HIGH';
      riskParams.riskPercentage = 2;
    }
    
    // Predict potential movement
    const historicalVolatility = indicators.calculateHistoricalVolatility(chartData, 14);
    
    // Convert percentage to decimal
    const volDecimal = historicalVolatility / 100;
    
    // Use confidence to estimate potential movement (as a multiple of historical volatility)
    const movementMultiplier = (confidence / 50) * (direction === 'NEUTRAL' ? 0.5 : 1.0);
    const percentChange = volDecimal * movementMultiplier * 100; // Convert back to percentage
    
    // Estimate time based on timeframe
    let timeEstimate: string;
    
    switch(timeframe) {
      case '1m':
      case '5m':
      case '15m':
        timeEstimate = '1-4 hours';
        break;
      case '30m':
      case '1h':
        timeEstimate = '1-2 days';
        break;
      case '4h':
        timeEstimate = '3-7 days';
        break;
      case '1d':
        timeEstimate = '1-3 weeks';
        break;
      case '3d':
      case '1w':
        timeEstimate = '1-2 months';
        break;
      case '1M':
        timeEstimate = '3-6 months';
        break;
      default:
        timeEstimate = 'variable';
    }
    
    // Use calculateSafeLeverage but handle any errors
    let recommendedLeverage: number;
    try {
      const leverageResult = calculateSafeLeverage(riskParams);
      recommendedLeverage = leverageResult.recommendedLeverage;
    } catch (err) {
      console.error(`Error calculating leverage for ${symbol}:`, err);
      recommendedLeverage = 1; // Safe default
    }
    
    const result: AdvancedSignal = {
      timeframe,
      direction,
      confidence,
      entryPrice: lastPrice,
      stopLoss,
      takeProfit,
      recommendedLeverage,
      indicators: categorizedIndicators,
      patternFormations: patterns,
      supportResistance: levels,
      optimalRiskReward: riskReward,
      predictedMovement: {
        percentChange,
        timeEstimate
      },
      macroScore,
      macroClassification: macroClass,
      macroInsights
    };
    
    return result;
  } catch (error) {
    console.error(`[ERROR] Error in calculateTimeframeConfidence for ${symbol} (${timeframe}):`, error);
    
    // Return a stub result with error information
    return {
      timeframe,
      direction: 'NEUTRAL',
      confidence: 0,
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      recommendedLeverage: 1,
      indicators: {
        trend: [],
        momentum: [],
        volatility: [],
        volume: [],
        pattern: []
      },
      patternFormations: [],
      supportResistance: [],
      optimalRiskReward: 0,
      predictedMovement: {
        percentChange: 0,
        timeEstimate: 'unknown'
      },
      macroScore: 50,
      macroClassification: 'Error calculating signals',
      macroInsights: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}