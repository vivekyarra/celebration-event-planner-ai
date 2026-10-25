import React from 'react';
import { AlertCircle, CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { EventPlan, MenuItem } from '../types';

interface DietaryAuditBannerProps {
  plan: EventPlan;
  onAddMenuItem: (item: MenuItem) => void;
}

export const DietaryAuditBanner: React.FC<DietaryAuditBannerProps> = ({
  plan,
  onAddMenuItem,
}) => {
  // Aggregate guest dietary requirements
  const guestDiets = plan.guests.map((g) => g.dietary.toLowerCase());
  const menuTags = plan.menu
    .flatMap((m) => m.dietaryTags)
    .map((t) => t.toLowerCase());

  const issues: { type: string; guestCount: number; recommendation: string; dishToAdd: MenuItem }[] = [];

  const veganCount = guestDiets.filter((d) => d.includes('vegan')).length;
  const hasVeganMains = plan.menu.some(
    (m) => m.course === 'mains' && m.dietaryTags.some((t) => t.toLowerCase().includes('vegan'))
  );

  if (veganCount > 0 && !hasVeganMains) {
    issues.push({
      type: 'Vegan Main Course Deficiency',
      guestCount: veganCount,
      recommendation: `${veganCount} confirmed/registered guest(s) require Vegan dining, but no dedicated Vegan entree exists in Mains.`,
      dishToAdd: {
        id: `auto-vegan-${Date.now()}`,
        course: 'mains',
        name: 'Za’atar Charred Cauliflower Steak & Pomegranate Reduction',
        description: 'Served on a bed of warm garlic-tahini purée with toasted pine nuts and micro herbs.',
        dietaryTags: ['Vegan', 'Gluten-Free', 'Dairy-Free'],
        recommendedQuantity: '1 serving per vegan guest',
      },
    });
  }

  const glutenFreeCount = guestDiets.filter((d) => d.includes('gluten') || d.includes('gf')).length;
  const hasGFDessert = plan.menu.some(
    (m) => m.course === 'desserts' && m.dietaryTags.some((t) => t.toLowerCase().includes('gluten-free'))
  );

  if (glutenFreeCount > 0 && !hasGFDessert) {
    issues.push({
      type: 'Gluten-Free Dessert Shortfall',
      guestCount: glutenFreeCount,
      recommendation: `${glutenFreeCount} guest(s) require Gluten-Free dietary options for dessert.`,
      dishToAdd: {
        id: `auto-gf-${Date.now()}`,
        course: 'desserts',
        name: 'Flourless Almond & Belgian Dark Chocolate Torte',
        description: 'Decadent cocoa torte finished with raspberry coulis and crushed pistachio.',
        dietaryTags: ['Gluten-Free', 'Vegetarian'],
        recommendedQuantity: '1 portion per guest',
      },
    });
  }

  if (issues.length === 0) {
    return (
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#6ee7b7',
          fontSize: '0.85rem',
        }}
      >
        <CheckCircle2 size={18} style={{ flexShrink: 0 }} aria-hidden="true" />
        <span>
          <strong>Dietary Audit Passed:</strong> All registered guest dietary requirements (
          {plan.dietaryPreferences.join(', ')}) are comprehensively covered across the culinary courses.
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, marginBottom: '8px' }}>
        <AlertCircle size={20} aria-hidden="true" />
        <span>AI Dietary Safety & Compliance Alert ({issues.length} Potential Conflict Detected)</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {issues.map((issue, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(15, 23, 42, 0.6)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                {issue.type}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {issue.recommendation}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onAddMenuItem(issue.dishToAdd)}
              style={{ fontSize: '0.78rem' }}
            >
              <Sparkles size={14} aria-hidden="true" />
              <span>1-Click Auto-Resolve ({issue.dishToAdd.name.split(' ')[0]}...)</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
