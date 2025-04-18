import { cleanupExpiredCache } from '../lib/cache';

async function main() {
  console.log('Starting cache cleanup...');
  
  try {
    const deletedCount = await cleanupExpiredCache();
    console.log(`Cleaned up ${deletedCount} expired cache entries`);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
  
  console.log('Cache cleanup complete');
  process.exit(0);
}

main();
