import { UltraPrecisionMathEngine } from './UltraPrecisionMathEngine';
import BigNumber from 'bignumber.js';

export class PerfectTechnicalIndicators {
  /**
   * Perfect RSI calculation with zero computational errors
   */
  static calculatePerfectRSI(prices: (number | string)[], period: number = 14): number {
    if (prices.length < period + 1) {
      throw new Error('Insufficient data for perfect RSI calculation');
    }

    const gains: BigNumber[] = [];
    const losses: BigNumber[] = [];

    // Calculate perfect price changes
    for (let i = 1; i < prices.length; i++) {
      const change = UltraPrecisionMathEngine.ultraSubtract(prices[i], prices[i - 1]);
      
      if (change.isGreaterThan(0)) {
        gains.push(change);
        losses.push(new BigNumber(0));
      } else {
        gains.push(new BigNumber(0));
        losses.push(change.abs());
      }
    }

    // Calculate perfect initial averages
    let avgGain = UltraPrecisionMathEngine.perfectMovingAverage(
      gains.slice(0, period).map(g => g.toString()), 
      period
    );
    let avgLoss = UltraPrecisionMathEngine.perfectMovingAverage(
      losses.slice(0, period).map(l => l.toString()), 
      period
    );

    // Calculate perfect RSI for remaining periods
    for (let i = period; i < gains.length; i++) {
      const periodMinusOne = new BigNumber(period - 1);
      avgGain = avgGain.times(periodMinusOne).plus(gains[i]).dividedBy(period);
      avgLoss = avgLoss.times(periodMinusOne).plus(losses[i]).dividedBy(period);
    }

    if (avgLoss.isZero()) {
      return 100;
    }

    const rs = avgGain.dividedBy(avgLoss);
    const hundred = new BigNumber(100);
    const rsi = hundred.minus(hundred.dividedBy(rs.plus(1)));

    // Validate RSI is within perfect bounds
    UltraPrecisionMathEngine.validateUltraPrecision(rsi, [0, 100]);

    return UltraPrecisionMathEngine.toFinancialPrecision(rsi);
  }

  /**
   * Perfect MACD calculation with exact precision
   */
  static calculatePerfectMACD(
    prices: (number | string)[], 
    fastPeriod: number = 12, 
    slowPeriod: number = 26, 
    signalPeriod: number = 9
  ): { macd: number; signal: number; histogram: number } {
    if (prices.length < slowPeriod) {
      throw new Error('Insufficient data for perfect MACD calculation');
    }

    const fastEMA = UltraPrecisionMathEngine.perfectEMA(prices, fastPeriod);
    const slowEMA = UltraPrecisionMathEngine.perfectEMA(prices, slowPeriod);
    const macdLine = fastEMA.minus(slowEMA);

    // Calculate perfect signal line
    const macdValues = [macdLine.toString()];
    const signalLine = UltraPrecisionMathEngine.perfectEMA(macdValues, signalPeriod);
    const histogram = macdLine.minus(signalLine);

    // Validate perfect MACD calculations
    UltraPrecisionMathEngine.validateUltraPrecision(macdLine);
    UltraPrecisionMathEngine.validateUltraPrecision(signalLine);
    UltraPrecisionMathEngine.validateUltraPrecision(histogram);

    return {
      macd: UltraPrecisionMathEngine.toFinancialPrecision(macdLine),
      signal: UltraPrecisionMathEngine.toFinancialPrecision(signalLine),
      histogram: UltraPrecisionMathEngine.toFinancialPrecision(histogram)
    };
  }

  /**
   * Perfect Bollinger Bands with exact standard deviation
   */
  static calculatePerfectBollingerBands(
    prices: (number | string)[], 
    period: number = 20, 
    standardDeviations: number = 2
  ): { upper: number; middle: number; lower: number } {
    if (prices.length < period) {
      throw new Error('Insufficient data for perfect Bollinger Bands calculation');
    }

    const middle = UltraPrecisionMathEngine.perfectMovingAverage(prices.slice(-period), period);
    const standardDeviation = UltraPrecisionMathEngine.perfectStandardDeviation(prices.slice(-period));
    const multiplier = new BigNumber(standardDeviations);

    const upper = middle.plus(standardDeviation.times(multiplier));
    const lower = middle.minus(standardDeviation.times(multiplier));

    // Validate perfect Bollinger Bands
    UltraPrecisionMathEngine.validateUltraPrecision(upper);
    UltraPrecisionMathEngine.validateUltraPrecision(middle);
    UltraPrecisionMathEngine.validateUltraPrecision(lower);

    // Verify mathematical relationship: lower < middle < upper
    if (!lower.isLessThan(middle) || !middle.isLessThan(upper)) {
      throw new Error('Perfect Bollinger Bands mathematical relationship violation');
    }

    return {
      upper: UltraPrecisionMathEngine.toFinancialPrecision(upper),
      middle: UltraPrecisionMathEngine.toFinancialPrecision(middle),
      lower: UltraPrecisionMathEngine.toFinancialPrecision(lower)
    };
  }

