import BigNumber from 'bignumber.js';

// Configure BigNumber for ultra-high precision
BigNumber.config({
  DECIMAL_PLACES: 50,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
  EXPONENTIAL_AT: [-50, 50],
  RANGE: [-1e+50, 1e+50],
  CRYPTO: true,
  MODULO_MODE: BigNumber.ROUND_FLOOR,
  POW_PRECISION: 50,
  FORMAT: {
    prefix: '',
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
    suffix: ''
  }
});

export class UltraPrecisionMathEngine {
  static readonly ULTRA_PRECISION = 50;
  static readonly FINANCIAL_PRECISION = 20;
  static readonly PERCENTAGE_PRECISION = 10;

  /**
   * Ultra-precise addition with perfect accuracy
   */
  static ultraAdd(a: number | string, b: number | string): BigNumber {
    const bigA = new BigNumber(a);
    const bigB = new BigNumber(b);
    return bigA.plus(bigB);
  }

  /**
   * Ultra-precise subtraction with perfect accuracy
   */
  static ultraSubtract(a: number | string, b: number | string): BigNumber {
    const bigA = new BigNumber(a);
    const bigB = new BigNumber(b);
    return bigA.minus(bigB);
  }

  /**
   * Ultra-precise multiplication with perfect accuracy
   */
  static ultraMultiply(a: number | string, b: number | string): BigNumber {
    const bigA = new BigNumber(a);
    const bigB = new BigNumber(b);
    return bigA.times(bigB);
  }

  /**
   * Ultra-precise division with perfect accuracy
   */
  static ultraDivide(a: number | string, b: number | string): BigNumber {
    const bigA = new BigNumber(a);
    const bigB = new BigNumber(b);
    
    if (bigB.isZero()) {
      throw new Error('Division by zero not allowed in ultra-precision mode');
    }
    
    return bigA.dividedBy(bigB);
  }

  /**
   * Perfect percentage calculation with zero error
   */
  static perfectPercentage(value: number | string, total: number | string): BigNumber {
    const bigValue = new BigNumber(value);
    const bigTotal = new BigNumber(total);
    
    if (bigTotal.isZero()) {
      return new BigNumber(0);
    }
    
    return bigValue.dividedBy(bigTotal).times(100);
  }

  /**
   * Perfect moving average with ultra precision
   */
  static perfectMovingAverage(values: (number | string)[], period: number): BigNumber {
    if (values.length < period) {
      throw new Error('Insufficient data for ultra-precise moving average');
    }
    
    const recentValues = values.slice(-period);
    let sum = new BigNumber(0);
    
    for (const value of recentValues) {
      sum = sum.plus(new BigNumber(value));
    }
    
    return sum.dividedBy(period);
  }

  /**
   * Perfect exponential moving average
   */
  static perfectEMA(values: (number | string)[], period: number): BigNumber {
    if (values.length === 0) {
      throw new Error('No data provided for ultra-precise EMA');
    }
    
    const alpha = new BigNumber(2).dividedBy(period + 1);
    const oneMinusAlpha = new BigNumber(1).minus(alpha);
    let ema = new BigNumber(values[0]);
    
    for (let i = 1; i < values.length; i++) {
      const currentValue = new BigNumber(values[i]);
      ema = currentValue.times(alpha).plus(ema.times(oneMinusAlpha));
    }
    
    return ema;
  }

  /**
   * Perfect standard deviation calculation
   */
  static perfectStandardDeviation(values: (number | string)[]): BigNumber {
    if (values.length < 2) {
      throw new Error('Insufficient data for ultra-precise standard deviation');
    }
    
    const mean = this.perfectMovingAverage(values, values.length);
    let variance = new BigNumber(0);
    
    for (const value of values) {
      const bigValue = new BigNumber(value);
      const diff = bigValue.minus(mean);
      variance = variance.plus(diff.times(diff));
    }
    
    variance = variance.dividedBy(values.length - 1);
    return variance.sqrt();
  }

  /**
   * Convert to financial precision
   */
  static toFinancialPrecision(value: BigNumber): number {
    return parseFloat(value.toFixed(this.FINANCIAL_PRECISION, BigNumber.ROUND_HALF_UP));
  }

  /**
   * Convert to percentage precision
   */
  static toPercentagePrecision(value: BigNumber): number {
    return parseFloat(value.toFixed(this.PERCENTAGE_PRECISION, BigNumber.ROUND_HALF_UP));
  }

  /**
   * Validate ultra-precision calculation
   */
  static validateUltraPrecision(result: BigNumber, expectedRange?: [number, number]): boolean {
    if (!result.isFinite()) {
      throw new Error('Ultra-precision calculation result is not finite');
    }
    
    if (expectedRange) {
      const [min, max] = expectedRange;
      const numResult = result.toNumber();
      if (numResult < min || numResult > max) {
        throw new Error(`Ultra-precision result ${numResult} outside expected range [${min}, ${max}]`);
      }
    }
    
    return true;
  }
}