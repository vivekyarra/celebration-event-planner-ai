import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  Circle,
  Plus,
  Calendar,
  Download,
  User,
} from 'lucide-react';
import { EventPlan, TimelineItem, TimelinePhase } from '../types';
import { useTimelineManager } from '../hooks/useTimelineManager';

interface TimelineRunOfShowProps {
  plan: EventPlan;
  onUpdateTimeline: (newTimeline: TimelineItem[]) => void;
}

export const TimelineRunOfShow: React.FC<TimelineRunOfShowProps> = ({
  plan,
  onUpdateTimeline,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [time, setTime] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<TimelinePhase>('ceremony');
  const [coordinator, setCoordinator] = useState('');

  // Delegated to custom timeline hook
  const {
    timeline,
    addMilestone,
    toggleComplete,
    filterByPhase,
    sortChronologically,
    isSequenced,
    sequencingWarnings,
  } = useTimelineManager(plan.timeline, onUpdateTimeline);

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !title) return;

    addMilestone({
      time,
      title,
      description,
      phase,
      leadCoordinator: coordinator || 'Event Host',
      isCompleted: false,
    });

    setTime('');
    setTitle('');
    setDescription('');
    setCoordinator('');
    setShowAddModal(false);
  };

  const exportICS = () => {
    const dateFormatted = plan.eventDate.replace(/-/g, '');
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CelebriteAI//Event Run of Show//EN',
      'CALSCALE:GREGORIAN',
      ...timeline.map((t) => [
        'BEGIN:VEVENT',
        `SUMMARY:${plan.title} - ${t.title}`,
        `DESCRIPTION:${t.description} (Coordinator: ${t.leadCoordinator})`,
        `DTSTART:${dateFormatted}T090000Z`,
        `DTEND:${dateFormatted}T180000Z`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ]).flat(),
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${plan.title.replace(/\s+/g, '_')}_Schedule.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTimeline = filterByPhase(selectedPhase as TimelinePhase | 'all');

  const phaseColors: Record<TimelinePhase, { bg: string; text: string }> = {
    setup: { bg: 'rgba(100, 116, 139, 0.2)', text: '#94a3b8' },
    arrival: { bg: 'rgba(14, 165, 233, 0.2)', text: '#38bdf8' },
    ceremony: { bg: 'rgba(236, 72, 153, 0.2)', text: '#f472b6' },
    dining: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24' },
    entertainment: { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc' },
    winddown: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' },
  };

  return (
    <div className="section-card" aria-label="Event Run-of-Show and Timeline">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Clock size={24} color="#a855f7" />
            Master Run-of-Show & Timeline
          </h2>
          <p className="section-subtitle">
            Synchronized execution schedule for coordinators, emcees, and vendor partners
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportICS}>
            <Download size={14} />
            <span>Export iCal (.ics)</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add Milestone</span>
          </button>
        </div>
      </div>

      {/* Sequence warning if milestones are out of chronological order */}
      {!isSequenced && sequencingWarnings.length > 0 && (
        <div
          role="alert"
          style={{
            padding: '10px 14px',
            marginBottom: '16px',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: '0.82rem',
            color: '#fbbf24',
          }}
        >
          <span>⚠️ <strong>Timing Sequence Warning</strong>: {sequencingWarnings[0]}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={sortChronologically}
            style={{ fontSize: '0.75rem', padding: '3px 8px' }}
          >
            Auto-Sort Timeline
          </button>
        </div>
      )}

      {/* Phase Filters */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {['all', 'setup', 'arrival', 'ceremony', 'dining', 'entertainment', 'winddown'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setSelectedPhase(p)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              border: '1px solid var(--border)',
              background: selectedPhase === p ? 'var(--primary)' : 'var(--bg-surface)',
              color: selectedPhase === p ? 'white' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Timeline Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredTimeline.map((item, index) => {
          const phaseStyle = phaseColors[item.phase] || { bg: 'rgba(255, 255, 255, 0.1)', text: '#ffffff' };
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                background: item.isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface)',
                border: item.isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.2s',
              }}
            >
              <button
                type="button"
                onClick={() => toggleComplete(item.id)}
                style={{
                  marginTop: '2px',
                  color: item.isCompleted ? '#10b981' : 'var(--text-dim)',
                  cursor: 'pointer',
                }}
                aria-label={item.isCompleted ? 'Mark milestone incomplete' : 'Mark milestone complete'}
              >
                {item.isCompleted ? <CheckCircle size={22} /> : <Circle size={22} />}
              </button>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                    }}
                  >
                    {item.time}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: phaseStyle.bg,
                      color: phaseStyle.text,
                    }}
                  >
                    {item.phase}
                  </span>
                  <h3
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: item.isCompleted ? 'var(--text-muted)' : 'var(--text-main)',
                      textDecoration: item.isCompleted ? 'line-through' : 'none',
                    }}
                  >
                    {item.title}
                  </h3>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {item.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  <User size={12} />
                  <span>Lead: {item.leadCoordinator}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-mile-title">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 id="add-mile-title" style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>
              Add Run-of-Show Milestone
            </h3>
            <form onSubmit={handleAddMilestone}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="mile-time">
                    Time (e.g. 7:30 PM)
                  </label>
                  <input
                    id="mile-time"
                    type="text"
                    className="form-input"
                    required
                    placeholder="7:30 PM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="mile-phase">
                    Phase
                  </label>
                  <select
                    id="mile-phase"
                    className="form-select"
                    value={phase}
                    onChange={(e) => setPhase(e.target.value as TimelinePhase)}
                  >
                    <option value="setup">Setup</option>
                    <option value="arrival">Arrival</option>
                    <option value="ceremony">Ceremony / Highlight</option>
                    <option value="dining">Dining & Toasts</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="winddown">Wind-down</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mile-title">
                  Milestone Title
                </label>
                <input
                  id="mile-title"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. VIP Champagne Toast & Speech"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mile-desc">
                  Detailed Operational Notes
                </label>
                <textarea
                  id="mile-desc"
                  className="form-textarea"
                  rows={3}
                  placeholder="Cue lighting to 30%, background track starts playing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mile-lead">
                  Responsible Coordinator / Lead
                </label>
                <input
                  id="mile-lead"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Master of Ceremonies / DJ"
                  value={coordinator}
                  onChange={(e) => setCoordinator(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
