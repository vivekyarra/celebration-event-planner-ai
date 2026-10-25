import React, { useState } from 'react';
import { X, Sparkles, Wand2, Calendar, DollarSign, Users, MapPin } from 'lucide-react';
import { EventPlan, EventType, VenueType } from '../types';
import {
  calculateBudgetBreakdown,
  generateCuratedTheme,
  generateInitialGuests,
  generateInvitations,
  generateMenu,
  generateRunOfShow,
  generateVendors,
} from '../services/plannerGenerator';

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
  const [eventType, setEventType] = useState<EventType>('birthday');
  const [title, setTitle] = useState('30th Milestone Golden Birthday');
  const [date, setDate] = useState('2026-11-20');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:30');
  const [guestCount, setGuestCount] = useState(60);
  const [totalBudget, setTotalBudget] = useState(8500);
  const [currency, setCurrency] = useState('USD');
  const [venueType, setVenueType] = useState<VenueType>('indoor');
  const [themeVibe, setThemeVibe] = useState('Golden Velvet Celebration');
  const [dietaryInput, setDietaryInput] = useState('Vegetarian, Gluten-Free, Vegan Friendly');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const loadPreset = (presetName: string) => {
    setValidationErrors([]);
    switch (presetName) {
      case 'wedding':
        setEventType('wedding');
        setTitle('Aarav & Ananya’s Royal Wedding');
        setDate('2026-12-18');
        setStartTime('16:00');
        setEndTime('23:30');
        setGuestCount(150);
        setTotalBudget(30000);
        setVenueType('indoor');
        setThemeVibe('Ethereal Botanical Elegance');
        setDietaryInput('Vegetarian, Gluten-Free, Vegan, Nut-Free');
        break;

      case 'hackathon':
        setEventType('hackathon');
        setTitle('NextGen AI 24H Global Hackathon');
        setDate('2026-11-15');
        setStartTime('09:00');
        setEndTime('21:00');
        setGuestCount(120);
        setTotalBudget(15000);
        setVenueType('indoor');
        setThemeVibe('Neon Cyberpunk Gala');
        setDietaryInput('Vegan, High-Protein, Caffeine Station, Halal');
        break;

      case 'birthday':
        setEventType('birthday');
        setTitle('Maya’s Retro Neon 30th Birthday');
        setDate('2026-11-28');
        setStartTime('19:00');
        setEndTime('01:00');
        setGuestCount(50);
        setTotalBudget(6000);
        setVenueType('rooftop');
        setThemeVibe('Golden Velvet Celebration');
        setDietaryInput('Vegetarian, Dairy-Free');
        break;

      case 'corporate':
        setEventType('corporate');
        setTitle('Annual Global Innovation Summit & Gala');
        setDate('2026-12-05');
        setStartTime('14:00');
        setEndTime('22:00');
        setGuestCount(200);
        setTotalBudget(45000);
        setVenueType('hybrid');
        setThemeVibe('Aurora Innovate Horizon');
        setDietaryInput('Gluten-Free, Halal, Jain Vegetarian, Vegan');
        break;
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();

    const errs: string[] = [];
    if (!title.trim()) {
      errs.push('Celebration / Event Name is required.');
    }
    if (guestCount < 5 || guestCount > 5000) {
      errs.push('Target guests must be between 5 and 5,000 attendees.');
    }
    if (totalBudget < 100 || totalBudget > 10000000) {
      errs.push('Total budget must be between 100 and 10,000,000.');
    }

    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors([]);

    const dietList = dietaryInput.split(',').map((s) => s.trim()).filter(Boolean);
    const newPlan: EventPlan = {
      id: `event-${Date.now()}`,
      title,
      eventType,
      eventDate: date,
      startTime,
      endTime,
      guestCount,
      totalBudget,
      currency,
      venueType,
      theme: themeVibe,
      dietaryPreferences: dietList,
      specialRequests: '',
      budgetBreakdown: calculateBudgetBreakdown(eventType, totalBudget),
      timeline: generateRunOfShow(eventType, startTime),
      vendors: generateVendors(eventType, totalBudget),
      guests: generateInitialGuests(guestCount),
      themePalette: generateCuratedTheme(eventType, themeVibe),
      invitations: generateInvitations(title, eventType, date, venueType),
      menu: generateMenu(eventType, dietList),
    };

    onPlanCreated(newPlan);
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="brand-logo" style={{ width: '36px', height: '36px' }}>
              <Wand2 size={20} />
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
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
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

        <form onSubmit={handleGenerate} noValidate>
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
              id="w-title"
              type="text"
              className="form-input"
              required
              aria-describedby="w-title-help"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (validationErrors.length > 0) setValidationErrors([]);
              }}
            />
            <span id="w-title-help" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
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
                onChange={(e) => setEventType(e.target.value as EventType)}
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
                onChange={(e) => setVenueType(e.target.value as VenueType)}
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
                onChange={(e) => setDate(e.target.value)}
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
                onChange={(e) => setStartTime(e.target.value)}
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
                aria-describedby="w-guests-help"
                value={guestCount}
                onChange={(e) => {
                  setGuestCount(parseInt(e.target.value, 10) || 0);
                  if (validationErrors.length > 0) setValidationErrors([]);
                }}
              />
              <span id="w-guests-help" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
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
                aria-describedby="w-budget-help"
                value={totalBudget}
                onChange={(e) => {
                  setTotalBudget(parseFloat(e.target.value) || 0);
                  if (validationErrors.length > 0) setValidationErrors([]);
                }}
              />
              <span id="w-budget-help" style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
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
              value={dietaryInput}
              onChange={(e) => setDietaryInput(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <Sparkles size={16} />
              <span>Generate AI Event Plan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
