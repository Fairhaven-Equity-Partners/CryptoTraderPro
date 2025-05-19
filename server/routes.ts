import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAlertSchema, 
  insertSignalHistorySchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // A simplified function to mock broadcasting updates
  // In a real app, this would use WebSockets
  function broadcastUpdates(data: any) {
    console.log("Would broadcast to clients:", data);
    // In a real app, this would send data to connected WebSocket clients
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
      const symbol = req.params.symbol;
      const asset = await storage.getCryptoAssetBySymbol(symbol);
      
      if (!asset) {
        return res.status(404).json({ message: 'Crypto asset not found' });
      }
      
      res.json(asset);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch crypto asset' });
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
        // Generate a default signal for the symbol
        const defaultSignal: InsertSignalHistory = {
          symbol,
          direction: "NEUTRAL",
          confidence: 50,
          timeframe: "1d",
          entryPrice: 0, // Will be updated by frontend with real-time price
          takeProfit: 0, // Will be updated by frontend with real-time price
          stopLoss: 0,   // Will be updated by frontend with real-time price
          indicators: JSON.stringify({
            trend: [],
            momentum: [],
            volatility: [],
            volume: [],
            pattern: []
          })
        };
        
        // Record the default signal
        await storage.recordSignal(defaultSignal);
        
        // Get signals again to include the newly added default
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
