export interface CrawlRequest {
  url: string;
  maxDepth: number;
  includePatterns: string[];
  excludePatterns: string[];
  respectRobotsTxt: boolean;
}

export interface ProcessedPage {
  url: string;
  title: string;
  content: string;
  category: string;
  importance: number;
  wordCount: number;
  lastModified?: Date;
}

export interface CrawlError {
  url: string;
  error: string;
  timestamp: Date;
}

export interface CrawlProgress {
  status: 'idle' | 'crawling' | 'processing' | 'completed' | 'error';
  totalPages: number;
  processedPages: number;
  currentPage: string;
  errors: CrawlError[];
  estimatedTimeRemaining: number;
  jobId: string;
  generatedContent?: LlmsTxtContent;
}

export interface LlmsTxtStructure {
  pages: ProcessedPage[];
}

export interface LlmsTxtContent {
  structure: LlmsTxtStructure;
  metadata: {
    websiteUrl: string;
    generatedAt: Date | string;
    totalPages: number;
    categories: string[];
  };
}

export interface WebsiteTemplate {
  name: string;
  patterns: {
    documentation: string[];
    api: string[];
    guides: string[];
    blog: string[];
  };
  excludePatterns: string[];
}