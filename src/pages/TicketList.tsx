import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import { tagsApi } from '../api/tags';
import { useToastStore } from '../store/toast';
import apiClient from '../api/client';
import { TicketListSkeleton } from '../components/LoadingSpinner';
import { Avatar } from '../components/Avatar';
import type { Ticket, TicketStatus, Priority, Tag } from '../types';
import { format } from 'date-fns';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const TicketList = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    issue_type: '',
    tag_id: '',
    search: '',
  });
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    loadDropdowns();
    loadTickets();
  }, []);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  useEffect(() => {
    loadTickets();
  }, [filters, currentPage]);

  const loadDropdowns = async () => {
    try {
      const [statusData, priorityData, typeData, tagsData] = await Promise.all([
        ticketsApi.getStatuses(),
        ticketsApi.getPriorities(),
        ticketsApi.getIssueTypes(),
        tagsApi.getTags(),
      ]);
      setStatuses(statusData || []);
      setPriorities(priorityData || []);
      setIssueTypes(typeData || []);
      setTags(tagsData || []);
    } catch (error) {
      console.error('Failed to load dropdowns:', error);
      showToast('Failed to load filter options. Please refresh the page.', 'error');
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * pageSize;
      const data = await ticketsApi.getTickets({
        ...filters,
        tag_id: filters.tag_id ? Number(filters.tag_id) : undefined,
        skip,
        limit: pageSize,
      });
      setTickets(data.items);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      LOW: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600',
      MEDIUM: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      HIGH: 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 dark:from-orange-900/40 dark:to-orange-800/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      CRITICAL: 'bg-gradient-to-br from-red-100 to-red-200 text-red-700 dark:from-red-900/40 dark:to-red-800/40 dark:text-red-300 border-red-300 dark:border-red-700',
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getStatusColor = (status: TicketStatus) => {
    const colors = {
      OPEN: 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 dark:from-blue-900/40 dark:to-blue-800/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      IN_PROGRESS: 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700 dark:from-purple-900/40 dark:to-purple-800/40 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      REVIEW: 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700 dark:from-yellow-900/40 dark:to-yellow-800/40 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      IN_TESTING: 'bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 dark:from-indigo-900/40 dark:to-indigo-800/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
      BLOCKED: 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600',
      DONE: 'bg-gradient-to-br from-green-100 to-green-200 text-green-700 dark:from-green-900/40 dark:to-green-800/40 dark:text-green-300 border-green-300 dark:border-green-700',
    };
    return colors[status] || colors.OPEN;
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.issue_type) params.append('issue_type', filters.issue_type);

      const response = await apiClient.get(`/api/v1/export/tickets/csv?${params.toString()}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets_export_${format(new Date(), 'yyyyMMdd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast('Tickets exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export tickets:', error);
      showToast('Failed to export tickets', 'error');
    } finally {
      setExporting(false);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tickets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and track all your tickets in one place
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </>
            )}
          </button>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Ticket
          </Link>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded-md">
                {activeFiltersCount}
              </span>
            )}
          </h2>
          {activeFiltersCount > 0 && (
            <button
              onClick={() => setFilters({ status: '', priority: '', issue_type: '', tag_id: '', search: '' })}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Search Tickets
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title, description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full px-4 py-3.5 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 hover:border-primary-300 dark:hover:border-primary-600"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 cursor-pointer"
            >
              <option value="">All Priorities</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={filters.issue_type}
              onChange={(e) => setFilters({ ...filters, issue_type: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 cursor-pointer"
            >
              <option value="">All Types</option>
              {issueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Tag
          </label>
          <select
            value={filters.tag_id}
            onChange={(e) => setFilters({ ...filters, tag_id: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 cursor-pointer"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <TicketListSkeleton />
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16">
          <div className="text-center">
            <svg className="w-20 h-20 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tickets found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {activeFiltersCount > 0
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first ticket.'}
            </p>
            {activeFiltersCount === 0 && (
              <Link
                to="/tickets/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Ticket
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow duration-200 hover:shadow-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50">
                  <tr>
                    {['ID', 'Title', 'Tags', 'Type', 'Priority', 'Status', 'Assigned To', 'Created'].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {tickets.map((ticket, index) => (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="group hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent dark:hover:from-primary-900/10 transition-all duration-300 cursor-pointer"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors duration-200 group-hover:scale-110 inline-block"
                        >
                          #{ticket.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 line-clamp-2"
                        >
                          {ticket.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1.5">
                          {ticket.tags && ticket.tags.length > 0 ? (
                            ticket.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 hover:scale-105"
                                style={{
                                  backgroundColor: `${tag.color}15`,
                                  color: tag.color,
                                  borderColor: `${tag.color}40`,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {ticket.issue_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getPriorityColor(ticket.priority)} transition-all duration-200 group-hover:scale-110`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(ticket.status)} transition-all duration-200 group-hover:scale-110`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                        {ticket.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar user={ticket.assignee} size="sm" showOnlineStatus={true} />
                            <span className="text-gray-900 dark:text-gray-100">{ticket.assignee.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                        <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Showing <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * pageSize, total)}</span> of{' '}
                <span className="font-bold text-gray-900 dark:text-white">{total}</span> tickets
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-400 transition-all duration-200 disabled:hover:bg-transparent"
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-xl">
                  Page {currentPage} of {Math.ceil(total / pageSize)}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(total / pageSize), prev + 1))}
                  disabled={currentPage >= Math.ceil(total / pageSize)}
                  className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-400 transition-all duration-200 disabled:hover:bg-transparent"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
