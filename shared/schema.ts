import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const cryptoAssets = pgTable("crypto_assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  lastPrice: doublePrecision("last_price"),
  change24h: doublePrecision("change_24h"),
  volume24h: doublePrecision("volume_24h"),
  marketCap: doublePrecision("market_cap"),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertCryptoAssetSchema = createInsertSchema(cryptoAssets).pick({
  symbol: true,
  name: true,
  lastPrice: true,
  change24h: true,
  volume24h: true,
  marketCap: true,
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  direction: text("direction").notNull(), // LONG or SHORT
  conditions: jsonb("conditions").notNull(), // Store conditions as JSON
  targetPrice: doublePrecision("target_price"),
  isActive: boolean("is_active").default(true),
  isTriggered: boolean("is_triggered").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  userId: true,
  symbol: true,
  timeframe: true,
  direction: true,
  conditions: true,
  targetPrice: true,
  isActive: true,
});

export const signalHistory = pgTable("signal_history", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  direction: text("direction").notNull(), // LONG or SHORT
  confidence: integer("confidence").notNull(), // 0-100 confidence percentage
  strength: integer("strength").notNull(), // 0-100
  indicators: jsonb("indicators").notNull(), // Store indicator results as JSON
  price: doublePrecision("price").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertSignalHistorySchema = createInsertSchema(signalHistory).pick({
  symbol: true,
  timeframe: true,
  direction: true,
  confidence: true,
  strength: true,
  indicators: true,
  price: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CryptoAsset = typeof cryptoAssets.$inferSelect;
export type InsertCryptoAsset = z.infer<typeof insertCryptoAssetSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type SignalHistory = typeof signalHistory.$inferSelect;
export type InsertSignalHistory = z.infer<typeof insertSignalHistorySchema>;

// Trade Simulation and Accuracy Tracking Tables
export const tradeSimulations = pgTable("trade_simulations", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  direction: text("direction").notNull(), // LONG, SHORT
  entryPrice: doublePrecision("entry_price").notNull(),
  stopLoss: doublePrecision("stop_loss").notNull(),
  takeProfit: doublePrecision("take_profit").notNull(),
  confidence: doublePrecision("confidence").notNull(),
  entryTime: timestamp("entry_time").defaultNow().notNull(),
  exitTime: timestamp("exit_time"),
  exitPrice: doublePrecision("exit_price"),
  exitReason: text("exit_reason"), // TP, SL, TIMEOUT, MANUAL
  profitLoss: doublePrecision("profit_loss"),
  profitLossPercent: doublePrecision("profit_loss_percent"),
  isActive: boolean("is_active").default(true),
  signalData: text("signal_data"), // JSON string of original signal
});

export const insertTradeSimulationSchema = createInsertSchema(tradeSimulations).pick({
  symbol: true,
  timeframe: true,
  direction: true,
  entryPrice: true,
  stopLoss: true,
  takeProfit: true,
  confidence: true,
  signalData: true,
});

export const accuracyMetrics = pgTable("accuracy_metrics", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  totalTrades: integer("total_trades").default(0),
  winningTrades: integer("winning_trades").default(0),
  losingTrades: integer("losing_trades").default(0),
  averageProfit: doublePrecision("average_profit").default(0),
  averageLoss: doublePrecision("average_loss").default(0),
  winRate: doublePrecision("win_rate").default(0),
  profitFactor: doublePrecision("profit_factor").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  // Indicator-specific accuracy
  rsiAccuracy: doublePrecision("rsi_accuracy").default(0),
  macdAccuracy: doublePrecision("macd_accuracy").default(0),
  emaAccuracy: doublePrecision("ema_accuracy").default(0),
  stochasticAccuracy: doublePrecision("stochastic_accuracy").default(0),
  adxAccuracy: doublePrecision("adx_accuracy").default(0),
  bbAccuracy: doublePrecision("bb_accuracy").default(0),
});

export const insertAccuracyMetricsSchema = createInsertSchema(accuracyMetrics).pick({
  symbol: true,
  timeframe: true,
  totalTrades: true,
  winningTrades: true,
  losingTrades: true,
  averageProfit: true,
  averageLoss: true,
  winRate: true,
  profitFactor: true,
  rsiAccuracy: true,
  macdAccuracy: true,
  emaAccuracy: true,
  stochasticAccuracy: true,
  adxAccuracy: true,
  bbAccuracy: true,
});

export type TradeSimulation = typeof tradeSimulations.$inferSelect;
export type InsertTradeSimulation = z.infer<typeof insertTradeSimulationSchema>;
export type AccuracyMetrics = typeof accuracyMetrics.$inferSelect;
export type InsertAccuracyMetrics = z.infer<typeof insertAccuracyMetricsSchema>;

// Enums and constants that can be shared
export const TIMEFRAMES = [
  "1m", "5m", "15m", "30m", "1h", "4h", "12h", "1d", "3d", "1w", "1M"
] as const;

export type TimeFrame = typeof TIMEFRAMES[number];

export const SIGNAL_DIRECTIONS = ["LONG", "SHORT", "NEUTRAL"] as const;

export const INDICATOR_CATEGORIES = [
  "MOMENTUM", "TREND", "VOLATILITY", "VOLUME", "PATTERN"
] as const;

export const TECHNICAL_INDICATORS = [
  "RSI", "MACD", "Stochastic", "MA Cross", "Ichimoku", "ADX",
  "Bollinger Bands", "ATR", "Chaikin", "OBV", "MFI", "Volume",
  "Parabolic SAR", "CCI", "Williams %R", "Awesome Oscillator"
] as const;

// Enhanced Market Analysis Types
export interface MarketStructure {
  fractalStructure: 'BULLISH_FRACTAL' | 'BEARISH_FRACTAL' | 'CONSOLIDATION';
  supplyZones: Array<{ level: number; strength: number }>;
  demandZones: Array<{ level: number; strength: number }>;
  orderBlocks: Array<{ type: 'BULLISH' | 'BEARISH'; level: number; strength: number }>;
}

export interface VWAPAnalysis {
  daily: number;
  innerBands: { upper: number; lower: number };
  outerBands: { upper: number; lower: number };
}

export interface FibonacciLevels {
  levels: Array<{ level: number; type: string }>;
  confluence: number;
  psychologicalLevels: number[];
}

export interface CandlestickPattern {
  pattern: string;
  reliability: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
}

export interface EnhancedConfidenceFactors {
  trendAlignment: boolean;
  momentumConfluence: boolean;
  volatilityLevel: string;
  structureConfirmation: boolean;
  vwapAlignment: boolean;
  fibonacciConfluence: boolean;
  candlestickConfirmation: boolean;
}
