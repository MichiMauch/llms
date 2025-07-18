import { ProcessedPage, LlmsTxtContent, LlmsTxtStructure } from '@/types';

export function generateLlmsTxt(pages: ProcessedPage[], websiteUrl: string): LlmsTxtContent {
  // Sort pages by importance
  const sortedPages = pages.sort((a, b) => b.importance - a.importance);
  
  // Create simple structure with all pages
  const structure: LlmsTxtStructure = {
    pages: sortedPages,
  };

  const metadata = {
    websiteUrl,
    generatedAt: new Date(),
    totalPages: pages.length,
    categories: Array.from(new Set(pages.map(p => p.category))),
  };

  return {
    structure,
    metadata,
  };
}

export function generateLlmsTxtMarkdown(content: LlmsTxtContent): string {
  const { structure, metadata } = content;
  
  // Extract main site title and description from the first high-importance page
  const mainPage = structure.pages.find(p => p.url === metadata.websiteUrl) || structure.pages[0];
  const siteTitle = mainPage ? mainPage.title : extractDomainName(metadata.websiteUrl);
  
  let markdown = `# ${siteTitle}\n\n`;
  
  // Add description from main page content
  if (mainPage) {
    const description = extractSiteDescription(mainPage.content);
    if (description) {
      markdown += `> ${description}\n\n`;
    }
  }

  // Create Main section with top pages by importance
  const topPages = structure.pages
    .filter(p => p.importance >= 0.6)
    .slice(0, 10); // Limit to 10 main pages total

  if (topPages.length > 0) {
    markdown += `## Main\n\n`;
    
    for (const page of topPages) {
      // Clean up title - remove common website suffixes
      const cleanTitle = cleanPageTitle(page.title, siteTitle);
      markdown += `- [${cleanTitle}](${page.url})\n`;
    }
  }

  // Add contact information if found
  const contactInfo = extractContactInfo(structure);
  if (contactInfo.length > 0) {
    markdown += `\n## Contact\n\n`;
    for (const contact of contactInfo) {
      markdown += `- ${contact}\n`;
    }
  }

  return markdown;
}

export function generateLlmsFullTxtMarkdown(content: LlmsTxtContent): string {
  const { structure, metadata } = content;
  
  let markdown = `# ${extractDomainName(metadata.websiteUrl)} - Complete Documentation\n\n`;
  const generatedDate = metadata.generatedAt instanceof Date ? metadata.generatedAt : new Date(metadata.generatedAt);
  markdown += `> Generated on ${generatedDate.toLocaleDateString()} from ${metadata.websiteUrl}\n`;
  markdown += `> This file contains the full content of all processed pages.\n\n`;

  // Use all pages sorted by importance
  const allPages = structure.pages.sort((a, b) => b.importance - a.importance);

  for (const page of allPages) {
    markdown += `---\n\n`;
    markdown += `# ${page.title}\n\n`;
    markdown += `**URL:** ${page.url}\n`;
    markdown += `**Category:** ${page.category}\n`;
    markdown += `**Word Count:** ${page.wordCount}\n\n`;
    markdown += page.content;
    markdown += `\n\n`;
  }

  return markdown;
}

function extractDomainName(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '').split('.')[0];
  } catch {
    return 'Documentation';
  }
}

function extractSiteDescription(content: string): string {
  // Look for common description patterns
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines) {
    // Skip headers
    if (line.startsWith('#')) continue;
    
    // Look for description-like content
    if (line.length > 30 && line.length < 200) {
      // Check if it contains business-related keywords
      const businessKeywords = ['digitalagentur', 'agentur', 'services', 'solutions', 'expertise', 'consulting', 'development', 'design'];
      const lowercaseLine = line.toLowerCase();
      
      if (businessKeywords.some(keyword => lowercaseLine.includes(keyword))) {
        return line;
      }
    }
  }
  
  // Fallback to first substantial paragraph
  for (const line of lines) {
    if (!line.startsWith('#') && line.length > 50 && line.length < 300) {
      return line;
    }
  }
  
  return '';
}

