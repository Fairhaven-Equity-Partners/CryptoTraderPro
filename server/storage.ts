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
    // Create a list with all major cryptocurrencies
    const defaultAssets: InsertCryptoAsset[] = [
      { symbol: "BTC/USDT", name: "Bitcoin", lastPrice: 107063.00, change24h: 1.26, volume24h: 28500000000, marketCap: 2100000000000 },
      { symbol: "ETH/USDT", name: "Ethereum", lastPrice: 2549.17, change24h: -0.19, volume24h: 15300000000, marketCap: 306000000000 },
      { symbol: "USDT/USD", name: "Tether", lastPrice: 1.00, change24h: 0.01, volume24h: 83500000000, marketCap: 113000000000 },
      { symbol: "BNB/USDT", name: "Binance Coin", lastPrice: 657.12, change24h: 0.84, volume24h: 1800000000, marketCap: 97800000000 },
      { symbol: "SOL/USDT", name: "Solana", lastPrice: 170.33, change24h: 0.87, volume24h: 4200000000, marketCap: 75100000000 },
      { symbol: "USDC/USD", name: "USD Coin", lastPrice: 1.00, change24h: 0.02, volume24h: 7300000000, marketCap: 73200000000 },
      { symbol: "XRP/USDT", name: "Ripple", lastPrice: 2.36, change24h: -0.89, volume24h: 2800000000, marketCap: 52900000000 },
      { symbol: "DOGE/USDT", name: "Dogecoin", lastPrice: 0.13, change24h: -0.45, volume24h: 820000000, marketCap: 18700000000 },
      { symbol: "ADA/USDT", name: "Cardano", lastPrice: 0.48, change24h: -1.2, volume24h: 620000000, marketCap: 17200000000 },
      { symbol: "SHIB/USDT", name: "Shiba Inu", lastPrice: 0.00002, change24h: 1.3, volume24h: 640000000, marketCap: 11900000000 },
      { symbol: "AVAX/USDT", name: "Avalanche", lastPrice: 31.52, change24h: 2.5, volume24h: 950000000, marketCap: 11700000000 },
      { symbol: "DOT/USDT", name: "Polkadot", lastPrice: 7.10, change24h: -0.35, volume24h: 340000000, marketCap: 9800000000 },
      { symbol: "LINK/USDT", name: "Chainlink", lastPrice: 14.85, change24h: 3.2, volume24h: 780000000, marketCap: 8900000000 },
      { symbol: "TRX/USDT", name: "TRON", lastPrice: 0.1145, change24h: 1.5, volume24h: 680000000, marketCap: 8300000000 },
      { symbol: "TON/USDT", name: "Toncoin", lastPrice: 6.91, change24h: -2.1, volume24h: 98000000, marketCap: 7400000000 },
      { symbol: "MATIC/USDT", name: "Polygon", lastPrice: 0.64, change24h: -2.1, volume24h: 410000000, marketCap: 6300000000 },
      { symbol: "UNI/USDT", name: "Uniswap", lastPrice: 9.73, change24h: 1.8, volume24h: 320000000, marketCap: 5900000000 },
      { symbol: "LTC/USDT", name: "Litecoin", lastPrice: 77.25, change24h: 0.45, volume24h: 290000000, marketCap: 5800000000 },
      { symbol: "BCH/USDT", name: "Bitcoin Cash", lastPrice: 371.82, change24h: 2.4, volume24h: 310000000, marketCap: 5600000000 },
      { symbol: "ICP/USDT", name: "Internet Computer", lastPrice: 11.35, change24h: 5.2, volume24h: 280000000, marketCap: 5100000000 },
      { symbol: "LEO/USDT", name: "UNUS SED LEO", lastPrice: 5.85, change24h: -0.3, volume24h: 780000, marketCap: 5000000000 },
      { symbol: "INJ/USDT", name: "Injective", lastPrice: 42.30, change24h: 2.7, volume24h: 210000000, marketCap: 4200000000 },
      { symbol: "NEAR/USDT", name: "NEAR Protocol", lastPrice: 3.40, change24h: -3.1, volume24h: 195000000, marketCap: 3500000000 },
      { symbol: "XLM/USDT", name: "Stellar", lastPrice: 0.1118, change24h: -1.3, volume24h: 65000000, marketCap: 3400000000 },
      { symbol: "ATOM/USDT", name: "Cosmos", lastPrice: 8.91, change24h: -0.75, volume24h: 210000000, marketCap: 3400000000 },
      { symbol: "VET/USDT", name: "VeChain", lastPrice: 0.0480, change24h: 1.2, volume24h: 110000000, marketCap: 3200000000 },
      { symbol: "XMR/USDT", name: "Monero", lastPrice: 164.25, change24h: 3.8, volume24h: 88000000, marketCap: 3100000000 },
      { symbol: "OP/USDT", name: "Optimism", lastPrice: 3.15, change24h: 1.35, volume24h: 165000000, marketCap: 2900000000 },
      { symbol: "APT/USDT", name: "Aptos", lastPrice: 7.85, change24h: -1.5, volume24h: 165000000, marketCap: 2800000000 },
      { symbol: "KAS/USDT", name: "Kaspa", lastPrice: 0.1195, change24h: 0.8, volume24h: 110000000, marketCap: 2700000000 },
      { symbol: "RUNE/USDT", name: "THORChain", lastPrice: 7.45, change24h: 3.2, volume24h: 130000000, marketCap: 2500000000 },
      { symbol: "FIL/USDT", name: "Filecoin", lastPrice: 4.89, change24h: 4.2, volume24h: 180000000, marketCap: 2400000000 },
      { symbol: "HBAR/USDT", name: "Hedera", lastPrice: 0.0745, change24h: -0.5, volume24h: 45000000, marketCap: 2400000000 },
      { symbol: "MKR/USDT", name: "Maker", lastPrice: 2470.00, change24h: 2.5, volume24h: 135000000, marketCap: 2200000000 },
      { symbol: "ALGO/USDT", name: "Algorand", lastPrice: 0.1802, change24h: -0.3, volume24h: 39000000, marketCap: 2000000000 },
      { symbol: "SAND/USDT", name: "The Sandbox", lastPrice: 0.4505, change24h: 4.5, volume24h: 280000000, marketCap: 1950000000 },
      { symbol: "GRT/USDT", name: "The Graph", lastPrice: 0.19, change24h: 3.7, volume24h: 120000000, marketCap: 1800000000 },
      { symbol: "IMX/USDT", name: "Immutable", lastPrice: 1.71, change24h: 4.2, volume24h: 88000000, marketCap: 1800000000 },
      { symbol: "FLOW/USDT", name: "Flow", lastPrice: 0.8015, change24h: 1.8, volume24h: 70000000, marketCap: 1700000000 },
      { symbol: "ARB/USDT", name: "Arbitrum", lastPrice: 1.21, change24h: 2.8, volume24h: 140000000, marketCap: 1700000000 },
      { symbol: "AXS/USDT", name: "Axie Infinity", lastPrice: 7.23, change24h: 4.1, volume24h: 96000000, marketCap: 1650000000 },
      { symbol: "EOS/USDT", name: "EOS", lastPrice: 0.855, change24h: 2.4, volume24h: 160000000, marketCap: 1600000000 },
      { symbol: "MANA/USDT", name: "Decentraland", lastPrice: 0.412, change24h: 1.05, volume24h: 105000000, marketCap: 1550000000 },
      { symbol: "XTZ/USDT", name: "Tezos", lastPrice: 1.09, change24h: -1.3, volume24h: 24000000, marketCap: 1500000000 },
      { symbol: "AAVE/USDT", name: "Aave", lastPrice: 92.70, change24h: -1.2, volume24h: 105000000, marketCap: 1400000000 },
      { symbol: "SUI/USDT", name: "Sui", lastPrice: 1.25, change24h: 0.9, volume24h: 110000000, marketCap: 1400000000 },
      { symbol: "THETA/USDT", name: "Theta Network", lastPrice: 1.28, change24h: 0.3, volume24h: 15000000, marketCap: 1350000000 },
      { symbol: "KSM/USDT", name: "Kusama", lastPrice: 45.20, change24h: 3.4, volume24h: 35000000, marketCap: 1300000000 },
      { symbol: "FET/USDT", name: "Fetch.ai", lastPrice: 1.56, change24h: 3.8, volume24h: 112000000, marketCap: 1300000000 },
      { symbol: "EGLD/USDT", name: "MultiversX", lastPrice: 48.95, change24h: 0.2, volume24h: 18000000, marketCap: 1250000000 },
      { symbol: "KAVA/USDT", name: "Kava", lastPrice: 0.94, change24h: 3.2, volume24h: 40000000, marketCap: 1150000000 },
      { symbol: "MINA/USDT", name: "Mina", lastPrice: 1.08, change24h: -3.1, volume24h: 75000000, marketCap: 1100000000 },
      { symbol: "CHZ/USDT", name: "Chiliz", lastPrice: 0.095, change24h: 2.4, volume24h: 65000000, marketCap: 1050000000 },
      { symbol: "BLUR/USDT", name: "Blur", lastPrice: 0.51, change24h: 6.8, volume24h: 220000000, marketCap: 990000000 },
      { symbol: "SNX/USDT", name: "Synthetix", lastPrice: 3.12, change24h: -1.2, volume24h: 45000000, marketCap: 960000000 },
      { symbol: "NEO/USDT", name: "NEO", lastPrice: 13.45, change24h: 1.3, volume24h: 42000000, marketCap: 950000000 },
      { symbol: "XDC/USDT", name: "XDC Network", lastPrice: 0.068, change24h: -0.5, volume24h: 9000000, marketCap: 940000000 },
      { symbol: "STX/USDT", name: "Stacks", lastPrice: 0.62, change24h: 1.8, volume24h: 35000000, marketCap: 930000000 },
      { symbol: "ENJ/USDT", name: "Enjin Coin", lastPrice: 0.39, change24h: 2.9, volume24h: 28000000, marketCap: 875000000 },
      { symbol: "DYDX/USDT", name: "dYdX", lastPrice: 1.86, change24h: -1.05, volume24h: 42000000, marketCap: 860000000 },
      { symbol: "ONE/USDT", name: "Harmony", lastPrice: 0.016, change24h: 4.5, volume24h: 38000000, marketCap: 840000000 },
      { symbol: "CRV/USDT", name: "Curve DAO", lastPrice: 0.48, change24h: 2.1, volume24h: 75000000, marketCap: 820000000 },
      { symbol: "XEC/USDT", name: "eCash", lastPrice: 0.00003, change24h: 1.4, volume24h: 11000000, marketCap: 780000000 },
      { symbol: "ROSE/USDT", name: "Oasis Network", lastPrice: 0.1185, change24h: -0.8, volume24h: 55000000, marketCap: 780000000 },
      { symbol: "BAT/USDT", name: "Basic Attention", lastPrice: 0.28, change24h: 2.3, volume24h: 35000000, marketCap: 760000000 },
      { symbol: "1INCH/USDT", name: "1inch", lastPrice: 0.65, change24h: 3.5, volume24h: 45000000, marketCap: 750000000 },
      { symbol: "IOTA/USDT", name: "IOTA", lastPrice: 0.265, change24h: -1.1, volume24h: 12000000, marketCap: 740000000 },
      { symbol: "QNT/USDT", name: "Quant", lastPrice: 96.85, change24h: 4.2, volume24h: 35000000, marketCap: 730000000 },
      { symbol: "RSR/USDT", name: "Reserve Rights", lastPrice: 0.0075, change24h: 2.8, volume24h: 85000000, marketCap: 720000000 },
      { symbol: "AUDIO/USDT", name: "Audius", lastPrice: 0.24, change24h: 1.9, volume24h: 18000000, marketCap: 710000000 },
      { symbol: "BAND/USDT", name: "Band Protocol", lastPrice: 1.95, change24h: 3.1, volume24h: 22000000, marketCap: 690000000 },
      { symbol: "HT/USDT", name: "Huobi Token", lastPrice: 3.30, change24h: -0.4, volume24h: 8500000, marketCap: 680000000 },
      { symbol: "CAKE/USDT", name: "PancakeSwap", lastPrice: 2.78, change24h: 1.2, volume24h: 110000000, marketCap: 530000000 },
      { symbol: "AR/USDT", name: "Arweave", lastPrice: 10.45, change24h: 4.3, volume24h: 28000000, marketCap: 520000000 },
      { symbol: "RVN/USDT", name: "Ravencoin", lastPrice: 0.023, change24h: 2.8, volume24h: 18000000, marketCap: 510000000 },
      { symbol: "ICX/USDT", name: "Icon", lastPrice: 0.165, change24h: 1.4, volume24h: 9500000, marketCap: 500000000 },
      { symbol: "ZRX/USDT", name: "0x", lastPrice: 0.265, change24h: 1.9, volume24h: 35000000, marketCap: 370000000 },
      { symbol: "FTM/USDT", name: "Fantom", lastPrice: 0.2695, change24h: 3.8, volume24h: 78000000, marketCap: 340000000 },
      { symbol: "LRC/USDT", name: "Loopring", lastPrice: 0.235, change24h: 2.5, volume24h: 38000000, marketCap: 330000000 },
      { symbol: "ANKR/USDT", name: "Ankr", lastPrice: 0.0285, change24h: 2.1, volume24h: 22000000, marketCap: 300000000 },
      { symbol: "GLM/USDT", name: "Golem", lastPrice: 0.1475, change24h: 1.9, volume24h: 12000000, marketCap: 270000000 },
      { symbol: "UMA/USDT", name: "UMA", lastPrice: 2.85, change24h: 1.3, volume24h: 9800000, marketCap: 250000000 },
      { symbol: "CELR/USDT", name: "Celer Network", lastPrice: 0.0155, change24h: 2.3, volume24h: 18000000, marketCap: 210000000 },
      { symbol: "SKL/USDT", name: "SKALE", lastPrice: 0.035, change24h: 1.9, volume24h: 15000000, marketCap: 200000000 },
      { symbol: "API3/USDT", name: "API3", lastPrice: 2.15, change24h: 4.2, volume24h: 28000000, marketCap: 190000000 },
      { symbol: "CVC/USDT", name: "Civic", lastPrice: 0.095, change24h: 1.8, volume24h: 7600000, marketCap: 160000000 },
      { symbol: "KNC/USDT", name: "Kyber Network", lastPrice: 0.66, change24h: 1.9, volume24h: 8500000, marketCap: 115000000 },
      { symbol: "CTSI/USDT", name: "Cartesi", lastPrice: 0.135, change24h: 1.7, volume24h: 5200000, marketCap: 101000000 }
    ];
    
    // Create assets from the extended list
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
