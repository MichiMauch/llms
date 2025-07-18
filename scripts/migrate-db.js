require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');
const { drizzle } = require('drizzle-orm/libsql');
const { migrate } = require('drizzle-orm/libsql/migrator');
const { sql } = require('drizzle-orm');

async function migrateDatabase() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  
  const db = drizzle(client);
  
  try {
    // Create crawl_progress table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS crawl_progress (
        job_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        total_pages INTEGER,
        processed_pages INTEGER,
        current_page TEXT,
        errors TEXT,
        estimated_time_remaining INTEGER,
        generated_content TEXT,
        timestamp INTEGER NOT NULL
      )
    `);
    
    // Create crawl_results table (if not exists)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS crawl_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        llms_txt TEXT NOT NULL,
        llms_full_txt TEXT NOT NULL,
        ip_address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
  }
}

migrateDatabase();