import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import {
  Settings, User, Bell, Shield, Database, Mail,
  Info, Save, RefreshCw, AlertTriangle, CheckCircle, UserPlus, Wrench
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [saveStatus, setSaveStatus] = useState(null);
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'MUT Study Hub',
    siteDescription: 'Academic Resource Sharing Platform',
    contactEmail: 'admin@mutstudy.com',
    maxFileSize: 50, // MB
    allowedFileTypes: '.pdf,.doc,.docx,.ppt,.pptx,.zip',
    downloadsEnabled: true, // Global download control
    registrationEnabled: true, // Allow new users to register
    maintenanceMode: false, // Pause new uploads and show a notice
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newResourceAlert: true,
    approvalNotification: true,
    weeklyReport: false,
    systemAlerts: true,
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    requireEmailVerification: false,
    sessionTimeout: 10080, // minutes (7 days)
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
  });

  // Resource Approval Settings
  const [approvalSettings, setApprovalSettings] = useState({
    autoApprove: false,
    requireClassRepApproval: true,
    requireAdminApproval: false,
    allowStudentUploads: true,
    moderationQueueLimit: 100,
  });

  const handleSaveSettings = async (settingsType) => {
    setSaveStatus('saving');

    const payloads = {
      general: {
        site_name: generalSettings.siteName,
        site_description: generalSettings.siteDescription,
        contact_email: generalSettings.contactEmail,
        max_file_size: Math.round(Number(generalSettings.maxFileSize) * 1024 * 1024),
        allowed_file_types: generalSettings.allowedFileTypes,
        downloads_enabled: generalSettings.downloadsEnabled,
        registration_enabled: generalSettings.registrationEnabled,
        maintenance_mode: generalSettings.maintenanceMode,
      },
      notifications: {
        email_notifications: notificationSettings.emailNotifications,
        new_resource_alert: notificationSettings.newResourceAlert,
        approval_notification: notificationSettings.approvalNotification,
        weekly_report: notificationSettings.weeklyReport,
        system_alerts: notificationSettings.systemAlerts,
      },
      security: {
        require_email_verification: securitySettings.requireEmailVerification,
        session_timeout_minutes: Number(securitySettings.sessionTimeout),
        max_login_attempts: Number(securitySettings.maxLoginAttempts),
        password_min_length: Number(securitySettings.passwordMinLength),
        require_strong_password: securitySettings.requireStrongPassword,
      },
      approval: {
        auto_approve: approvalSettings.autoApprove,
        require_class_rep_approval: approvalSettings.requireClassRepApproval,
        require_admin_approval: approvalSettings.requireAdminApproval,
        allow_student_uploads: approvalSettings.allowStudentUploads,
        moderation_queue_limit: Number(approvalSettings.moderationQueueLimit),
      },
    };

    try {
      await adminAPI.updateSettings(payloads[settingsType]);

      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await adminAPI.getSettings();
        const settings = response.data.data || {};
        const get = (key, fallback) =>
          settings[key]?.value !== undefined ? settings[key].value : fallback;

        setGeneralSettings((prev) => ({
          ...prev,
          siteName: get('site_name', prev.siteName),
          siteDescription: get('site_description', prev.siteDescription),
          contactEmail: get('contact_email', prev.contactEmail),
          maxFileSize: Math.max(
            1,
            Math.round(Number(get('max_file_size', prev.maxFileSize * 1024 * 1024)) / 1024 / 1024)
          ),
          allowedFileTypes: get('allowed_file_types', prev.allowedFileTypes),
          downloadsEnabled: Boolean(get('downloads_enabled', prev.downloadsEnabled)),
          registrationEnabled: Boolean(get('registration_enabled', prev.registrationEnabled)),
          maintenanceMode: Boolean(get('maintenance_mode', prev.maintenanceMode)),
        }));

        setNotificationSettings((prev) => ({
          emailNotifications: Boolean(get('email_notifications', prev.emailNotifications)),
          newResourceAlert: Boolean(get('new_resource_alert', prev.newResourceAlert)),
          approvalNotification: Boolean(get('approval_notification', prev.approvalNotification)),
          weeklyReport: Boolean(get('weekly_report', prev.weeklyReport)),
          systemAlerts: Boolean(get('system_alerts', prev.systemAlerts)),
        }));

        setSecuritySettings((prev) => ({
          requireEmailVerification: Boolean(get('require_email_verification', prev.requireEmailVerification)),
          sessionTimeout: Number(get('session_timeout_minutes', prev.sessionTimeout)),
          maxLoginAttempts: Number(get('max_login_attempts', prev.maxLoginAttempts)),
          passwordMinLength: Number(get('password_min_length', prev.passwordMinLength)),
          requireStrongPassword: Boolean(get('require_strong_password', prev.requireStrongPassword)),
        }));

        setApprovalSettings((prev) => ({
          autoApprove: Boolean(get('auto_approve', prev.autoApprove)),
          requireClassRepApproval: Boolean(get('require_class_rep_approval', prev.requireClassRepApproval)),
          requireAdminApproval: Boolean(get('require_admin_approval', prev.requireAdminApproval)),
          allowStudentUploads: Boolean(get('allow_student_uploads', prev.allowStudentUploads)),
          moderationQueueLimit: Number(get('moderation_queue_limit', prev.moderationQueueLimit)),
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    if (user?.role === 'admin') {
      loadSettings();
    }
  }, [user]);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'approval', label: 'Approval Workflow', icon: CheckCircle },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings & Configuration</h1>
        <p className="text-gray-600 mt-1">Manage system settings and preferences</p>
      </div>

      {/* Admin Only Warning */}
      {user?.role !== 'admin' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Limited Access</h3>
              <p className="text-sm text-yellow-800">
                Some settings are restricted to administrators only. Contact your system admin to modify system-wide configurations.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs Sidebar */}
        <div className="lg:w-64">
          <div className="bg-white rounded-lg shadow-md p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = user?.role !== 'admin' && tab.id !== 'profile';
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-admin-primary text-white'
                      : isDisabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">General Settings</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure basic platform settings and information
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={generalSettings.siteName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={generalSettings.siteDescription}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={generalSettings.contactEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum File Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={generalSettings.maxFileSize}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, maxFileSize: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed File Types
                  </label>
                  <input
                    type="text"
                    value={generalSettings.allowedFileTypes}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, allowedFileTypes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                    placeholder=".pdf,.doc,.docx"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Comma-separated list of allowed file extensions
                  </p>
                </div>

                {/* Downloads Toggle */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        Enable Resource Downloads
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Control whether students can download resources. When disabled, students can only read/view resources online.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={generalSettings.downloadsEnabled}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, downloadsEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-admin-primary"></div>
                    </label>
                  </div>
                </div>

                {/* Registration Toggle */}
                <div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-purple-600" />
                        Allow New Registrations
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        When disabled, new students cannot create accounts. Existing users can still sign in.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={generalSettings.registrationEnabled}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, registrationEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-admin-primary"></div>
                    </label>
                  </div>
                </div>

                {/* Maintenance Mode Toggle */}
                <div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-amber-600" />
                        Maintenance Mode
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Shows a maintenance notice to all users and temporarily pauses new uploads.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={generalSettings.maintenanceMode}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-admin-primary"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => handleSaveSettings('general')}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2 px-6 py-2 bg-admin-primary text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Settings</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure notification preferences and alerts
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive email notifications for important events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">New Resource Alerts</p>
                      <p className="text-sm text-gray-600">Notify when new resources are uploaded</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newResourceAlert}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, newResourceAlert: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Approval Notifications</p>
                      <p className="text-sm text-gray-600">Notify when resources need approval</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.approvalNotification}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, approvalNotification: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Weekly Reports</p>
                      <p className="text-sm text-gray-600">Receive weekly activity summary emails</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.weeklyReport}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklyReport: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">System Alerts</p>
                      <p className="text-sm text-gray-600">Critical system notifications and updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.systemAlerts}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, systemAlerts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={() => handleSaveSettings('notifications')}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2 px-6 py-2 bg-admin-primary text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure security and authentication settings
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Require Email Verification</p>
                    <p className="text-sm text-gray-600">Users must verify email before accessing platform</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.requireEmailVerification}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, requireEmailVerification: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="10080"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Minutes a login stays valid (10080 = 7 days)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Login Attempts
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Password Length
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Require Strong Passwords</p>
                    <p className="text-sm text-gray-600">Enforce uppercase, numbers, and special characters</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.requireStrongPassword}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, requireStrongPassword: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                  </label>
                </div>

                <button
                  onClick={() => handleSaveSettings('security')}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2 px-6 py-2 bg-admin-primary text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Approval Workflow */}
            {activeTab === 'approval' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Approval Workflow Settings</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure resource approval and moderation settings
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Auto-Approve Resources</p>
                    <p className="text-sm text-gray-600">Automatically approve all uploaded resources</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalSettings.autoApprove}
                      onChange={(e) => setApprovalSettings({ ...approvalSettings, autoApprove: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Class Rep Approval Required</p>
                    <p className="text-sm text-gray-600">Class representatives can approve resources</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalSettings.requireClassRepApproval}
                      onChange={(e) => setApprovalSettings({ ...approvalSettings, requireClassRepApproval: e.target.checked })}
                      className="sr-only peer"
                      disabled={approvalSettings.autoApprove}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Admin Approval Required</p>
                    <p className="text-sm text-gray-600">Only administrators can approve resources</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalSettings.requireAdminApproval}
                      onChange={(e) => setApprovalSettings({ ...approvalSettings, requireAdminApproval: e.target.checked })}
                      className="sr-only peer"
                      disabled={approvalSettings.autoApprove}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Allow Student Uploads</p>
                    <p className="text-sm text-gray-600">Students can upload study materials</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalSettings.allowStudentUploads}
                      onChange={(e) => setApprovalSettings({ ...approvalSettings, allowStudentUploads: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-primary"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moderation Queue Limit
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={approvalSettings.moderationQueueLimit}
                    onChange={(e) => setApprovalSettings({ ...approvalSettings, moderationQueueLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-primary"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum resources in approval queue
                  </p>
                </div>

                <button
                  onClick={() => handleSaveSettings('approval')}
                  disabled={saveStatus === 'saving'}
                  className="flex items-center gap-2 px-6 py-2 bg-admin-primary text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}

            {/* My Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">My Profile</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    View and update your personal information
                  </p>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-admin-primary rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </h3>
                    <p className="text-gray-600">{user?.email}</p>
                    <span className="inline-block mt-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      {user?.role === 'admin' ? 'Administrator' : user?.role === 'class_rep' ? 'Class Representative' : 'Student'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">First Name</p>
                    <p className="font-medium text-gray-900">{user?.first_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Name</p>
                    <p className="font-medium text-gray-900">{user?.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium text-gray-900 capitalize">{user?.role?.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">Profile Update</h3>
                      <p className="text-sm text-blue-800">
                        To update your profile information, please contact the system administrator or use the main student portal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {saveStatus === 'success' && (
              <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Settings saved successfully!</span>
              </div>
            )}

            {/* Error Message */}
            {saveStatus === 'error' && (
              <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-up">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Failed to save settings. Please try again.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
