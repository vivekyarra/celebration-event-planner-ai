import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  AlertTriangle,
  Lightbulb,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { BudgetCategory, EventPlan } from '../types';
import { useBudgetManager } from '../hooks/useBudgetManager';

interface BudgetManagerProps {
  plan: EventPlan;
  onUpdateBudget: (newCategories: BudgetCategory[], newTotalBudget?: number) => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  plan,
  onUpdateBudget,
}) => {
  const {
    categories,
    totalAllocated,
    totalSpent,
    remainingBudget,
    highestExpenseCategory,
    totalPercentage,
    updateCategoryPercentage,
    recordSpending,
    addCustomCategory,
    removeCategory,
  } = useBudgetManager(plan.budgetBreakdown, plan.totalBudget, onUpdateBudget);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAmount, setNewCatAmount] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatAmount) return;
    const amount = parseFloat(newCatAmount);
    const pct = plan.totalBudget > 0 ? Math.round((amount / plan.totalBudget) * 100) : 0;

    addCustomCategory({
      name: newCatName.trim(),
      percentage: pct,
      allocatedAmount: amount,
      spentAmount: 0,
      icon: 'Tag',
      recommendations: ['Track receipts and invoices directly with vendor.'],
    });

    setNewCatName('');
    setNewCatAmount('');
    setShowAddModal(false);
  };

  return (
    <div className="section-card" aria-label="Budget Allocation & Cost Control">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <DollarSign size={24} color="#6366f1" aria-hidden="true" />
            Dynamic Budget Allocator & Cost Optimization
          </h2>
          <p className="section-subtitle">
            Contextual algorithmic distribution based on {plan.eventType.replace('_', ' ')} requirements
          </p>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowAddModal(true)}
          aria-haspopup="dialog"
          aria-label="Add custom budget line item"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* Progress & Over budget alert */}
      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '8px',
            fontSize: '0.9rem',
          }}
        >
          <span>
            Total Allocated:{' '}
            <strong>
              {plan.currency} {totalAllocated.toLocaleString()} ({totalPercentage}%)
            </strong>
          </span>
          <span>
            Committed / Spent:{' '}
            <strong style={{ color: totalSpent > plan.totalBudget ? '#ef4444' : '#34d399' }}>
              {plan.currency} {totalSpent.toLocaleString()}
            </strong>{' '}
            / {plan.currency} {plan.totalBudget.toLocaleString()}
          </span>
        </div>

        <div
          style={{
            height: '10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={Math.min(100, Math.round((totalSpent / (plan.totalBudget || 1)) * 100))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Budget utilization progress"
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.round((totalSpent / (plan.totalBudget || 1)) * 100))}%`,
              background:
                totalSpent > plan.totalBudget
                  ? 'linear-gradient(90deg, #ef4444, #b91c1c)'
                  : 'linear-gradient(90deg, #6366f1, #10b981)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '10px',
            fontSize: '0.8rem',
          }}
        >
          <span style={{ color: remainingBudget >= 0 ? 'var(--text-muted)' : '#ef4444' }}>
            Remaining Buffer: <strong>{plan.currency} {remainingBudget.toLocaleString()}</strong>
          </span>
          {highestExpenseCategory && (
            <span style={{ color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} color="#818cf8" aria-hidden="true" />
              Primary Cost Driver: <strong>{highestExpenseCategory.name}</strong> ({plan.currency} {highestExpenseCategory.allocatedAmount.toLocaleString()})
            </span>
          )}
        </div>

        {totalPercentage !== 100 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '10px',
              fontSize: '0.8rem',
              color: '#fbbf24',
            }}
            role="status"
            aria-live="polite"
          >
            <AlertTriangle size={14} aria-hidden="true" />
            <span>
              Budget percentages currently total {totalPercentage}%. Adjust sliders to achieve 100% balance.
            </span>
          </div>
        )}
      </div>

      {/* Categories Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
        }}
      >
        {categories.map((cat) => {
          const spentPct =
            cat.allocatedAmount > 0
              ? Math.round((cat.spentAmount / cat.allocatedAmount) * 100)
              : 0;

          return (
            <div
              key={cat.id}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                  {cat.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-info">{cat.percentage}%</span>
                  {cat.id.startsWith('custom') && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', color: '#ef4444', height: 'auto', minHeight: 'unset' }}
                      onClick={() => removeCategory(cat.id)}
                      aria-label={`Remove category ${cat.name}`}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor={`slider-${cat.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginBottom: '4px',
                  }}
                >
                  <span>Allocation Slider</span>
                  <span>
                    {plan.currency} {cat.allocatedAmount.toLocaleString()}
                  </span>
                </label>
                <input
                  id={`slider-${cat.id}`}
                  type="range"
                  min="0"
                  max="60"
                  value={cat.percentage}
                  onChange={(e) => updateCategoryPercentage(cat.id, parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                  aria-label={`${cat.name} percentage slider (${cat.percentage}%)`}
                />
              </div>

              {/* Spent Amount Input */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <label htmlFor={`spent-${cat.id}`} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Actual Spent:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{plan.currency}</span>
                  <input
                    id={`spent-${cat.id}`}
                    type="number"
                    min="0"
                    value={cat.spentAmount}
                    onChange={(e) => recordSpending(cat.id, parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100px',
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      textAlign: 'right',
                    }}
                    aria-label={`Actual spent amount for ${cat.name}`}
                  />
                </div>
              </div>

              {/* Spent bar */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-dim)',
                    marginBottom: '3px',
                  }}
                >
                  <span>Utilization</span>
                  <span style={{ color: spentPct > 100 ? '#ef4444' : 'inherit' }}>{spentPct}%</span>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    overflow: 'hidden',
                  }}
                  role="progressbar"
                  aria-valuenow={Math.min(100, spentPct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cat.name} utilization`}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, spentPct)}%`,
                      background: spentPct > 100 ? '#ef4444' : '#10b981',
                    }}
                  />
                </div>
              </div>

              {/* Recommendations */}
              {cat.recommendations && cat.recommendations.length > 0 && (
                <div
                  style={{
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px dashed rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    fontSize: '0.75rem',
                    color: '#c7d2fe',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, marginBottom: '4px' }}>
                    <Lightbulb size={12} color="#fbbf24" aria-hidden="true" />
                    <span>Cost-Saving Insights:</span>
                  </div>
                  <ul style={{ paddingLeft: '16px', margin: 0 }}>
                    {cat.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Custom Category Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-cat-title">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <h3 id="add-cat-title" style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>
              Add Budget Line Item
            </h3>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label className="form-label" htmlFor="cat-name">
                  Category Name
                </label>
                <input
                  id="cat-name"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g., Live Drone Videography"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cat-amount">
                  Allocated Amount ({plan.currency})
                </label>
                <input
                  id="cat-amount"
                  type="number"
                  className="form-input"
                  required
                  min="1"
                  placeholder="e.g., 1500"
                  value={newCatAmount}
                  onChange={(e) => setNewCatAmount(e.target.value)}
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
