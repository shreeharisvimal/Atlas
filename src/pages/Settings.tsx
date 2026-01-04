import { useEffect, useState } from 'react';
import { userPreferencesApi } from '../api/userPreferences';
import { useToastStore } from '../store/toast';
import { useThemeStore } from '../store/theme';
import type { UserPreference } from '../types';

export const Settings = () => {
  const { showToast } = useToastStore();
  const { theme, setTheme } = useThemeStore();
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localTheme, setLocalTheme] = useState(theme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    // Check if there are unsaved changes
    const hasUnsavedChanges = 
      localTheme !== (preferences?.theme || 'system') ||
      emailNotifications !== (preferences?.email_notifications ?? true) ||
      inAppNotifications !== (preferences?.in_app_notifications ?? true) ||
      language !== (preferences?.language || 'en');
    setHasChanges(hasUnsavedChanges);
  }, [localTheme, emailNotifications, inAppNotifications, language, preferences]);

  const loadPreferences = async () => {
    try {
      const data = await userPreferencesApi.getPreferences();
      setPreferences(data);
      setLocalTheme((data.theme || 'system') as 'light' | 'dark' | 'system');
      setEmailNotifications(data.email_notifications ?? true);
      setInAppNotifications(data.in_app_notifications ?? true);
      setNotificationsEnabled(data.email_notifications && data.in_app_notifications);
      setLanguage(data.language || 'en');
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setLocalTheme(theme);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userPreferencesApi.updatePreferences({
        theme: localTheme,
        email_notifications: notificationsEnabled ? emailNotifications : false,
        in_app_notifications: notificationsEnabled ? inAppNotifications : false,
        language: language,
      });
      setPreferences(updated);
      setTheme(localTheme);
      setHasChanges(false);
      showToast('Preferences saved successfully! 🎉', 'success');
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      showToast(error.response?.data?.detail || 'Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const ToggleSwitch = ({ 
    enabled, 
    onChange, 
    label, 
    description,
    disabled = false 
  }: { 
    enabled: boolean; 
    onChange: (enabled: boolean) => void;
    label: string;
    description?: string;
    disabled?: boolean;
  }) => (
    <div className="flex items-center justify-between group">
      <div className="flex-1">
        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-1">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          enabled
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/50'
            : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
            enabled ? 'translate-x-8' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const ThemeOption = ({ 
    value, 
    label, 
    icon, 
    description,
    selected 
  }: { 
    value: string; 
    label: string; 
    icon: string;
    description: string;
    selected: boolean;
  }) => (
    <button
      type="button"
      onClick={() => setLocalTheme(value as 'light' | 'dark' | 'system')}
      className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 ${
        selected
          ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 shadow-lg shadow-primary-500/20 scale-105'
          : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-primary-300 dark:hover:border-primary-700 hover:scale-102'
      }`}
    >
      <div className={`text-4xl mb-3 transition-transform duration-300 ${selected ? 'scale-110' : ''}`}>
        {icon}
      </div>
      <div className="font-bold text-gray-900 dark:text-white mb-1">{label}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">{description}</div>
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header Section */}
      <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Manage your account preferences and customize your experience
        </p>
      </div>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
            🎨
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Appearance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the app looks</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Theme Preference
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ThemeOption
                value="light"
                label="Light"
                icon="☀️"
                description="Clean and bright interface"
                selected={localTheme === 'light'}
              />
              <ThemeOption
                value="dark"
                label="Dark"
                icon="🌙"
                description="Easy on the eyes"
                selected={localTheme === 'dark'}
              />
              <ThemeOption
                value="system"
                label="System"
                icon="💻"
                description="Match your device"
                selected={localTheme === 'system'}
              />
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>💡</span>
              Choose your preferred theme. System will automatically match your device settings.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg">
            🔔
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Control how you receive updates</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/30 dark:to-gray-800/30 border border-gray-200/50 dark:border-gray-600/50">
            <ToggleSwitch
              enabled={notificationsEnabled}
              onChange={setNotificationsEnabled}
              label="Enable Notifications"
              description="Master switch for all notification types"
            />
          </div>

          {notificationsEnabled && (
            <div className="space-y-5 pl-6 border-l-4 border-primary-500/50 dark:border-primary-400/50 animate-fade-in">
              <div className="p-5 rounded-xl bg-white/50 dark:bg-gray-700/20 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200">
                <ToggleSwitch
                  enabled={emailNotifications}
                  onChange={setEmailNotifications}
                  label="Email Notifications"
                  description="Receive email updates for ticket changes"
                  disabled={!notificationsEnabled}
                />
              </div>
              <div className="p-5 rounded-xl bg-white/50 dark:bg-gray-700/20 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200">
                <ToggleSwitch
                  enabled={inAppNotifications}
                  onChange={setInAppNotifications}
                  label="In-App Notifications"
                  description="Get real-time notifications in the app"
                  disabled={!notificationsEnabled}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-2xl shadow-lg">
            🌐
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Language</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred language</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Interface Language
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3.5 pl-12 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 cursor-pointer appearance-none hover:border-primary-300 dark:hover:border-primary-700"
              >
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="fr">🇫🇷 French</option>
                <option value="de">🇩🇪 German</option>
              </select>
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🌐</span>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</span>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>ℹ️</span>
              Select your preferred language for the interface
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end items-center gap-4">
        {hasChanges && (
          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 animate-fade-in">
            <span>⚠️</span>
            <span className="font-medium">You have unsaved changes</span>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="group relative px-8 py-3.5 gradient-primary text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden min-w-[160px]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <span>💾</span>
                Save Preferences
              </>
            )}
          </span>
          {!saving && hasChanges && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          )}
        </button>
      </div>
    </div>
  );
};
