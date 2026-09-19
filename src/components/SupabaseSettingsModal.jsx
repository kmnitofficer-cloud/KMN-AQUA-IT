import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  Copy, 
  Check, 
  KeyRound 
} from 'lucide-react';
import { 
  getSupabaseCredentials, 
  saveSupabaseCredentials, 
  testConnection, 
  seedSupabaseBulk 
} from '../lib/supabaseClient';

export default function SupabaseSettingsModal({
  isOpen,
  onClose,
  machines,
  services,
  onSyncComplete,
  showToast
}) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [testState, setTestState] = useState({ loading: false, result: null });
  const [syncState, setSyncState] = useState({ loading: false, message: '' });
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setKey(creds.key);
      setTestState({ loading: false, result: null });
      setSyncState({ loading: false, message: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim() || !key.trim()) {
      setTestState({
        loading: false,
        result: { success: false, error: 'Please enter both Supabase URL and Anon Key' }
      });
      return;
    }

    setTestState({ loading: true, result: null });
    const res = await testConnection(url, key);
    setTestState({ loading: false, result: res });
  };

  const handleSaveCredentials = () => {
    saveSupabaseCredentials(url, key);
    showToast('Supabase settings saved!', 'success');
    onSyncComplete();
    onClose();
  };

  const handleClearCredentials = () => {
    if (window.confirm('Disconnect from Supabase and revert to local storage?')) {
      saveSupabaseCredentials('', '');
      setUrl('');
      setKey('');
      setTestState({ loading: false, result: null });
      showToast('Reverted to Local Storage (Offline Mode)', 'info');
      onSyncComplete();
    }
  };

  const handlePushSeedData = async () => {
    if (!url || !key) {
      alert('Please save and test your Supabase connection first.');
      return;
    }

    setSyncState({ loading: true, message: 'Uploading computers and service logs to Supabase...' });
    try {
      // Save credentials first
      saveSupabaseCredentials(url, key);
      const res = await seedSupabaseBulk(machines, services);
      setSyncState({
        loading: false,
        message: `Successfully uploaded ${res.machinesCount} machines and ${res.servicesCount} service records to Supabase!`
      });
      showToast('Data synced to Supabase!', 'success');
      onSyncComplete();
    } catch (err) {
      setSyncState({
        loading: false,
        message: `Upload error: ${err.message}. Make sure you ran supabase_schema.sql first!`
      });
    }
  };

  const handleCopySchemaPath = () => {
    navigator.clipboard.writeText('supabase_schema.sql');
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    showToast('Copied schema filename!', 'info');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Database size={18} color="var(--brand-primary)" />
            <span>Supabase Cloud Database Settings</span>
          </h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Information banner */}
          <div style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            fontSize: '0.82rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem'
          }}>
            Connect your <strong>Supabase</strong> PostgreSQL database for real-time cloud storage across all offices. 
            If unconfigured, the dashboard runs seamlessly in <strong>Local Storage Mode</strong> with your 76 computers pre-loaded.
          </div>

          {/* Form */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Supabase Project URL</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://your-project-id.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Supabase Anon / Public API Key</label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>

          {/* Connection Test Result */}
          {testState.result && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
              background: testState.result.success ? 'var(--accent-emerald-bg)' : 'var(--accent-rose-bg)',
              color: testState.result.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              border: `1px solid ${testState.result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
            }}>
              {testState.result.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>
                {testState.result.success 
                  ? (testState.result.warning || 'Connection successful! Supabase is reachable.') 
                  : `Error: ${testState.result.error}`}
              </span>
            </div>
          )}

          {/* Actions: Test, Save, Clear */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleTestConnection}
              disabled={testState.loading}
            >
              <RefreshCw size={13} className={testState.loading ? 'spin' : ''} />
              <span>{testState.loading ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveCredentials}
            >
              <KeyRound size={13} />
              <span>Save & Connect</span>
            </button>

            {(url || key) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleClearCredentials}
                style={{ color: 'var(--accent-rose)' }}
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Cloud Migration Box */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem'
          }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              One-Click Cloud Migration
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Push your currently loaded <strong>{machines.length} computers</strong> and <strong>{services.length} maintenance records</strong> straight into your Supabase tables.
            </p>

            <button
              type="button"
              className="btn btn-emerald btn-sm"
              onClick={handlePushSeedData}
              disabled={syncState.loading || !url || !key}
            >
              <UploadCloud size={14} />
              <span>{syncState.loading ? 'Uploading...' : 'Push All Records to Supabase'}</span>
            </button>

            {syncState.message && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {syncState.message}
              </div>
            )}
          </div>

          {/* SQL Schema Notice */}
          <div style={{
            marginTop: '1.25rem',
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem'
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              SQL Schema Setup Script:
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              Open your Supabase Project &gt; SQL Editor, and paste the code from <code>supabase_schema.sql</code> in this project folder.
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
