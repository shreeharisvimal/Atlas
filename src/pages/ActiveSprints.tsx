import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sprintsApi } from '../api/sprints';
import { projectsApi } from '../api/projects';
import { ticketsApi } from '../api/tickets';
import { useToastStore } from '../store/toast';
import { useAuthStore } from '../store/auth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Avatar } from '../components/Avatar';
import type { Sprint, Ticket, Project } from '../types';
import { SystemRole, Designation, TicketStatus } from '../types';
import { format } from 'date-fns';

const STATUS_COLUMNS: { status: TicketStatus; label: string; bgColor: string; borderColor: string }[] = [
  { status: 'OPEN' as TicketStatus, label: 'TO DO', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  { status: 'IN_PROGRESS' as TicketStatus, label: 'IN PROGRESS', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { status: 'REVIEW' as TicketStatus, label: 'IN REVIEW', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { status: 'IN_TESTING' as TicketStatus, label: 'TESTING', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { status: 'DONE' as TicketStatus, label: 'DONE', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
];

export const ActiveSprints = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const { user } = useAuthStore();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [movingTicket, setMovingTicket] = useState<number | null>(null);
  const [draggedTicket, setDraggedTicket] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [invalidDropZone, setInvalidDropZone] = useState<TicketStatus | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sprintForm, setSprintForm] = useState({
    name: '',
    description: '',
    goal: '',
    start_date: '',
    end_date: '',
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; dates?: string }>({});

  const canCreateSprint = user && (user.system_role === SystemRole.ADMIN || user.system_role === SystemRole.MANAGER);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadSprints();
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedSprint) {
      loadTickets();
    }
  }, [selectedSprint]);

  const loadProjects = async () => {
    try {
      const data = await projectsApi.getProjects(true);
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        showToast('Unable to connect to the server. Please ensure the backend server is running.', 'error');
      } else {
        showToast('Failed to load projects', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSprints = async () => {
    if (!selectedProject) {
      console.log('No project selected, skipping sprint load');
      setSprints([]);
      setSelectedSprint(null);
      return;
    }
    
    setLoadingSprints(true);
    console.log('Loading sprints for project:', selectedProject);
    
    try {
      // First try to load active sprints
      console.log('Fetching active sprints...');
      let data = await sprintsApi.getActiveSprints(selectedProject);
      console.log('Active sprints response:', data);
      
      // If no active sprints, load all sprints as fallback
      if (data.length === 0) {
        console.log('No active sprints found, loading all sprints...');
        data = await sprintsApi.getSprints(selectedProject, false);
        console.log('All sprints response:', data);
      }
      
      console.log('Setting sprints:', data);
      setSprints(data);
      
      if (data.length > 0 && !selectedSprint) {
        console.log('Auto-selecting first sprint:', data[0]);
        setSelectedSprint(data[0]);
      } else if (data.length === 0) {
        console.log('No sprints found for project');
        setSelectedSprint(null);
        setTickets([]);
      }
    } catch (error: any) {
      console.error('Failed to load sprints:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      setSprints([]);
      setSelectedSprint(null);
      setTickets([]);
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        showToast('Unable to connect to the server. Please ensure the backend server is running.', 'error');
      } else {
        const errorMessage = error.response?.data?.detail || error.message || 'Failed to load sprints';
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoadingSprints(false);
    }
  };

  const loadTickets = async () => {
    if (!selectedSprint) return;
    try {
      const data = await sprintsApi.getSprintTickets(selectedSprint.id);
      setTickets(data);
    } catch (error: any) {
      console.error('Failed to load tickets:', error);
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        showToast('Unable to connect to the server. Please ensure the backend server is running.', 'error');
      } else {
        showToast('Failed to load tickets', 'error');
      }
    }
  };

  const canTransitionToStatus = (currentStatus: TicketStatus, newStatus: TicketStatus, ticket: Ticket): boolean => {
    if (!user) return false;

    // ADMIN and MANAGER can move to any status
    if (user.system_role === SystemRole.ADMIN || user.system_role === SystemRole.MANAGER) {
      return true;
    }

    // Check if user is assigned to the ticket
    const isAssignedUser = ticket.assigned_to_id === user.id;

    // TEAM_LEAD and PROJECT_MANAGER can move to any status
    if (user.designation === Designation.TEAM_LEAD || user.designation === Designation.PROJECT_MANAGER) {
      return true;
    }

    // Only assigned user can update status (except for TEAM_LEAD and PROJECT_MANAGER)
    if (!isAssignedUser && user.designation !== Designation.TEAM_LEAD && user.designation !== Designation.PROJECT_MANAGER) {
      return false;
    }

    // DEVELOPER workflow - can only move to REVIEW or TESTING, but NOT from TESTING
    if (user.designation === Designation.DEVELOPER) {
      const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
        [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
        [TicketStatus.IN_PROGRESS]: [TicketStatus.REVIEW, TicketStatus.IN_TESTING],
        [TicketStatus.REVIEW]: [TicketStatus.IN_PROGRESS, TicketStatus.IN_TESTING],
        [TicketStatus.IN_TESTING]: [], // DEVELOPER cannot move tickets from TESTING - only TESTER/MANAGER can
        [TicketStatus.BLOCKED]: [],
        [TicketStatus.DONE]: [],
      };
      return allowedTransitions[currentStatus]?.includes(newStatus) || false;
    }

    // TESTER and QA workflow - can change TESTING status and move to DONE
    if (user.designation === Designation.TESTER || user.designation === Designation.QA) {
      const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
        [TicketStatus.REVIEW]: [TicketStatus.IN_TESTING],
        [TicketStatus.IN_TESTING]: [TicketStatus.DONE, TicketStatus.REVIEW, TicketStatus.IN_PROGRESS], // Can move to DONE, back to REVIEW, or back to IN_PROGRESS
        [TicketStatus.DONE]: [TicketStatus.REVIEW, TicketStatus.IN_TESTING], // Can reopen
        [TicketStatus.OPEN]: [],
        [TicketStatus.IN_PROGRESS]: [],
        [TicketStatus.BLOCKED]: [],
      };
      return allowedTransitions[currentStatus]?.includes(newStatus) || false;
    }

    return false;
  };

  const handleStatusChange = async (ticketId: number, newStatus: TicketStatus, showNotification: boolean = true) => {
    try {
      setMovingTicket(ticketId);
      const ticket = tickets.find(t => t.id === ticketId);
      const oldStatus = ticket?.status;
      const oldStatusLabel = STATUS_COLUMNS.find(c => c.status === oldStatus)?.label || oldStatus;
      const newStatusLabel = STATUS_COLUMNS.find(c => c.status === newStatus)?.label || newStatus;
      
      // Optimistically update the local state for instant UI feedback
      setTickets(prevTickets => 
        prevTickets.map(t => 
          t.id === ticketId ? { ...t, status: newStatus } : t
        )
      );
      
      // Update on server in the background
      await ticketsApi.updateTicketStatus(ticketId, { status: newStatus });
      
      // Show success notification only if requested
      if (showNotification) {
        showToast(`Ticket moved from ${oldStatusLabel} to ${newStatusLabel}`, 'success');
      }
    } catch (error: any) {
      console.error('Failed to update ticket status:', error);
      
      // Revert optimistic update on error
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setTickets(prevTickets => 
          prevTickets.map(t => 
            t.id === ticketId ? { ...t, status: ticket.status } : t
          )
        );
      }
      
      // Extract error message from backend response
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to update ticket status';
      showToast(errorMessage, 'error');
    } finally {
      setMovingTicket(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, ticket: Ticket) => {
    // Only allow dragging if user has permission to modify tickets
    if (!user) {
      e.preventDefault();
      return;
    }
    
    // Check if user can modify this ticket (assigned user, admin, manager, or team lead)
    const canModify = 
      user.system_role === SystemRole.ADMIN || 
      user.system_role === SystemRole.MANAGER ||
      ticket.assigned_to_id === user.id ||
      user.designation === Designation.TEAM_LEAD ||
      user.designation === Designation.PROJECT_MANAGER;
    
    if (!canModify) {
      e.preventDefault();
      return;
    }
    
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    document.body.appendChild(dragImage);
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    e.dataTransfer.setDragImage(dragImage, e.clientX - e.currentTarget.getBoundingClientRect().left, e.clientY - e.currentTarget.getBoundingClientRect().top);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ ticketId: ticket.id, currentStatus: ticket.status }));
    e.dataTransfer.setData('text/plain', ticket.id.toString());
    setDraggedTicket(ticket.id);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTicket(null);
    setDragOverColumn(null);
    setDragPosition(null);
    setInvalidDropZone(null);
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: TicketStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    if (!draggedTicket) {
      e.dataTransfer.dropEffect = 'none';
      setInvalidDropZone(null);
      return;
    }
    
    const ticket = tickets.find(t => t.id === draggedTicket);
    if (!ticket) {
      e.dataTransfer.dropEffect = 'none';
      setInvalidDropZone(null);
      return;
    }
    
    // Check if transition is allowed before showing drop effect
    if (canTransitionToStatus(ticket.status, columnStatus, ticket)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverColumn(columnStatus);
      setInvalidDropZone(null);
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDragOverColumn(null);
      if (ticket.status !== columnStatus) {
        setInvalidDropZone(columnStatus);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're actually leaving the column, not just moving to a child
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverColumn(null);
      setInvalidDropZone(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TicketStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    setInvalidDropZone(null);
    
    if (!draggedTicket) return;
    
    const ticket = tickets.find(t => t.id === draggedTicket);
    if (!ticket) {
      setDraggedTicket(null);
      return;
    }

    // Check if transition is allowed
    if (!canTransitionToStatus(ticket.status, targetStatus, ticket)) {
      showToast('You do not have permission to move this ticket to this status', 'error');
      setDraggedTicket(null);
      return;
    }

    // Only change status if it's different
    if (ticket.status !== targetStatus) {
      // Don't show notification here - handleStatusChange will show it
      await handleStatusChange(ticket.id, targetStatus, true);
    }
    
    setDraggedTicket(null);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200 dark:border-gray-500',
      MEDIUM: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 dark:from-blue-900/50 dark:to-blue-800/50 dark:text-blue-200 dark:border-blue-600',
      HIGH: 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-300 dark:from-orange-900/50 dark:to-orange-800/50 dark:text-orange-200 dark:border-orange-600',
      CRITICAL: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 dark:from-red-900/50 dark:to-red-800/50 dark:text-red-200 dark:border-red-600',
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(t => t.status === status);
  };

  const handleCreateSprint = async () => {
    if (!selectedProject) {
      showToast('Please select a project first', 'error');
      return;
    }

    // Validate form
    const errors: { name?: string; dates?: string } = {};
    if (!sprintForm.name.trim()) {
      errors.name = 'Sprint name is required';
    }
    if (sprintForm.start_date && sprintForm.end_date) {
      const start = new Date(sprintForm.start_date);
      const end = new Date(sprintForm.end_date);
      if (end < start) {
        errors.dates = 'End date must be after start date';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setCreating(true);
    setFormErrors({});

    try {
      const sprintData = {
        name: sprintForm.name.trim(),
        description: sprintForm.description.trim() || undefined,
        goal: sprintForm.goal.trim() || undefined,
        project_id: selectedProject,
        start_date: sprintForm.start_date || undefined,
        end_date: sprintForm.end_date || undefined,
      };

      const newSprint = await sprintsApi.createSprint(sprintData);
      showToast('Sprint created successfully', 'success');
      setShowCreateModal(false);
      setSprintForm({ name: '', description: '', goal: '', start_date: '', end_date: '' });
      // Reload sprints
      await loadSprints();
      // Select the newly created sprint
      setSelectedSprint(newSprint);
    } catch (error: any) {
      console.error('Failed to create sprint:', error);
      showToast(error.response?.data?.detail || 'Failed to create sprint', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Projects Found</h2>
          <p className="text-gray-600 mb-6">Please create a project first to use sprints.</p>
          <Link
            to="/tickets"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Active Sprints
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your sprint tickets with a kanban board
          </p>
        </div>
      </div>

      {/* Project and Sprint Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project
            </label>
            <select
              value={selectedProject || ''}
              onChange={(e) => {
                setSelectedProject(Number(e.target.value));
                setSelectedSprint(null);
                setTickets([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} - {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sprint
              </label>
              {canCreateSprint && selectedProject && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                  title="Create new sprint"
                >
                  + New
                </button>
              )}
            </div>
            <select
              value={selectedSprint?.id || ''}
              onChange={(e) => {
                const sprint = sprints.find(s => s.id === Number(e.target.value));
                setSelectedSprint(sprint || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedProject || loadingSprints || sprints.length === 0}
            >
              <option value="">
                {loadingSprints
                  ? 'Loading sprints...'
                  : !selectedProject 
                  ? 'Select a project first' 
                  : sprints.length === 0 
                  ? 'No sprints available' 
                  : 'Select Sprint'}
              </option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name} {sprint.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
            {loadingSprints && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Loading sprints...</p>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {selectedSprint ? (
        <div className="space-y-4">
          {/* Sprint Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSprint.name}</h2>
                {selectedSprint.goal && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{selectedSprint.goal}</p>
                )}
                {selectedSprint.start_date && selectedSprint.end_date && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    {format(new Date(selectedSprint.start_date), 'MMM d')} - {format(new Date(selectedSprint.end_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/tickets/new')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Ticket
                </button>
              </div>
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STATUS_COLUMNS.map((column) => {
              const columnTickets = getTicketsByStatus(column.status);
              return (
                <div
                  key={column.status}
                  className={`${column.bgColor} dark:bg-gray-800/50 rounded-xl border-2 ${column.borderColor} dark:border-gray-700 p-5 min-h-[500px] shadow-sm transition-all duration-300 ease-out ${
                    dragOverColumn === column.status 
                      ? 'border-primary-400 dark:border-primary-500 bg-primary-50/70 dark:bg-primary-900/30 scale-[1.02] shadow-xl ring-4 ring-primary-200/50 dark:ring-primary-800/50 transform-gpu' 
                      : ''
                  } ${
                    invalidDropZone === column.status
                      ? 'border-red-300 dark:border-red-600 bg-red-50/30 dark:bg-red-900/10 ring-2 ring-red-200 dark:ring-red-800 animate-pulse'
                      : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.status)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.status)}
                >
                  {/* Drop zone indicator */}
                  {dragOverColumn === column.status && draggedTicket && (
                    <div className="absolute inset-0 pointer-events-none z-0">
                      <div className="absolute inset-2 border-2 border-dashed border-primary-400 dark:border-primary-500 rounded-lg animate-pulse bg-primary-50/20 dark:bg-primary-900/10"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm animate-bounce">
                        Drop here
                      </div>
                    </div>
                  )}
                  {/* Invalid drop zone indicator */}
                  {invalidDropZone === column.status && draggedTicket && (
                    <div className="absolute inset-0 pointer-events-none z-0">
                      <div className="absolute inset-2 border-2 border-dashed border-red-400 dark:border-red-500 rounded-lg bg-red-50/20 dark:bg-red-900/10"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Not allowed
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white uppercase text-sm tracking-wider">
                      {column.label}
                    </h3>
                    <span className="px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold border-2 border-gray-300 dark:border-gray-600 shadow-sm">
                      {columnTickets.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {columnTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        draggable={!movingTicket && !!user && (user.system_role === SystemRole.ADMIN || user.system_role === SystemRole.MANAGER || ticket.assigned_to_id === user.id || user.designation === Designation.TEAM_LEAD || user.designation === Designation.PROJECT_MANAGER)}
                        onDragStart={(e) => handleDragStart(e, ticket)}
                        onDragEnd={handleDragEnd}
                        className={`group bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-4 shadow-md hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 mb-3 relative overflow-hidden transform-gpu ${
                          movingTicket === ticket.id ? 'opacity-50 pointer-events-none scale-95' : ''
                        } ${
                          draggedTicket === ticket.id ? 'opacity-30 scale-90 rotate-3 shadow-2xl z-50 border-primary-400' : ''
                        } ${
                          user && (user.system_role === SystemRole.ADMIN || user.system_role === SystemRole.MANAGER || ticket.assigned_to_id === user.id || user.designation === Designation.TEAM_LEAD || user.designation === Designation.PROJECT_MANAGER) 
                            ? 'cursor-move hover:scale-[1.02] hover:-translate-y-1 active:scale-100' 
                            : 'cursor-pointer hover:scale-[1.01]'
                        } ${
                          !user || !(user.system_role === SystemRole.ADMIN || user.system_role === SystemRole.MANAGER || ticket.assigned_to_id === user.id || user.designation === Designation.TEAM_LEAD || user.designation === Designation.PROJECT_MANAGER)
                            ? 'opacity-90'
                            : ''
                        }`}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 dark:from-primary-900/0 dark:to-primary-800/0 group-hover:from-primary-50/50 group-hover:to-primary-100/30 dark:group-hover:from-primary-900/20 dark:group-hover:to-primary-800/10 transition-all duration-300 pointer-events-none" />
                        
                        {movingTicket === ticket.id && (
                          <div className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 flex items-center justify-center rounded-xl z-20 backdrop-blur-md animate-fade-in">
                            <div className="flex flex-col items-center gap-3">
                              <div className="relative">
                                <LoadingSpinner size="sm" />
                                <div className="absolute inset-0 bg-primary-200/20 dark:bg-primary-800/20 rounded-full blur-xl animate-pulse"></div>
                              </div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
                                Moving ticket...
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="relative z-10">
                          {/* Drag Handle Indicator */}
                          {user && (user.system_role === SystemRole.ADMIN || user.system_role === SystemRole.MANAGER || ticket.assigned_to_id === user.id || user.designation === Designation.TEAM_LEAD || user.designation === Designation.PROJECT_MANAGER) && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
                              <div className="bg-primary-100 dark:bg-primary-900/50 rounded-md p-1.5 shadow-sm border border-primary-200 dark:border-primary-800">
                                <div className="flex gap-0.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                                </div>
                                <div className="flex gap-0.5 mt-0.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 dark:bg-primary-400"></div>
                                </div>
                              </div>
                              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                Drag to move
                              </div>
                            </div>
                          )}
                          {/* Non-draggable indicator */}
                          {user && !(user.system_role === SystemRole.ADMIN || user.system_role === SystemRole.MANAGER || ticket.assigned_to_id === user.id || user.designation === Designation.TEAM_LEAD || user.designation === Designation.PROJECT_MANAGER) && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-1.5 shadow-sm border border-gray-300 dark:border-gray-600">
                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            </div>
                          )}

                          {/* Header: Ticket ID and Priority */}
                          <div className="flex items-start justify-between mb-3">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-mono tracking-wide"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ticket.project?.key || 'TICK'}-{ticket.id}
                            </Link>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm border ${getPriorityColor(ticket.priority)} transition-transform group-hover:scale-105`}>
                              {ticket.priority}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                            {ticket.title}
                          </h3>

                          {/* Tags */}
                          {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {ticket.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="px-2 py-0.5 rounded-md text-xs font-medium shadow-sm border transition-transform group-hover:scale-105"
                                  style={{
                                    backgroundColor: `${tag.color}15`,
                                    color: tag.color,
                                    borderColor: `${tag.color}40`,
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {ticket.tags.length > 3 && (
                                <span className="px-2 py-0.5 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">
                                  +{ticket.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Assignee */}
                          {ticket.assignee && (
                            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
                              <Avatar user={ticket.assignee} size="sm" showOnlineStatus={true} />
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                                {ticket.assignee.full_name}
                              </span>
                            </div>
                          )}

                          {/* Action Buttons - Filtered by permissions */}
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
                            {STATUS_COLUMNS
                              .filter(c => c.status !== ticket.status)
                              .filter(col => canTransitionToStatus(ticket.status, col.status, ticket))
                              .map((col) => (
                                <button
                                  key={col.status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(ticket.id, col.status);
                                  }}
                                  disabled={movingTicket === ticket.id}
                                  className="flex-1 min-w-[100px] text-xs px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:from-primary-100 hover:to-primary-50 dark:hover:from-primary-900/50 dark:hover:to-primary-800/50 hover:text-primary-700 dark:hover:text-primary-300 font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 group/btn relative overflow-hidden"
                                  title={`Move to ${col.label}`}
                                >
                                  <span className="relative z-10 flex items-center justify-center gap-1">
                                    <span className="inline-block transition-transform group-hover/btn:translate-x-0.5">→</span>
                                    {col.label}
                                  </span>
                                  <span className="absolute inset-0 bg-gradient-to-r from-primary-400/0 to-primary-500/0 group-hover/btn:from-primary-400/10 group-hover/btn:to-primary-500/10 transition-all duration-200"></span>
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {columnTickets.length === 0 && (
                      <div className="text-center py-12 relative">
                        <div className="flex flex-col items-center gap-3 opacity-40">
                          <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No tickets</p>
                          <p className="text-xs text-gray-300 dark:text-gray-600">Drag tickets here</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {sprints.length === 0 ? 'No Sprints Found' : 'No Sprint Selected'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {sprints.length === 0
              ? 'No sprints found for this project. Create a sprint to get started.'
              : 'Please select a sprint from the dropdown above to view the kanban board.'}
          </p>
          {sprints.length === 0 && canCreateSprint && selectedProject && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Sprint
            </button>
          )}
        </div>
      )}

      {/* Create Sprint Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!creating) {
              setShowCreateModal(false);
              setSprintForm({ name: '', description: '', goal: '', start_date: '', end_date: '' });
              setFormErrors({});
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Sprint</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Create a new sprint for {projects.find(p => p.id === selectedProject)?.name || 'selected project'}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sprint Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., Sprint 1 - January 2026"
                  disabled={creating}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={sprintForm.description}
                  onChange={(e) => setSprintForm({ ...sprintForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Optional sprint description"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sprint Goal
                </label>
                <textarea
                  value={sprintForm.goal}
                  onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What do you want to achieve in this sprint?"
                  disabled={creating}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={sprintForm.start_date}
                    onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.dates ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={creating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={sprintForm.end_date}
                    onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })}
                    min={sprintForm.start_date || undefined}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      formErrors.dates ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={creating}
                  />
                </div>
              </div>
              {formErrors.dates && (
                <p className="text-xs text-red-500">{formErrors.dates}</p>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> If you set start and end dates that include today, the sprint will be automatically marked as active.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSprintForm({ name: '', description: '', goal: '', start_date: '', end_date: '' });
                  setFormErrors({});
                }}
                disabled={creating}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSprint}
                disabled={creating || !sprintForm.name.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

