#!/usr/bin/env node

/**
 * Complete CoinMarketCap Migration Script
 * Replaces all CoinGecko API usage with CoinMarketCap across the entire codebase
 */

import fs from 'fs/promises';
import path from 'path';

const COINMARKETCAP_API_KEY = 'd129bffe-efd9-4841-9946-f67c10168aed';

async function migrateFile(filePath, replacements) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    
    for (const [oldText, newText] of replacements) {
      if (content.includes(oldText)) {
        content = content.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
        modified = true;
      }
    }
    
    if (modified) {
      await fs.writeFile(filePath, content);
      console.log(`✓ Updated ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error updating ${filePath}:`, error.message);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Starting CoinMarketCap migration...\n');
  
  const migrations = [
    // Update server/routes.ts - import and initialization
    {
      file: 'server/routes.ts',
      replacements: [
        ['import { enhancedPriceStreamer } from "./enhancedPriceStreamer";', 'import { CoinMarketCapPriceStreamer } from "./coinMarketCapPriceStreamer";'],
        ['enhancedPriceStreamer.initialize(wss);', 'const cmcPriceStreamer = new CoinMarketCapPriceStreamer();\n  cmcPriceStreamer.initialize(wss);'],
        ['await enhancedPriceStreamer.start();', 'await cmcPriceStreamer.start();']
      ]
    },
    
    // Update storage.ts to use CMC symbols
    {
      file: 'server/storage.ts',
      replacements: [
        ['coinGeckoId', 'cmcSymbol'],
        ['getCoinGeckoId', 'getCMCSymbol']
      ]
    },
    
    // Update any remaining files that reference CoinGecko
    {
      file: 'server/cryptoData.ts',
      replacements: [
        ['CoinGecko', 'CoinMarketCap'],
        ['coingecko', 'coinmarketcap']
      ]
    }
  ];
  
  let updatedFiles = 0;
  
  for (const migration of migrations) {
    const updated = await migrateFile(migration.file, migration.replacements);
    if (updated) updatedFiles++;
  }
  
  // Create environment variable update script
  const envUpdate = `
# Update your environment variables:
# Replace COINGECKO_API_KEY with COINMARKETCAP_API_KEY

# Add this to your environment:
export COINMARKETCAP_API_KEY="${COINMARKETCAP_API_KEY}"

# Remove the old CoinGecko key:
# unset COINGECKO_API_KEY
`;
  
  await fs.writeFile('update_env_vars.sh', envUpdate);
  
  console.log(`\n✅ Migration completed!`);
  console.log(`📊 Files updated: ${updatedFiles}`);
  console.log(`🔑 API key configured: ${COINMARKETCAP_API_KEY.substring(0, 8)}...`);
  console.log(`📝 Environment update script created: update_env_vars.sh`);
  console.log(`\n🚀 Your system now uses CoinMarketCap API for all price data!`);
}

runMigration().catch(console.error);