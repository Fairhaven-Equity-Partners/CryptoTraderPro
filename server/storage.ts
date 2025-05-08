import { 
  users, cryptoAssets, alerts, signalHistory,
  type User, type InsertUser, type CryptoAsset, type InsertCryptoAsset,
  type Alert, type InsertAlert, type SignalHistory, type InsertSignalHistory
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Crypto asset operations
  getAllCryptoAssets(): Promise<CryptoAsset[]>;
  getCryptoAssetBySymbol(symbol: string): Promise<CryptoAsset | undefined>;
  updateCryptoAsset(symbol: string, data: Partial<InsertCryptoAsset>): Promise<CryptoAsset | undefined>;
  
  // Alert operations
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlertsByUser(userId: number): Promise<Alert[]>;
  getActiveAlerts(): Promise<Alert[]>;
  updateAlert(id: number, data: Partial<InsertAlert & { isTriggered?: boolean }>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;
  
  // Signal history operations
  recordSignal(signal: InsertSignalHistory): Promise<SignalHistory>;
  getSignalHistoryBySymbol(symbol: string, limit?: number): Promise<SignalHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cryptoAssets: Map<string, CryptoAsset>;
  private alerts: Map<number, Alert>;
  private signalHistory: Map<number, SignalHistory>;
  
  private userIdCounter: number;
  private alertIdCounter: number;
  private signalIdCounter: number;

  constructor() {
    this.users = new Map();
    this.cryptoAssets = new Map();
    this.alerts = new Map();
    this.signalHistory = new Map();
    
    this.userIdCounter = 1;
    this.alertIdCounter = 1;
    this.signalIdCounter = 1;
    
    // Initialize with some crypto assets
    this.initializeCryptoAssets();
  }

  private initializeCryptoAssets() {
    const defaultAssets: InsertCryptoAsset[] = [
      { symbol: "BTC/USDT", name: "Bitcoin", lastPrice: 43256.78, change24h: 2.34, volume24h: 24500000000, marketCap: 845000000000 },
      { symbol: "ETH/USDT", name: "Ethereum", lastPrice: 2250.45, change24h: 1.23, volume24h: 12300000000, marketCap: 270000000000 },
      { symbol: "BNB/USDT", name: "Binance Coin", lastPrice: 567.89, change24h: -0.45, volume24h: 1500000000, marketCap: 87000000000 },
      { symbol: "SOL/USDT", name: "Solana", lastPrice: 123.45, change24h: 5.67, volume24h: 3200000000, marketCap: 53000000000 },
      { symbol: "XRP/USDT", name: "Ripple", lastPrice: 0.5678, change24h: -1.23, volume24h: 1800000000, marketCap: 30000000000 },
    ];
    
    defaultAssets.forEach((asset, index) => {
      const cryptoAsset: CryptoAsset = {
        ...asset,
        id: index + 1,
        updatedAt: new Date(),
      };
      this.cryptoAssets.set(asset.symbol, cryptoAsset);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Crypto asset operations
  async getAllCryptoAssets(): Promise<CryptoAsset[]> {
    return Array.from(this.cryptoAssets.values());
  }

  async getCryptoAssetBySymbol(symbol: string): Promise<CryptoAsset | undefined> {
    return this.cryptoAssets.get(symbol);
  }

  async updateCryptoAsset(symbol: string, data: Partial<InsertCryptoAsset>): Promise<CryptoAsset | undefined> {
    const asset = this.cryptoAssets.get(symbol);
    if (!asset) {
      return undefined;
    }
    
    const updatedAsset: CryptoAsset = {
      ...asset,
      ...data,
      updatedAt: new Date(),
    };
    
    this.cryptoAssets.set(symbol, updatedAsset);
    return updatedAsset;
  }

  // Alert operations
  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.alertIdCounter++;
    const alert: Alert = {
      ...insertAlert,
      id,
      isTriggered: false,
      createdAt: new Date(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async getAlertsByUser(userId: number): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.userId === userId,
    );
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.isActive && !alert.isTriggered,
    );
  }

  async updateAlert(id: number, data: Partial<InsertAlert & { isTriggered?: boolean }>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) {
      return undefined;
    }
    
    const updatedAlert: Alert = {
      ...alert,
      ...data,
    };
    
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: number): Promise<boolean> {
    return this.alerts.delete(id);
  }

  // Signal history operations
  async recordSignal(insertSignal: InsertSignalHistory): Promise<SignalHistory> {
    const id = this.signalIdCounter++;
    const signal: SignalHistory = {
      ...insertSignal,
      id,
      timestamp: new Date(),
    };
    this.signalHistory.set(id, signal);
    return signal;
  }

  async getSignalHistoryBySymbol(symbol: string, limit = 50): Promise<SignalHistory[]> {
    const signals = Array.from(this.signalHistory.values())
      .filter((signal) => signal.symbol === symbol)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return signals.slice(0, limit);
  }
}

export const storage = new MemStorage();
