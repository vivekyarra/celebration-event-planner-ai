import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  CheckCircle2,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { EventPlan } from '../types';
import { CountdownTimer } from './CountdownTimer';

interface EventHeaderProps {
  plan: EventPlan;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ plan }) => {
  const confirmedGuests = plan.guests.filter((g) => g.rsvpStatus === 'confirmed').length;
  const costPerGuest = Math.round(plan.totalBudget / (plan.guestCount || 1));
  const completedMilestones = plan.timeline.filter((t) => t.isCompleted).length;

  return (
    <section className="event-header-card" aria-label="Event Overview">
      <div className="event-header-top" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
        <div className="event-headline">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
              {plan.eventType.replace('_', ' ')}
            </span>
            <span className="badge badge-success">
              <Sparkles size={12} />
              {plan.themePalette.name}
            </span>
          </div>
          <h1>{plan.title}</h1>
          <div className="event-meta-tags">
            <span className="meta-chip">
              <Calendar size={14} />
              {plan.eventDate}
            </span>
            <span className="meta-chip">
              <Clock size={14} />
              {plan.startTime} – {plan.endTime}
            </span>
            <span className="meta-chip" style={{ textTransform: 'capitalize' }}>
              <MapPin size={14} />
              {plan.venueType} Venue
            </span>
          </div>
        </div>

        {/* Live Event Countdown Clock */}
        <div style={{ minWidth: '300px' }}>
          <CountdownTimer
            eventDate={plan.eventDate}
            startTime={plan.startTime}
            eventTitle={plan.title}
          />
        </div>
      </div>

      <div className="stat-pills-grid" role="region" aria-label="Key Performance Indicators">
        <div
          className="stat-pill"
          role="group"
          aria-label={`Total Budget: ${plan.currency} ${plan.totalBudget.toLocaleString()}`}
        >
          <div className="stat-pill-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }} aria-hidden="true">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="stat-pill-label">Total Budget</div>
            <div className="stat-pill-value">
              {plan.currency} {plan.totalBudget.toLocaleString()}
            </div>
          </div>
        </div>

        <div
          className="stat-pill"
          role="group"
          aria-label={`Target Guests: ${plan.guestCount} Guests`}
        >
          <div className="stat-pill-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }} aria-hidden="true">
            <Users size={20} />
          </div>
          <div>
            <div className="stat-pill-label">Target Guests</div>
            <div className="stat-pill-value">{plan.guestCount} Guests</div>
          </div>
        </div>

        <div
          className="stat-pill"
          role="group"
          aria-label={`Confirmed RSVPs: ${confirmedGuests} of ${plan.guests.length}`}
        >
          <div className="stat-pill-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }} aria-hidden="true">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="stat-pill-label">Confirmed RSVPs</div>
            <div className="stat-pill-value">
              {confirmedGuests} / {plan.guests.length}
            </div>
          </div>
        </div>

        <div
          className="stat-pill"
          role="group"
          aria-label={`Unit Economics: ${plan.currency} ${costPerGuest} per guest`}
        >
          <div className="stat-pill-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }} aria-hidden="true">
            <PieChart size={20} />
          </div>
          <div>
            <div className="stat-pill-label">Unit Economics</div>
            <div className="stat-pill-value">
              {plan.currency} {costPerGuest} / guest
            </div>
          </div>
        </div>

        <div
          className="stat-pill"
          role="group"
          aria-label={`Timeline Progress: ${completedMilestones} of ${plan.timeline.length} Steps completed`}
        >
          <div className="stat-pill-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }} aria-hidden="true">
            <Clock size={20} />
          </div>
          <div>
            <div className="stat-pill-label">Timeline Run</div>
            <div className="stat-pill-value">
              {completedMilestones} / {plan.timeline.length} Steps
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
