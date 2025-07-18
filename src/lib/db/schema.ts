import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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