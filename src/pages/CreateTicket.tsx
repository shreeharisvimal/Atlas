import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ticketsApi } from '../api/tickets';
import { usersApi } from '../api/users';
import { projectsApi } from '../api/projects';
import { sprintsApi } from '../api/sprints';
import { attachmentsApi } from '../api/attachments';
import { ticketTemplatesApi } from '../api/ticketTemplates';
import type { TicketTemplate } from '../types';
import { useToastStore } from '../store/toast';
import { useAuthStore } from '../store/auth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MarkdownEditor } from '../components/MarkdownEditor';
import type { TicketCreate, User, Project, Sprint } from '../types';
import { IssueType, Priority } from '../types';
import { VALIDATION_CONFIG } from '../config/constants';
import { extractErrorMessage } from '../utils/errorHandler';

export const CreateTicket = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [issueType, setIssueType] = useState<IssueType>(IssueType.BUG);
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [assignedToId, setAssignedToId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [sprintId, setSprintId] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [issueTypes, setIssueTypes] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; description?: string; project?: string }>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [_templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [_selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToastStore();

  useEffect(() => {
    // Check if projectId is provided in URL params
    const projectIdParam = searchParams.get('projectId');
    if (projectIdParam) {
      const parsedId = parseInt(projectIdParam, 10);
      if (!isNaN(parsedId)) {
        setProjectId(parsedId);
      }
    }
    const templateIdParam = searchParams.get('templateId');
    if (templateIdParam) {
      const parsedId = parseInt(templateIdParam, 10);
      if (!isNaN(parsedId)) {
        setSelectedTemplateId(parsedId);
      }
    }
    loadDropdowns();
    loadTemplates();
  }, [searchParams]);

  useEffect(() => {
    if (projectId) {
      loadSprints();
    } else {
      setSprints([]);
      setSprintId(null);
    }
  }, [projectId]);

  const loadSprints = async () => {
    if (!projectId) return;
    try {
      const sprintsData = await sprintsApi.getSprints(projectId, true);
      setSprints(sprintsData);
    } catch (error) {
      console.error('Failed to load sprints:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await ticketTemplatesApi.getTemplates(true);
      setTemplates(data);
      // If templateId is in URL, load it
      const templateIdParam = searchParams.get('templateId');
      if (templateIdParam) {
        const parsedId = parseInt(templateIdParam, 10);
        if (!isNaN(parsedId)) {
          const template = data.find(t => t.id === parsedId);
          if (template) {
            handleTemplateSelect(template);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleTemplateSelect = (template: TicketTemplate) => {
    setSelectedTemplateId(template.id);
    setTitle(template.default_title || '');
    setDescription(template.default_description || '');
    setIssueType(template.issue_type);
    setPriority(template.priority);
  };

  const loadDropdowns = async () => {
    try {
      setLoadingDropdowns(true);
      
      // Load data with individual error handling
      let usersData: User[] = [];
      let projectsData: Project[] = [];
      let typesData: string[] = [];
      let prioritiesData: string[] = [];

      try {
        usersData = await usersApi.getUsersDropdown();
      } catch (error) {
        // Error handling: show user-friendly message, fallback gracefully
        const errorMessage = extractErrorMessage(error, 'Failed to load users list');
        showToast(errorMessage, 'error');
      }

      try {
        projectsData = await projectsApi.getProjects(true);
      } catch (error) {
        // Error handling: show user-friendly message, fallback gracefully
        const errorMessage = extractErrorMessage(error, 'Failed to load projects list');
        showToast(errorMessage, 'error');
      }

      try {
        typesData = await ticketsApi.getIssueTypes();
      } catch (error) {
        // Fallback to enum values if API call fails
        console.error('Failed to load issue types:', error);
        typesData = Object.values(IssueType);
      }

      try {
        prioritiesData = await ticketsApi.getPriorities();
      } catch (error) {
        // Fallback to enum values if API call fails
        console.error('Failed to load priorities:', error);
        prioritiesData = Object.values(Priority);
      }

      // Ensure current user is in the users list
      if (currentUser) {
        const userExists = usersData.some(u => u.id === currentUser.id);
        if (!userExists) {
          usersData = [currentUser, ...usersData];
        }
      }

      setUsers(usersData);
      setProjects(projectsData);
      setIssueTypes(typesData.length > 0 ? typesData : Object.values(IssueType));
      setPriorities(prioritiesData.length > 0 ? prioritiesData : Object.values(Priority));
      
      // Load sprints if a project is selected (will be loaded when project changes)
    } catch (error) {
      console.error('Failed to load dropdowns:', error);
      // Set fallback values
      setIssueTypes(Object.values(IssueType));
      setPriorities(Object.values(Priority));
      if (currentUser) {
        setUsers([currentUser]);
      }
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { title?: string; description?: string; project?: string } = {};
    
    if (!projectId) {
      newErrors.project = 'Project is required';
    }
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length < VALIDATION_CONFIG.MIN_TITLE_LENGTH) {
      newErrors.title = `Title must be at least ${VALIDATION_CONFIG.MIN_TITLE_LENGTH} characters`;
    } else if (title.trim().length > VALIDATION_CONFIG.MAX_TITLE_LENGTH) {
      newErrors.title = `Title must be less than ${VALIDATION_CONFIG.MAX_TITLE_LENGTH} characters`;
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (description.trim().length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the form errors', 'error');
      return;
    }

    setLoading(true);
    try {
      const ticketData: TicketCreate = {
        title: title.trim(),
        description: description.trim(),
        page_url: pageUrl.trim() || null,
        issue_type: issueType,
        priority: priority,
        assigned_to_id: assignedToId,
        project_id: projectId,
        sprint_id: sprintId,
      };
      const ticket = await ticketsApi.createTicket(ticketData);
      
      // Upload attachments if any
      if (selectedFiles.length > 0) {
        try {
          for (const file of selectedFiles) {
            await attachmentsApi.uploadAttachment(ticket.id, file);
          }
          showToast('Ticket created with attachments successfully', 'success');
        } catch (attachmentError) {
          console.error('Failed to upload attachments:', attachmentError);
          const errorMessage = extractErrorMessage(attachmentError, 'Failed to upload attachments');
          showToast(`Ticket created but attachments failed: ${errorMessage}`, 'warning');
        }
      } else {
        showToast('Ticket created successfully', 'success');
      }
      
      navigate(`/tickets/${ticket.id}`);
    } catch (error) {
      console.error('Failed to create ticket:', error);
      const errorMessage = extractErrorMessage(error, 'Failed to create ticket');
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/tickets')}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          ← Back to Tickets
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Ticket</h1>
      </div>

      {loadingDropdowns ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading form options...</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors({ ...errors, title: undefined });
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 ${
                errors.title ? 'border-red-300 dark:border-red-600' : ''
              }`}
              placeholder="Enter ticket title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          <MarkdownEditor
            value={description}
            onChange={(value) => {
              setDescription(value);
              if (errors.description) {
                setErrors({ ...errors, description: undefined });
              }
            }}
            placeholder="Enter ticket description (Markdown supported)"
            rows={10}
            className={errors.description ? 'border-red-300' : ''}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Page URL (Optional)
            </label>
            <input
              type="url"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://example.com/page"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Exact URL of the page where this issue occurs
            </p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={projectId || ''}
              onChange={(e) => {
                setProjectId(e.target.value ? Number(e.target.value) : null);
                if (errors.project) {
                  setErrors({ ...errors, project: undefined });
                }
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white text-gray-900 ${
                errors.project ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} - {project.name}
                </option>
              ))}
            </select>
            {errors.project && (
              <p className="mt-1 text-sm text-red-600">{errors.project}</p>
            )}
          </div>

          {projectId && sprints.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sprint (Optional)</label>
              <select
                value={sprintId || ''}
                onChange={(e) => setSprintId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white text-gray-900"
              >
                <option value="">No Sprint</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as IssueType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white text-gray-900"
            >
              {(issueTypes.length > 0 ? issueTypes : Object.values(IssueType)).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white text-gray-900"
            >
              {(priorities.length > 0 ? priorities : Object.values(Priority)).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
            <select
              value={assignedToId || ''}
              onChange={(e) => setAssignedToId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white text-gray-900"
            >
              <option value="">Unassigned</option>
              {currentUser && (
                <option key={currentUser.id} value={currentUser.id}>
                  {currentUser.full_name} (Me)
                </option>
              )}
              {users
                .filter((user) => !currentUser || user.id !== currentUser.id)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.designation})
                  </option>
                ))}
            </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Attachments (Optional)
          </label>
          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors duration-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Select Files
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={loading}
            />
          </label>
          {selectedFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 gradient-primary text-white rounded-lg hover:opacity-90 shadow-md hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};

