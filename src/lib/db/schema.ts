import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const crawlProgress = sqliteTable('crawl_progress', {
  jobId: text('job_id').primaryKey(),
  status: text('status').notNull(),
  totalPages: integer('total_pages'),
  processedPages: integer('processed_pages'),
  currentPage: text('current_page'),
  errors: text('errors', { mode: 'json' }), // Store errors as JSON string
  estimatedTimeRemaining: integer('estimated_time_remaining'),
  generatedContent: text('generated_content', { mode: 'json' }), // Store generated content as JSON string
  timestamp: integer('timestamp').notNull(),
});

export type CrawlProgress = typeof crawlProgress.$inferSelect;
export type NewCrawlProgress = typeof crawlProgress.$inferInsert;

export const crawlResults = sqliteTable('crawl_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  url: text('url').notNull(),
  llmsTxt: text('llms_txt').notNull(),
  llmsFullTxt: text('llms_full_txt').notNull(),
  ipAddress: text('ip_address'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type CrawlResult = typeof crawlResults.$inferSelect;
export type NewCrawlResult = typeof crawlResults.$inferInsert;