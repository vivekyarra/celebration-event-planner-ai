import React from 'react';
import { Layers, Check, ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { EventPlan } from '../types';
import { calculateBudgetBreakdown } from '../services/plannerGenerator';

interface ScenarioSimulatorProps {
  plan: EventPlan;
  onApplyScenario: (newBudget: number) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  plan,
  onApplyScenario,
}) => {
  const conservativeBudget = Math.round(plan.totalBudget * 0.8);
  const luxuryBudget = Math.round(plan.totalBudget * 1.35);

  const scenarios = [
    {
      id: 'conservative',
      name: 'Essential / Conservative',
      badge: 'Cost-Optimized',
      budget: conservativeBudget,
      perGuest: Math.round(conservativeBudget / (plan.guestCount || 1)),
      highlights: [
        'Family-style buffet catering replacing plated service (-15%)',
        'DJ with smart acoustic playlist instead of 6-piece live band',
        'Repurposed ceremony florals into dining table centerpieces',
        'Digital-only invitations & interactive RSVP portal',
      ],
      color: '#34d399',
    },
    {
      id: 'balanced',
      name: 'Current Balanced Target',
      badge: 'Active Baseline',
      budget: plan.totalBudget,
      perGuest: Math.round(plan.totalBudget / (plan.guestCount || 1)),
      highlights: [
        'Multi-course culinary dinner with open cocktail hour',
        'Full AV lighting setup with custom atmospheric uplights',
        'Dedicated candid photographer & highlight reel',
        'Curated physical invitations + WhatsApp smart cards',
      ],
      color: '#818cf8',
      isActive: true,
    },
    {
      id: 'luxury',
      name: 'Premium Royale / VIP',
      badge: 'High-Impact Experience',
      budget: luxuryBudget,
      perGuest: Math.round(luxuryBudget / (plan.guestCount || 1)),
      highlights: [
        'Live headline jazz/fusion band + celebrity Emcee host',
        'Cinematic 4K drone videography & same-day teaser edit',
        'Suspended floral chandeliers & custom laser monogram',
        'Champagne & artisanal mixology tasting station',
      ],
      color: '#f472b6',
    },
  ];

  return (
    <div className="section-card" aria-label="Budget Scenario Comparison and Simulation">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Layers size={24} color="#6366f1" aria-hidden="true" />
            Budget "What-If" Scenario Simulator
          </h2>
          <p className="section-subtitle">
            Model and switch between financial allocations without breaking operational timelines
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            style={{
              background: sc.isActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.7)',
              border: sc.isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: sc.color,
                  }}
                >
                  {sc.badge}
                </span>
                {sc.isActive && <span className="badge badge-success">Selected</span>}
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
                {sc.name}
              </h3>

              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '2px' }}>
                {plan.currency} {sc.budget.toLocaleString()}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                ~{plan.currency} {sc.perGuest} per attendee ({plan.guestCount} guests)
              </div>

              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Key Strategic Adjustments:
              </div>

              <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {sc.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              className={`btn ${sc.isActive ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => onApplyScenario(sc.budget)}
              disabled={sc.isActive}
              style={{ width: '100%' }}
            >
              {sc.isActive ? (
                <>
                  <Check size={16} aria-hidden="true" />
                  <span>Currently Applied</span>
                </>
              ) : (
                <>
                  <ArrowRight size={16} aria-hidden="true" />
                  <span>Apply {sc.name.split(' ')[0]} Scenario</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
