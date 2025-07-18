'use client';

import { ContentEditor } from '@/components/editor/content-editor';
import { useCrawlStore } from '@/stores/crawl-store';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

function LlmsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { generatedContent, progress, startCrawl, setCrawlProgress, setGeneratedContent, resetCrawl } = useCrawlStore();

  useEffect(() => {
    if (jobId && !generatedContent && progress?.jobId !== jobId) {
      // If we have a jobId but no content in store, try to fetch it
      const fetchContent = async () => {
        try {
          const response = await fetch(`/api/crawl/${jobId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'completed' && data.generatedContent) {
              setGeneratedContent(data.generatedContent);
              setCrawlProgress(data); // Update progress as well
            } else if (data.status === 'error') {
              // Handle error state if job failed
              console.error('Job failed:', data.errors);
              setCrawlProgress(data);
            } else {
              // Job not completed yet, redirect back to progress page or show loading
              router.replace(`/?jobId=${jobId}`);
            }
          } else {
            console.error('Failed to fetch job data');
            router.replace('/'); // Redirect to home if job not found
          }
        } catch (error) {
          console.error('Error fetching job data:', error);
          router.replace('/');
        }
      };
      fetchContent();
    } else if (!jobId && !generatedContent) {
      router.replace('/'); // Redirect to home if no jobId and no content
    }
  }, [jobId, generatedContent, progress, router, setGeneratedContent, setCrawlProgress]);

  const handleReset = () => {
    resetCrawl();
    router.replace('/');
  };

  if (!generatedContent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #E6F9F9, #F9FAFB, #B3F0F0)' }}>
        <p>Loading llms.txt content...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ background: 'linear-gradient(to bottom right, #E6F9F9, #F9FAFB, #B3F0F0)' }}>
      <div className="container mx-auto px-4">
        <div className="mb-6 text-center">
          <Button
            onClick={handleReset}
            className="hover:text-primary-600 underline"
            style={{ color: '#34CCCD' }}
            variant="link"
          >
            ← Start a new crawl
          </Button>
        </div>
        <ContentEditor
          content={generatedContent}
          onContentChange={(newContent) => {
            console.log('Content changed:', newContent);
          }}
        />
      </div>
    </div>
  );
}

export default function LlmsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #E6F9F9, #F9FAFB, #B3F0F0)' }}>
        <p>Loading...</p>
      </div>
    }>
      <LlmsPageContent />
    </Suspense>
  );
}