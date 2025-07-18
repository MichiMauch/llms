'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { Plus, Minus } from 'lucide-react';

interface AdvancedOptionsProps {
  maxDepth: number;
  onMaxDepthChange: (depth: number) => void;
  includePatterns: string[];
  onIncludePatternsChange: (patterns: string[]) => void;
  excludePatterns: string[];
  onExcludePatternsChange: (patterns: string[]) => void;
  respectRobotsTxt: boolean;
  onRespectRobotsTxtChange: (respect: boolean) => void;
}

export function AdvancedOptions({
  maxDepth,
  onMaxDepthChange,
  includePatterns,
  onIncludePatternsChange,
  excludePatterns,
  onExcludePatternsChange,
  respectRobotsTxt,
  onRespectRobotsTxtChange,
}: AdvancedOptionsProps) {
  const [newIncludePattern, setNewIncludePattern] = useState('');
  const [newExcludePattern, setNewExcludePattern] = useState('');

  const addIncludePattern = () => {
    if (newIncludePattern.trim()) {
      onIncludePatternsChange([...includePatterns, newIncludePattern.trim()]);
      setNewIncludePattern('');
    }
  };

  const removeIncludePattern = (index: number) => {
    onIncludePatternsChange(includePatterns.filter((_, i) => i !== index));
  };

  const addExcludePattern = () => {
    if (newExcludePattern.trim()) {
      onExcludePatternsChange([...excludePatterns, newExcludePattern.trim()]);
      setNewExcludePattern('');
    }
  };

  const removeExcludePattern = (index: number) => {
    onExcludePatternsChange(excludePatterns.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Crawling Options</CardTitle>
        <CardDescription>
          Customize how the crawler behaves when processing your website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">
            Maximum Crawl Depth: {maxDepth}
          </label>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-5"
            value={[maxDepth]}
            onValueChange={([value]) => onMaxDepthChange(value)}
            max={10}
            min={1}
            step={1}
          >
            <Slider.Track className="bg-blackA7 relative grow rounded-full h-[3px] bg-gray-200">
              <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-5 h-5 bg-blue-500 shadow-lg rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Maximum crawl depth"
            />
          </Slider.Root>
          <p className="text-xs text-muted-foreground">
            Controls how many levels deep the crawler will follow links (1-10)
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Include Patterns</label>
          <div className="flex gap-2">
            <Input
              placeholder="/docs/, /api/, *.pdf"
              value={newIncludePattern}
              onChange={(e) => setNewIncludePattern(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIncludePattern()}
            />
            <Button type="button" size="sm" onClick={addIncludePattern}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {includePatterns.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {includePatterns.map((pattern, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                >
                  {pattern}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeIncludePattern(index)}
                    className="h-4 w-4 p-0 hover:bg-green-200"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Only crawl URLs matching these patterns (optional)
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Exclude Patterns</label>
          <div className="flex gap-2">
            <Input
              placeholder="/admin/, /login/, *.zip"
              value={newExcludePattern}
              onChange={(e) => setNewExcludePattern(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExcludePattern()}
            />
            <Button type="button" size="sm" onClick={addExcludePattern}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {excludePatterns.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {excludePatterns.map((pattern, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded text-sm"
                >
                  {pattern}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeExcludePattern(index)}
                    className="h-4 w-4 p-0 hover:bg-red-200"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Skip URLs matching these patterns (optional)
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium">Respect robots.txt</label>
            <p className="text-xs text-muted-foreground">
              Follow the website&apos;s crawling guidelines
            </p>
          </div>
          <Switch.Root
            className="w-11 h-6 bg-gray-200 rounded-full relative data-[state=checked]:bg-blue-500 outline-none cursor-pointer"
            checked={respectRobotsTxt}
            onCheckedChange={onRespectRobotsTxtChange}
          >
            <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
          </Switch.Root>
        </div>
      </CardContent>
    </Card>
  );
}