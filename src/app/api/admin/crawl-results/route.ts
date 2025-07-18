import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getDb, schema } from '@/lib/db';
import { desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has netnode.ch email
    const session = await getServerSession();
    if (!session || !session.user?.email?.endsWith('@netnode.ch')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    
    // Get all crawl results
    const results = await db
      .select()
      .from(schema.crawlResults)
      .orderBy(desc(schema.crawlResults.createdAt))
      .limit(100); // Limit to last 100 results

    // Calculate statistics
    const totalCrawls = results.length;
    
    // Today's crawls
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCrawls = results.filter(r => new Date(r.createdAt) >= today).length;
    
    // Unique IPs
    const uniqueIPs = new Set(results.map(r => r.ipAddress)).size;
    
    // Unique URLs
    const uniqueUrls = new Set(results.map(r => r.url)).size;

    const stats = {
      totalCrawls,
      todayCrawls,
      uniqueIPs,
      uniqueUrls,
    };

    return NextResponse.json({ results, stats });
  } catch (error) {
    console.error('Error fetching crawl results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crawl results' },
      { status: 500 }
    );
  }
}