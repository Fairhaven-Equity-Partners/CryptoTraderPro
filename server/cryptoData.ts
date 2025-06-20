/**
 * This file contains a more comprehensive list of cryptocurrencies with market caps over $100M
 * Used for the market-wide signal heatmap
 */

export const extendedCryptoList = [
  // Top 20 by market cap
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
  
  // 21-40
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
  
  // 41-60
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
  
  // 61-80
  { symbol: "ONE/USDT", name: "Harmony", lastPrice: 0.016, change24h: 4.5, volume24h: 38000000, marketCap: 840000000 },
  { symbol: "CRV/USDT", name: "Curve DAO", lastPrice: 0.48, change24h: 2.1, volume24h: 75000000, marketCap: 820000000 },
  { symbol: "XEC/USDT", name: "eCash", lastPrice: 0.00003, change24h: 1.4, volume24h: 11000000, marketCap: 780000000 },
  { symbol: "ROSE/USDT", name: "Oasis Network", lastPrice: 0.1185, change24h: -0.8, volume24h: 55000000, marketCap: 780000000 },
  { symbol: "BAT/USDT", name: "Basic Attention", lastPrice: 0.28, change24h: 2.3, volume24h: 35000000, marketCap: 760000000 },
  { symbol: "1INCH/USDT", name: "1inch", lastPrice: 0.724, change24h: 3.5, volume24h: 45000000, marketCap: 750000000 },
  { symbol: "IOTA/USDT", name: "IOTA", lastPrice: 0.265, change24h: -1.1, volume24h: 12000000, marketCap: 740000000 },
  { symbol: "QNT/USDT", name: "Quant", lastPrice: 96.85, change24h: 4.2, volume24h: 35000000, marketCap: 730000000 },
  { symbol: "RSR/USDT", name: "Reserve Rights", lastPrice: 0.0075, change24h: 2.8, volume24h: 85000000, marketCap: 720000000 },
  { symbol: "AUDIO/USDT", name: "Audius", lastPrice: 0.24, change24h: 1.9, volume24h: 18000000, marketCap: 710000000 },
  { symbol: "BAND/USDT", name: "Band Protocol", lastPrice: 1.95, change24h: 3.1, volume24h: 22000000, marketCap: 690000000 },
  { symbol: "HT/USDT", name: "Huobi Token", lastPrice: 3.30, change24h: -0.4, volume24h: 8500000, marketCap: 680000000 },
  { symbol: "OCEAN/USDT", name: "Ocean Protocol", lastPrice: 0.95, change24h: 5.8, volume24h: 65000000, marketCap: 650000000 },
  { symbol: "HOT/USDT", name: "Holo", lastPrice: 0.0032, change24h: 1.7, volume24h: 28000000, marketCap: 640000000 },
  { symbol: "DAG/USDT", name: "Constellation", lastPrice: 0.075, change24h: 4.2, volume24h: 11000000, marketCap: 620000000 },
  { symbol: "DASH/USDT", name: "Dash", lastPrice: 34.15, change24h: 1.3, volume24h: 55000000, marketCap: 610000000 },
  { symbol: "ZEC/USDT", name: "Zcash", lastPrice: 29.75, change24h: 2.1, volume24h: 84000000, marketCap: 590000000 },
  { symbol: "ZIL/USDT", name: "Zilliqa", lastPrice: 0.0165, change24h: 3.8, volume24h: 32000000, marketCap: 580000000 },
  { symbol: "WAVES/USDT", name: "Waves", lastPrice: 2.25, change24h: -0.9, volume24h: 48000000, marketCap: 560000000 },
  { symbol: "YFI/USDT", name: "yearn.finance", lastPrice: 14520, change24h: 1.8, volume24h: 62000000, marketCap: 550000000 },
  
  // 81-100
  { symbol: "CAKE/USDT", name: "PancakeSwap", lastPrice: 2.78, change24h: 1.2, volume24h: 110000000, marketCap: 530000000 },
  { symbol: "AR/USDT", name: "Arweave", lastPrice: 10.45, change24h: 4.3, volume24h: 28000000, marketCap: 520000000 },
  { symbol: "RVN/USDT", name: "Ravencoin", lastPrice: 0.023, change24h: 2.8, volume24h: 18000000, marketCap: 510000000 },
  { symbol: "ICX/USDT", name: "Icon", lastPrice: 0.165, change24h: 1.4, volume24h: 9500000, marketCap: 500000000 },
  { symbol: "OKB/USDT", name: "OKB", lastPrice: 48.75, change24h: -0.5, volume24h: 7800000, marketCap: 490000000 },
  { symbol: "XEM/USDT", name: "NEM", lastPrice: 0.0315, change24h: 0.8, volume24h: 14000000, marketCap: 480000000 },
  { symbol: "CKB/USDT", name: "Nervos Network", lastPrice: 0.0145, change24h: 3.5, volume24h: 32000000, marketCap: 470000000 },
  { symbol: "COMP/USDT", name: "Compound", lastPrice: 59.85, change24h: 2.1, volume24h: 45000000, marketCap: 460000000 },
  { symbol: "BAL/USDT", name: "Balancer", lastPrice: 4.85, change24h: 1.5, volume24h: 12000000, marketCap: 450000000 },
  { symbol: "ONT/USDT", name: "Ontology", lastPrice: 0.255, change24h: 3.2, volume24h: 28000000, marketCap: 440000000 },
  { symbol: "SC/USDT", name: "Siacoin", lastPrice: 0.0075, change24h: 1.8, volume24h: 18000000, marketCap: 430000000 },
  { symbol: "TRB/USDT", name: "Tellor", lastPrice: 156.25, change24h: 5.1, volume24h: 42000000, marketCap: 420000000 },
  { symbol: "DCR/USDT", name: "Decred", lastPrice: 24.85, change24h: 0.3, volume24h: 9500000, marketCap: 410000000 },
  { symbol: "REN/USDT", name: "Ren", lastPrice: 0.095, change24h: 2.7, volume24h: 22000000, marketCap: 400000000 },
  { symbol: "BTG/USDT", name: "Bitcoin Gold", lastPrice: 21.45, change24h: 1.5, volume24h: 32000000, marketCap: 390000000 },
  { symbol: "STORJ/USDT", name: "Storj", lastPrice: 0.28, change24h: 3.1, volume24h: 18000000, marketCap: 380000000 },
  { symbol: "ZRX/USDT", name: "0x", lastPrice: 0.265, change24h: 1.9, volume24h: 35000000, marketCap: 370000000 },
  { symbol: "ZEN/USDT", name: "Horizen", lastPrice: 11.85, change24h: 2.4, volume24h: 14000000, marketCap: 360000000 },
  { symbol: "BNT/USDT", name: "Bancor", lastPrice: 0.52, change24h: 1.1, volume24h: 8500000, marketCap: 350000000 },
  { symbol: "FTM/USDT", name: "Fantom", lastPrice: 0.2695, change24h: 3.8, volume24h: 78000000, marketCap: 340000000 },
  
  // 101-120 (additional tokens with >$100M market cap)
  { symbol: "LRC/USDT", name: "Loopring", lastPrice: 0.235, change24h: 2.5, volume24h: 38000000, marketCap: 330000000 },
  { symbol: "BAKE/USDT", name: "BakeryToken", lastPrice: 0.105, change24h: 1.7, volume24h: 18000000, marketCap: 320000000 },
  { symbol: "RLC/USDT", name: "iExec RLC", lastPrice: 1.55, change24h: 3.4, volume24h: 12000000, marketCap: 310000000 },
  { symbol: "ANKR/USDT", name: "Ankr", lastPrice: 0.0285, change24h: 2.1, volume24h: 22000000, marketCap: 300000000 },
  { symbol: "KMD/USDT", name: "Komodo", lastPrice: 0.38, change24h: 1.5, volume24h: 9500000, marketCap: 290000000 },
  { symbol: "CELO/USDT", name: "Celo", lastPrice: 0.69, change24h: 2.8, volume24h: 25000000, marketCap: 280000000 },
  { symbol: "GLM/USDT", name: "Golem", lastPrice: 0.1475, change24h: 1.9, volume24h: 12000000, marketCap: 270000000 },
  { symbol: "MTV/USDT", name: "MultiVAC", lastPrice: 0.0032, change24h: 5.2, volume24h: 18000000, marketCap: 260000000 },
  { symbol: "UMA/USDT", name: "UMA", lastPrice: 2.85, change24h: 1.3, volume24h: 9800000, marketCap: 250000000 },
  { symbol: "NMR/USDT", name: "Numeraire", lastPrice: 17.35, change24h: 2.5, volume24h: 14000000, marketCap: 240000000 },
  { symbol: "QTUM/USDT", name: "Qtum", lastPrice: 2.38, change24h: 1.1, volume24h: 28000000, marketCap: 230000000 },
  { symbol: "BEAM/USDT", name: "Beam", lastPrice: 0.0185, change24h: 3.7, volume24h: 9500000, marketCap: 220000000 },
  { symbol: "CELR/USDT", name: "Celer Network", lastPrice: 0.0155, change24h: 2.3, volume24h: 18000000, marketCap: 210000000 },
  { symbol: "SKL/USDT", name: "SKALE", lastPrice: 0.035, change24h: 1.9, volume24h: 15000000, marketCap: 200000000 },
  { symbol: "API3/USDT", name: "API3", lastPrice: 2.15, change24h: 4.2, volume24h: 28000000, marketCap: 190000000 },
  { symbol: "OGN/USDT", name: "Origin Protocol", lastPrice: 0.165, change24h: 2.7, volume24h: 12000000, marketCap: 180000000 },
  { symbol: "AMP/USDT", name: "Amp", lastPrice: 0.0021, change24h: 1.5, volume24h: 8500000, marketCap: 170000000 },
  { symbol: "CVC/USDT", name: "Civic", lastPrice: 0.095, change24h: 1.8, volume24h: 7600000, marketCap: 160000000 },
  { symbol: "BADGER/USDT", name: "Badger DAO", lastPrice: 3.45, change24h: 3.2, volume24h: 9500000, marketCap: 150000000 },
  { symbol: "AVA/USDT", name: "Travala.com", lastPrice: 0.86, change24h: 2.5, volume24h: 8800000, marketCap: 140000000 },
  
  // 121-140 (more tokens with >$100M market cap)
  { symbol: "NKN/USDT", name: "NKN", lastPrice: 0.105, change24h: 2.1, volume24h: 9500000, marketCap: 135000000 },
  { symbol: "WING/USDT", name: "Wing Finance", lastPrice: 4.85, change24h: 3.5, volume24h: 7800000, marketCap: 130000000 },
  { symbol: "PERL/USDT", name: "Perlin", lastPrice: 0.0215, change24h: 1.8, volume24h: 5600000, marketCap: 125000000 },
  { symbol: "WAN/USDT", name: "Wanchain", lastPrice: 0.165, change24h: 2.4, volume24h: 4900000, marketCap: 120000000 },
  { symbol: "KNC/USDT", name: "Kyber Network", lastPrice: 0.66, change24h: 1.9, volume24h: 8500000, marketCap: 115000000 },
  { symbol: "ORN/USDT", name: "Orion Protocol", lastPrice: 0.585, change24h: 3.1, volume24h: 6700000, marketCap: 110000000 },
  { symbol: "SXP/USDT", name: "Swipe", lastPrice: 0.205, change24h: 1.5, volume24h: 4500000, marketCap: 105000000 },
  { symbol: "TOMO/USDT", name: "TomoChain", lastPrice: 0.625, change24h: 2.3, volume24h: 3900000, marketCap: 102000000 },
  { symbol: "CTSI/USDT", name: "Cartesi", lastPrice: 0.135, change24h: 1.7, volume24h: 5200000, marketCap: 101000000 },
  { symbol: "MTL/USDT", name: "Metal", lastPrice: 1.45, change24h: 2.9, volume24h: 3800000, marketCap: 100000000 }
];