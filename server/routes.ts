import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAlertSchema, 
  insertSignalHistorySchema,
  type InsertSignalHistory
} from "@shared/schema";
import { z } from "zod";
import { extendedCryptoList } from "./cryptoData";
import { WebSocketServer } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track connected clients
  const clients = new Set<any>();
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    // Add new client to our set
    clients.add(ws);
    console.log(`WebSocket client connected. Total clients: ${clients.size}`);
    
    // Remove client when they disconnect
    ws.on('close', () => {
      clients.delete(ws);
      console.log(`WebSocket client disconnected. Remaining clients: ${clients.size}`);
    });
  });
  
  // Function to broadcast updates to all connected clients
  function broadcastUpdates(data: any) {
    const message = JSON.stringify(data);
    
    clients.forEach((client: any) => {
      try {
        // Only send if connection is open
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(message);
        }
      } catch (error) {
        console.error('Error broadcasting to client:', error);
      }
    });
    
    console.log(`Broadcast message sent to ${clients.size} clients:`, data);
  }
  
  // API Routes
  
  // Get all crypto assets
  app.get('/api/crypto', async (req: Request, res: Response) => {
    try {
      const assets = await storage.getAllCryptoAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch crypto assets' });
    }
  });
  
  // Get specific crypto asset
  app.get('/api/crypto/:symbol', async (req: Request, res: Response) => {
    try {
      // URL decode the symbol and replace encoded forward slash
      const symbol = decodeURIComponent(req.params.symbol).replace('%2F', '/');
      console.log(`Fetching crypto asset with symbol: ${symbol}`);
      
      const asset = await storage.getCryptoAssetBySymbol(symbol);
      
      if (!asset) {
        console.log(`No crypto asset found for symbol: ${symbol}`);
        return res.status(404).json({ message: 'Crypto asset not found' });
      }
      
      res.json(asset);
    } catch (error) {
      console.error(`Error fetching crypto asset:`, error);
      res.status(500).json({ message: 'Failed to fetch crypto asset' });
    }
  });
  
  // Track price updates to prevent flooding - much stricter with 15 second minimum interval
  const lastPriceUpdates: Record<string, number> = {};
  
  // Price synchronization endpoint for consistent price data - FIXED VERSION
  app.post('/api/sync-price', async (req: Request, res: Response) => {
    try {
      const { symbol, price } = req.body;
      
      if (!symbol || price === undefined || price === null) {
        return res.status(400).json({ 
          success: false, 
          message: 'Symbol and price are required' 
        });
      }
      
      // STRICT anti-flooding protection - min 15 seconds between updates
      const now = Date.now();
      const lastUpdate = lastPriceUpdates[symbol] || 0;
      const timeSinceLastUpdate = now - lastUpdate;
      
      if (timeSinceLastUpdate < 15000) {
        return res.status(200).json({
          success: true,
          throttled: true,
          message: 'Price update throttled to prevent flooding'
        });
      }
      
      // Update tracking
      lastPriceUpdates[symbol] = now;
      
      // Get the current price before updating
      const asset = await storage.getCryptoAssetBySymbol(symbol);
      const currentPrice = asset?.lastPrice || 0;
      
      // Only update if the price change is significant (>0.25%)
      const priceDiff = Math.abs(price - currentPrice);
      const percentChange = (currentPrice > 0) ? (priceDiff / currentPrice) * 100 : 0;
      
      if (percentChange < 0.25 && currentPrice > 0) {
        return res.status(200).json({
          success: true,
          ignored: true,
          message: 'Price change too small to update'
        });
      }
      
      // Update the cryptocurrency price in storage
      const updatedAsset = await storage.updateCryptoAsset(symbol, {
        lastPrice: price
      });
      
      if (updatedAsset) {
        // Broadcast price update to all connected clients
        broadcastUpdates({
          type: 'PRICE_UPDATE',
          symbol,
          price,
          timestamp: now
        });
        
        console.log(`Price synchronized for ${symbol}: ${price}`);
        return res.status(200).json({ success: true, updatedAsset });
      } else {
        return res.status(404).json({ 
          success: false, 
          message: `Cryptocurrency ${symbol} not found` 
        });
      }
    } catch (error) {
      console.error(`Error synchronizing price:`, error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error processing price synchronization' 
      });
    }
  });
  
  // Get all alerts
  app.get('/api/alerts', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      if (userId) {
        const alerts = await storage.getAlertsByUser(userId);
        return res.json(alerts);
      }
      
      const activeAlerts = await storage.getActiveAlerts();
      res.json(activeAlerts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });
  
  // Create new alert
  app.post('/api/alerts', async (req: Request, res: Response) => {
    try {
      const alertData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);
      res.status(201).json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid alert data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create alert' });
    }
  });
  
  // Update alert
  app.patch('/api/alerts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const alertData = req.body;
      
      const updatedAlert = await storage.updateAlert(id, alertData);
      
      if (!updatedAlert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      res.json(updatedAlert);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update alert' });
    }
  });
  
  // Delete alert
  app.delete('/api/alerts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAlert(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete alert' });
    }
  });
  
  // Get signal history for a symbol
  app.get('/api/signals/:symbol', async (req: Request, res: Response) => {
    try {
      const symbol = req.params.symbol;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      // Get existing signals, or create placeholder/default signals if none exist
      let signals = await storage.getSignalHistoryBySymbol(symbol, limit);
      
      // If no signals exist for this symbol, create some default placeholders
      // This ensures all cryptocurrency pairs can work, including SOL/USDT and XRP/USDT
      if (signals.length === 0) {
        // Get current price data for the symbol to create realistic default signals
        const asset = await storage.getCryptoAssetBySymbol(symbol);
        const currentPrice = asset?.lastPrice || 1000; // Fallback price if asset not found
        
        // Special handling for problematic assets
        const isSpecialAsset = symbol === 'SOL/USDT' || symbol === 'XRP/USDT';
        
        // Create signals for all timeframes to ensure complete data
        const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '3d', '1w', '1M'];
        
        for (const timeframe of timeframes) {
          // Generate a default signal for the symbol with realistic price values
          const defaultSignal: InsertSignalHistory = {
            symbol,
            direction: isSpecialAsset ? "NEUTRAL" : "LONG", // Special assets start neutral
            confidence: isSpecialAsset ? 50 : 65, // Special assets start with 50% confidence
            timeframe,
            entryPrice: currentPrice,
            takeProfit: currentPrice * 1.05, // 5% profit target
            stopLoss: currentPrice * 0.95,   // 5% stop loss
            indicators: JSON.stringify({
              trend: [
                { name: "Moving Average", signal: "NEUTRAL", strength: "MODERATE" },
                { name: "Trend Direction", signal: "NEUTRAL", strength: "MODERATE" }
              ],
              momentum: [
                { name: "RSI", signal: "NEUTRAL", strength: "MODERATE" },
                { name: "MACD", signal: "NEUTRAL", strength: "MODERATE" }
              ],
              volatility: [
                { name: "Bollinger Bands", signal: "NEUTRAL", strength: "MODERATE" },
                { name: "ATR", signal: "NEUTRAL", strength: "MODERATE" }
              ],
              volume: [
                { name: "Volume Profile", signal: "NEUTRAL", strength: "MODERATE" },
                { name: "OBV", signal: "NEUTRAL", strength: "MODERATE" }
              ],
              pattern: [
                { name: "Support/Resistance", signal: "NEUTRAL", strength: "MODERATE" },
                { name: "Price Patterns", signal: "NEUTRAL", strength: "MODERATE" }
              ]
            })
          };
          
          // Record the default signal
          await storage.recordSignal(defaultSignal);
        }
        
        // Get signals again to include the newly added defaults
        signals = await storage.getSignalHistoryBySymbol(symbol, limit);
      }
      
      res.json(signals);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch signal history' });
    }
  });
  
  // Record a new signal
  app.post('/api/signals', async (req: Request, res: Response) => {
    try {
      const signalData = insertSignalHistorySchema.parse(req.body);
      const signal = await storage.recordSignal(signalData);
      
      // Broadcast the new signal to WebSocket clients
      broadcastUpdates({
        type: 'new_signal',
        data: signal
      });
      
      res.status(201).json(signal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid signal data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to record signal' });
    }
  });
  
  // API endpoint for calculating safe leverage based on parameters
  app.post('/api/calculate-leverage', (req: Request, res: Response) => {
    try {
      const { positionSize, riskPercentage, entryPrice, stopLoss, takeProfit } = req.body;
      
      // Validate inputs
      if (!positionSize || !riskPercentage || !entryPrice || !stopLoss) {
        return res.status(400).json({ 
          message: 'Missing required parameters: positionSize, riskPercentage, entryPrice, stopLoss' 
        });
      }
      
      // Simple leverage calculation (in a real app, this would be more sophisticated)
      const priceChangePercentage = Math.abs((stopLoss - entryPrice) / entryPrice * 100);
      const maxLeverage = Math.floor(riskPercentage / priceChangePercentage * 100) / 10;
      
      // Ensure leverage is within reasonable bounds
      const safeLeverage = Math.min(Math.max(1, maxLeverage), 20);
      
      // Calculate risk metrics
      const riskAmount = positionSize * (riskPercentage / 100);
      let potentialProfit = 0;
      let riskRewardRatio = 0;
      let liquidationPrice = 0;
      
      if (takeProfit) {
        const profitPercentage = Math.abs((takeProfit - entryPrice) / entryPrice * 100);
        potentialProfit = (positionSize * (profitPercentage / 100)) * safeLeverage;
        riskRewardRatio = parseFloat((potentialProfit / riskAmount).toFixed(2));
      }
      
      // Simplified liquidation calculation (would be more complex in reality)
      if (stopLoss < entryPrice) { // LONG position
        liquidationPrice = entryPrice * (1 - (1 / safeLeverage));
      } else { // SHORT position
        liquidationPrice = entryPrice * (1 + (1 / safeLeverage));
      }
      
      res.json({
        recommendedLeverage: safeLeverage.toFixed(1),
        maxLoss: riskAmount.toFixed(2),
        potentialProfit: potentialProfit.toFixed(2),
        riskRewardRatio,
        liquidationPrice: liquidationPrice.toFixed(2)
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to calculate leverage' });
    }
  });
  
  return httpServer;
}
