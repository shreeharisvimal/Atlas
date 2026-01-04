import { useEffect, useState } from 'react';
import { tagsApi } from '../api/tags';
import { useToastStore } from '../store/toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { Tag } from '../types';

export const TagManagement = () => {
  const { showToast } = useToastStore();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await tagsApi.getTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
      showToast('Failed to load tags', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Tag name is required', 'error');
      return;
    }

    try {
      const newTag = await tagsApi.createTag({
        name: formData.name.trim(),
        color: formData.color,
      });
      setTags([...tags, newTag]);
      setFormData({ name: '', color: '#3B82F6' });
      setShowCreateForm(false);
      showToast('Tag created successfully', 'success');
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      showToast(error.message || 'Failed to create tag', 'error');
    }
  };

  const handleUpdate = async (tagId: number, name: string, color: string) => {
    if (!name.trim()) {
      showToast('Tag name is required', 'error');
      return;
    }

    try {
      const updated = await tagsApi.updateTag(tagId, {
        name: name.trim(),
        color: color,
      });
      setTags(tags.map(tag => tag.id === tagId ? updated : tag));
      setEditingId(null);
      showToast('Tag updated successfully', 'success');
    } catch (error: any) {
      console.error('Failed to update tag:', error);
      showToast(error.message || 'Failed to update tag', 'error');
    }
  };

  const handleDelete = async (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag? This will remove it from all tickets.')) {
      return;
    }

    try {
      await tagsApi.deleteTag(tagId);
      setTags(tags.filter(tag => tag.id !== tagId));
      showToast('Tag deleted successfully', 'success');
    } catch (error: any) {
      console.error('Failed to delete tag:', error);
      showToast(error.message || 'Failed to delete tag', 'error');
    }
  };

  const presetColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
    '#6366F1', // indigo
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tag Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage tags for organizing tickets
          </p>
        </div>
        <div className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tag Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage tags for organizing tickets
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showCreateForm ? 'Cancel' : 'Create Tag'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Create New Tag
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tag Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder="Enter tag name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer"
                />
                <div className="flex gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 ${
                        formData.color === color
                          ? 'border-gray-900 dark:border-white scale-110'
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm hover:shadow transition-colors duration-200"
              >
                Create Tag
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ name: '', color: '#3B82F6' });
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tags List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Tags ({tags.length})
          </h2>
        </div>
        {tags.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No tags found</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Create your first tag to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                isEditing={editingId === tag.id}
                onEdit={() => setEditingId(tag.id)}
                onCancel={() => setEditingId(null)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                presetColors={presetColors}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface TagRowProps {
  tag: Tag;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (id: number, name: string, color: string) => void;
  onDelete: (id: number) => void;
  presetColors: string[];
}

const TagRow = ({ tag, isEditing, onEdit, onCancel, onUpdate, onDelete, presetColors }: TagRowProps) => {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  useEffect(() => {
    if (isEditing) {
      setName(tag.name);
      setColor(tag.color);
    }
  }, [isEditing, tag]);

  const handleSave = () => {
    onUpdate(tag.id, name, color);
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
      {isEditing ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 cursor-pointer"
            />
            <div className="flex gap-1">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-6 h-6 rounded border transition-all duration-200 ${
                    color === presetColor
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all duration-200"
              style={{
                backgroundColor: `${color}15`,
                color: color,
                borderColor: `${color}40`,
              }}
            >
              {tag.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              title="Edit tag"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(tag.id)}
              className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
              title="Delete tag"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
