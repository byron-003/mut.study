import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAlert, useConfirm } from '../hooks/useAlert';
import CustomAlert from '../components/CustomAlert';
import CustomConfirm from '../components/CustomConfirm';
import {
  Mail, CheckCircle, AlertTriangle, XCircle, RefreshCw, Send, Trash2,
  Shield, Settings2, Loader, ChevronDown, ChevronUp
} from 'lucide-react';

const EVENT_LABELS = {
  config_check: 'Configuration Check',
  test_email: 'Test Email',
  password_reset_otp: 'Password Reset OTP',
  password_reset_success: 'Reset Success Notification',
  contact_reply: 'Contact Reply',
  contact_notification: 'Contact Notification',
};

const STATUS_STYLES = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  skipped: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
};

const Banner = ({ lastCheck, configured }) => {
  if (!lastCheck && configured?.apiKeyPresent) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-900 dark:text-blue-200">Email service status has not been checked yet</p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Run a configuration check below to verify your SMTP credentials and sender address.</p>
        </div>
      </div>
    );
  }

  const status = lastCheck?.status || 'not_configured';

  if (status === 'success') {
    return (
      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-green-900 dark:text-green-200">Email configured successfully</p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">{lastCheck.message}</p>
        </div>
      </div>
    );
  }

  if (status === 'warning') {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900 dark:text-yellow-200">Email service partially configured</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{lastCheck.message}</p>
        </div>
      </div>
    );
  }

  if (status === 'disabled') {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-start gap-3">
        <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">Outbound email is disabled</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Enable the "Send emails" switch below to allow the platform to deliver emails.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-red-900 dark:text-red-200">
          {status === 'not_configured' ? 'Email service is not configured' : 'Email service error'}
        </p>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{lastCheck?.message || 'Add your SMTP credentials in the configuration below.'}</p>
      </div>
    </div>
  );
};

