import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DietaryAuditBanner } from '../components/DietaryAuditBanner';
import { ScenarioSimulator } from '../components/ScenarioSimulator';
import { SpeechStudio } from '../components/SpeechStudio';
import { createDefaultEventPlan } from '../services/plannerGenerator';

describe('Advanced Winner Features Component Tests', () => {
  it('renders Scenario Simulator with Conservative, Balanced, and Luxury tiers', () => {
    const plan = createDefaultEventPlan();
    render(<ScenarioSimulator plan={plan} onApplyScenario={() => {}} />);

    expect(screen.getByText(/Budget "What-If" Scenario Simulator/i)).toBeInTheDocument();
    expect(screen.getByText(/Essential \/ Conservative/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Balanced Target/i)).toBeInTheDocument();
    expect(screen.getByText(/Premium Royale \/ VIP/i)).toBeInTheDocument();
  });

  it('renders Speech Studio with rehearsal teleprompter and tone controls', () => {
    const plan = createDefaultEventPlan();
    render(<SpeechStudio plan={plan} />);

    expect(screen.getByText(/AI Speech & Toast Studio/i)).toBeInTheDocument();
    expect(screen.getByText(/Speaker Identity/i)).toBeInTheDocument();
    expect(screen.getByText(/Tone of Voice/i)).toBeInTheDocument();
  });

  it('renders Dietary Audit Banner correctly', () => {
    const plan = createDefaultEventPlan();
    render(<DietaryAuditBanner plan={plan} onAddMenuItem={() => {}} />);

    // Should indicate audit status
    expect(screen.getByText(/Dietary/i)).toBeInTheDocument();
  });
});
