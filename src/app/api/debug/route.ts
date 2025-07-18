import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test database connection
    const { getDb, schema } = await import('@/lib/db');
    const db = getDb();
    
    // Try to query the crawl_progress table
    const testQuery = await db.select().from(schema.crawlProgress).limit(1);
    
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      dbConnection: 'OK',
      dbTableExists: true,
      testRecords: testQuery.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      environment: process.env.NODE_ENV,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasTursoUrl: !!process.env.TURSO_DATABASE_URL,
      hasTursoToken: !!process.env.TURSO_AUTH_TOKEN,
      dbConnection: 'ERROR',
      dbError: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}