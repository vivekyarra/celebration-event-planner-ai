import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  DollarSign,
  Clock,
  Palette,
  UtensilsCrossed,
  Users,
  Briefcase,
  Mic,
  Layers,
  PartyPopper,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const actions = [
    { id: 'tab-budget', label: 'Go to Budget Allocator & Costs', icon: DollarSign, group: 'Navigation' },
    { id: 'tab-timeline', label: 'Go to Run of Show & Timeline', icon: Clock, group: 'Navigation' },
    { id: 'tab-theme', label: 'Go to Theme, Palette & Invitations', icon: Palette, group: 'Navigation' },
    { id: 'tab-menu', label: 'Go to Culinary & Banquet Menu', icon: UtensilsCrossed, group: 'Navigation' },
    { id: 'tab-guests', label: 'Go to Guest Registry & RSVPs', icon: Users, group: 'Navigation' },
    { id: 'tab-vendors', label: 'Go to Vendor Partner Directory', icon: Briefcase, group: 'Navigation' },
    { id: 'tab-speech', label: 'Go to AI Speech & Toast Studio', icon: Mic, group: 'Navigation' },
    { id: 'tab-scenarios', label: 'Go to Budget "What-If" Simulator', icon: Layers, group: 'Navigation' },
    { id: 'act-confetti', label: 'Trigger Festive Celebration Confetti 🎉', icon: PartyPopper, group: 'Actions' },
    { id: 'act-print', label: 'Print Event Dossier Report (PDF)', icon: Printer, group: 'Actions' },
    { id: 'act-wizard', label: 'Launch Autonomous Celebration Designer', icon: Sparkles, group: 'Actions' },
  ];

  const filtered = actions.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.group.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selected index when query changes or dialog opens
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
    }
  }, [isOpen]);

  // Global keydown: Ctrl+K, Escape & Focus Trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap inside the modal dialog
  useEffect(() => {
    if (!isOpen) return;
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = modalEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) return;

      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    modalEl.addEventListener('keydown', handleTabKey);
    return () => modalEl.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  // Keyboard navigation for results list (ArrowDown, ArrowUp, Enter)
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetAction = filtered[selectedIndex];
      if (targetAction) {
        onSelectAction(targetAction.id);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Command Palette"
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content" style={{ maxWidth: '540px', padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            gap: '10px',
            background: 'var(--bg-surface)',
          }}
        >
          <Search size={18} color="var(--text-dim)" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={filtered.length > 0}
            aria-controls="command-palette-results"
            placeholder="Type a command, search modules, or take action (Ctrl+K)..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
            }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close command palette"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div
          id="command-palette-results"
          role="listbox"
          aria-label="Suggested Commands"
          style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              No commands found matching "{query}"
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  id={`command-option-${item.id}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelectAction(item.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#818cf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{item.label}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: isSelected ? '#a5b4fc' : 'var(--text-dim)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div
          style={{
            padding: '8px 16px',
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-dim)',
          }}
        >
          <span>Tip: Press <strong>Esc</strong> to exit</span>
          <span>Shortcut: <strong>Ctrl + K</strong></span>
        </div>

        <div
          style={{
            padding: '10px 16px',
            background: 'rgba(15, 23, 42, 0.75)',
            borderTop: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
          aria-label="Available shortcuts list"
        >
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
            Available shortcuts:
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '4px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div>Ctrl+K → Command Palette</div>
            <div>Tab → Next module</div>
            <div>Shift+Tab → Previous module</div>
            <div>Escape → Close modal</div>
            <div>↑ / ↓ → Navigate actions</div>
            <div>Enter → Select action</div>
          </div>
        </div>
      </div>
    </div>
  );
};
