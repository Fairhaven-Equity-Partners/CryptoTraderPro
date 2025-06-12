/**
 * Moon Phase Calculator and Market Correlation Analysis
 * Calculates current moon phase and its impact on market sentiment
 */

export interface MoonPhaseData {
  phase: number; // 0-1 where 0 = new moon, 0.5 = full moon
  phaseName: string;
  illumination: number; // 0-100% illuminated
  marketBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  impactStrength: number; // 0-1 multiplier for macro score
  description: string;
}

/**
 * Calculate the current moon phase using astronomical algorithms
 * Based on the lunar cycle of approximately 29.53059 days
 */
export function getCurrentMoonPhase(): MoonPhaseData {
  const now = new Date();
  
  // Known new moon date (January 29, 2025) as reference point
  const knownNewMoon = new Date('2025-01-29T12:36:00Z');
  const lunarCycle = 29.53059; // Average lunar cycle in days
  
  // Calculate days since known new moon
  const daysSinceNewMoon = (now.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  
  // Calculate current phase (0-1)
  const phase = (daysSinceNewMoon % lunarCycle) / lunarCycle;
  
  // Determine phase name and characteristics
  let phaseName: string;
  let marketBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  let impactStrength: number;
  let description: string;
  
  if (phase < 0.125) {
    // New Moon (0-3.7 days) - Bearish bias
    phaseName = 'New Moon';
    marketBias = 'BEARISH';
    impactStrength = 0.85; // Strong bearish influence
    description = 'New moon phase often correlates with market downturns and selling pressure';
  } else if (phase < 0.25) {
    // Waxing Crescent (3.7-7.4 days) - Slight bullish bias
    phaseName = 'Waxing Crescent';
    marketBias = 'NEUTRAL';
    impactStrength = 1.02; // Slight positive influence
    description = 'Growing moon energy may support gradual price recovery';
  } else if (phase < 0.375) {
    // First Quarter (7.4-11.1 days) - Neutral to bullish
    phaseName = 'First Quarter';
    marketBias = 'NEUTRAL';
    impactStrength = 1.05; // Moderate positive influence
    description = 'First quarter moon often brings market stability and upward momentum';
  } else if (phase < 0.5) {
    // Waxing Gibbous (11.1-14.8 days) - Building bullish energy
    phaseName = 'Waxing Gibbous';
    marketBias = 'BULLISH';
    impactStrength = 1.08; // Good positive influence
    description = 'Approaching full moon energy builds market optimism and buying pressure';
  } else if (phase < 0.625) {
    // Full Moon (14.8-18.5 days) - Peak bullish bias
    phaseName = 'Full Moon';
    marketBias = 'BULLISH';
    impactStrength = 1.15; // Strong bullish influence
    description = 'Full moon phase historically correlates with market peaks and strong buying activity';
  } else if (phase < 0.75) {
    // Waning Gibbous (18.5-22.2 days) - Declining bullish energy
    phaseName = 'Waning Gibbous';
    marketBias = 'NEUTRAL';
    impactStrength = 1.02; // Slight positive influence
    description = 'Post-full moon energy may maintain some bullish momentum before decline';
  } else if (phase < 0.875) {
    // Last Quarter (22.2-25.9 days) - Neutral to bearish
    phaseName = 'Last Quarter';
    marketBias = 'NEUTRAL';
    impactStrength = 0.95; // Slight negative influence
    description = 'Last quarter moon often brings market uncertainty and profit-taking';
  } else {
    // Waning Crescent (25.9-29.5 days) - Bearish bias building
    phaseName = 'Waning Crescent';
    marketBias = 'BEARISH';
    impactStrength = 0.88; // Moderate bearish influence
    description = 'Approaching new moon energy may create selling pressure and market caution';
  }
  
  // Calculate illumination percentage
  const illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * phase)));
  
  return {
    phase,
    phaseName,
    illumination,
    marketBias,
    impactStrength,
    description
  };
}

/**
 * Get appropriate emoji for moon phase
 */
export function getMoonPhaseEmoji(phaseName: string): string {
  switch (phaseName) {
    case 'New Moon':
      return '🌑';
    case 'Waxing Crescent':
      return '🌒';
    case 'First Quarter':
      return '🌓';
    case 'Waxing Gibbous':
      return '🌔';
    case 'Full Moon':
      return '🌕';
    case 'Waning Gibbous':
      return '🌖';
    case 'Last Quarter':
      return '🌗';
    case 'Waning Crescent':
      return '🌘';
    default:
      return '🌙';
  }
}

/**
 * Calculate moon phase impact on macro score
 * Integrates lunar cycle influence into overall market sentiment analysis
 */
export function calculateMoonPhaseImpact(baseMacroScore: number): {
  adjustedScore: number;
  moonData: MoonPhaseData;
  impactDetails: string;
} {
  const moonData = getCurrentMoonPhase();
  
  // Apply moon phase multiplier to macro score
  // The impact is weighted at about 5-15% of the total macro score
  const impactWeight = 0.1; // 10% weight for moon phase influence
  const adjustment = (moonData.impactStrength - 1) * impactWeight;
  const adjustedScore = Math.max(0, Math.min(100, baseMacroScore + (baseMacroScore * adjustment)));
  
  // Generate impact description
  let impactDetails: string;
  if (moonData.marketBias === 'BULLISH') {
    impactDetails = `${moonData.phaseName} adds +${Math.round(adjustment * baseMacroScore)} to macro score (bullish lunar influence`)`;
  } else if (moonData.marketBias === 'BEARISH') {
    impactDetails = `${moonData.phaseName} reduces macro score by ${Math.round(Math.abs(adjustment * baseMacroScore))} (bearish lunar influence`)`;
  } else {
    impactDetails = `${moonData.phaseName} has minimal impact on macro score (neutral lunar phase`)`;
  }
  
  return {
    adjustedScore: Math.round(adjustedScore * 10) / 10, // Round to 1 decimal
    moonData,
    impactDetails
  };
}

