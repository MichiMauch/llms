'use client';

import { UrlInput } from '@/components/landing/url-input';
import { CrawlProgress } from '@/components/progress/crawl-progress';
import { useCrawlStore } from '@/stores/crawl-store';
import { CrawlRequest } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { progress, generatedContent, startCrawl, resetCrawl, isStartingNewCrawl } = useCrawlStore();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we have a completed job AND we're not starting a new crawl
    if (progress?.status === 'completed' && generatedContent && progress.jobId && !isStartingNewCrawl) {
      // Add a small delay to ensure the page has fully loaded
      const timer = setTimeout(() => {
        router.replace(`/llms?jobId=${progress.jobId}`);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress, generatedContent, router, isStartingNewCrawl]);

  const handleUrlSubmit = (request: CrawlRequest) => {
    startCrawl(request);
  };

  const handleCancel = () => {
    resetCrawl();
  };

  const handleReset = () => {
    resetCrawl();
  };

  // Show progress if crawling is in progress
  if (progress && (progress.status === 'crawling' || progress.status === 'processing' || progress.status === 'error')) {
    return (
      <div className="min-h-screen py-8" style={{ background: 'linear-gradient(to bottom right, #E6F9F9, #F9FAFB, #B3F0F0)' }}>
        <div className="container mx-auto px-4">
          <div className="mb-6 text-center">
            <button
              onClick={handleReset}
              className="hover:text-primary-600 underline"
              style={{ color: '#34CCCD' }}
            >
              ← Go back
            </button>
          </div>
          <CrawlProgress
            progress={progress}
            onCancel={progress.status === 'crawling' || progress.status === 'processing' ? handleCancel : undefined}
          />
        </div>
      </div>
    );
  }

  // Show URL input form (default state)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-gray-50 to-primary-100 py-12" style={{ background: 'linear-gradient(to bottom right, #E6F9F9, #F9FAFB, #B3F0F0)' }}>
      <div className="container mx-auto px-4">
        <UrlInput
          onSubmit={handleUrlSubmit}
          isLoading={false}
        />
        
        {/* About section */}
        <div className="max-w-4xl mx-auto mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">What is llms.txt?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
              llms.txt is a standardized format for structured documentation 
              for Large Language Models. It helps AI systems understand your website, 
              documentation or codebase more effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold mb-3 text-gray-800 text-lg">AI-Powered</h3>
              <p className="text-gray-600 leading-relaxed">
                Uses GPT-4 to intelligently analyze your content and structure it into perfect llms.txt format.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="font-semibold mb-3 text-gray-800 text-lg">Comprehensive</h3>
              <p className="text-gray-600 leading-relaxed">
                Automatically categorizes content into essential, helpful, reference, and context sections.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold mb-3 text-gray-800 text-lg">Fast & Simple</h3>
              <p className="text-gray-600 leading-relaxed">
                Simply enter a URL and get a complete llms.txt file in just minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}