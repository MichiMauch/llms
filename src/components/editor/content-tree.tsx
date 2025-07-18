'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LlmsTxtContent, ProcessedPage } from '@/types';
import { ChevronDown, ChevronRight, ExternalLink, Edit, Check, X, GripVertical } from 'lucide-react';

interface ContentTreeProps {
  content: LlmsTxtContent;
  onContentChange: (content: LlmsTxtContent) => void;
}

interface PageItemProps {
  page: ProcessedPage;
  onUpdate: (page: ProcessedPage) => void;
  onDelete: (page: ProcessedPage) => void;
}

function PageItem({ page, onUpdate, onDelete }: PageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);

  const handleSave = () => {
    onUpdate({ ...page, title: editTitle });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(page.title);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow">
      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
      
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="font-medium truncate">{page.title}</div>
            <div className="text-sm text-muted-foreground">
              {page.category} • {page.wordCount} words • Importance: {Math.round(page.importance * 100)}%
            </div>
            <div className="text-xs text-muted-foreground truncate">{page.url}</div>
          </>
        )}
      </div>

      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => window.open(page.url, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(page)}
          className="text-red-500 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  description: string;
  pages: ProcessedPage[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdatePage: (oldPage: ProcessedPage, newPage: ProcessedPage) => void;
  onDeletePage: (page: ProcessedPage) => void;
  color: string;
}

function Section({ title, description, pages, isExpanded, onToggle, onUpdatePage, onDeletePage, color }: SectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle 
          className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <div className={`w-3 h-3 rounded-full ${color}`} />
          {title}
          <span className="text-sm text-muted-foreground ml-auto">
            ({pages.length} pages)
          </span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          {pages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pages in this section
            </div>
          ) : (
            <div className="space-y-2">
              {pages.map((page, index) => (
                <PageItem
                  key={`${page.url}-${index}`}
                  page={page}
                  onUpdate={(newPage) => onUpdatePage(page, newPage)}
                  onDelete={onDeletePage}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function ContentTree({ content, onContentChange }: ContentTreeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updatePage = (oldPage: ProcessedPage, newPage: ProcessedPage) => {
    const newPages = [...content.structure.pages];
    const index = newPages.findIndex(p => p.url === oldPage.url);
    
    if (index !== -1) {
      newPages[index] = newPage;
      
      onContentChange({
        ...content,
        structure: {
          pages: newPages
        },
      });
    }
  };

  const deletePage = (page: ProcessedPage) => {
    const newPages = content.structure.pages.filter(p => p.url !== page.url);
    
    onContentChange({
      ...content,
      structure: {
        pages: newPages
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Content Structure</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review and customize your page content. You can edit page titles, 
            remove unwanted pages, and reorder by dragging.
          </p>
        </CardHeader>
      </Card>

      <Section
        title="All Pages"
        description="All pages from your website crawl."
        pages={content.structure.pages}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        onUpdatePage={updatePage}
        onDeletePage={deletePage}
        color="bg-blue-500"
      />
    </div>
  );
}