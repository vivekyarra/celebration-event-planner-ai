import React from 'react';
import { PartyPopper, PlusCircle, Printer, Sparkles, KeyRound } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NavbarProps {
  onOpenWizard: () => void;
  onOpenApiKey: () => void;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenWizard,
  onOpenApiKey,
  hasApiKey,
}) => {
  const triggerCelebrationConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
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
              <span className="brand-badge">Autonomous Event Planner</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Intelligent Celebrations & Milestone Orchestrator
            </p>
          </div>
        </div>

        <nav className="navbar-actions" aria-label="Quick Actions">
          <button
            type="button"
            className="btn btn-festive"
            onClick={triggerCelebrationConfetti}
            aria-label="Celebrate with festive confetti"
          >
            <PartyPopper size={16} />
            <span>Celebrate!</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenWizard}
            aria-label="Create or customize new celebration"
          >
            <PlusCircle size={16} />
            <span>New Celebration</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrint}
            aria-label="Print event dossier report"
            title="Print or Save PDF Dossier"
          >
            <Printer size={16} />
            <span className="no-mobile">Print Dossier</span>
          </button>

          <button
            type="button"
            className={`btn ${hasApiKey ? 'btn-secondary' : 'btn-outline'}`}
            onClick={onOpenApiKey}
            aria-label="Gemini API Key configuration"
            title="Configure Gemini 1.5 Flash API Key"
          >
            <KeyRound size={16} color={hasApiKey ? '#34d399' : undefined} />
            <span style={{ fontSize: '0.78rem' }}>{hasApiKey ? 'Gemini Live' : 'AI Settings'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