function cleanPageTitle(title: string, siteTitle: string): string {
  // Remove site name from title if it appears at the end
  const siteName = siteTitle.split(/[|\-–—]/).map(s => s.trim())[0];
  let cleanTitle = title;
  
  // Remove common suffixes
  const suffixes = [siteName, 'Home', 'Homepage', 'Index', 'Main'];
  for (const suffix of suffixes) {
    const regex = new RegExp(`\\s*[|\-–—]\\s*${suffix}\\s*$`, 'i');
    cleanTitle = cleanTitle.replace(regex, '');
  }
  
  // Clean up and add period if missing
  cleanTitle = cleanTitle.trim();
  if (cleanTitle && !cleanTitle.match(/[.!?]$/)) {
    cleanTitle += '.';
  }
  
  return cleanTitle || title;
}

function extractContactInfo(structure: LlmsTxtStructure): string[] {
  const contactInfo: string[] = [];
  const allPages = structure.pages;
  
  for (const page of allPages) {
    const content = page.content.toLowerCase();
    
    // Look for phone numbers
    const phoneMatches = page.content.match(/(\+?[\d\s\-\(\)]{10,})/g);
    if (phoneMatches) {
      for (const phone of phoneMatches) {
        const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+\-]/g, '');
        if (cleanPhone.length >= 10) {
          contactInfo.push(`[${phone.trim()}](tel:${cleanPhone})`);
        }
      }
    }
    
    // Look for email addresses
    const emailMatches = page.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (emailMatches) {
      for (const email of emailMatches) {
        contactInfo.push(`[${email}](mailto:${email})`);
      }
    }
    
    // Look for contact page
    if (content.includes('kontakt') || content.includes('contact') || page.url.includes('contact') || page.url.includes('kontakt')) {
      // This is likely a contact page, extract structured info
      const lines = page.content.split('\n');
      for (const line of lines) {
        if (line.match(/^\s*[\+\d\s\-\(\)]{10,}/)) {
          const phone = line.trim();
          const cleanPhone = phone.replace(/\s+/g, '').replace(/[^\d+\-]/g, '');
          if (cleanPhone.length >= 10) {
            contactInfo.push(`[${phone}](tel:${cleanPhone})`);
          }
        }
      }
    }
  }
  
  // Remove duplicates and limit to most relevant
  return Array.from(new Set(contactInfo)).slice(0, 3);
}

// Commented out since it's not used in the AI-powered version
// function generatePageDescription(page: ProcessedPage): string {
//   // Extract first paragraph or first 200 characters as description
//   const lines = page.content.split('\n').filter(line => line.trim().length > 0);
//   
//   for (const line of lines) {
//     // Skip headers
//     if (line.startsWith('#')) continue;
//     
//     // Use first meaningful paragraph
//     if (line.length > 50) {
//       const description = line.length > 200 ? line.substring(0, 200) + '...' : line;
//       return `${description} *(${page.category}, ${page.wordCount} words)*`;
//     }
//   }
//   
//   // Fallback description
//   return `${page.category} page with ${page.wordCount} words of content.`;
// }

// Utility function to convert content to downloadable format
export function createDownloadableContent(content: LlmsTxtContent, format: 'llms.txt' | 'llms-full.txt'): string {
  if (format === 'llms-full.txt') {
    return generateLlmsFullTxtMarkdown(content);
  }
  return generateLlmsTxtMarkdown(content);
}

// Function to suggest categories based on URL patterns
export function suggestCategories(url: string): string[] {
  const suggestions: string[] = [];
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('/docs/') || urlLower.includes('/documentation/')) {
    suggestions.push('Documentation');
  }
  if (urlLower.includes('/api/')) {
    suggestions.push('API Documentation');
  }
  if (urlLower.includes('/tutorial/') || urlLower.includes('/guide/')) {
    suggestions.push('Tutorial');
  }
  if (urlLower.includes('/blog/') || urlLower.includes('/news/')) {
    suggestions.push('Blog');
  }
  if (urlLower.includes('/reference/')) {
    suggestions.push('Reference');
  }
  
  return suggestions.length > 0 ? suggestions : ['Documentation'];
}