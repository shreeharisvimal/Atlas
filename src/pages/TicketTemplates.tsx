import { useEffect, useState } from 'react';
import { ticketTemplatesApi } from '../api/ticketTemplates';
import type { TicketTemplate } from '../types';
import { IssueType, Priority } from '../types';
import { useToastStore } from '../store/toast';
import { useAuthStore } from '../store/auth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { extractErrorMessage } from '../utils/errorHandler';

export const TicketTemplates = () => {
  const { showToast } = useToastStore();
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<TicketTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    issue_type: IssueType.BUG,
    priority: Priority.MEDIUM,
    default_title: '',
    default_description: '',
    is_public: false,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await ticketTemplatesApi.getTemplates(false);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      showToast(extractErrorMessage(error, 'Failed to load templates'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }
    try {
      await ticketTemplatesApi.createTemplate(formData);
      showToast('Template created successfully', 'success');
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        issue_type: IssueType.BUG,
        priority: Priority.MEDIUM,
        default_title: '',
        default_description: '',
        is_public: false,
      });
      loadTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
      showToast(extractErrorMessage(error, 'Failed to create template'), 'error');
    }
  };

  const handleEditTemplate = (template: TicketTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      issue_type: template.issue_type,
      priority: template.priority,
      default_title: template.default_title || '',
      default_description: template.default_description || '',
      is_public: template.is_public,
    });
    setShowEditModal(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name.trim()) {
      showToast('Please enter a template name', 'error');
      return;
    }
    try {
      await ticketTemplatesApi.updateTemplate(editingTemplate.id, formData);
      showToast('Template updated successfully', 'success');
      setShowEditModal(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      console.error('Failed to update template:', error);
      showToast(extractErrorMessage(error, 'Failed to update template'), 'error');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await ticketTemplatesApi.deleteTemplate(templateId);
      showToast('Template deleted successfully', 'success');
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      showToast(extractErrorMessage(error, 'Failed to delete template'), 'error');
    }
  };

  const handleCreateTicketFromTemplate = async (templateId: number) => {
    try {
      const ticket = await ticketTemplatesApi.createTicketFromTemplate(templateId);
      window.location.href = `/tickets/${ticket.id}`;
    } catch (error) {
      console.error('Failed to create ticket from template:', error);
      showToast(extractErrorMessage(error, 'Failed to create ticket'), 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ticket Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage ticket templates</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No templates found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                {template.created_by_id === user?.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              {template.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{template.description}</p>
              )}
              <div className="flex gap-2 mb-4">
                <span className="px-2 py-1 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                  {template.issue_type}
                </span>
                <span className="px-2 py-1 text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded">
                  {template.priority}
                </span>
                {template.is_public && (
                  <span className="px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                    Public
                  </span>
                )}
              </div>
              <button
                onClick={() => handleCreateTicketFromTemplate(template.id)}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
              >
                Create Ticket from Template
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Issue Type</label>
                  <select
                    value={formData.issue_type}
                    onChange={(e) => setFormData({ ...formData, issue_type: e.target.value as IssueType })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={IssueType.BUG}>Bug</option>
                    <option value={IssueType.TASK}>Task</option>
                    <option value={IssueType.IMPROVEMENT}>Improvement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={Priority.LOW}>Low</option>
                    <option value={Priority.MEDIUM}>Medium</option>
                    <option value={Priority.HIGH}>High</option>
                    <option value={Priority.CRITICAL}>Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Title</label>
                <input
                  type="text"
                  value={formData.default_title}
                  onChange={(e) => setFormData({ ...formData, default_title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Description</label>
                <textarea
                  value={formData.default_description}
                  onChange={(e) => setFormData({ ...formData, default_description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Make this template public</label>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    name: '',
                    description: '',
                    issue_type: IssueType.BUG,
                    priority: Priority.MEDIUM,
                    default_title: '',
                    default_description: '',
                    is_public: false,
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button onClick={handleCreateTemplate} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Issue Type</label>
                  <select
                    value={formData.issue_type}
                    onChange={(e) => setFormData({ ...formData, issue_type: e.target.value as IssueType })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={IssueType.BUG}>Bug</option>
                    <option value={IssueType.TASK}>Task</option>
                    <option value={IssueType.IMPROVEMENT}>Improvement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={Priority.LOW}>Low</option>
                    <option value={Priority.MEDIUM}>Medium</option>
                    <option value={Priority.HIGH}>High</option>
                    <option value={Priority.CRITICAL}>Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Title</label>
                <input
                  type="text"
                  value={formData.default_title}
                  onChange={(e) => setFormData({ ...formData, default_title: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Description</label>
                <textarea
                  value={formData.default_description}
                  onChange={(e) => setFormData({ ...formData, default_description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">Make this template public</label>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button onClick={handleUpdateTemplate} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

