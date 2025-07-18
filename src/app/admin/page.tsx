'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface CrawlResult {
  id: number;
  url: string;
  ipAddress: string;
  createdAt: string;
  llmsTxt: string;
  llmsFullTxt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [crawlResults, setCrawlResults] = useState<CrawlResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCrawls: 0,
    todayCrawls: 0,
    uniqueIPs: 0,
    uniqueUrls: 0,
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/admin/login');
      return;
    }

    fetchCrawlResults();
  }, [session, status, router]);

  const fetchCrawlResults = async () => {
    try {
      const response = await fetch('/api/admin/crawl-results');
      if (response.ok) {
        const data = await response.json();
        setCrawlResults(data.results);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching crawl results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-CH');
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen py-8" style={{ background: 'linear-gradient(to bottom right, #E6F9F9, #F9FAFB, #B3F0F0)' }}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome, {session.user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="w-10 h-10 rounded-full border-2 border-gray-200"
                  />
                )}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">{session.user?.name}</p>
                  <p className="text-xs text-gray-500">{session.user?.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Back to Generator
                </Button>
                <Button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Crawls</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.totalCrawls}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Today&apos;s Crawls</h3>
            <p className="text-3xl font-bold text-green-600">{stats.todayCrawls}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Unique IPs</h3>
            <p className="text-3xl font-bold text-purple-600">{stats.uniqueIPs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Unique URLs</h3>
            <p className="text-3xl font-bold text-orange-600">{stats.uniqueUrls}</p>
          </div>
        </div>

        {/* Crawl Results Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">Recent Crawl Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {crawlResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {truncateUrl(result.url)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{result.ipAddress}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(result.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(result.llmsTxt)}`, '_blank')}
                        variant="outline"
                        size="sm"
                        className="mr-2"
                      >
                        View llms.txt
                      </Button>
                      <Button
                        onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(result.llmsFullTxt)}`, '_blank')}
                        variant="outline"
                        size="sm"
                      >
                        View Full
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}