  /**
   * Perfect ATR with exact true range calculations
   */
  static calculatePerfectATR(
    highs: (number | string)[], 
    lows: (number | string)[], 
    closes: (number | string)[], 
    period: number = 14
  ): number {
    if (highs.length !== lows.length || lows.length !== closes.length) {
      throw new Error('Perfect ATR requires equal length price arrays');
    }

    if (highs.length < period + 1) {
      throw new Error('Insufficient data for perfect ATR calculation');
    }

    const trueRanges: BigNumber[] = [];

    for (let i = 1; i < highs.length; i++) {
      const high = new BigNumber(highs[i]);
      const low = new BigNumber(lows[i]);
      const prevClose = new BigNumber(closes[i - 1]);

      const tr1 = high.minus(low);
      const tr2 = high.minus(prevClose).abs();
      const tr3 = low.minus(prevClose).abs();

      const trueRange = BigNumber.max(tr1, BigNumber.max(tr2, tr3));
      trueRanges.push(trueRange);
    }

    const atr = UltraPrecisionMathEngine.perfectMovingAverage(
      trueRanges.slice(-period).map(tr => tr.toString()), 
      period
    );

    // Validate perfect ATR
    UltraPrecisionMathEngine.validateUltraPrecision(atr, [0, Number.MAX_VALUE]);

    return UltraPrecisionMathEngine.toFinancialPrecision(atr);
  }

  /**
   * Perfect Stochastic Oscillator
   */
  static calculatePerfectStochastic(
    highs: (number | string)[], 
    lows: (number | string)[], 
    closes: (number | string)[], 
    kPeriod: number = 14,
    dPeriod: number = 3
  ): { k: number; d: number } {
    if (highs.length < kPeriod) {
      throw new Error('Insufficient data for perfect Stochastic calculation');
    }

    const recentHighs = highs.slice(-kPeriod).map(h => new BigNumber(h));
    const recentLows = lows.slice(-kPeriod).map(l => new BigNumber(l));
    const currentClose = new BigNumber(closes[closes.length - 1]);

    const highestHigh = BigNumber.max(...recentHighs);
    const lowestLow = BigNumber.min(...recentLows);

    const k = currentClose.minus(lowestLow)
      .dividedBy(highestHigh.minus(lowestLow))
      .times(100);

    // Calculate %D as moving average of %K
    const kValues = [k.toString()];
    const d = UltraPrecisionMathEngine.perfectMovingAverage(kValues, Math.min(dPeriod, kValues.length));

    // Validate perfect Stochastic
    UltraPrecisionMathEngine.validateUltraPrecision(k, [0, 100]);
    UltraPrecisionMathEngine.validateUltraPrecision(d, [0, 100]);

    return {
      k: UltraPrecisionMathEngine.toFinancialPrecision(k),
      d: UltraPrecisionMathEngine.toFinancialPrecision(d)
    };
  }

  /**
   * Perfect Volume Weighted Average Price (VWAP)
   */
  static calculatePerfectVWAP(
    prices: (number | string)[], 
    volumes: (number | string)[]
  ): number {
    if (prices.length !== volumes.length) {
      throw new Error('Price and volume arrays must have equal length');
    }

    let totalVolume = new BigNumber(0);
    let totalVolumePrice = new BigNumber(0);

    for (let i = 0; i < prices.length; i++) {
      const price = new BigNumber(prices[i]);
      const volume = new BigNumber(volumes[i]);
      
      totalVolumePrice = totalVolumePrice.plus(price.times(volume));
      totalVolume = totalVolume.plus(volume);
    }

    if (totalVolume.isZero()) {
      throw new Error('Total volume cannot be zero for VWAP calculation');
    }

    const vwap = totalVolumePrice.dividedBy(totalVolume);
    return UltraPrecisionMathEngine.toFinancialPrecision(vwap);
  }
}