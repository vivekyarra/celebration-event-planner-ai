import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, Sparkles } from 'lucide-react';

interface CountdownTimerProps {
  eventDate: string;
  startTime?: string;
  eventTitle?: string;
}

interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  isToday: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  eventDate,
  startTime = '12:00',
  eventTitle,
}) => {
  const calculateTimeRemaining = (): TimeRemaining => {
    try {
      // Normalize date string (YYYY-MM-DD) and startTime (HH:mm)
      const targetString = startTime
        ? `${eventDate}T${startTime.length === 5 ? startTime : '12:00'}:00`
        : `${eventDate}T12:00:00`;
      
      const targetTime = new Date(targetString).getTime();
      const now = Date.now();
      const diff = targetTime - now;

      if (isNaN(targetTime)) {
        return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isToday: false };
      }

      const isPast = diff < 0;
      const absDiff = Math.abs(diff);

      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((absDiff / (1000 * 60)) % 60);
      const seconds = Math.floor((absDiff / 1000) % 60);

      const isToday = !isPast && days === 0;

      return {
        totalMs: diff,
        days,
        hours,
        minutes,
        seconds,
        isPast,
        isToday,
      };
    } catch {
      return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isToday: false };
    }
  };

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTimeRemaining);

  useEffect(() => {
    // Initial sync
    setTimeLeft(calculateTimeRemaining());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [eventDate, startTime]);

  const readableAnnouncement = timeLeft.isPast
    ? `The event ${eventTitle || ''} took place ${timeLeft.days} days ago.`
    : timeLeft.isToday
    ? `The event ${eventTitle || ''} is taking place today in ${timeLeft.hours} hours and ${timeLeft.minutes} minutes!`
    : `${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, and ${timeLeft.seconds} seconds remaining until ${eventTitle || 'the celebration'}.`;

  return (
    <div
      role="timer"
      aria-label={`Countdown to ${eventTitle || 'Event'}`}
      className="countdown-timer-container"
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Hidden ARIA announcement for screen readers */}
      <span className="sr-only" aria-live="polite">
        {readableAnnouncement}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            padding: '6px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {timeLeft.isPast ? <CheckCircle size={18} /> : <Clock size={18} />}
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {timeLeft.isPast ? 'Event Status' : timeLeft.isToday ? 'Happening Today!' : 'Countdown to Showtime'}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} color="#a5b4fc" />
            <span>{eventDate} at {startTime}</span>
          </div>
        </div>
      </div>

      {timeLeft.isPast ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            fontSize: '0.85rem',
            fontWeight: 600,
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <Sparkles size={14} />
          <span>Celebration Concluded & Archived</span>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={timerBoxStyle}>
            <span style={numberStyle}>{String(timeLeft.days).padStart(2, '0')}</span>
            <span style={labelStyle}>Days</span>
          </div>
          <span style={colonStyle}>:</span>
          <div style={timerBoxStyle}>
            <span style={numberStyle}>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span style={labelStyle}>Hrs</span>
          </div>
          <span style={colonStyle}>:</span>
          <div style={timerBoxStyle}>
            <span style={numberStyle}>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span style={labelStyle}>Min</span>
          </div>
          <span style={colonStyle}>:</span>
          <div style={timerBoxStyle}>
            <span style={numberStyle}>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span style={labelStyle}>Sec</span>
          </div>
        </div>
      )}
    </div>
  );
};

const timerBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(30, 41, 59, 0.8)',
  border: '1px solid rgba(99, 102, 241, 0.25)',
  borderRadius: '8px',
  padding: '4px 10px',
  minWidth: '46px',
};

const numberStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: '1.05rem',
  fontWeight: 800,
  color: '#ffffff',
  lineHeight: 1.1,
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.65rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#94a3b8',
  letterSpacing: '0.04em',
};

const colonStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 800,
  color: '#6366f1',
};

export default CountdownTimer;
