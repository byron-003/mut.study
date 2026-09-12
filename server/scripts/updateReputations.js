import { recalculateAllReputations } from '../utils/reputationCalculator.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script to recalculate all user reputations
 * Run this periodically (e.g., daily via cron job) to keep reputation scores updated
 */

async function main() {
  console.log('🔄 Starting reputation recalculation...\n');
  
  try {
    const startTime = Date.now();
    const updatedCount = await recalculateAllReputations();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✨ Reputation update complete!`);
    console.log(`   Users updated: ${updatedCount}`);
    console.log(`   Duration: ${duration}s`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Reputation update failed:', error);
    process.exit(1);
  }
}

main();
