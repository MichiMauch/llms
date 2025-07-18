import { getDb, schema } from '@/lib/db';
import { CrawlProgress } from '@/types';
import { eq } from 'drizzle-orm';

// Helper function to create a new job
export async function createJob(jobId: string): Promise<void> {
  const db = getDb();
  const initialProgress: CrawlProgress = {
    jobId,
    status: 'pending',
    totalPages: 0,
    processedPages: 0,
    currentPage: '',
    errors: [],
    estimatedTimeRemaining: 0,
    generatedContent: undefined,
    timestamp: Date.now(),
  };
  await db.insert(schema.crawlProgress).values({
    jobId: initialProgress.jobId,
    status: initialProgress.status,
    totalPages: initialProgress.totalPages,
    processedPages: initialProgress.processedPages,
    currentPage: initialProgress.currentPage,
    estimatedTimeRemaining: initialProgress.estimatedTimeRemaining,
    timestamp: initialProgress.timestamp || Date.now(),
    errors: JSON.stringify(initialProgress.errors),
    generatedContent: initialProgress.generatedContent ? JSON.stringify(initialProgress.generatedContent) : null,
  });
}

// Add helper function to check if job exists
export async function jobExists(jobId: string): Promise<boolean> {
  const db = getDb();
  const job = await db.query.crawlProgress.findFirst({
    where: eq(schema.crawlProgress.jobId, jobId),
  });
  return !!job;
}

// Add helper function to get job safely
export async function getJob(jobId: string): Promise<CrawlProgress | null> {
  const db = getDb();
  const job = await db.query.crawlProgress.findFirst({
    where: eq(schema.crawlProgress.jobId, jobId),
  });
  console.log(`getJob: Retrieved job ${jobId} with status: ${job?.status}`);
  if (!job) {
    return null;
  }
  return {
    jobId: job.jobId,
    status: job.status as CrawlProgress['status'],
    totalPages: job.totalPages || 0,
    processedPages: job.processedPages || 0,
    currentPage: job.currentPage || '',
    estimatedTimeRemaining: job.estimatedTimeRemaining || 0,
    timestamp: job.timestamp,
    errors: JSON.parse(job.errors as string),
    generatedContent: job.generatedContent ? JSON.parse(job.generatedContent as string) : undefined,
  };
}

// Helper function to update job progress
export async function updateJob(jobId: string, updates: Partial<CrawlProgress>): Promise<void> {
  const db = getDb();
  const updatePayload: Record<string, unknown> = { ...updates, timestamp: Date.now() };

  if (updates.errors !== undefined) {
    updatePayload.errors = JSON.stringify(updates.errors);
  }
  if (updates.generatedContent !== undefined) {
    updatePayload.generatedContent = updates.generatedContent ? JSON.stringify(updates.generatedContent) : null;
  }

  await db.update(schema.crawlProgress)
    .set(updatePayload)
    .where(eq(schema.crawlProgress.jobId, jobId));
}

// Cleanup old jobs (e.g., jobs older than 2 hours)
export async function cleanupOldJobs(): Promise<void> {
  const db = getDb();
  const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
  await db.delete(schema.crawlProgress).where(eq(schema.crawlProgress.timestamp, twoHoursAgo));
}