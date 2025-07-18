import { NextRequest, NextResponse } from 'next/server';
import { getDb, schema } from '@/lib/db';
import { sql, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    // Get all unique domains from crawl results
    const domains = await db
      .select({ url: schema.crawlResults.url })
      .from(schema.crawlResults)
      .groupBy(schema.crawlResults.url);

    const uniqueDomains = Array.from(new Set(
      domains.map(d => {
        try {
          const url = new URL(d.url);
          return url.hostname;
        } catch {
          return null;
        }
      }).filter(Boolean)
    ));

    // Check each domain for llms.txt file
    const domainStatuses = await Promise.all(
      uniqueDomains.map(async (domain) => {
        if (!domain) return null;
        
        try {
          const response = await fetch(`https://${domain}/llms.txt`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });
          
          const hasLlmsTxt = response.ok;
          
          // Update or insert domain status
          const timestamp = new Date().toISOString();
          
          // Check if domain already exists
          const existingDomain = await db
            .select()
            .from(schema.domainStatus)
            .where(eq(schema.domainStatus.domain, domain))
            .limit(1);

          if (existingDomain.length > 0) {
            // Update existing record
            await db
              .update(schema.domainStatus)
              .set({
                hasLlmsTxt,
                lastChecked: timestamp,
              })
              .where(eq(schema.domainStatus.domain, domain));
          } else {
            // Insert new record
            await db
              .insert(schema.domainStatus)
              .values({
                domain,
                hasLlmsTxt,
                lastChecked: timestamp,
              });
          }

          return {
            domain,
            hasLlmsTxt,
            lastChecked: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Error checking ${domain}:`, error);
          
          // Update domain status as not having llms.txt
          const timestamp = new Date().toISOString();
          
          // Check if domain already exists
          const existingDomain = await db
            .select()
            .from(schema.domainStatus)
            .where(eq(schema.domainStatus.domain, domain))
            .limit(1);

          if (existingDomain.length > 0) {
            // Update existing record
            await db
              .update(schema.domainStatus)
              .set({
                hasLlmsTxt: false,
                lastChecked: timestamp,
              })
              .where(eq(schema.domainStatus.domain, domain));
          } else {
            // Insert new record
            await db
              .insert(schema.domainStatus)
              .values({
                domain,
                hasLlmsTxt: false,
                lastChecked: timestamp,
              });
          }

          return {
            domain,
            hasLlmsTxt: false,
            lastChecked: new Date().toISOString(),
          };
        }
      })
    );

    const validStatuses = domainStatuses.filter(Boolean);
    
    return NextResponse.json({
      checked: validStatuses.length,
      domains: validStatuses,
    });
  } catch (error) {
    console.error('Error checking domains:', error);
    return NextResponse.json(
      { error: 'Failed to check domains' },
      { status: 500 }
    );
  }
}