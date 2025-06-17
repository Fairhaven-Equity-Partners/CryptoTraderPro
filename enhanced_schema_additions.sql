
// Enhanced schema addition for historical performance tracking
export const indicatorPerformance = pgTable('indicator_performance', {
  id: serial('id').primaryKey(),
  indicator: varchar('indicator', 50).notNull(),
  symbol: varchar('symbol', 20).notNull(),
  timeframe: varchar('timeframe', 10).notNull(),
  accuracy: decimal('accuracy', 5, 4).notNull(),
  weight: decimal('weight', 5, 4).notNull(),
  totalSignals: integer('total_signals').default(0),
  successfulSignals: integer('successful_signals').default(0),
  lastUpdated: timestamp('last_updated').defaultNow(),
  performancePeriod: varchar('performance_period', 10).default('30d')
});

export const signalReasoningLogs = pgTable('signal_reasoning_logs', {
  id: serial('id').primaryKey(),
  signalId: integer('signal_id').references(() => tradeSimulations.id),
  reasoning: text('reasoning').array(),
  confidenceBreakdown: jsonb('confidence_breakdown'),
  indicatorContributions: jsonb('indicator_contributions'),
  patternInfluence: jsonb('pattern_influence'),
  marketRegime: varchar('market_regime', 20),
  timestamp: timestamp('timestamp').defaultNow()
});