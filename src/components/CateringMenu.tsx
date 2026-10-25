import React, { useState } from 'react';
import { UtensilsCrossed, Plus, Sparkles } from 'lucide-react';
import { EventPlan, MenuItem } from '../types';
import { DietaryAuditBanner } from './DietaryAuditBanner';

interface CateringMenuProps {
  plan: EventPlan;
  onUpdateMenu: (newMenu: MenuItem[]) => void;
}

export const CateringMenu: React.FC<CateringMenuProps> = ({
  plan,
  onUpdateMenu,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState<'starters' | 'mains' | 'desserts' | 'beverages'>('starters');
  const [tagInput, setTagInput] = useState('Vegetarian, Gluten-Free');
  const [portion, setPortion] = useState('1 serving per guest');

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newDish: MenuItem = {
      id: `dish-${Date.now()}`,
      name,
      description,
      course,
      dietaryTags: tagInput.split(',').map((t) => t.trim()).filter(Boolean),
      recommendedQuantity: portion,
    };

    onUpdateMenu([...plan.menu, newDish]);
    setName('');
    setDescription('');
    setShowAddModal(false);
  };

  const courses: ('starters' | 'mains' | 'desserts' | 'beverages')[] = [
    'starters',
    'mains',
    'desserts',
    'beverages',
  ];

  return (
    <div className="section-card" aria-label="Banquet Menu & Catering Planner">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <UtensilsCrossed size={24} color="#f59e0b" />
            Curated Banquet & Culinary Menu
          </h2>
          <p className="section-subtitle">
            Catered to special dietary preferences: {plan.dietaryPreferences.join(', ')}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddModal(true)}
          aria-label="Add custom dish to catering menu"
        >
          <Plus size={16} />
          <span>Add Custom Dish</span>
        </button>
      </div>

      {/* Embedded Dietary Audit for contextual awareness */}
      <div style={{ marginBottom: '20px' }}>
        <DietaryAuditBanner
          plan={plan}
          onAddMenuItem={(dish) => onUpdateMenu([...plan.menu, dish])}
        />
      </div>

      {/* Courses display */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {courses.map((c) => {
          const items = plan.menu.filter((m) => m.course === c);
          if (items.length === 0) return null;

          return (
            <section
              key={c}
              role="region"
              aria-label={`${c} course selection`}
            >
              <h3
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  color: '#fbbf24',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '1px solid var(--border)',
                  paddingBottom: '6px',
                }}
              >
                <Sparkles size={16} />
                {c} Selection
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '14px',
                }}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                        {item.name}
                      </h4>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '8px' }}>
                        {item.description}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {item.dietaryTags.map((t) => (
                          <span key={t} className="badge badge-success">
                            {t}
                          </span>
                        ))}
                      </div>

                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#a5b4fc',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(99, 102, 241, 0.08)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}
                      >
                        Est. Portion: {item.recommendedQuantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Add Custom Dish Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-dish-title">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 id="add-dish-title" style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>
              Add Dish to Menu
            </h3>
            <form onSubmit={handleAddDish}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="dish-course">
                    Course Type
                  </label>
                  <select
                    id="dish-course"
                    className="form-select"
                    value={course}
                    onChange={(e) => setCourse(e.target.value as 'starters' | 'mains' | 'desserts' | 'beverages')}
                  >
                    <option value="starters">Starters</option>
                    <option value="mains">Mains</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dish-portion">
                    Portion Sizing
                  </label>
                  <input
                    id="dish-portion"
                    type="text"
                    className="form-input"
                    value={portion}
                    onChange={(e) => setPortion(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dish-name">
                  Dish Name
                </label>
                <input
                  id="dish-name"
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g., Saffron Infused Biryani & Raita"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dish-desc">
                  Description & Ingredients
                </label>
                <textarea
                  id="dish-desc"
                  className="form-textarea"
                  rows={2}
                  placeholder="Fragrant basmati rice, caramelised onions, fresh mint..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="dish-tags">
                  Dietary Tags (comma separated)
                </label>
                <input
                  id="dish-tags"
                  type="text"
                  className="form-input"
                  placeholder="Vegetarian, Gluten-Free, Halal"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
