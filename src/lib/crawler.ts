import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { ProcessedPage, CrawlRequest, CrawlError } from '@/types';

export class WebCrawler {
  private turndownService: TurndownService;
  private visitedUrls = new Set<string>();
  private errors: CrawlError[] = [];
  private processedPages: ProcessedPage[] = [];

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    
    // Configure turndown to preserve important elements
    this.turndownService.addRule('removeScripts', {
      filter: ['script', 'style', 'nav', 'footer', 'aside'],
      replacement: () => '',
    });
  }

  async crawl(request: CrawlRequest, onProgress?: (progress: { processedPages: number; currentPage: string; totalPages: number }) => void): Promise<ProcessedPage[]> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
    });

    try {
      const startUrl = new URL(request.url);
      const baseDomain = startUrl.hostname;
      
      // Smart crawling strategy: First crawl ONLY homepage
      console.log('Smart crawling: Starting with homepage only');
      await this.crawlSinglePage(browser, request.url, onProgress);

      // If we have a good homepage with sufficient content, look for key pages only
      const homepage = this.processedPages.find(p => p.url === request.url || p.url.replace(/\/$/, '') === request.url.replace(/\/$/, ''));
      if (homepage && homepage.wordCount > 200) {
        console.log(`Homepage has ${homepage.wordCount} words, looking for key pages only`);
        await this.smartCrawlKeyPages(browser, request.url, baseDomain, request, onProgress);
      } else {
        // Fallback to limited crawling
        console.log('Homepage insufficient, doing limited regular crawl');
        const limitedRequest = { ...request, maxDepth: 1 }; // Only depth 1
        await this.crawlUrl(
          browser,
          request.url,
          baseDomain,
          limitedRequest,
          0,
          onProgress
        );
      }

      return this.processedPages;
    } finally {
      await browser.close();
    }
  }

  private async crawlUrl(
    browser: Browser,
    url: string,
    baseDomain: string,
    request: CrawlRequest,
    currentDepth: number,
    onProgress?: (progress: { processedPages: number; currentPage: string; totalPages: number }) => void
  ): Promise<void> {
    if (currentDepth >= request.maxDepth || this.visitedUrls.has(url)) {
      return;
    }

    // Check if URL matches include/exclude patterns
    if (!this.shouldCrawlUrl(url, request)) {
      return;
    }

    this.visitedUrls.add(url);
    
    try {
      const page = await browser.newPage();
      
      // Set reasonable timeouts and user agent
      await page.setUserAgent('Mozilla/5.0 (compatible; LLMsTxtGenerator/1.0)');
      await page.setViewport({ width: 1280, height: 720 });
      
      const response = await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      if (!response || !response.ok()) {
        throw new Error(`HTTP ${response?.status() || 'unknown'}: Failed to load page`);
      }

      // Extract content and metadata
      const content = await page.content();
      const title = await page.title();
      
      // Process the page content
      const processedPage = await this.processPage(url, title, content);
      if (processedPage) {
        this.processedPages.push(processedPage);
        
        onProgress?.({
          processedPages: this.processedPages.length,
          currentPage: url,
          totalPages: this.visitedUrls.size,
        });
      }

      // Extract links for further crawling
      const links = await this.extractLinks(page, baseDomain);
      await page.close();

      // Recursively crawl found links
      for (const link of links) {
        await this.crawlUrl(
          browser,
          link,
          baseDomain,
          request,
          currentDepth + 1,
          onProgress
        );
        
        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
      const crawlError: CrawlError = {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
      this.errors.push(crawlError);
      console.error(`Error crawling ${url}:`, error);
    }
  }

  private shouldCrawlUrl(url: string, request: CrawlRequest): boolean {
    // Check include patterns
    if (request.includePatterns.length > 0) {
      const matchesInclude = request.includePatterns.some(pattern =>
        this.matchesPattern(url, pattern)
      );
      if (!matchesInclude) return false;
    }

    // Check exclude patterns
    if (request.excludePatterns.length > 0) {
      const matchesExclude = request.excludePatterns.some(pattern =>
        this.matchesPattern(url, pattern)
      );
      if (matchesExclude) return false;
    }

    return true;
  }

  private matchesPattern(url: string, pattern: string): boolean {
    // Simple pattern matching - could be enhanced with proper glob matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*'), 'i');
    return regex.test(url);
  }

  private async processPage(url: string, title: string, html: string): Promise<ProcessedPage | null> {
    try {
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('script, style, nav, footer, aside, .sidebar, .navigation').remove();
      
      // Extract main content
      let mainContent = '';
      const contentSelectors = [
        'main',
        '[role="main"]',
        '.content',
        '.main-content',
        'article',
        '.article-content',
        '.post-content',
        '.documentation',
        '.docs-content'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector).first();
        if (element.length && element.text().trim().length > 100) {
          mainContent = element.html() || '';
          break;
        }
      }

      // Fallback to body if no main content found
      if (!mainContent) {
        mainContent = $('body').html() || '';
      }

      // Convert to markdown
      const markdown = this.turndownService.turndown(mainContent);
      const wordCount = markdown.split(/\s+/).length;

      // Skip if content is too short
      if (wordCount < 50) {
        return null;
      }

      // Categorize the page
      const category = this.categorizeContent(url, title, markdown);
      const importance = this.calculateImportance(url, title, wordCount, category);

      return {
        url,
        title: title || 'Untitled',
        content: markdown,
        category,
        importance,
        wordCount,
        lastModified: new Date(),
      };
    } catch (error) {
      console.error(`Error processing page ${url}:`, error);
      return null;
    }
  }

  private async extractLinks(page: Page, baseDomain: string): Promise<string[]> {
    try {
      const links = await page.evaluate((domain) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
          .map(anchor => (anchor as HTMLAnchorElement).href)
          .filter(href => {
            try {
              const url = new URL(href);
              return url.hostname === domain && 
                     !href.includes('#') && 
                     !href.includes('mailto:') &&
                     !href.includes('tel:') &&
                     !href.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe)$/i);
            } catch {
              return false;
            }
          });
      }, baseDomain);

      return Array.from(new Set(links));
    } catch (error) {
      console.error('Error extracting links:', error);
      return [];
    }
  }

  private categorizeContent(url: string, title: string, content: string): string {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    // Home/Main page
    const urlPath = new URL(url).pathname;
    if (urlPath === '/' || urlPath === '' || titleLower.includes('home') || titleLower.includes('startseite')) {
      return 'Main Navigation';
    }

    // Main navigation pages (German/English)
    const mainNavKeywords = [
      'über uns', 'about', 'about us', 'ueber uns',
      'kontakt', 'contact', 'impressum',
      'services', 'dienstleistungen', 'was wir tun',
      'projekte', 'projects', 'portfolio',
      'team', 'unternehmen', 'company'
    ];

    if (mainNavKeywords.some(keyword => 
      titleLower.includes(keyword) || urlLower.includes(keyword))) {
      return 'Main Navigation';
    }

    // API Documentation
    if (urlLower.includes('/api/') || titleLower.includes('api') || 
        contentLower.includes('endpoint') || contentLower.includes('authentication')) {
      return 'API Documentation';
    }

    // Getting Started / Quick Start
    if (titleLower.includes('getting started') || titleLower.includes('quick start') ||
        titleLower.includes('introduction') || urlLower.includes('/getting-started') ||
        urlLower.includes('/quickstart') || urlLower.includes('/intro')) {
      return 'Getting Started';
    }

    // Tutorials
    if (urlLower.includes('/tutorial') || titleLower.includes('tutorial') ||
        titleLower.includes('how to') || contentLower.includes('step-by-step')) {
      return 'Tutorial';
    }

    // Reference
    if (urlLower.includes('/reference') || titleLower.includes('reference') ||
        titleLower.includes('specification') || contentLower.includes('parameters')) {
      return 'Reference';
    }

    // Blog Posts / Insights
    if (urlLower.includes('/blog') || urlLower.includes('/news') ||
        titleLower.includes('blog') || urlLower.includes('/posts') ||
        urlLower.includes('/insights') || titleLower.includes('insights')) {
      return 'Blog';
    }

    // Legal
    if (titleLower.includes('privacy') || titleLower.includes('terms') ||
        titleLower.includes('legal') || urlLower.includes('/legal') ||
        titleLower.includes('datenschutz') || titleLower.includes('agb')) {
      return 'Legal';
    }

    return 'Documentation';
  }

  private calculateImportance(url: string, title: string, wordCount: number, category: string): number {
    let importance = 0.5; // Base importance

    // Category-based importance
    const categoryWeights = {
      'Main Navigation': 0.95, // Highest priority for main nav pages
      'Getting Started': 0.9,
      'API Documentation': 0.8,
      'Tutorial': 0.7,
      'Documentation': 0.6,
      'Reference': 0.5,
      'Blog': 0.3,
      'Legal': 0.1,
    };

    importance = categoryWeights[category as keyof typeof categoryWeights] || 0.5;

    // Home page gets maximum importance
    const urlPath = new URL(url).pathname;
    if (urlPath === '/' || urlPath === '') {
      importance = 1.0;
    }

    // URL structure importance (shorter paths are more important)
    const urlDepth = url.split('/').length - 3; // Subtract protocol and domain
    if (category === 'Main Navigation') {
      // Don't penalize main nav pages for depth
      importance *= Math.max(0.8, 1 - (urlDepth * 0.05));
    } else {
      importance *= Math.max(0.3, 1 - (urlDepth * 0.1));
    }

    // Content length importance (but not critical for nav pages)
    if (category !== 'Main Navigation') {
      if (wordCount > 1000) importance += 0.1;
      if (wordCount > 2000) importance += 0.1;
    }

    // Title keywords
    const titleLower = title.toLowerCase();
    const importantKeywords = ['getting started', 'introduction', 'overview', 'guide', 'tutorial'];
    if (importantKeywords.some(keyword => titleLower.includes(keyword))) {
      importance += 0.1;
    }

    return Math.min(1, Math.max(0, importance));
  }

  getErrors(): CrawlError[] {
    return this.errors;
  }

  private async smartCrawlKeyPages(
    browser: Browser,
    baseUrl: string,
    baseDomain: string,
    request: CrawlRequest,
    onProgress?: (progress: { processedPages: number; currentPage: string; totalPages: number }) => void
  ): Promise<void> {
    console.log('Starting smart crawl for key pages');
    
    // Define key page patterns to look for
    const keyPagePatterns = [
      '/about',
      '/ueber-uns',
      '/about-us',
      '/company',
      '/unternehmen',
      '/services',
      '/leistungen',
      '/dienstleistungen',
      '/products',
      '/produkte',
      '/solutions',
      '/loesungen',
      '/team',
      '/people',
      '/philosophy',
      '/mission',
      '/vision'
    ];

    const baseUrlObj = new URL(baseUrl);
    const keyUrls: string[] = [];

    // Try to find key pages by constructing likely URLs
    for (const pattern of keyPagePatterns) {
      const potentialUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${pattern}`;
      keyUrls.push(potentialUrl);
      
      // Also try with language prefix if the base URL has one
      if (baseUrlObj.pathname.startsWith('/de') || baseUrlObj.pathname.startsWith('/en')) {
        const langPrefix = baseUrlObj.pathname.substring(0, 3);
        const potentialLangUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${langPrefix}${pattern}`;
        keyUrls.push(potentialLangUrl);
      }
    }

    // Try to crawl each key URL
    let successful = 0;
    for (const url of keyUrls) {
      if (successful >= 3) break; // Limit to 3 additional key pages

      try {
        if (!this.visitedUrls.has(url)) {
          console.log(`Trying key page: ${url}`);
          
          onProgress?.({
            processedPages: this.processedPages.length,
            currentPage: url,
            totalPages: this.processedPages.length + keyUrls.length - successful
          });

          const page = await browser.newPage();
          
          try {
            await page.goto(url, { 
              waitUntil: 'networkidle0',
              timeout: 10000 // Reduced timeout for key pages
            });

            const title = await page.title();
            const html = await page.content();
            
            const processedPage = await this.processPage(url, title, html);
            if (processedPage && processedPage.wordCount > 100) {
              this.processedPages.push(processedPage);
              this.visitedUrls.add(url);
              successful++;
              console.log(`Successfully crawled key page: ${url} (${processedPage.wordCount} words)`);
            }
          } catch (error) {
            console.log(`Key page not found or error: ${url}`);
            // Don't add to errors, it's expected that some key pages don't exist
          } finally {
            await page.close();
          }
        }
      } catch (error) {
        console.log(`Error accessing key page ${url}:`, error);
      }
    }

    console.log(`Smart crawl completed, found ${successful} additional key pages`);
  }

  private async crawlSinglePage(
    browser: Browser,
    url: string,
    onProgress?: (progress: { processedPages: number; currentPage: string; totalPages: number }) => void
  ): Promise<void> {
    if (this.visitedUrls.has(url)) {
      return;
    }

    console.log(`Crawling single page: ${url}`);
    
    onProgress?.({
      processedPages: this.processedPages.length,
      currentPage: url,
      totalPages: 1
    });

    const page = await browser.newPage();
    
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 15000
      });

      const title = await page.title();
      const html = await page.content();
      
      const processedPage = await this.processPage(url, title, html);
      if (processedPage) {
        this.processedPages.push(processedPage);
        this.visitedUrls.add(url);
        console.log(`Successfully crawled homepage: ${url} (${processedPage.wordCount} words)`);
      }
    } catch (error) {
      console.error(`Error crawling single page ${url}:`, error);
      this.errors.push({
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    } finally {
      await page.close();
    }
  }
}