import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import { tagsApi } from '../api/tags';
import { usersApi } from '../api/users';
import { savedFiltersApi, type SavedFilter } from '../api/savedFilters';
import { useToastStore } from '../store/toast';
import { useAuthStore } from '../store/auth';
import apiClient from '../api/client';
import { TicketListSkeleton } from '../components/LoadingSpinner';
import { Avatar } from '../components/Avatar';
import type { Ticket, TicketStatus, Priority, Tag, User } from '../types';
import { format } from 'date-fns';
import { PAGINATION_CONFIG, DEBOUNCE_CONFIG, UI_CONFIG } from '../config/constants';
import { extractErrorMessage } from '../utils/errorHandler';

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
  const { user: currentUser } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(PAGINATION_CONFIG.DEFAULT_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    issue_type: '',
    tag_id: '',
    search: '',
    created_by_id: '',
    created_from: '',
    created_to: '',
  });
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set());
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, DEBOUNCE_CONFIG.SEARCH_DELAY);

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
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        ticketsApi.getStatuses(),
        ticketsApi.getPriorities(),
        ticketsApi.getIssueTypes(),
        tagsApi.getTags(),
        usersApi.getUsersDropdown(),
        savedFiltersApi.getSavedFilters(true),
      ]);
      
      // Process results individually
      const [statusResult, priorityResult, typeResult, tagsResult, usersResult, savedFiltersResult] = results;
      
      if (statusResult.status === 'fulfilled') {
        setStatuses(statusResult.value || []);
      } else {
        console.error('Failed to load statuses:', statusResult.reason);
      }
      
      if (priorityResult.status === 'fulfilled') {
        setPriorities(priorityResult.value || []);
      } else {
        console.error('Failed to load priorities:', priorityResult.reason);
      }
      
      if (typeResult.status === 'fulfilled') {
        setIssueTypes(typeResult.value || []);
      } else {
        console.error('Failed to load issue types:', typeResult.reason);
      }
      
      if (tagsResult.status === 'fulfilled') {
        setTags(tagsResult.value || []);
      } else {
        console.error('Failed to load tags:', tagsResult.reason);
        // Only show toast for critical failures, not for optional data
      }
      
      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value || []);
      } else {
        console.error('Failed to load users:', usersResult.reason);
      }
      
      if (savedFiltersResult.status === 'fulfilled') {
        setSavedFilters(savedFiltersResult.value || []);
      } else {
        console.error('Failed to load saved filters:', savedFiltersResult.reason);
        // Saved filters are optional, don't show error
      }
      
      // Only show a general error if multiple critical endpoints failed
      const criticalFailures = [statusResult, priorityResult, typeResult].filter(r => r.status === 'rejected');
      if (criticalFailures.length > 0) {
        const errorMessage = extractErrorMessage(criticalFailures[0].reason, 'Failed to load some filter options');
        showToast(errorMessage, 'error');
      }
    } catch (error) {
      // Fallback for unexpected errors
      console.error('Unexpected error loading dropdowns:', error);
      const errorMessage = extractErrorMessage(error, 'Failed to load filter options. Please refresh the page.');
      showToast(errorMessage, 'error');
    }
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      const skip = (currentPage - 1) * pageSize;
      const data = await ticketsApi.getTickets({
        ...filters,
        tag_id: filters.tag_id ? Number(filters.tag_id) : undefined,
        created_by_id: filters.created_by_id ? Number(filters.created_by_id) : undefined,
        created_from: filters.created_from || undefined,
        created_to: filters.created_to || undefined,
        skip,
        limit: pageSize,
      });
      setTickets(data.items);
      setTotal(data.total);
      setSelectedTickets(new Set()); // Clear selection when filters change
    } catch (error) {
      console.error('Failed to load tickets:', error);
      const errorMessage = extractErrorMessage(error, 'Failed to load tickets');
      showToast(errorMessage, 'error');
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
      const errorMessage = extractErrorMessage(error, 'Failed to export tickets');
      showToast(errorMessage, 'error');
    } finally {
      setExporting(false);
    }
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;
  const canPerformBulkActions = currentUser?.system_role === 'ADMIN' || currentUser?.system_role === 'MANAGER';

  const handleSelectTicket = (ticketId: number, checked: boolean) => {
    setSelectedTickets((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(ticketId);
      } else {
        newSet.delete(ticketId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(new Set(tickets.map(t => t.id)));
      setShowBulkActions(true);
    } else {
      setSelectedTickets(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkUpdate = async (updates: { status?: string; priority?: string; assigned_to_id?: number | null; project_id?: number | null }) => {
    if (selectedTickets.size === 0) return;
    try {
      setBulkActionLoading(true);
      const result = await ticketsApi.bulkUpdate(Array.from(selectedTickets), updates);
      showToast(`Successfully updated ${result.updated_count} ticket(s)`, 'success');
      if (result.errors && result.errors.length > 0) {
        showToast(`Some errors occurred: ${result.errors.join(', ')}`, 'warning');
      }
      setSelectedTickets(new Set());
      setShowBulkActions(false);
      loadTickets();
    } catch (error) {
      console.error('Failed to bulk update tickets:', error);
      showToast(extractErrorMessage(error, 'Failed to update tickets'), 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.size === 0 || !confirm(`Are you sure you want to delete ${selectedTickets.size} ticket(s)?`)) return;
    try {
      setBulkActionLoading(true);
      const result = await ticketsApi.bulkDelete(Array.from(selectedTickets));
      showToast(`Successfully deleted ${result.deleted_count} ticket(s)`, 'success');
      setSelectedTickets(new Set());
      setShowBulkActions(false);
      loadTickets();
    } catch (error) {
      console.error('Failed to bulk delete tickets:', error);
      showToast(extractErrorMessage(error, 'Failed to delete tickets'), 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleLoadSavedFilter = (savedFilter: SavedFilter) => {
    setFilters({
      status: savedFilter.filters.status || '',
      priority: savedFilter.filters.priority || '',
      issue_type: savedFilter.filters.issue_type || '',
      tag_id: savedFilter.filters.tag_id || '',
      search: savedFilter.filters.search || '',
      created_by_id: '',
      created_from: '',
      created_to: '',
    });
    setSearchInput(savedFilter.filters.search || '');
    setCurrentPage(1);
  };

  const handleSaveFilter = async () => {
    if (!saveFilterName.trim()) {
      showToast('Please enter a filter name', 'error');
      return;
    }
    try {
      await savedFiltersApi.createSavedFilter({
        name: saveFilterName.trim(),
        filters: {
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          issue_type: filters.issue_type || undefined,
          tag_id: filters.tag_id || undefined,
          search: filters.search || undefined,
        },
      });
      showToast('Filter saved successfully', 'success');
      setShowSaveFilterModal(false);
      setSaveFilterName('');
      loadDropdowns();
    } catch (error) {
      console.error('Failed to save filter:', error);
      showToast(extractErrorMessage(error, 'Failed to save filter'), 'error');
    }
  };

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
          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setFilters({ status: '', priority: '', issue_type: '', tag_id: '', search: '', created_by_id: '', created_from: '', created_to: '' });
                  setSearchInput('');
                }}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {showAdvancedSearch ? 'Hide' : 'Advanced'} Search
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSaveFilterModal(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Save Filter
              </button>
              {savedFilters.length > 0 && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 max-h-96 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">Saved Filters</div>
                    {savedFilters.map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => handleLoadSavedFilter(filter)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      >
                        {filter.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
        {showAdvancedSearch && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Created By
              </label>
              <select
                value={filters.created_by_id}
                onChange={(e) => setFilters({ ...filters, created_by_id: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 cursor-pointer"
              >
                <option value="">All Creators</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Created From
              </label>
              <input
                type="date"
                value={filters.created_from}
                onChange={(e) => setFilters({ ...filters, created_from: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Created To
              </label>
              <input
                type="date"
                value={filters.created_to}
                onChange={(e) => setFilters({ ...filters, created_to: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {showBulkActions && canPerformBulkActions && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              {selectedTickets.size} ticket(s) selected
            </span>
            <button
              onClick={() => {
                setSelectedTickets(new Set());
                setShowBulkActions(false);
              }}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkUpdate({ status: e.target.value });
                  e.target.value = '';
                }
              }}
              disabled={bulkActionLoading}
              className="px-3 py-2 border border-primary-300 dark:border-primary-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Change Status...</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkUpdate({ priority: e.target.value });
                  e.target.value = '';
                }
              }}
              disabled={bulkActionLoading}
              className="px-3 py-2 border border-primary-300 dark:border-primary-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Change Priority...</option>
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
            <select
              onChange={(e) => {
                const userId = e.target.value ? Number(e.target.value) : null;
                if (userId !== null || e.target.value === 'unassign') {
                  handleBulkUpdate({ assigned_to_id: e.target.value === 'unassign' ? null : userId });
                  e.target.value = '';
                }
              }}
              disabled={bulkActionLoading}
              className="px-3 py-2 border border-primary-300 dark:border-primary-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="">Assign To...</option>
              <option value="unassign">Unassign</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkDelete}
              disabled={bulkActionLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Save Filter Modal */}
      {showSaveFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Save Filter</h3>
            <input
              type="text"
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              placeholder="Filter name"
              className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSaveFilterModal(false);
                  setSaveFilterName('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilter}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
                    {canPerformBulkActions && (
                      <th className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTickets.size === tickets.length && tickets.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </th>
                    )}
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
                      className={`group hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent dark:hover:from-primary-900/10 transition-all duration-300 cursor-pointer ${selectedTickets.has(ticket.id) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                      style={{ animationDelay: `${index * UI_CONFIG.ANIMATION_DELAY_BASE}ms` }}
                    >
                      {canPerformBulkActions && (
                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTickets.has(ticket.id)}
                            onChange={(e) => handleSelectTicket(ticket.id, e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </td>
                      )}
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
