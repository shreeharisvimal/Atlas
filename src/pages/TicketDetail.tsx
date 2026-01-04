import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import { commentsApi } from '../api/comments';
import { ticketHistoryApi } from '../api/ticketHistory';
import { attachmentsApi } from '../api/attachments';
import { useToastStore } from '../store/toast';
import { useAuthStore } from '../store/auth';
import { LoadingSpinner, TicketDetailSkeleton } from '../components/LoadingSpinner';
import { Avatar } from '../components/Avatar';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { AttachmentUpload } from '../components/AttachmentUpload';
import type { Ticket, Comment, TicketHistory, TicketStatus, Priority, IssueType, User, Attachment } from '../types';
import { format, isSameDay, startOfDay } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToastStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<TicketHistory[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '' as TicketStatus,
    priority: '' as Priority,
    issue_type: '' as IssueType,
    assigned_to_id: null as number | null,
  });
  const [statuses, setStatuses] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const historyInitialized = useRef(false);

  useEffect(() => {
    if (id) {
      // Reset history initialization when ticket changes
      historyInitialized.current = false;
      setExpandedGroups(new Set());
      loadTicket();
      loadComments();
      loadHistory();
      loadAttachments();
      loadDropdowns();
    }
  }, [id]);

  const loadTicket = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ticketsApi.getTicket(parseInt(id));
      setTicket(data);
      setEditData({
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        issue_type: data.issue_type,
        assigned_to_id: data.assigned_to_id,
      });
    } catch (error) {
      console.error('Failed to load ticket:', error);
      showToast('Failed to load ticket', 'error');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;
    try {
      const data = await commentsApi.getTicketComments(parseInt(id));
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadHistory = async () => {
    if (!id) return;
    try {
      const data = await ticketHistoryApi.getTicketHistory(parseInt(id));
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadAttachments = async () => {
    if (!id) return;
    try {
      const data = await attachmentsApi.getTicketAttachments(parseInt(id));
      setAttachments(data);
    } catch (error: any) {
      console.error('Failed to load attachments:', error);
      // Don't show toast for 404 or permission errors - just log silently
      // Only show toast for unexpected errors
      if (error.response?.status !== 404 && error.response?.status !== 403) {
        showToast('Failed to load attachments', 'error');
      }
    }
  };

  const loadDropdowns = async () => {
    try {
      const [statusesData, prioritiesData, typesData, usersData] = await Promise.all([
        ticketsApi.getStatuses(),
        ticketsApi.getPriorities(),
        ticketsApi.getIssueTypes(),
        ticketsApi.getTickets({ limit: 1 }).then(() => []), // We'll need a users API call
      ]);
      setStatuses(statusesData);
      setPriorities(prioritiesData);
      setIssueTypes(typesData);
      // Load users separately
      try {
        const { usersApi } = await import('../api/users');
        const usersList = await usersApi.getUsersDropdown();
        setUsers(usersList);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    } catch (error) {
      console.error('Failed to load dropdowns:', error);
    }
  };

  const handleUpdate = async () => {
    if (!id || !ticket) return;
    try {
      setSaving(true);
      const updated = await ticketsApi.updateTicket(parseInt(id), {
        title: editData.title,
        description: editData.description,
        status: editData.status,
        priority: editData.priority,
        issue_type: editData.issue_type,
        assigned_to_id: editData.assigned_to_id,
      });
      setTicket(updated);
      setEditing(false);
      showToast('Ticket updated successfully', 'success');
      loadHistory();
    } catch (error: any) {
      console.error('Failed to update ticket:', error);
      // Extract error message from backend response
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update ticket';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!id || !ticket) return;
    
    // Optimistic update for instant feedback
    const oldStatus = ticket.status;
    setTicket({ ...ticket, status: newStatus });
    setEditData({ ...editData, status: newStatus });
    
    try {
      setSaving(true);
      const updated = await ticketsApi.updateTicketStatus(parseInt(id), { status: newStatus });
      setTicket(updated);
      setEditData({ ...editData, status: newStatus });
      
      const oldStatusLabel = oldStatus.replace('_', ' ');
      const newStatusLabel = newStatus.replace('_', ' ');
      showToast(`Status changed from ${oldStatusLabel} to ${newStatusLabel}`, 'success');
      loadHistory();
    } catch (error: any) {
      // Revert optimistic update on error
      setTicket({ ...ticket, status: oldStatus });
      setEditData({ ...editData, status: oldStatus });
      
      console.error('Failed to update status:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update status';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const newComment = await commentsApi.createComment({
        ticket_id: parseInt(id),
        content: commentText.trim(),
      });
      setComments([...comments, newComment]);
      setCommentText('');
      showToast('Comment added successfully', 'success');
      loadHistory();
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      // Extract error message from backend response
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to add comment';
      showToast(errorMessage, 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await ticketsApi.deleteTicket(parseInt(id));
      showToast('Ticket deleted successfully', 'success');
      navigate('/tickets');
    } catch (error: any) {
      console.error('Failed to delete ticket:', error);
      // Extract error message from backend response
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to delete ticket';
      showToast(errorMessage, 'error');
    }
  };

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
      MEDIUM: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
      CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700',
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getStatusConfig = (status: TicketStatus) => {
    const configs = {
      OPEN: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/40',
        text: 'text-blue-700 dark:text-blue-200',
        border: 'border-blue-300 dark:border-blue-600',
        hover: 'hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/50 dark:hover:to-blue-700/60',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        description: 'New ticket, ready to be worked on',
      },
      IN_PROGRESS: {
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/40',
        text: 'text-purple-700 dark:text-purple-200',
        border: 'border-purple-300 dark:border-purple-600',
        hover: 'hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/50 dark:hover:to-purple-700/60',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        description: 'Currently being worked on',
      },
      REVIEW: {
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/40',
        text: 'text-yellow-700 dark:text-yellow-200',
        border: 'border-yellow-300 dark:border-yellow-600',
        hover: 'hover:from-yellow-100 hover:to-yellow-200 dark:hover:from-yellow-800/50 dark:hover:to-yellow-700/60',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        description: 'Awaiting review and approval',
      },
      IN_TESTING: {
        bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/40',
        text: 'text-indigo-700 dark:text-indigo-200',
        border: 'border-indigo-300 dark:border-indigo-600',
        hover: 'hover:from-indigo-100 hover:to-indigo-200 dark:hover:from-indigo-800/50 dark:hover:to-indigo-700/60',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        description: 'In testing phase',
      },
      BLOCKED: {
        bg: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/60',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
        hover: 'hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/70 dark:hover:to-gray-600/80',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ),
        description: 'Blocked by dependencies or issues',
      },
      DONE: {
        bg: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/40',
        text: 'text-green-700 dark:text-green-200',
        border: 'border-green-300 dark:border-green-600',
        hover: 'hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/50 dark:hover:to-green-700/60',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        description: 'Completed and ready',
      },
    };
    return configs[status] || configs.OPEN;
  };

  const getStatusColor = (status: TicketStatus) => {
    const config = getStatusConfig(status);
    return `${config.bg} ${config.text} ${config.border}`;
  };

  // Format field name for display
  const formatFieldName = (fieldName: string): string => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Format status value for display (remove underscores, capitalize)
  const formatStatusValue = (value: string): string => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Group history by date and user
  const groupedHistory = useMemo(() => {
    const groups: Record<string, Record<number, TicketHistory[]>> = {};
    
    history.forEach((item) => {
      const date = startOfDay(new Date(item.created_at));
      const dateKey = format(date, 'yyyy-MM-dd');
      const userId = item.user_id;
      
      if (!groups[dateKey]) {
        groups[dateKey] = {};
      }
      if (!groups[dateKey][userId]) {
        groups[dateKey][userId] = [];
      }
      groups[dateKey][userId].push(item);
    });
    
    return groups;
  }, [history]);

  // Get sorted date keys
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedHistory).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedHistory]);

  // Expand most recent date group by default (only once when history first loads)
  useEffect(() => {
    if (sortedDateKeys.length > 0 && !historyInitialized.current && expandedGroups.size === 0) {
      const mostRecentDate = sortedDateKeys[0];
      const userGroups = groupedHistory[mostRecentDate];
      const userIds = Object.keys(userGroups).map(Number);
      const initialExpanded = new Set<string>();
      userIds.forEach((userId) => {
        initialExpanded.add(`${mostRecentDate}-${userId}`);
      });
      setExpandedGroups(initialExpanded);
      historyInitialized.current = true;
    }
    // Reset initialization flag when history changes (new ticket loaded)
    if (history.length === 0) {
      historyInitialized.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.length, sortedDateKeys.length]);

  // Toggle group expansion
  const toggleGroup = (dateKey: string, userId: number) => {
    const groupKey = `${dateKey}-${userId}`;
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Check if group is expanded
  const isGroupExpanded = (dateKey: string, userId: number): boolean => {
    const groupKey = `${dateKey}-${userId}`;
    return expandedGroups.has(groupKey);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ticket Details</h1>
        </div>
        <TicketDetailSkeleton />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Ticket not found</p>
        <Link to="/tickets" className="text-primary-600 dark:text-primary-400 hover:underline mt-4 inline-block">
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/tickets"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Ticket #{ticket.id}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  if (ticket) {
                    setEditData({
                      title: ticket.title,
                      description: ticket.description,
                      status: ticket.status,
                      priority: ticket.priority,
                      issue_type: ticket.issue_type,
                      assigned_to_id: ticket.assigned_to_id,
                    });
                  }
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title and Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {editing ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <MarkdownEditor
                    value={editData.description}
                    onChange={(value) => setEditData({ ...editData, description: value })}
                    placeholder="Enter ticket description..."
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {ticket.title}
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {ticket.description || '*No description provided*'}
                  </ReactMarkdown>
                </div>
              </>
            )}
          </div>

          {/* Attachments Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <AttachmentUpload
              ticketId={parseInt(id!)}
              existingAttachments={attachments}
              onUploadSuccess={(attachment) => {
                setAttachments((prev) => [...prev, attachment]);
                loadHistory();
              }}
              onDeleteSuccess={(attachmentId) => {
                setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
                loadHistory();
              }}
            />
          </div>

          {/* Comments Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="mb-3">
                <MarkdownEditor
                  value={commentText}
                  onChange={setCommentText}
                  placeholder="Add a comment..."
                />
              </div>
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-l-4 border-primary-200 dark:border-primary-800 pl-4 py-2"
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <Avatar user={comment.author} size="sm" showOnlineStatus={true} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {comment.author.full_name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(comment.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="prose dark:prose-invert max-w-none text-sm">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {comment.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Ticket Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Status
                </label>
                {editing ? (
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as TicketStatus })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2">
                    {/* Current Status - Highlighted */}
                    <div className="relative group">
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-sm transition-all duration-300 ${getStatusColor(ticket.status)} ${saving ? 'opacity-75' : ''}`}>
                        <div className="flex-shrink-0">
                          {getStatusConfig(ticket.status).icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">
                            {ticket.status.replace('_', ' ')}
                          </div>
                          <div className="text-xs opacity-75 mt-0.5">
                            {getStatusConfig(ticket.status).description}
                          </div>
                        </div>
                        {saving && (
                          <div className="flex-shrink-0">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Other Status Options */}
                    <div className="grid grid-cols-2 gap-2">
                      {statuses.map((status) => {
                        if (status === ticket.status) return null;
                        const config = getStatusConfig(status as TicketStatus);
                        const isUpdating = saving && editData.status === status;
                        
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status as TicketStatus)}
                            disabled={saving}
                            className={`
                              group relative flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 
                              transition-all duration-200 transform
                              ${config.bg} ${config.text} ${config.border}
                              ${config.hover}
                              ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md active:scale-95'}
                              focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
                            `}
                            title={config.description}
                          >
                            <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                              {config.icon}
                            </div>
                            <span className="text-xs font-medium truncate flex-1 text-left">
                              {status.replace('_', ' ')}
                            </span>
                            {isUpdating && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/20 rounded-lg">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                {editing ? (
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value as Priority })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-md border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                {editing ? (
                  <select
                    value={editData.issue_type}
                    onChange={(e) => setEditData({ ...editData, issue_type: e.target.value as IssueType })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {issueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md">
                    {ticket.issue_type}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assigned To
                </label>
                {editing ? (
                  <select
                    value={editData.assigned_to_id || ''}
                    onChange={(e) => setEditData({ ...editData, assigned_to_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar user={ticket.assignee} size="sm" showOnlineStatus={true} />
                        <span className="text-gray-900 dark:text-white">{ticket.assignee.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Created By
                </label>
                <div className="flex items-center gap-2">
                  <Avatar user={ticket.creator} size="sm" showOnlineStatus={true} />
                  <span className="text-gray-900 dark:text-white">{ticket.creator.full_name}</span>
                </div>
              </div>

              {ticket.tags && ticket.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ticket.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border"
                        style={{
                          backgroundColor: `${tag.color}15`,
                          color: tag.color,
                          borderColor: `${tag.color}40`,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Activity History
                </h3>
              </div>
              <div className="space-y-6">
                {sortedDateKeys.map((dateKey) => {
                  const date = new Date(dateKey);
                  const userGroups = groupedHistory[dateKey];
                  const userIds = Object.keys(userGroups).map(Number).sort((a, b) => {
                    // Sort by most recent activity first
                    const aLatest = userGroups[a][0]?.created_at || '';
                    const bLatest = userGroups[b][0]?.created_at || '';
                    return new Date(bLatest).getTime() - new Date(aLatest).getTime();
                  });

                  return (
                    <div key={dateKey} className="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 pb-6 last:pb-0">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                          <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {format(date, 'MMMM d, yyyy')}
                          </h4>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {userIds.map((userId) => {
                          const items = userGroups[userId];
                          const user = items[0]?.user;
                          const groupKey = `${dateKey}-${userId}`;
                          const isExpanded = isGroupExpanded(dateKey, userId);
                          const itemCount = items.length;

                          return (
                            <div key={groupKey} className="border border-gray-200/60 dark:border-gray-700/50 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 shadow-sm hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-600/50 transition-all duration-300 group">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleGroup(dateKey, userId);
                                }}
                                className="w-full flex items-center justify-between p-4 hover:bg-white/50 dark:hover:bg-gray-700/30 transition-all duration-200"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="relative">
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                                    </div>
                                    <Avatar user={user} size="sm" showOnlineStatus={false} />
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                                    <span className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                                      {user?.full_name || 'Unknown User'}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/70 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600/50">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      {itemCount} {itemCount === 1 ? 'change' : 'changes'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 ${
                                    isExpanded 
                                      ? 'text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800' 
                                      : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/70 border border-gray-200 dark:border-gray-600/50'
                                  }`}>
                                    {isExpanded ? 'Expanded' : 'Collapsed'}
                                  </span>
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                    isExpanded 
                                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' 
                                      : 'bg-gray-100 dark:bg-gray-700/70 text-gray-500 dark:text-gray-400'
                                  }`}>
                                    <svg
                                      className={`w-4 h-4 transition-transform duration-200 ${
                                        isExpanded ? 'transform rotate-180' : ''
                                      }`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </button>
                              {isExpanded && (
                                <div className="border-t border-gray-100 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/30 to-transparent dark:from-gray-900/20 dark:to-transparent overflow-visible">
                                  <div className="relative py-4 pl-14 pr-6 overflow-visible">
                                    {/* Enhanced Timeline line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-400 to-primary-200 dark:from-primary-700 dark:via-primary-500 dark:to-primary-700"></div>
                                    
                                    <div className="space-y-3">
                                      {items.map((item) => {
                                        const fieldName = formatFieldName(item.field_name);
                                        const isStatusChange = item.field_name === 'status';
                                        const time = format(new Date(item.created_at), 'HH:mm');
                                        
                                        return (
                                          <div 
                                            key={item.id} 
                                            className="relative group"
                                          >
                                            {/* Enhanced Timeline dot */}
                                            <div className="absolute -left-10 top-2.5 flex items-center justify-center">
                                              <div className="absolute w-5 h-5 rounded-full bg-primary-400/20 dark:bg-primary-500/20 group-hover:bg-primary-400/30 dark:group-hover:bg-primary-500/30 transition-all duration-200"></div>
                                              <div className="relative w-3.5 h-3.5 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 ring-2 ring-white dark:ring-gray-800 group-hover:ring-primary-200 dark:group-hover:ring-primary-600 group-hover:scale-110 transition-all duration-200 shadow-sm"></div>
                                            </div>
                                            
                                            {/* Enhanced Content card */}
                                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/60 p-4 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-300 hover:-translate-y-0.5 overflow-visible">
                                              {item.change_type === 'UPDATE' && isStatusChange && item.old_value && item.new_value ? (
                                                <div className="w-full">
                                                  {/* Desktop & Tablet Layout */}
                                                  <div className="hidden sm:flex items-end gap-2.5 w-full">
                                                    {/* From Section */}
                                                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                                                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                                        From
                                                      </span>
                                                      <span className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition-all whitespace-nowrap ${getStatusColor(item.old_value as TicketStatus)}`}>
                                                        {formatStatusValue(item.old_value)}
                                                      </span>
                                                    </div>
                                                    
                                                    {/* Arrow */}
                                                    <div className="flex items-center justify-center flex-shrink-0 pb-1">
                                                      <div className="flex items-center gap-0.5">
                                                        <div className="w-2.5 h-0.5 bg-primary-400 dark:bg-primary-500 rounded-full"></div>
                                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 dark:bg-primary-600 shadow-sm">
                                                          <svg className="w-3 h-3 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                          </svg>
                                                        </div>
                                                        <div className="w-2.5 h-0.5 bg-primary-400 dark:bg-primary-500 rounded-full"></div>
                                                      </div>
                                                    </div>
                                                    
                                                    {/* To Section */}
                                                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                                                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                                        To
                                                      </span>
                                                      <span className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition-all shadow-sm ring-1 ring-primary-200 dark:ring-primary-800 whitespace-nowrap ${getStatusColor(item.new_value as TicketStatus)}`}>
                                                        {formatStatusValue(item.new_value)}
                                                      </span>
                                                    </div>
                                                    
                                                    {/* Timestamp - Always Visible */}
                                                    <div className="flex items-center gap-1.5 flex-shrink-0 pb-1 ml-2">
                                                      <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                      </svg>
                                                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                        {time}
                                                      </span>
                                                    </div>
                                                  </div>
                                                      
                                                      {/* Mobile Layout */}
                                                      <div className="flex sm:hidden flex-col gap-2.5">
                                                        <div className="flex items-center justify-between">
                                                          {/* From Status */}
                                                          <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                                              From
                                                            </span>
                                                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold border transition-all whitespace-nowrap ${getStatusColor(item.old_value as TicketStatus)}`}>
                                                              {formatStatusValue(item.old_value)}
                                                            </span>
                                                          </div>
                                                          
                                                          {/* Timestamp */}
                                                          <div className="flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                              {time}
                                                            </span>
                                                          </div>
                                                        </div>
                                                        
                                                        {/* Arrow - Vertical */}
                                                        <div className="flex items-center justify-center py-0.5">
                                                          <div className="flex flex-col items-center gap-0.5">
                                                            <div className="h-3 w-0.5 bg-primary-400 dark:bg-primary-500 rounded-full"></div>
                                                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 dark:bg-primary-600 shadow-sm">
                                                              <svg className="w-3.5 h-3.5 text-white flex-shrink-0 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                              </svg>
                                                            </div>
                                                            <div className="h-3 w-0.5 bg-primary-400 dark:bg-primary-500 rounded-full"></div>
                                                          </div>
                                                        </div>
                                                        
                                                        {/* To Status */}
                                                        <div className="flex flex-col gap-1">
                                                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                                            To
                                                          </span>
                                                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold border-2 transition-all shadow-sm ring-1 ring-primary-200 dark:ring-primary-800 whitespace-nowrap ${getStatusColor(item.new_value as TicketStatus)}`}>
                                                            {formatStatusValue(item.new_value)}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                              ) : (
                                                <div className="flex items-center justify-between gap-4">
                                                  <div className="flex-1 min-w-0">
                                                    {item.change_type === 'UPDATE' && item.old_value && item.new_value ? (
                                                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md w-fit">
                                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                          </svg>
                                                          Updated {fieldName}
                                                        </span>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                                            {item.old_value}
                                                          </span>
                                                          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                          </svg>
                                                          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                            {item.new_value}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    ) : item.change_type === 'CREATE' ? (
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-md">
                                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                          </svg>
                                                          Created {fieldName}
                                                        </span>
                                                        {item.new_value && (
                                                          <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {isStatusChange ? formatStatusValue(item.new_value) : item.new_value}
                                                          </span>
                                                        )}
                                                      </div>
                                                    ) : item.change_type === 'DELETE' ? (
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-md">
                                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                          </svg>
                                                          Deleted {fieldName}
                                                        </span>
                                                        {item.old_value && (
                                                          <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                                            {isStatusChange ? formatStatusValue(item.old_value) : item.old_value}
                                                          </span>
                                                        )}
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                  {/* Timestamp */}
                                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                                      {time}
                                                    </span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
