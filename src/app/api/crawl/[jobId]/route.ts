import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/crawl-jobs';

// Extend timeout for Vercel to 60 seconds
export const maxDuration = 60;

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
    
    const progress = await getJob(jobId);
    console.log(`API Response for job ${jobId}:`, progress);
    
    if (!progress) {
      console.log(`Job not found: ${jobId}`);
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