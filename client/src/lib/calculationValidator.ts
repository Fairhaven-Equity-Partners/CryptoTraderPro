/**
 * Mathematical Accuracy Validation System
 * Verifies calculation precision and identifies inconsistencies
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    priceConsistency: number;
    riskRewardRatio: number;
    confidenceRealism: number;
    technicalIndicatorAlignment: number;
  };
}

export class CalculationValidator {
  private static readonly MAX_STOP_LOSS_PERCENTAGE = 15;
  private static readonly MAX_TAKE_PROFIT_PERCENTAGE = 30;
  private static readonly MAX_CONFIDENCE_SCORE = 85;
  private static readonly MIN_CONFIDENCE_SCORE = 51;

  public static validateSignal(signal: any, currentPrice: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let metrics = {
      priceConsistency: 0,
      riskRewardRatio: 0,
      confidenceRealism: 0,
      technicalIndicatorAlignment: 0
    };

    // Validate price consistency
    const priceDeviation = Math.abs(signal.entryPrice - currentPrice) / currentPrice;
    if (priceDeviation > 0.02) { // 2% tolerance
      errors.push(`Entry price ${signal.entryPrice} deviates ${(priceDeviation * 100).toFixed(2)}% from current price ${currentPrice}`);
    }
    metrics.priceConsistency = Math.max(0, 100 - (priceDeviation * 5000));

    // Validate stop loss and take profit ratios
    const stopLossDistance = Math.abs(signal.stopLoss - signal.entryPrice);
    const takeProfitDistance = Math.abs(signal.takeProfit - signal.entryPrice);
    const stopLossPercentage = (stopLossDistance / signal.entryPrice) * 100;
    const takeProfitPercentage = (takeProfitDistance / signal.entryPrice) * 100;

    if (stopLossPercentage > this.MAX_STOP_LOSS_PERCENTAGE) {
      errors.push(`Stop loss percentage ${stopLossPercentage.toFixed(2)}% exceeds maximum ${this.MAX_STOP_LOSS_PERCENTAGE}%`);
    }

    if (takeProfitPercentage > this.MAX_TAKE_PROFIT_PERCENTAGE) {
      errors.push(`Take profit percentage ${takeProfitPercentage.toFixed(2)}% exceeds maximum ${this.MAX_TAKE_PROFIT_PERCENTAGE}%`);
    }

    const riskRewardRatio = takeProfitDistance / stopLossDistance;
    if (riskRewardRatio < 1.0 || riskRewardRatio > 3.0) {
      warnings.push(`Risk/reward ratio ${riskRewardRatio.toFixed(2)} is outside optimal range (1.0-3.0)`);
    }
    metrics.riskRewardRatio = Math.max(0, 100 - Math.abs(riskRewardRatio - 1.5) * 50);

    // Validate confidence score realism
    if (signal.confidence > this.MAX_CONFIDENCE_SCORE) {
      errors.push(`Confidence score ${signal.confidence}% exceeds realistic maximum ${this.MAX_CONFIDENCE_SCORE}%`);
    }

    if (signal.confidence < this.MIN_CONFIDENCE_SCORE && signal.direction !== 'NEUTRAL') {
      warnings.push(`Confidence score ${signal.confidence}% is below recommended minimum ${this.MIN_CONFIDENCE_SCORE}%`);
    }

    metrics.confidenceRealism = signal.confidence <= this.MAX_CONFIDENCE_SCORE ? 100 : 
      Math.max(0, 100 - ((signal.confidence - this.MAX_CONFIDENCE_SCORE) * 5));

    // Validate technical indicator alignment
    const indicators = signal.indicators;
    let alignmentScore = 0;
    let totalIndicators = 0;

    if (indicators.rsi) {
      totalIndicators++;
      if ((signal.direction === 'LONG' && indicators.rsi.signal === 'BUY') ||
          (signal.direction === 'SHORT' && indicators.rsi.signal === 'SELL') ||
          (signal.direction === 'NEUTRAL' && indicators.rsi.signal === 'NEUTRAL')) {
        alignmentScore++;
      }
    }

    if (indicators.macd) {
      totalIndicators++;
      if ((signal.direction === 'LONG' && indicators.macd.signal === 'BUY') ||
          (signal.direction === 'SHORT' && indicators.macd.signal === 'SELL')) {
        alignmentScore++;
      }
    }

    if (indicators.ema) {
      totalIndicators++;
      const emaAlignment = indicators.ema.short > indicators.ema.medium;
      if ((signal.direction === 'LONG' && emaAlignment) ||
          (signal.direction === 'SHORT' && !emaAlignment)) {
        alignmentScore++;
      }
    }

    metrics.technicalIndicatorAlignment = totalIndicators > 0 ? (alignmentScore / totalIndicators) * 100 : 0;

    if (metrics.technicalIndicatorAlignment < 60) {
      warnings.push(`Technical indicator alignment is low (${metrics.technicalIndicatorAlignment.toFixed(1)}%)`);
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings,
      metrics
    };
  }

  public static validateMultiTimeframeConsistency(signals: Map<string, any>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const metrics = {
      priceConsistency: 100,
      riskRewardRatio: 100,
      confidenceRealism: 100,
      technicalIndicatorAlignment: 100
    };

    const signalArray = Array.from(signals.values());
    if (signalArray.length === 0) {
      return { isValid: true, errors, warnings, metrics };
    }

    // Check for conflicting signals across timeframes
    const longSignals = signalArray.filter(s => s.direction === 'LONG').length;
    const shortSignals = signalArray.filter(s => s.direction === 'SHORT').length;
    const neutralSignals = signalArray.filter(s => s.direction === 'NEUTRAL').length;

    if (longSignals > 0 && shortSignals > 0) {
      const conflictRatio = Math.min(longSignals, shortSignals) / signalArray.length;
      if (conflictRatio > 0.3) {
        warnings.push(`High signal conflict: ${longSignals} LONG vs ${shortSignals} SHORT signals`);
      }
    }

    // Check price consistency across all signals
    const entryPrices = signalArray.map(s => s.entryPrice);
    const priceSpread = Math.max(...entryPrices) - Math.min(...entryPrices);
    const avgPrice = entryPrices.reduce((sum, price) => sum + price, 0) / entryPrices.length;
    const priceDeviationPercentage = (priceSpread / avgPrice) * 100;

    if (priceDeviationPercentage > 1.0) {
      errors.push(`Entry price inconsistency: ${priceDeviationPercentage.toFixed(2)}% spread across timeframes`);
      metrics.priceConsistency = Math.max(0, 100 - (priceDeviationPercentage * 20));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics
    };
  }
}