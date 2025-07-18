'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface DomainStatus {
  id: number;
  domain: string;
  hasLlmsTxt: boolean;
  lastChecked: string;
  createdAt: string;
}

export function DomainStatusList() {
  const [domains, setDomains] = useState<DomainStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    fetchDomainStatus();
  }, []);

  const fetchDomainStatus = async () => {
    try {
      const response = await fetch('/api/domain-status');
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains);
        setNeedsUpdate(data.needsUpdate);
      }
    } catch (error) {
      console.error('Error fetching domain status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkDomains = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/check-domains');
      if (response.ok) {
        // Refresh the domain status after checking
        await fetchDomainStatus();
      }
    } catch (error) {
      console.error('Error checking domains:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never checked';
    return new Date(dateString).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Domain Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading domain status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (domains.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Domain Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No domains have been processed yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Domain Status</CardTitle>
          <Button
            onClick={checkDomains}
            disabled={isChecking}
            variant="outline"
            size="sm"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Status
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Domains that have generated llms.txt files and their deployment status
        </p>
      </CardHeader>
      <CardContent>
        {needsUpdate && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              Some domains haven't been checked recently. Click "Check Status" to update.
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          {domains.map((domain, index) => (
            <div
              key={domain.id > 0 ? domain.id : `domain-${index}`}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    domain.hasLlmsTxt ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  title={domain.hasLlmsTxt ? 'llms.txt deployed' : 'llms.txt not found'}
                />
                <div>
                  <a
                    href={`https://${domain.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-blue-600 transition-colors"
                  >
                    {domain.domain}
                  </a>
                  {domain.hasLlmsTxt && (
                    <a
                      href={`https://${domain.domain}/llms.txt`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      (view llms.txt)
                    </a>
                  )}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Last checked: {formatDate(domain.lastChecked)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>llms.txt deployed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>llms.txt not found</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}