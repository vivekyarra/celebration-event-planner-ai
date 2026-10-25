import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { EventPlan, Guest, RSVPStatus } from '../types';
import { useGuestManager } from '../hooks/useGuestManager';

interface GuestTrackerProps {
  plan: EventPlan;
  onUpdateGuests: (newGuests: Guest[]) => void;
}

export const GuestTracker: React.FC<GuestTrackerProps> = ({
  plan,
  onUpdateGuests,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Business logic delegated to custom hook
  const {
    guests,
    addGuest,
    updateGuestStatus,
    confirmedCount,
    pendingCount,
    declinedCount,
    totalHeadcount,
  } = useGuestManager(plan.guests, onUpdateGuests);

  // New guest state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dietary, setDietary] = useState('Standard');
  const [plusOnes, setPlusOnes] = useState(0);
  const [tableNumber, setTableNumber] = useState<string>('1');

  const handleStatusChange = (id: string, newStatus: RSVPStatus) => {
    const targetGuest = guests.find((g) => g.id === id);
    const guestName = targetGuest ? targetGuest.name : 'Guest';
    updateGuestStatus(id, newStatus);
    setAnnouncement(`${guestName} RSVP status updated to ${newStatus}`);
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    addGuest({
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      dietary,
      plusOnes,
      tableNumber: parseInt(tableNumber, 10) || null,
      rsvpStatus: 'pending',
    });

    setName('');
    setEmail('');
    setDietary('Standard');
    setPlusOnes(0);
    setShowAddModal(false);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'RSVP Status', 'Dietary Restrictions', 'Table', 'Plus Ones'];
    const rows = guests.map((g) => [
      `"${g.name}"`,
      `"${g.email}"`,
      `"${g.rsvpStatus}"`,
      `"${g.dietary}"`,
      `"${g.tableNumber || 'Unassigned'}"`,
      g.plusOnes,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${plan.title.replace(/\s+/g, '_')}_GuestList.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.email.toLowerCase().includes(search.toLowerCase()) ||
      g.dietary.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.rsvpStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="section-card" aria-label="Guest and RSVP Tracker">
      {/* Screen reader live region for RSVP announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Users size={24} color="#10b981" />
            Guest List, Seating & RSVP Registry
          </h2>
          <p className="section-subtitle">
            Manage attendance, dietary requirements, and plus-one logistics in real time
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportCSV}>
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus size={16} />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirmed Guests</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>{confirmedCount}</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending RSVPs</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>{pendingCount}</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Declined</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171' }}>{declinedCount}</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Headcount (+1s)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#818cf8' }}>{totalHeadcount}</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by name, email, dietary tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search guests"
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'confirmed', 'pending', 'declined'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'capitalize',
                border: '1px solid var(--border)',
                background: statusFilter === s ? 'var(--primary)' : 'var(--bg-surface)',
                color: statusFilter === s ? 'white' : 'var(--text-muted)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Guests Table */}
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px 16px' }}>Guest Name</th>
              <th style={{ padding: '12px 16px' }}>Contact</th>
              <th style={{ padding: '12px 16px' }}>Dietary</th>
              <th style={{ padding: '12px 16px' }}>Table</th>
              <th style={{ padding: '12px 16px' }}>+1s</th>
              <th style={{ padding: '12px 16px' }}>RSVP Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map((guest) => (
              <tr
                key={guest.id}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: 'rgba(15, 23, 42, 0.4)',
                }}
              >
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{guest.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{guest.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="badge badge-info">{guest.dietary}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {guest.tableNumber ? `Table ${guest.tableNumber}` : 'Unassigned'}
                </td>
                <td style={{ padding: '12px 16px' }}>{guest.plusOnes > 0 ? `+${guest.plusOnes}` : '0'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <select
                    className="form-select"
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.78rem',
                      width: 'auto',
                      fontWeight: 600,
                      color:
                        guest.rsvpStatus === 'confirmed'
                          ? '#34d399'
                          : guest.rsvpStatus === 'pending'
                          ? '#fbbf24'
                          : '#f87171',
                    }}
                    value={guest.rsvpStatus}
                    onChange={(e) => handleStatusChange(guest.id, e.target.value as RSVPStatus)}
                    aria-label={`RSVP status for ${guest.name}`}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-guest-title">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <h3 id="add-guest-title" style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>
              Add Attendee
            </h3>
            <form onSubmit={handleAddGuest}>
              <div className="form-group">
                <label className="form-label" htmlFor="g-name">
                  Full Name
                </label>
                <input
                  id="g-name"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="g-email">
                  Email Address
                </label>
                <input
                  id="g-email"
                  type="email"
                  className="form-input"
                  placeholder="maya.lin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="g-diet">
                    Dietary
                  </label>
                  <input
                    id="g-diet"
                    type="text"
                    className="form-input"
                    placeholder="Vegetarian / Vegan / Jain"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="g-plus">
                    Plus Ones (+1)
                  </label>
                  <input
                    id="g-plus"
                    type="number"
                    min="0"
                    max="5"
                    className="form-input"
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="g-table">
                  Table Number
                </label>
                <input
                  id="g-table"
                  type="number"
                  min="1"
                  max="50"
                  className="form-input"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
