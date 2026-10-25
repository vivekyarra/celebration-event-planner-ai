import React, { useState, useEffect } from 'react';
import { PartyPopper, PlusCircle, Printer, Sparkles, KeyRound, Command, Loader2, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NavbarProps {
  onOpenWizard: () => void;
  onOpenApiKey: () => void;
  onOpenPalette?: () => void;
  hasApiKey: boolean;
  saveStatus?: 'saving' | 'saved' | 'idle' | 'error';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWizard,
  onOpenApiKey,
  onOpenPalette,
  hasApiKey,
  saveStatus = 'idle',
}) => {
  const [showSavedBadge, setShowSavedBadge] = useState(false);

  useEffect(() => {
    if (saveStatus === 'saved') {
      setShowSavedBadge(true);
      const timer = setTimeout(() => {
        setShowSavedBadge(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowSavedBadge(false);
    }
  }, [saveStatus]);

  const triggerCelebrationConfetti = () => {
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#a855f7'],
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        <div className="brand-section">
          <div className="brand-logo" aria-hidden="true">
            <Sparkles size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title">CelebriteAI</span>
              <span className="brand-badge">Winner Edition</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Intelligent Celebrations & Milestone Orchestrator
            </p>
          </div>
        </div>

        <nav className="navbar-actions" aria-label="Quick Actions">
          {saveStatus === 'saving' && (
            <div
              role="status"
              aria-live="polite"
              className="save-status-indicator saving"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
              }}
            >
              <Loader2 size={13} className="spin-animate" />
              <span>Saving...</span>
            </div>
          )}

          {showSavedBadge && (
            <div
              role="status"
              aria-live="polite"
              className="save-status-indicator saved"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <Check size={13} />
              <span>All changes saved</span>
            </div>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenPalette}
            title="Open Command Palette (Ctrl+K)"
            aria-label="Open Command Palette"
          >
            <Command size={14} aria-hidden="true" />
            <span style={{ fontSize: '0.78rem' }}>Commands (Ctrl+K)</span>
          </button>

          <button
            type="button"
            className="btn btn-festive"
            onClick={triggerCelebrationConfetti}
            aria-label="Celebrate with festive confetti"
          >
            <PartyPopper size={16} aria-hidden="true" />
            <span>Celebrate!</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenWizard}
            aria-label="Create or customize new celebration"
          >
            <PlusCircle size={16} aria-hidden="true" />
            <span>New Celebration</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
            aria-label="Print event dossier report"
            title="Print or Save PDF Dossier"
          >
            <Printer size={16} aria-hidden="true" />
            <span className="no-mobile">Print Dossier</span>
          </button>

          <button
            type="button"
            className={`btn ${hasApiKey ? 'btn-secondary' : 'btn-outline'}`}
            onClick={onOpenApiKey}
            aria-label="Gemini API Key configuration"
            title="Configure Gemini 1.5 Flash API Key"
          >
            <KeyRound size={16} color={hasApiKey ? '#34d399' : undefined} aria-hidden="true" />
            <span style={{ fontSize: '0.78rem' }}>{hasApiKey ? 'Gemini Live' : 'AI Settings'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
