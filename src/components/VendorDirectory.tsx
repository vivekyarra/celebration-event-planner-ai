import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';
import { EventPlan, VendorItem, VendorStatus } from '../types';
import { useVendorManager } from '../hooks/useVendorManager';

interface VendorDirectoryProps {
  plan: EventPlan;
  onUpdateVendors: (newVendors: VendorItem[]) => void;
}

export const VendorDirectory: React.FC<VendorDirectoryProps> = ({
  plan,
  onUpdateVendors,
}) => {
  const {
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    filterVendors,
    totalCommittedCost,
    confirmedVendorCount,
    pendingVendorCount,
  } = useVendorManager(plan.vendors, onUpdateVendors);

  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VendorStatus | 'all'>('all');
  const [category, setCategory] = useState('Venue & Banquet');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [notes, setNotes] = useState('');

  const displayedVendors = filterVendors(statusFilter);

  const handleStatusChange = (id: string, newStatus: VendorStatus) => {
    updateVendor(id, { status: newStatus });
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    addVendor({
      category: category.trim(),
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim() || 'Operations Lead',
      emailOrPhone: emailOrPhone.trim(),
      estimatedCost: parseFloat(estimatedCost) || 0,
      status: 'planning',
      notes: notes.trim(),
    });

    setCompanyName('');
    setContactPerson('');
    setEmailOrPhone('');
    setEstimatedCost('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="section-card" aria-label="Vendor RFP and Directory">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Briefcase size={24} color="#38bdf8" aria-hidden="true" />
            Vendor Partners & RFP Management
          </h2>
          <p className="section-subtitle">
            Contracts, contacts, and quote statuses across all critical service suppliers
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddModal(true)}
          aria-haspopup="dialog"
          aria-label="Add vendor partner"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Add Vendor Partner</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} color="#34d399" aria-hidden="true" />
            <span>
              Confirmed Contracts: <strong>{confirmedVendorCount}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <Clock size={16} color="#fbbf24" aria-hidden="true" />
            <span>
              Pending Inquiries: <strong>{pendingVendorCount}</strong>
            </span>
          </div>

          <div style={{ fontSize: '0.85rem' }}>
            <span>
              Committed Vendor Spend:{' '}
              <strong style={{ color: '#38bdf8' }}>
                {plan.currency} {totalCommittedCost.toLocaleString()}
              </strong>
            </span>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="var(--text-muted)" aria-hidden="true" />
          <label htmlFor="vendor-status-filter" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Filter:
          </label>
          <select
            id="vendor-status-filter"
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as VendorStatus | 'all')}
            style={{ padding: '2px 8px', fontSize: '0.8rem', width: 'auto' }}
            aria-label="Filter vendors by contractual status"
          >
            <option value="all">All Vendors ({vendors.length})</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="negotiating">Negotiating</option>
            <option value="contacted">Contacted</option>
            <option value="planning">Planning</option>
          </select>
        </div>
      </div>

      {displayedVendors.length === 0 ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border)',
          }}
        >
          <p>No vendor partners found matching the active filter.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '16px',
          }}
        >
          {displayedVendors.map((vendor) => {
            return (
              <div
                key={vendor.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#818cf8',
                        textTransform: 'uppercase',
                      }}
                    >
                      {vendor.category}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select
                        className="form-select"
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          width: 'auto',
                          fontWeight: 600,
                        }}
                        value={vendor.status}
                        onChange={(e) => handleStatusChange(vendor.id, e.target.value as VendorStatus)}
                        aria-label={`Status for vendor ${vendor.companyName}`}
                      >
                        <option value="planning">Planning</option>
                        <option value="contacted">Contacted</option>
                        <option value="negotiating">Negotiating</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '2px 4px', color: '#ef4444', height: 'auto', minHeight: 'unset' }}
                        onClick={() => deleteVendor(vendor.id)}
                        aria-label={`Delete vendor ${vendor.companyName}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      marginBottom: '4px',
                    }}
                  >
                    {vendor.companyName}
                  </h3>

                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Contact: <strong>{vendor.contactPerson}</strong> ({vendor.emailOrPhone})
                  </div>

                  {vendor.notes && (
                    <p
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        lineHeight: '1.4',
                      }}
                    >
                      {vendor.notes}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '10px',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Spend:</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>
                    {plan.currency} {vendor.estimatedCost.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-vendor-title">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 id="add-vendor-title" style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>
              Add Vendor Supplier
            </h3>
            <form onSubmit={handleAddVendor}>
              <div className="form-group">
                <label className="form-label" htmlFor="v-cat">
                  Category
                </label>
                <input
                  id="v-cat"
                  type="text"
                  className="form-input"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="v-name">
                  Company / Supplier Name
                </label>
                <input
                  id="v-name"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g., Celestial Sound & Lasers"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="v-contact">
                    Contact Person
                  </label>
                  <input
                    id="v-contact"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Liam Scott"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="v-cost">
                    Estimated Cost ({plan.currency})
                  </label>
                  <input
                    id="v-cost"
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="2500"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="v-email">
                  Email / Phone
                </label>
                <input
                  id="v-email"
                  type="text"
                  className="form-input"
                  placeholder="liam@celestialsound.example.com"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="v-notes">
                  Agreement Details & Scope
                </label>
                <textarea
                  id="v-notes"
                  className="form-textarea"
                  rows={2}
                  placeholder="Includes 4 wireless mics and 2 smoke machines..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
