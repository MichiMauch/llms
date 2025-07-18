import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { WebCrawler } from '@/lib/crawler';
import { CrawlRequest, CrawlProgress, ProcessedPage, LlmsTxtContent } from '@/types';
import { generateJobId } from '@/lib/utils';
import { createJob, updateJob } from '@/lib/crawl-jobs';
import { getAIGeneratedMarkdown } from '@/lib/openai-generator';
import { generateLlmsFullTxtMarkdown } from '@/lib/llms-generator';

// Extend timeout for Vercel to 60 seconds
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const crawlRequest: CrawlRequest = await request.json();
    
    // Validate the request
    if (!crawlRequest.url || !crawlRequest.url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    const jobId = generateJobId();
    
    console.log(`Creating new crawl job: ${jobId} for URL: ${crawlRequest.url} from IP: ${clientIP}`);
    
    // Initialize the crawl job in database
    await createJob(jobId);
    await updateJob(jobId, {
      status: 'crawling',
      totalPages: 0,
      processedPages: 0,
      currentPage: crawlRequest.url,
      errors: [],
      estimatedTimeRemaining: 0,
    });
    
    console.log(`Job ${jobId} created and stored in database`);

    // Start crawling in the background
    setImmediate(() => startCrawling(jobId, crawlRequest, clientIP));

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('Error starting crawl:', error);
    return NextResponse.json(
      { error: 'Failed to start crawling', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function startCrawling(jobId: string, request: CrawlRequest, clientIP?: string) {
  const crawler = new WebCrawler();
  
  try {
    console.log(`Starting crawl process for job ${jobId}`);
    console.log(`Environment check - OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Present' : 'Missing'}`);
    console.log(`Environment check - Turso URL: ${process.env.TURSO_DATABASE_URL ? 'Present' : 'Missing'}`);
    console.log(`Environment check - Turso Token: ${process.env.TURSO_AUTH_TOKEN ? 'Present' : 'Missing'}`);
    const startTime = Date.now();
    
    // Add a maximum timeout to prevent hanging jobs
    const timeoutId = setTimeout(async () => {
      console.log(`Job ${jobId} timed out after 10 minutes`);
      await updateJob(jobId, {
        status: 'error',
        errors: [{
          url: request.url,
          error: 'Crawl operation timed out after 10 minutes',
          timestamp: new Date(),
        }],
      });
    }, 600000); // 10 minutes timeout
    
    const pages = await crawler.crawl(request, async (progress) => {
      console.log(`Job ${jobId} progress:`, progress);
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = progress.processedPages / elapsed;
      const estimatedTotal = Math.max(progress.totalPages, progress.processedPages * 2);
      const remaining = estimatedTotal - progress.processedPages;
      const estimatedTimeRemaining = rate > 0 ? Math.round(remaining / rate) : 0;

      await updateJob(jobId, {
        ...progress,
        estimatedTimeRemaining,
        errors: crawler.getErrors(),
      });
    });

    console.log(`Job ${jobId} crawling completed. Found ${pages.length} pages.`);
    
    // Clear the timeout since crawling completed successfully
    clearTimeout(timeoutId);

    // Process and categorize the results
    console.log(`Job ${jobId} switching to processing status`);
    await updateJob(jobId, {
      status: 'processing',
      currentPage: 'Generating llms.txt...',
    });

    // Generate llms.txt content using AI directly
    console.log(`Job ${jobId} starting AI generation`);
    const generatedContent = await generateLlmsTxtWithAIServer(pages, request.url);
    console.log(`Job ${jobId} AI generation completed`);

    // Save to database
    try {
      const { getDb, schema } = await import('@/lib/db');
      const db = getDb();
      const llmsTxt = getAIGeneratedMarkdown(generatedContent);
      const llmsFullTxt = generateLlmsFullTxtMarkdown(generatedContent);
      
      await db.insert(schema.crawlResults).values({
        url: request.url,
        llmsTxt,
        llmsFullTxt,
        ipAddress: clientIP || 'unknown',
        createdAt: new Date().toISOString(),
      });
      
      console.log(`Job ${jobId} saved to database`);
    } catch (dbError) {
      console.error(`Job ${jobId} database save failed:`, dbError);
      // Don't fail the whole process if DB save fails
    }

    // Mark as completed
    console.log(`Job ${jobId} marking as completed`);
    await updateJob(jobId, {
      status: 'completed',
      currentPage: 'Completed',
      estimatedTimeRemaining: 0,
      generatedContent,
    });

  } catch (error) {
    console.error(`Error in crawl job ${jobId}:`, error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    await updateJob(jobId, {
      status: 'error',
      errors: [{
        url: request.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      }],
    });
  }
}

async function generateLlmsTxtWithAIServer(pages: ProcessedPage[], websiteUrl: string): Promise<LlmsTxtContent> {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, falling back to basic generation');
      const { generateLlmsTxt } = await import('@/lib/llms-generator');
      return generateLlmsTxt(pages, websiteUrl);
    }

    // Identify main navigation pages (highest importance and main navigation category)
    const mainNavigationPages = pages
      .filter((page: ProcessedPage) => 
        page.category === 'Main Navigation' || 
        page.importance >= 0.8 ||
        page.url === websiteUrl
      )
      .sort((a: ProcessedPage, b: ProcessedPage) => b.importance - a.importance)
      .slice(0, 8); // Limit to top 8 most important pages

    // Get summarized content from main navigation pages (limit content length)
    const fullNavigationContent = mainNavigationPages.map((page: ProcessedPage) => ({
      url: page.url,
      title: page.title,
      category: page.category,
      importance: page.importance,
      wordCount: page.wordCount,
      contentSummary: page.content.substring(0, 800) + (page.content.length > 800 ? '...' : '') // Reduced from full content
    }));

    // Create summary of other pages (non-navigation) - further reduced
    const otherPagesSummary = pages
      .filter((page: ProcessedPage) => !mainNavigationPages.includes(page))
      .slice(0, 10) // Limit to top 10 other pages
      .map((page: ProcessedPage) => ({
        url: page.url,
        title: page.title,
        category: page.category,
        importance: page.importance,
        contentPreview: page.content.substring(0, 150) + (page.content.length > 150 ? '...' : '')
      }));

    const prompt = `Du bist ein Experte für das Erstellen von optimalen llms.txt Dateien - ein standardisiertes Format für strukturierte Dokumentation für Large Language Models.

Erstelle ein optimales llms.txt File nach folgenden Prinzipien:

# [Firmen/Organisations Name]

> [2-3 Zeilen Beschreibung: Kerngeschäft, Größe/Reichweite, gesellschaftliche Rolle - zeitlos und ohne Daten]

## Main
- [Geschäftsbereich](URL): Spezifische Beschreibung was Nutzer hier finden und welchen Mehrwert es bietet
- [Kernaktivität](URL): Konkrete Erklärung des Inhalts und Nutzens für verschiedene Zielgruppen
- [Hauptservice](URL): Eindeutige Beschreibung ohne Redundanz zu anderen Links

## Publikationen & News
- [Aktuelle Inhalte](URL): Beschreibung der Art von Inhalten und Aktualisierungsfrequenz
- [Fachpublikationen](URL): Zielgruppe und Themenspektrum der Publikationen

## Kontakt & Informationen
- [Kontakt & Standorte](URL): Verfügbare Kontaktmöglichkeiten und Erreichbarkeit
- [Services & Preise](URL): Übersicht über Dienstleistungen und Konditionen (falls relevant)
- [FAQ & Support](URL): Häufige Fragen und Hilfestellungen (falls verfügbar)

Wichtige Hinweise:
- [Organisationstyp und Größenordnung]
- [Zielgruppen und Kundenkreis]
- [Besonderheiten und Alleinstellungsmerkmale]

OPTIMIERUNGSRICHTLINIEN:
1. STRUKTUR & FORMAT: Konsistente Formatierung, logische Gliederung, keine Doppelpunkte in Überschriften
2. ZEITLOSE GESTALTUNG: Keine Daten/Termine verwenden, die schnell veralten
3. KERNGESCHÄFT ABBILDEN: Alle wichtigen Geschäftsbereiche/Aktivitäten erfassen
4. SPEZIFISCHE BESCHREIBUNGEN: Konkret erklären was Nutzer finden, nicht nur wiederholen was der Link-Text sagt
5. NUTZENORIENTIERUNG: Welchen Mehrwert hat die Seite für verschiedene Nutzergruppen
6. ZIELGRUPPENVIELFALT: Links für Kunden, Medien, Partner, Bewerber je nach Relevanz
7. VERMEIDUNG VON REDUNDANZ: Jede Beschreibung soll einzigartige Informationen bieten
8. NACHHALTIGE LINKS: Hauptkategorien bevorzugen, nicht spezifische Produkte/Events
9. UNIVERSELL ANWENDBAR: Struktur funktioniert für alle Organisationstypen
10. KONTAKTDATEN EINBINDEN: Falls verfügbar, Kontaktinformationen in separater Sektion hinzufügen

WICHTIG: Arbeite mit den vorhandenen Informationen effizient. Die Startseite enthält oft bereits alle wichtigen Informationen über das Unternehmen. Ziel ist ein llms.txt File, das Nutzern schnell die wichtigsten Informationen vermittelt und sie effizient zu relevanten Inhalten weiterleitet.

WICHTIGE RICHTLINIEN (nach aktuellen llms.txt Best Practices):
1. Nutze den echten Firmen-/Website-Namen aus dem Content, nicht nur die Domain
2. ERWEITERTE BESCHREIBUNG: 2-3 Zeilen im Blockquote mit konkreten Details:
   - Was macht das Unternehmen genau
   - Größe/Reichweite (Anzahl Mitglieder/Kunden/Mitarbeiter)  
   - Rolle/Position in der Branche oder Gesellschaft
3. BESCHREIBENDE LINK-TEXTE: Jeder Link MUSS eine Beschreibung haben:
   Format: [Link Titel](URL): Kurze Erklärung was auf dieser Seite zu finden ist
4. MAIN Bereich: Die 6-8 wichtigsten Bereiche mit Beschreibungen
5. INTELLIGENTE KATEGORISIERUNG:
   - "Kernthemen" oder "Hauptbereiche" für thematische Inhalte
   - "Publikationen & News" für aktuelle Inhalte  
   - "Services" oder "Leistungen" für Angebote
   - "Organisation" für Unternehmensinfo
6. WICHTIGE HINWEISE Sektion: Zusätzliche Kontextinformationen
   - Besondere Merkmale des Unternehmens
   - Anzahl Mitglieder/Kunden/Standorte
   - Branchenstellung oder gesellschaftliche Rolle
7. KONTAKTDATEN: Falls verfügbar, Kontaktseiten verlinken und grundlegende Erreichbarkeit erwähnen
8. QUALITÄT VOR QUANTITÄT: Lieber weniger, aber dafür ausführlichere und beschreibende Einträge
9. Ziel: LLMs sollen den Zweck und Inhalt jeder Sektion sofort verstehen können
10. SCHWEIZER TASTATUR: Verwende nur Zeichen, die auf einer Schweizer Tastatur verfügbar sind - keine speziellen Anführungszeichen, Gedankenstriche oder andere Sonderzeichen

Website URL: ${websiteUrl}

HAUPTNAVIGATIONS-SEITEN (Zusammenfassung):
${JSON.stringify(fullNavigationContent, null, 2)}

ANDERE WICHTIGE SEITEN:
${JSON.stringify(otherPagesSummary, null, 2)}

Basierend auf der kompletten Analyse des Hauptnavigations-Contents oben, generiere jetzt den llms.txt Content:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Experte für das Erstellen von llms.txt Dateien. Antworte immer mit sauberem, gut formatiertem Markdown das exakt der spezifizierten Struktur folgt. Analysiere den vollständigen Content der Hauptnavigationsseiten um das Business, Services und Wertversprechen tiefgreifend zu verstehen.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.2,
    });

    const generatedContent = response.choices[0]?.message?.content || '';

    // Parse the generated content back into our structure
    return parseAIGeneratedContent(generatedContent, pages, websiteUrl);

  } catch (error) {
    console.error('Error generating content with AI:', error);
    // Fallback to original method if AI fails
    const { generateLlmsTxt } = await import('@/lib/llms-generator');
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
    metadata: metadata as LlmsTxtContent['metadata'] & { aiContent: string },
  };
}

