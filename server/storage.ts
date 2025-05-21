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
      { symbol: "BTC/USDT", name: "Bitcoin", lastPrice: 107063.00, change24h: 1.26, volume24h: 28500000000, marketCap: 2100000000000 },
      { symbol: "ETH/USDT", name: "Ethereum", lastPrice: 2549.17, change24h: -0.19, volume24h: 15300000000, marketCap: 306000000000 },
      { symbol: "BNB/USDT", name: "Binance Coin", lastPrice: 657.12, change24h: 0.84, volume24h: 1800000000, marketCap: 97800000000 },
      { symbol: "SOL/USDT", name: "Solana", lastPrice: 170.33, change24h: 0.87, volume24h: 4200000000, marketCap: 75100000000 },
      { symbol: "XRP/USDT", name: "Ripple", lastPrice: 2.36, change24h: -0.89, volume24h: 2800000000, marketCap: 52900000000 },
      { symbol: "ADA/USDT", name: "Cardano", lastPrice: 0.48, change24h: -1.2, volume24h: 620000000, marketCap: 17200000000 },
      { symbol: "AVAX/USDT", name: "Avalanche", lastPrice: 31.52, change24h: 2.5, volume24h: 950000000, marketCap: 11700000000 },
      { symbol: "DOT/USDT", name: "Polkadot", lastPrice: 7.10, change24h: -0.35, volume24h: 340000000, marketCap: 9800000000 },
      { symbol: "LINK/USDT", name: "Chainlink", lastPrice: 14.85, change24h: 3.2, volume24h: 780000000, marketCap: 8900000000 },
      { symbol: "UNI/USDT", name: "Uniswap", lastPrice: 9.73, change24h: 1.8, volume24h: 320000000, marketCap: 5900000000 },
      { symbol: "MATIC/USDT", name: "Polygon", lastPrice: 0.64, change24h: -2.1, volume24h: 410000000, marketCap: 6300000000 },
      { symbol: "LTC/USDT", name: "Litecoin", lastPrice: 77.25, change24h: 0.45, volume24h: 290000000, marketCap: 5800000000 },
      { symbol: "ATOM/USDT", name: "Cosmos", lastPrice: 8.91, change24h: -0.75, volume24h: 210000000, marketCap: 3400000000 },
      { symbol: "FIL/USDT", name: "Filecoin", lastPrice: 4.89, change24h: 4.2, volume24h: 180000000, marketCap: 2400000000 },
      { symbol: "OP/USDT", name: "Optimism", lastPrice: 3.15, change24h: 1.35, volume24h: 165000000, marketCap: 2900000000 },
      { symbol: "ARB/USDT", name: "Arbitrum", lastPrice: 1.21, change24h: 2.8, volume24h: 140000000, marketCap: 1700000000 },
      { symbol: "NEAR/USDT", name: "NEAR Protocol", lastPrice: 3.40, change24h: -3.1, volume24h: 195000000, marketCap: 3500000000 },
      { symbol: "ICP/USDT", name: "Internet Computer", lastPrice: 11.35, change24h: 5.2, volume24h: 280000000, marketCap: 5100000000 },
      { symbol: "APT/USDT", name: "Aptos", lastPrice: 7.85, change24h: -1.5, volume24h: 165000000, marketCap: 2800000000 },
      { symbol: "SUI/USDT", name: "Sui", lastPrice: 1.25, change24h: 0.9, volume24h: 110000000, marketCap: 1400000000 },
      { symbol: "DOGE/USDT", name: "Dogecoin", lastPrice: 0.13, change24h: -0.45, volume24h: 820000000, marketCap: 18700000000 },
      { symbol: "SHIB/USDT", name: "Shiba Inu", lastPrice: 0.00002, change24h: 1.3, volume24h: 640000000, marketCap: 11900000000 },
      { symbol: "GRT/USDT", name: "The Graph", lastPrice: 0.19, change24h: 3.7, volume24h: 120000000, marketCap: 1800000000 },
      { symbol: "AAVE/USDT", name: "Aave", lastPrice: 92.70, change24h: -1.2, volume24h: 105000000, marketCap: 1400000000 },
      { symbol: "MKR/USDT", name: "Maker", lastPrice: 2470.00, change24h: 2.5, volume24h: 135000000, marketCap: 2200000000 }
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