const EmailPage = () => {
  const { alertState, showAlert, closeAlert } = useAlert();
  const { confirmState, showConfirm } = useConfirm();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);
  const [testTo, setTestTo] = useState('');

  const [form, setForm] = useState({
    email_enabled: true,
    email_from_name: '',
    email_from_address: '',
    email_support_address: '',
    email_smtp_host: '',
    email_smtp_port: 587,
    email_smtp_user: '',
    email_smtp_key: '',
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getEmailStatus();
      setStatus(response.data.data);
      setForm((prev) => ({
        ...prev,
        email_enabled: response.data.data.configured.enabled,
        email_from_name: response.data.data.configured.fromName,
        email_from_address: response.data.data.configured.fromAddress,
        email_support_address: response.data.data.configured.supportEmail,
        email_smtp_host: response.data.data.configured.smtpHost || '',
        email_smtp_port: response.data.data.configured.smtpPort || 587,
        email_smtp_user: prev.email_smtp_user || '',
        email_smtp_key: prev.email_smtp_key || '',
      }));
      if (!testTo) setTestTo(response.data.data.configured.supportEmail || '');
    } catch (error) {
      console.error('Error fetching email status:', error);
      showAlert('Error', 'Failed to load email service status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheck = async () => {
    try {
      setChecking(true);
      const response = await adminAPI.runEmailCheck();
      const result = response.data.data;
      showAlert('Configuration Check', result.message, result.status === 'success' ? 'success' : result.status === 'warning' ? 'warning' : 'error');
      await fetchStatus();
    } catch (error) {
      console.error('Error running email check:', error);
      showAlert('Error', 'Failed to run email configuration check', 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        email_enabled: form.email_enabled,
        email_from_name: form.email_from_name.trim(),
        email_from_address: form.email_from_address.trim(),
        email_support_address: form.email_support_address.trim(),
        email_smtp_host: form.email_smtp_host.trim(),
        email_smtp_port: Number(form.email_smtp_port) || 587,
      };
      if (form.email_smtp_user.trim()) payload.email_smtp_user = form.email_smtp_user.trim();
      if (form.email_smtp_key.trim()) payload.email_smtp_key = form.email_smtp_key.trim();
      await adminAPI.updateSettings(payload);
      showAlert('Saved', 'Email configuration saved', 'success');
      setForm((prev) => ({ ...prev, email_smtp_key: '', email_smtp_user: '' }));
      await fetchStatus();
    } catch (error) {
      console.error('Error saving email config:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to save email configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testTo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testTo.trim())) {
      showAlert('Invalid Address', 'Enter a valid recipient email address.', 'error');
      return;
    }
    try {
      setSending(true);
      const response = await adminAPI.sendTestEmail(testTo.trim());
      const result = response.data.data;
      showAlert(
        result.success ? 'Test Email Sent' : 'Test Email Failed',
        result.message,
        result.success ? 'success' : 'error'
      );
      await fetchStatus();
    } catch (error) {
      console.error('Error sending test email:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to send test email', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleClearLogs = () => {
    showConfirm({
      title: 'Clear Email Logs',
      message: 'Delete all email log history? This cannot be undone.',
      onConfirm: async () => {
        try {
          setClearing(true);
          await adminAPI.clearEmailLogs();
          showAlert('Success', 'Email logs cleared', 'success');
          await fetchStatus();
        } catch (error) {
          console.error('Error clearing email logs:', error);
          showAlert('Error', 'Failed to clear email logs', 'error');
        } finally {
          setClearing(false);
        }
      },
    });
  };

  const logs = (status?.logs || []).filter((log) => filter === 'all' || log.status === filter);
  const counts = status?.counts || { success: 0, failed: 0, warning: 0, skipped: 0 };

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomAlert
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={closeAlert}
      />
      <CustomConfirm
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Service</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configuration, delivery status and send logs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            {checking ? <Loader className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {checking ? 'Checking...' : 'Run Configuration Check'}
          </button>
          <button
            onClick={() => { setRefreshing(true); fetchStatus().finally(() => setRefreshing(false)); }}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status banner */}
      <Banner lastCheck={status?.lastCheck} configured={status?.configured} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{counts.success || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{counts.failed || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Warnings</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{counts.warning || 0}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Mail className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Skipped</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{counts.skipped || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-admin-primary" />
            Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
              <p className="text-sm text-gray-900 dark:text-white font-medium uppercase">
                {status?.configured?.provider === 'brevo' ? 'Brevo SMTP' : (status?.configured?.provider || 'brevo')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Server: {status?.configured?.smtpHost || 'smtp-relay.brevo.com'}:{status?.configured?.smtpPort || 587}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                SMTP login: {status?.configured?.smtpUserMasked || 'not set'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                SMTP key: {status?.configured?.smtpKeyMasked || 'not set'} ({status?.configured?.smtpKeySource === 'environment' ? 'from server environment' : status?.configured?.smtpKeyPresent ? 'from settings' : 'missing'})
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Send emails</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Master switch for all outbound email</p>
              </div>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, email_enabled: !prev.email_enabled }))}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 items-center rounded-full transition-colors ${form.email_enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.email_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From name</label>
                <input
                  type="text"
                  value={form.email_from_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, email_from_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From address</label>
                <input
                  type="email"
                  value={form.email_from_address}
                  onChange={(e) => setForm((prev) => ({ ...prev, email_from_address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reply-to address</label>
              <input
                type="email"
                value={form.email_support_address}
                onChange={(e) => setForm((prev) => ({ ...prev, email_support_address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP host</label>
                <input
                  type="text"
                  value={form.email_smtp_host}
                  onChange={(e) => setForm((prev) => ({ ...prev, email_smtp_host: e.target.value }))}
                  placeholder="smtp-relay.brevo.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP port</label>
                <input
                  type="number"
                  value={form.email_smtp_port}
                  onChange={(e) => setForm((prev) => ({ ...prev, email_smtp_port: e.target.value }))}
                  placeholder="587"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP login</label>
              <input
                type="text"
                value={form.email_smtp_user}
                onChange={(e) => setForm((prev) => ({ ...prev, email_smtp_user: e.target.value }))}
                placeholder={status?.configured?.smtpUserMasked || 'user@smtp-brevo.com'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to use the SMTP_USER server environment variable.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP key (password)</label>
              <input
                type="password"
                value={form.email_smtp_key}
                onChange={(e) => setForm((prev) => ({ ...prev, email_smtp_key: e.target.value }))}
                placeholder={status?.configured?.smtpKeyMasked || 'xsmtpsib-...'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to keep the current key. Empty key uses the server's BREVO_SMTP_KEY environment variable.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-admin-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>

        {/* Test email */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-admin-primary" />
            Send Test Email
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Send a test message to confirm the email service is delivering. Sending to your own address is the
            fastest way to verify end-to-end delivery.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient</label>
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleSendTest}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-admin-primary text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
            >
              {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : 'Send Test Email'}
            </button>
          </div>
          {status?.lastCheck && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Last check</p>
              <p className="text-sm text-gray-900 dark:text-white">{status.lastCheck.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(status.lastCheck.created_at).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-admin-primary" />
            Email Logs <span className="text-sm font-normal text-gray-400">({status?.logs?.length || 0})</span>
          </h2>
          <button
            onClick={handleClearLogs}
            disabled={clearing}
            className="flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {clearing ? 'Clearing...' : 'Clear Logs'}
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {['all', 'success', 'failed', 'warning', 'skipped'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab
                  ? 'bg-admin-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No email logs found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Send a test email or run a configuration check to see activity here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[log.status] || STATUS_STYLES.info}`}>
                      {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {EVENT_LABELS[log.event] || log.event}
                    </span>
                    {log.recipient && <span className="text-sm text-gray-500 dark:text-gray-400">{log.recipient}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</span>
                    {log.details && (
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="text-gray-400 hover:text-admin-primary"
                      >
                        {expandedLog === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{log.message}</p>
                {log.subject && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Subject: {log.subject}</p>}
                {expandedLog === log.id && log.details && (
                  <pre className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">
                    {log.details}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPage;