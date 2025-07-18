import { CrawlProgress as CrawlProgressType } from '@/types';

interface CrawlProgressProps {
  progress: CrawlProgressType;
  onCancel?: () => void;
}

export function CrawlProgress({ progress, onCancel }: CrawlProgressProps) {
  const getStatusText = () => {
    switch (progress.status) {
      case 'crawling':
        return 'Paul AI is crawling your website...';
      case 'processing':
        if (progress.currentPage === 'Generating llms.txt...') {
          return 'Paul AI is creating your llms.txt file...';
        }
        return 'Paul AI is processing content...';
      case 'completed':
        return 'Paul AI completed your llms.txt file!';
      case 'error':
        return 'Paul AI encountered an error';
      default:
        return 'Paul AI is initializing...';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #E6F9F9, #F9FAFB, #B3F0F0)' }}>
      <div className="text-center space-y-6">
        {/* Paul AI Robot Animation */}
        {progress.status !== 'completed' && (
          <div className="flex justify-center">
            <img 
              src="/paul-1.gif" 
              alt="Paul AI is working..." 
              width="120" 
              height="120"
              className="object-contain"
            />
          </div>
        )}
        
        {/* Status text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">{getStatusText()}</h2>
          {progress.currentPage && progress.currentPage !== 'Generating llms.txt...' && (
            <p className="text-gray-600 max-w-md mx-auto truncate">
              Current page: {progress.currentPage}
            </p>
          )}
        </div>
        
        {/* Simple progress indicator */}
        {progress.totalPages > 0 && progress.status !== 'completed' && (
          <div className="text-sm text-gray-500">
            {progress.processedPages} / {progress.totalPages} pages processed
          </div>
        )}
      </div>
    </div>
  );
}