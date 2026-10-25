import React, { useEffect, useRef } from 'react';
import { X, Sparkles, Wand2 } from 'lucide-react';
import { EventPlan, EventType, VenueType } from '../types';
import { useEventWizard } from '../hooks/useEventWizard';

interface EventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (plan: EventPlan) => void;
}

export const EventWizardModal: React.FC<EventWizardModalProps> = ({
  isOpen,
  onClose,
  onPlanCreated,
}) => {
  const {
    title,
    eventType,
    venueType,
    date,
    startTime,
    guestCount,
    totalBudget,
    currency,
    dietaryTags,
    fieldErrors,
    validationErrors,
    handleFieldChange,
    handleSubmit,
    loadPreset,
  } = useEventWizard({
    onPlanCreated: (plan) => {
      onPlanCreated(plan);
      onClose();
    },
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus trap inside the modal dialog
  useEffect(() => {
    if (!isOpen) return;
    const modalEl = modalRef.current;
    if (!modalEl) return;

    // Focus initial input
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = modalEl.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

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

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo" style={{ width: '36px', height: '36px' }}>
              <Wand2 size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 id="wizard-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Autonomous Celebration Designer
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tell us your celebration goals and let AI configure budget, timeline & RSVPs
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: '20px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Instant Celebration Presets:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => loadPreset('wedding')}
            >
              💍 Royal Wedding
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => loadPreset('birthday')}
            >
              🎂 30th Birthday
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => loadPreset('hackathon')}
            >
              ⚡ Tech Hackathon
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => loadPreset('corporate')}
            >
              🏢 Annual Tech Gala
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {validationErrors.length > 0 && (
            <div
              role="alert"
              aria-live="assertive"
              className="form-validation-summary"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '18px',
                color: '#fca5a5',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '6px', color: '#f87171' }}>
                Please resolve the following validation errors:
              </div>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="w-title">
              Celebration / Event Name
            </label>
            <input
              ref={titleInputRef}
              id="w-title"
              type="text"
              className="form-input"
              required
              aria-describedby={
                fieldErrors.title ? 'w-title-error w-title-help' : 'w-title-help'
              }
              aria-invalid={Boolean(fieldErrors.title)}
              aria-errormessage={fieldErrors.title ? 'w-title-error' : undefined}
              value={title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
            />
            {fieldErrors.title && (
              <span
                id="w-title-error"
                className="field-error-message"
                style={{
                  fontSize: '0.75rem',
                  color: '#f87171',
                  marginTop: '4px',
                  display: 'block',
                  fontWeight: 600,
                }}
              >
                {fieldErrors.title}
              </span>
            )}
            <span
              id="w-title-help"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                marginTop: '4px',
                display: 'block',
              }}
            >
              Give your celebration a memorable, recognizable name
            </span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="w-type">
                Celebration Vertical
              </label>
              <select
                id="w-type"
                className="form-select"
                value={eventType}
                onChange={(e) => handleFieldChange('eventType', e.target.value as EventType)}
              >
                <option value="birthday">Birthday Party</option>
                <option value="wedding">Wedding & Reception</option>
                <option value="corporate">Corporate Event / Gala</option>
                <option value="hackathon">Hackathon / Tech Fest</option>
                <option value="anniversary">Anniversary</option>
                <option value="festive_gala">Festive Gala (Diwali/New Year)</option>
                <option value="baby_shower">Baby Shower</option>
                <option value="milestone">Milestone Celebration</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="w-venue">
                Venue Type
              </label>
              <select
                id="w-venue"
                className="form-select"
                value={venueType}
                onChange={(e) => handleFieldChange('venueType', e.target.value as VenueType)}
              >
                <option value="indoor">Indoor Banquet / Ballroom</option>
                <option value="outdoor">Outdoor Garden / Lawn</option>
                <option value="rooftop">Rooftop Lounge</option>
                <option value="beach">Beach / Waterfront</option>
                <option value="hybrid">Hybrid (Indoor + Terrace)</option>
                <option value="virtual">Virtual / Livestream</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="w-date">
                Event Date
              </label>
              <input
                id="w-date"
                type="date"
                className="form-input"
                required
                value={date}
                onChange={(e) => handleFieldChange('date', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="w-start">
                Start Time
              </label>
              <input
                id="w-start"
                type="text"
                className="form-input"
                value={startTime}
                onChange={(e) => handleFieldChange('startTime', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="w-guests">
                Target Guests
              </label>
              <input
                id="w-guests"
                type="number"
                min="5"
                max="5000"
                className="form-input"
                required
                aria-describedby={
                  fieldErrors.guestCount ? 'w-guests-error w-guests-help' : 'w-guests-help'
                }
                aria-invalid={Boolean(fieldErrors.guestCount)}
                aria-errormessage={fieldErrors.guestCount ? 'w-guests-error' : undefined}
                value={guestCount}
                onChange={(e) =>
                  handleFieldChange('guestCount', parseInt(e.target.value, 10) || 0)
                }
              />
              {fieldErrors.guestCount && (
                <span
                  id="w-guests-error"
                  className="field-error-message"
                  style={{
                    fontSize: '0.75rem',
                    color: '#f87171',
                    marginTop: '4px',
                    display: 'block',
                    fontWeight: 600,
                  }}
                >
                  {fieldErrors.guestCount}
                </span>
              )}
              <span
                id="w-guests-help"
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Must be between 5 and 5,000 guests
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="w-budget">
                Total Budget ({currency})
              </label>
              <input
                id="w-budget"
                type="number"
                min="100"
                max="10000000"
                step="50"
                className="form-input"
                required
                aria-describedby={
                  fieldErrors.totalBudget ? 'w-budget-error w-budget-help' : 'w-budget-help'
                }
                aria-invalid={Boolean(fieldErrors.totalBudget)}
                aria-errormessage={fieldErrors.totalBudget ? 'w-budget-error' : undefined}
                value={totalBudget}
                onChange={(e) =>
                  handleFieldChange('totalBudget', parseFloat(e.target.value) || 0)
                }
              />
              {fieldErrors.totalBudget && (
                <span
                  id="w-budget-error"
                  className="field-error-message"
                  style={{
                    fontSize: '0.75rem',
                    color: '#f87171',
                    marginTop: '4px',
                    display: 'block',
                    fontWeight: 600,
                  }}
                >
                  {fieldErrors.totalBudget}
                </span>
              )}
              <span
                id="w-budget-help"
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Must be between 100 and 10,000,000
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="w-diet">
              Dietary Special Requirements (comma separated)
            </label>
            <input
              id="w-diet"
              type="text"
              className="form-input"
              value={dietaryTags}
              onChange={(e) => handleFieldChange('dietaryTags', e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '24px',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <Sparkles size={16} aria-hidden="true" />
              <span>Generate AI Event Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
