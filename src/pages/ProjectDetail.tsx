import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import { ticketsApi } from '../api/tickets';
import { useToastStore } from '../store/toast';
import { useAuthStore } from '../store/auth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { WorkflowService } from '../services/workflow';
import type { Project, Ticket } from '../types';
import { SystemRole, TicketStatus, Priority } from '../types';

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const canCreateTicket = user && WorkflowService.canCreateTicket(user.system_role);

  useEffect(() => {
    if (id) {
      loadProject();
      loadTickets();
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await projectsApi.getProject(Number(id));
      setProject(data);
    } catch (error: any) {
      console.error('Failed to load project:', error);
      showToast(error.response?.data?.detail || 'Failed to load project', 'error');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    if (!id) return;
    try {
      setTicketsLoading(true);
      // Filter tickets by project_id using backend filter
      const data = await ticketsApi.getTickets({
        project_id: Number(id),
        skip: 0,
        limit: 100,
      });
      setTickets(data.items);
    } catch (error: any) {
      console.error('Failed to load tickets:', error);
      showToast('Failed to load tickets', 'error');
    } finally {
      setTicketsLoading(false);
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    const colors = {
      OPEN: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      IN_PROGRESS: 'bg-primary-200 text-primary-900 dark:bg-primary-800 dark:text-primary-100',
      REVIEW: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
      IN_TESTING: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
      BLOCKED: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      DONE: 'bg-success-200 text-success-900 dark:bg-success-800 dark:text-success-100',
    };
    return colors[status] || colors.OPEN;
  };

  const getPriorityColor = (priority: Priority) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      MEDIUM: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      HIGH: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
      CRITICAL: 'bg-primary-200 text-primary-900 dark:bg-primary-800 dark:text-primary-100',
    };
    return colors[priority] || colors.MEDIUM;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Project not found</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          ← Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-2xl text-primary-600 dark:text-primary-400">
              {project.key}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                project.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {project.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {project.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">{project.description}</p>
          )}
        </div>
        {canCreateTicket && (
          <button
            onClick={() => navigate(`/tickets/new?projectId=${project.id}`)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Create Ticket
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tickets</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{tickets.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Tickets</div>
          <div className="mt-2 text-3xl font-bold text-primary-600 dark:text-primary-400">
            {tickets.filter((t) => t.status === TicketStatus.OPEN).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Done Tickets</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {tickets.filter((t) => t.status === TicketStatus.DONE).length}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tickets</h2>
        </div>
        {ticketsLoading ? (
          <div className="p-6 text-center">
            <LoadingSpinner />
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No tickets in this project</p>
            {canCreateTicket && (
              <button
                onClick={() => navigate(`/tickets/new?projectId=${project.id}`)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create First Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
                        #{ticket.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {ticket.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          ticket.status as TicketStatus
                        )}`}
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                          ticket.priority as Priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {ticket.issue_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

