import { useEffect, useState } from 'react';
import { tagsApi } from '../api/tags';
import type { TagStatistics as TagStatisticsType } from '../types';
import { useToastStore } from '../store/toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { extractErrorMessage } from '../utils/errorHandler';

export const TagStatistics = () => {
  const { showToast } = useToastStore();
  const [statistics, setStatistics] = useState<TagStatisticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await tagsApi.getTagStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to load tag statistics:', error);
      showToast(extractErrorMessage(error, 'Failed to load tag statistics'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tag Statistics</h1>
        <p className="text-gray-600 dark:text-gray-400">Analytics and usage statistics for tags</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Tags</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{statistics.total_tags}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Tickets</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{statistics.total_tickets}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tagged Tickets</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{statistics.tagged_tickets}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Untagged Tickets</h3>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{statistics.untagged_tickets}</p>
        </div>
      </div>

      {/* Tag Statistics Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tag Usage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ticket Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usage %</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {statistics.tag_statistics.map((tagStat) => {
                const usagePercent = statistics.total_tickets > 0 ? ((tagStat.ticket_count / statistics.total_tickets) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={tagStat.tag_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tagStat.tag_color }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{tagStat.tag_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{tagStat.ticket_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${usagePercent}%`,
                              backgroundColor: tagStat.tag_color,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{usagePercent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

