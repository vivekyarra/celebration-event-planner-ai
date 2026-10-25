import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Trash2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveKey,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(keyInput.trim());
    onClose();
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveKey('');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="api-modal-title">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} color="#34d399" />
            <h3 id="api-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Gen AI Engine Configuration
            </h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
            CelebriteAI operates on <strong>Google Gemini 1.5 Flash</strong> for live interactive event generation and copilot advising.
          </p>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              fontSize: '0.8rem',
              color: '#a7f3d0',
              marginBottom: '16px',
              display: 'flex',
              gap: '8px',
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Graceful Autonomous Fallback:</strong> If no API key is provided, CelebriteAI automatically engages the local <em>Contextual Heuristic Assistant</em> with full budgeting, timeline, and invitation capabilities!
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gemini-key">
              Google Gemini API Key (Optional)
            </label>
            <input
              id="gemini-key"
              type="password"
              className="form-input"
              placeholder="AIzaSy..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: '#818cf8',
                marginTop: '6px',
              }}
            >
              <span>Get a free Gemini API key from Google AI Studio</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
            {apiKey ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleClear}
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={14} />
                <span>Clear Key</span>
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
