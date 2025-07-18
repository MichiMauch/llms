import { create } from 'zustand';
import { CrawlProgress, CrawlRequest, LlmsTxtContent } from '@/types';

interface CrawlStore {
  progress: CrawlProgress | null;
  generatedContent: LlmsTxtContent | null;
  
  // Actions
  setCrawlProgress: (progress: CrawlProgress) => void;
  setGeneratedContent: (content: LlmsTxtContent) => void;
  startCrawl: (request: CrawlRequest) => Promise<void>;
  resetCrawl: () => void;
}

export const useCrawlStore = create<CrawlStore>((set) => ({
  progress: null,
  generatedContent: null,

  setCrawlProgress: (progress) => set({ progress }),
  
  setGeneratedContent: (content) => set({ generatedContent: content }),

  startCrawl: async (request: CrawlRequest) => {
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to start crawl');
      }

      const { jobId } = await response.json();
      
      // Start polling for progress
      const pollProgress = async () => {
        try {
          const progressResponse = await fetch(`/api/crawl/${jobId}`);
          if (progressResponse.ok) {
            const progress = await progressResponse.json();
            set({ progress });

            if (progress.status === 'completed' && progress.generatedContent) {
              set({ generatedContent: progress.generatedContent });
            } else if (progress.status === 'crawling' || progress.status === 'processing') {
              setTimeout(pollProgress, 2000); // Increase interval to 2 seconds
            }
          } else if (progressResponse.status === 404) {
            console.warn(`Job ${jobId} not found on server`);
            // Job might have been cleaned up, stop polling
            return;
          } else {
            console.error(`Error polling progress: ${progressResponse.status}`);
          }
        } catch (error) {
          console.error('Error polling progress:', error);
          // Stop polling on network errors after some attempts
        }
      };

      pollProgress();
    } catch (error) {
      console.error('Error starting crawl:', error);
      set({
        progress: {
          status: 'error',
          totalPages: 0,
          processedPages: 0,
          currentPage: '',
          errors: [{ url: request.url, error: 'Failed to start crawl', timestamp: new Date() }],
          estimatedTimeRemaining: 0,
          jobId: '',
        },
      });
    }
  },

  resetCrawl: () => set({ progress: null, generatedContent: null }),
}));