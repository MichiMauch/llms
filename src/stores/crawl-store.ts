import { create } from 'zustand';
import { CrawlProgress, CrawlRequest, LlmsTxtContent } from '@/types';

interface CrawlStore {
  progress: CrawlProgress | null;
  generatedContent: LlmsTxtContent | null;
  isStartingNewCrawl: boolean;
  
  // Actions
  setCrawlProgress: (progress: CrawlProgress) => void;
  setGeneratedContent: (content: LlmsTxtContent) => void;
  startCrawl: (request: CrawlRequest) => Promise<void>;
  resetCrawl: () => void;
}

export const useCrawlStore = create<CrawlStore>((set) => ({
  progress: null,
  generatedContent: null,
  isStartingNewCrawl: false,

  setCrawlProgress: (progress) => set({ progress }),
  
  setGeneratedContent: (content) => set({ generatedContent: content }),

  startCrawl: async (request: CrawlRequest) => {
    set({ isStartingNewCrawl: true });
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
      
      // Start polling for progress with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      const pollProgress = async () => {
        try {
          const progressResponse = await fetch(`/api/crawl/${jobId}`);
          if (progressResponse.ok) {
            const progress = await progressResponse.json();
            set({ progress });
            retryCount = 0; // Reset retry count on success

            if (progress.status === 'completed' && progress.generatedContent) {
              set({ generatedContent: progress.generatedContent });
              // Stop polling when completed
              return;
            } else if (progress.status === 'error') {
              // Stop polling on error
              return;
            } else if (progress.status === 'crawling' || progress.status === 'processing') {
              setTimeout(pollProgress, 2000); // Continue polling
            }
          } else if (progressResponse.status === 404) {
            retryCount++;
            if (retryCount <= maxRetries) {
              console.warn(`Job ${jobId} not found on server, retrying... (${retryCount}/${maxRetries})`);
              // Retry after a short delay - job might still be initializing
              setTimeout(pollProgress, 1000);
            } else {
              console.error(`Job ${jobId} not found after ${maxRetries} retries`);
              set({
                progress: {
                  status: 'error',
                  totalPages: 0,
                  processedPages: 0,
                  currentPage: '',
                  errors: [{ url: request.url, error: 'Job not found on server', timestamp: new Date() }],
                  estimatedTimeRemaining: 0,
                  jobId: jobId,
                },
              });
            }
          } else {
            console.error(`Error polling progress: ${progressResponse.status}`);
            retryCount++;
            if (retryCount <= maxRetries) {
              setTimeout(pollProgress, 2000);
            }
          }
        } catch (error) {
          console.error('Error polling progress:', error);
          retryCount++;
          if (retryCount <= maxRetries) {
            setTimeout(pollProgress, 2000);
          }
        }
      };

      // Start polling after a brief delay to ensure job is saved in database
      setTimeout(() => {
        set({ isStartingNewCrawl: false });
        pollProgress();
      }, 500);
    } catch (error) {
      console.error('Error starting crawl:', error);
      set({
        isStartingNewCrawl: false,
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

  resetCrawl: () => set({ progress: null, generatedContent: null, isStartingNewCrawl: false }),
}));