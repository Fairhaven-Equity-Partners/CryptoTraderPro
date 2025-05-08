import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision } from "drizzle-orm/pg-core";
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
  strength: integer("strength").notNull(), // 0-100
  indicators: jsonb("indicators").notNull(), // Store indicator results as JSON
  price: doublePrecision("price").notNull(),
  timestamp: timestamp("timestamp").defaultNow()
});

export const insertSignalHistorySchema = createInsertSchema(signalHistory).pick({
  symbol: true,
  timeframe: true,
  direction: true,
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

// Enums and constants that can be shared
export const TIMEFRAMES = [
  "1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w", "1M"
] as const;

export const SIGNAL_DIRECTIONS = ["LONG", "SHORT", "NEUTRAL"] as const;

export const INDICATOR_CATEGORIES = [
  "MOMENTUM", "TREND", "VOLATILITY", "VOLUME"
] as const;

export const TECHNICAL_INDICATORS = [
  "RSI", "MACD", "Stochastic", "MA Cross", "Ichimoku", "ADX",
  "Bollinger Bands", "ATR", "Chaikin", "OBV", "MFI", "Volume",
  "Parabolic SAR", "CCI", "Williams %R", "Awesome Oscillator"
] as const;
