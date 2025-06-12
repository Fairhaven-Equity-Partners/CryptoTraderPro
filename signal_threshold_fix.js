
// FIXED BALANCED THRESHOLD RANGES
// Replaces the biased ranges that caused 87.5% SHORT bias

// Short timeframes (5m, 15m, 30m, 1h) - More reactive
if (['5m', '15m', '30m', '1h'].includes(timeframe)) {
  signalScore = (signalScore * 0.9) + (lastDigits * 0.1);
  if (signalScore < 40) direction = 'LONG';        // 40% LONG
  else if (signalScore < 80) direction = 'SHORT';  // 40% SHORT  
  else direction = 'NEUTRAL';                      // 20% NEUTRAL
}
// Mid timeframes (1d, 3d) - Balanced approach
else if (['1d', '3d'].includes(timeframe)) {
  signalScore = (signalScore * 0.8) + (lastDigits * 0.2);
  if (signalScore < 35) direction = 'LONG';        // 35% LONG
  else if (signalScore < 70) direction = 'SHORT';  // 35% SHORT
  else direction = 'NEUTRAL';                      // 30% NEUTRAL
}
// Long timeframes (1w, 1M) - More conservative
else {
  signalScore = (signalScore * 0.7) + (lastDigits * 0.3);
  if (signalScore < 30) direction = 'LONG';        // 30% LONG
  else if (signalScore < 60) direction = 'SHORT';  // 30% SHORT
  else direction = 'NEUTRAL';                      // 40% NEUTRAL
}