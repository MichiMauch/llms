import { ProcessedPage, LlmsTxtContent } from '@/types';

export async function generateLlmsTxtWithAI(pages: ProcessedPage[], websiteUrl: string): Promise<LlmsTxtContent> {
  try {
    // Call our API route instead of using OpenAI directly
    const response = await fetch('/api/generate-llms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pages,
        websiteUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'AI generation failed');
    }

    const generatedContent = result.content;

    // Parse the generated content back into our structure
    return parseAIGeneratedContent(generatedContent, pages, websiteUrl);

  } catch (error) {
    console.error('Error generating content with AI:', error);
    // Fallback to original method if AI fails
    const { generateLlmsTxt } = await import('./llms-generator');
    return generateLlmsTxt(pages, websiteUrl);
  }
}

function parseAIGeneratedContent(aiContent: string, pages: ProcessedPage[], websiteUrl: string): LlmsTxtContent {
  // Parse the AI-generated content and map it back to our structure
  const lines = aiContent.split('\n');
  
  // Find the main section links
  const mainSectionLinks: ProcessedPage[] = [];
  let inMainSection = false;
  
  for (const line of lines) {
    if (line.trim() === '## Main') {
      inMainSection = true;
      continue;
    }
    
    if (line.startsWith('## ') && line.trim() !== '## Main') {
      inMainSection = false;
      continue;
    }
    
    if (inMainSection && line.startsWith('- [')) {
      // Extract URL from the markdown link
      const urlMatch = line.match(/\(([^)]+)\)/);
      if (urlMatch) {
        const url = urlMatch[1];
        const page = pages.find(p => p.url === url);
        if (page) {
          mainSectionLinks.push(page);
        }
      }
    }
  }

  // Create structure with all pages sorted by importance
  const structure = {
    pages: pages.sort((a, b) => b.importance - a.importance),
  };

  const metadata = {
    websiteUrl,
    generatedAt: new Date(),
    totalPages: pages.length,
    categories: Array.from(new Set(pages.map(p => p.category))),
    aiGenerated: true,
    aiContent: aiContent, // Store the AI-generated content
  };

  return {
    structure,
    metadata: metadata as LlmsTxtContent['metadata'] & { aiContent: string }, // Type assertion to avoid interface conflicts
  };
}

// New function to get the AI-generated markdown directly
export function getAIGeneratedMarkdown(content: LlmsTxtContent): string {
  const aiContent = (content.metadata as LlmsTxtContent['metadata'] & { aiContent?: string }).aiContent;
  if (aiContent) {
    return aiContent;
  }
  
  // Fallback: generate from the structure if no AI content exists
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { generateLlmsTxtMarkdown } = require('./llms-generator');
  return generateLlmsTxtMarkdown(content);
}

// Enhanced version that creates both a simple version and a detailed version
export async function generateBothVersionsWithAI(pages: ProcessedPage[], websiteUrl: string): Promise<{
  simple: string;
  detailed: string;
}> {
  try {
    // Generate simple version
    const simpleContent = await generateLlmsTxtWithAI(pages, websiteUrl);
    const simple = getAIGeneratedMarkdown(simpleContent);

    // For now, use the same content for detailed version
    // In the future, we could create a separate API endpoint for detailed generation
    const detailed = simple;

    return {
      simple,
      detailed
    };

  } catch (error) {
    console.error('Error generating both versions with AI:', error);
    throw error;
  }
}