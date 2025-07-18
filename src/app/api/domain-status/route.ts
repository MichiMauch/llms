import { NextRequest, NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/db';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    // Get all unique domains from crawl results
    const crawlResults = await db
      .select({ url: schema.crawlResults.url })
      .from(schema.crawlResults)
      .groupBy(schema.crawlResults.url);

    const uniqueDomains = Array.from(new Set(
      crawlResults.map(d => {
        try {
          const url = new URL(d.url);
          return url.hostname;
        } catch {
          return null;
        }
      }).filter(Boolean)
    ));

    // Get existing domain statuses
    const domainStatuses = await db
      .select()
      .from(schema.domainStatus)
      .orderBy(desc(schema.domainStatus.lastChecked));

    // Create a map of existing statuses
    const statusMap = new Map();
    domainStatuses.forEach(status => {
      statusMap.set(status.domain, status);
    });

    // Create combined results with all domains
    const allDomains = uniqueDomains.map(domain => {
      const existingStatus = statusMap.get(domain);
      return existingStatus || {
        id: 0,
        domain,
        hasLlmsTxt: false,
        lastChecked: null, // Never checked
        createdAt: new Date().toISOString(),
      };
    });

    // Check if we need to update statuses (older than 1 hour or never checked)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const needsUpdate = allDomains.some(status => 
      !status.lastChecked || new Date(status.lastChecked) < oneHourAgo
    );

    return NextResponse.json({
      domains: allDomains,
      needsUpdate,
    });
  } catch (error) {
    console.error('Error fetching domain status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domain status' },
      { status: 500 }
    );
  }
}