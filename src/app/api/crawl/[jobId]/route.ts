import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/crawl-jobs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    if (!jobId || jobId.length < 10) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }
    
    const progress = getJob(jobId);
    
    if (!progress) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      console.log(`Job not found: ${jobId}. Available jobs:`, Array.from(require('@/lib/crawl-jobs').crawlJobs.keys()));
      return NextResponse.json(
        { error: 'Job not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error getting crawl progress:', error);
    return NextResponse.json(
      { error: 'Failed to get crawl progress' },
      { status: 500 }
    );
  }
}