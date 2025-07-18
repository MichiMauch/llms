'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Globe } from 'lucide-react';
import { isValidUrl, normalizeUrl } from '@/lib/utils';
import { CrawlRequest } from '@/types';

interface UrlInputProps {
  onSubmit: (request: CrawlRequest) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    // Normalize URL (add https:// if missing)
    const normalizedUrl = normalizeUrl(url);

    if (!isValidUrl(normalizedUrl)) {
      setUrlError('Please enter a valid URL');
      return;
    }

    setUrlError('');
    
    const request: CrawlRequest = {
      url: normalizedUrl,
      maxDepth: 3,
      includePatterns: [],
      excludePatterns: [],
      respectRobotsTxt: true,
    };

    onSubmit(request);
  };

  const exampleUrls = [
    'docs.anthropic.com',
    'docs.vercel.com', 
    'nextjs.org/docs',
    'www.netnode.ch',
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Paul AI - LLMs.txt Generator</h1>
        <p className="text-lg text-muted-foreground">
          Generate structured, AI-friendly documentation from any website with Paul AI
        </p>
        
        {/* GEO Information Card */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 max-w-3xl mx-auto border border-blue-100 mt-6">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">
            Essential for Generative Engine Optimization (GEO)
          </h3>
          <p className="text-gray-700 leading-relaxed">
            llms.txt files are crucial for <strong>Generative Engine Optimization (GEO)</strong> - 
            the practice of optimizing content for AI-powered search engines and chatbots. 
            By providing structured, machine-readable documentation, you ensure AI systems 
            can accurately understand and represent your content in their responses.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardDescription className="text-lg">
            Enter the URL of the website you want to crawl and convert to llms.txt format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="www.example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setUrlError('');
                }}
                className={urlError ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {urlError && (
                <p className="text-sm text-red-500">{urlError}</p>
              )}
            </div>


            <Button
              type="submit"
              className="w-full font-medium hover:opacity-90 hover:cursor-pointer transition-all duration-200"
              style={{ backgroundColor: '#34CCCD', color: 'white' }}
              disabled={isLoading || !url.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verarbeitung läuft...
                </>
              ) : (
                'llms.txt generieren'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}