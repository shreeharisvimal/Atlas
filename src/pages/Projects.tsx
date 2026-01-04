import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi, ProjectCreate, ProjectUpdate } from '../api/projects';
import { useToastStore } from '../store/toast';
import { useAuthStore } from '../store/auth';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Project } from '../types';
import { SystemRole } from '../types';

export const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToastStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectCreate>({
    name: '',
    description: '',
    key: '',
    site_link: '',
  });
  const [errors, setErrors] = useState<{ name?: string; key?: string }>({});

  const isManagerOrAbove = user?.system_role === SystemRole.ADMIN || user?.system_role === SystemRole.MANAGER;

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getProjects(false); // Get all projects, not just active
      setProjects(data);
    } catch (error: any) {
      console.error('Failed to load projects:', error);
      showToast(error.response?.data?.detail || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; key?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Project name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Project name must be less than 100 characters';
    }
    
    if (!formData.key.trim()) {
      newErrors.key = 'Project key is required';
    } else if (formData.key.trim().length < 2) {
      newErrors.key = 'Project key must be at least 2 characters';
    } else if (formData.key.trim().length > 10) {
      newErrors.key = 'Project key must be less than 10 characters';
    } else if (!/^[A-Z0-9]+$/.test(formData.key.trim().toUpperCase())) {
      newErrors.key = 'Project key must contain only uppercase letters and numbers';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      await projectsApi.createProject({
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        key: formData.key.trim().toUpperCase(),
        site_link: formData.site_link?.trim() || null,
      });
      showToast('Project created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', key: '', site_link: '' });
      setErrors({});
      loadProjects();
    } catch (error: any) {
      console.error('Failed to create project:', error);
      showToast(error.response?.data?.detail || 'Failed to create project', 'error');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      key: project.key,
      site_link: project.site_link || '',
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingProject || !validateForm()) return;

    try {
      const updateData: ProjectUpdate = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        key: formData.key.trim().toUpperCase(),
        site_link: formData.site_link?.trim() || null,
        is_active: editingProject.is_active,
      };
      await projectsApi.updateProject(editingProject.id, updateData);
      showToast('Project updated successfully', 'success');
      setShowEditModal(false);
      setEditingProject(null);
      setFormData({ name: '', description: '', key: '', site_link: '' });
      setErrors({});
      loadProjects();
    } catch (error: any) {
      console.error('Failed to update project:', error);
      showToast(error.response?.data?.detail || 'Failed to update project', 'error');
    }
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', key: '' });
    setErrors({});
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your projects and view project details
          </p>
        </div>
        {isManagerOrAbove && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            + Create Project
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No projects found</p>
            {isManagerOrAbove && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-primary-600 dark:text-primary-400">
                        {project.key}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                        {project.description || '-'}
                      </div>
                      {project.site_link && (
                        <div className="mt-1">
                          <a
                            href={project.site_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Website
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          project.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {project.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          View
                        </button>
                        {isManagerOrAbove && (
                          <button
                            onClick={() => handleEdit(project)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Project</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="My Project"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      setFormData({ ...formData, key: value });
                      if (errors.key) setErrors({ ...errors, key: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono ${
                      errors.key ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="PROJ"
                    maxLength={10}
                  />
                  {errors.key && <p className="mt-1 text-sm text-red-600">{errors.key}</p>}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Short identifier (2-10 uppercase letters/numbers)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Project description (optional)"
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Site Link
                  </label>
                  <input
                    type="url"
                    value={formData.site_link || ''}
                    onChange={(e) => setFormData({ ...formData, site_link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Website URL for this project (optional)
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Project</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.name ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      setFormData({ ...formData, key: value });
                      if (errors.key) setErrors({ ...errors, key: undefined });
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono ${
                      errors.key ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    maxLength={10}
                  />
                  {errors.key && <p className="mt-1 text-sm text-red-600">{errors.key}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Site Link
                  </label>
                  <input
                    type="url"
                    value={formData.site_link || ''}
                    onChange={(e) => setFormData({ ...formData, site_link: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Website URL for this project (optional)
                  </p>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingProject.is_active}
                      onChange={(e) => {
                        setEditingProject({ ...editingProject, is_active: e.target.checked });
                      }}
                      className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

