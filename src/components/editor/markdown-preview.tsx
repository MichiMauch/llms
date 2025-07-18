'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, FileText, Download, Check, Edit3 } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
  title: string;
  onDownload?: () => void;
  onEdit?: () => void;
}

export function MarkdownPreview({ content, title, onDownload, onEdit }: MarkdownPreviewProps) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Preview: {title}
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEdit}
                  className="hover:bg-gray-100 hover:cursor-pointer transition-all duration-200 p-1 ml-1"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="hover:bg-gray-100 hover:cursor-pointer transition-all duration-200"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </>
              )}
            </Button>
            {onDownload && (
              <Button
                size="sm"
                onClick={onDownload}
                style={{ backgroundColor: '#34CCCD', color: 'white' }}
                className="hover:opacity-90 hover:cursor-pointer transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-4 max-h-[800px] overflow-auto">
          <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <strong>Lines:</strong> {content.split('\n').length} | 
          <strong> Characters:</strong> {content.length} | 
          <strong> Words:</strong> {content.split(/\s+/).length}
        </div>
      </CardContent>
    </Card>
  );
}