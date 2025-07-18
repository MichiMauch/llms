import { CrawlProgress } from '@/types';

// Global storage that survives hot reloads in development
declare global {
  var __crawlJobs: Map<string, CrawlProgress> | undefined;
}

// In-memory storage for crawl jobs (in production, use Redis or a database)
// Use global variable in development to survive hot reloads
export const crawlJobs = globalThis.__crawlJobs ?? new Map<string, CrawlProgress>();
if (process.env.NODE_ENV === 'development') {
  globalThis.__crawlJobs = crawlJobs;
}

// Track cleanup interval to prevent multiple intervals in development
declare global {
  var __cleanupInterval: NodeJS.Timeout | undefined;
}

// Initialize cleanup only once - but with longer retention for development
if (!globalThis.__cleanupInterval) {
  globalThis.__cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [jobId, progress] of crawlJobs.entries()) {
      // Extract timestamp from jobId (first part before the random string)
      try {
        const timestampHex = jobId.substring(0, 11); // Timestamp part in base36
        const createdAt = parseInt(timestampHex, 36);
        // Increase retention time to 2 hours for development
        if (now - createdAt > 7200000) { // 2 hours
          crawlJobs.delete(jobId);
          cleanedCount++;
        }
      } catch (error) {
        // If parsing fails and job is very old, clean it up
        console.warn(`Could not parse timestamp from jobId: ${jobId}`, error);
        // Keep jobs that we can't parse timestamp for, to be safe
      }
    }
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} old jobs. Current job count: ${crawlJobs.size}`);
    }
  }, 600000); // Clean every 10 minutes (less frequent)
}

// Add helper function to check if job exists
export function jobExists(jobId: string): boolean {
  return crawlJobs.has(jobId);
}

// Add helper function to get job safely
export function getJob(jobId: string): CrawlProgress | null {
  return crawlJobs.get(jobId) || null;
}