'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LlmsTxtContent } from '@/types';
import { getAIGeneratedMarkdown } from '@/lib/openai-generator';
import { generateLlmsFullTxtMarkdown } from '@/lib/llms-generator';
import { Download, Edit3, Save } from 'lucide-react';
import { MarkdownPreview } from './markdown-preview';

interface ContentEditorProps {
  content: LlmsTxtContent;
  onContentChange: (content: LlmsTxtContent) => void;
}

export function ContentEditor({ content, onContentChange }: ContentEditorProps) {
  const [viewMode, setViewMode] = useState<'llms.txt' | 'llms-full.txt' | 'edit'>('llms.txt');
  const [editContent, setEditContent] = useState('');
  const [localContent, setLocalContent] = useState<LlmsTxtContent>(content);

  const handleDownload = (format: 'llms.txt' | 'llms-full.txt') => {
    const fileContent = format === 'llms.txt' 
      ? getCurrentContent()
      : generateLlmsFullTxtMarkdown(content);
    
    if (fileContent) {
      const blob = new Blob([fileContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const copyToClipboard = async (format: 'llms.txt' | 'llms-full.txt') => {
    const fileContent = format === 'llms.txt' 
      ? getAIGeneratedMarkdown(content)
      : generateLlmsFullTxtMarkdown(content);
    
    if (fileContent) {
      try {
        await navigator.clipboard.writeText(fileContent);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  const getCurrentContent = () => {
    if (viewMode === 'llms.txt') {
      // Check if we have edited content in localContent, use that instead of original AI content
      const hasEditedContent = (localContent.metadata as LlmsTxtContent['metadata'] & { aiContent?: string }).aiContent;
      if (hasEditedContent) {
        return hasEditedContent;
      }
      return getAIGeneratedMarkdown(localContent);
    } else if (viewMode === 'llms-full.txt') {
      return generateLlmsFullTxtMarkdown(localContent);
    }
    return null;
  };

  const getCurrentTitle = () => {
    return viewMode === 'edit' ? 'Edit llms.txt' : viewMode;
  };

  const handleSave = () => {
    // Save the changes and go back to preview
    if (editContent) {
      const updatedContent = {
        ...localContent,
        metadata: {
          ...localContent.metadata,
          aiContent: editContent
        } as LlmsTxtContent['metadata'] & { aiContent: string }
      };
      setLocalContent(updatedContent);
      onContentChange(updatedContent);
      console.log('Saved content:', updatedContent); // Debug log
    }
    setViewMode('llms.txt');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with file toggle and action buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{getCurrentTitle()}</h1>
          
          {/* File type toggle */}
          {viewMode !== 'edit' && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'llms.txt' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('llms.txt')}
                style={viewMode === 'llms.txt' ? { backgroundColor: '#34CCCD', color: 'white' } : {}}
              >
                llms.txt
              </Button>
              <Button
                variant={viewMode === 'llms-full.txt' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('llms-full.txt')}
                style={viewMode === 'llms-full.txt' ? { backgroundColor: '#34CCCD', color: 'white' } : {}}
              >
                llms-full.txt
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {viewMode === 'edit' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('llms.txt')}
                className="hover:bg-gray-100 hover:cursor-pointer transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                style={{ backgroundColor: '#34CCCD', color: 'white' }}
                className="hover:opacity-90 hover:cursor-pointer transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      {viewMode === 'edit' ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <label className="block text-sm font-medium mb-2">Edit llms.txt content:</label>
            <textarea
              className="w-full h-96 p-3 border rounded-md font-mono text-sm"
              value={viewMode === 'edit' && editContent ? editContent : getAIGeneratedMarkdown(localContent)}
              onChange={(e) => {
                setEditContent(e.target.value);
              }}
              onFocus={() => {
                if (!editContent) {
                  setEditContent(getAIGeneratedMarkdown(localContent));
                }
              }}
              placeholder="Edit your llms.txt content here..."
            />
          </div>
        </div>
      ) : (
        getCurrentContent() && (
          <MarkdownPreview 
            content={getCurrentContent()!} 
            title={viewMode}
            onDownload={() => handleDownload(viewMode)}
            onEdit={() => setViewMode('edit')}
          />
        )
      )}
    </div>
  );
}