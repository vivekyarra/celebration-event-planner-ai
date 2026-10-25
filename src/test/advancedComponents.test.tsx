import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DietaryAuditBanner } from '../components/DietaryAuditBanner';
import { ScenarioSimulator } from '../components/ScenarioSimulator';
import { SpeechStudio } from '../components/SpeechStudio';
import { GuestTracker } from '../components/GuestTracker';
import { Navbar } from '../components/Navbar';
import { EventWizardModal } from '../components/EventWizardModal';
import { CommandPalette } from '../components/CommandPalette';
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

  it('GuestTracker renders aria-live status region and announces RSVP changes', () => {
    const plan = createDefaultEventPlan();
    const onUpdate = vi.fn();
    render(<GuestTracker plan={plan} onUpdateGuests={onUpdate} />);

    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');

    const firstGuest = plan.guests[0];
    const select = screen.getByLabelText(`RSVP status for ${firstGuest.name}`);
    fireEvent.change(select, { target: { value: 'declined' } });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(screen.getByText(`${firstGuest.name} RSVP status updated to declined`)).toBeInTheDocument();
  });

  it('Navbar displays auto-save status indicator for saving and saved states', () => {
    const { rerender } = render(
      <Navbar
        onOpenWizard={vi.fn()}
        onOpenApiKey={vi.fn()}
        hasApiKey={true}
        saveStatus="saving"
      />
    );

    expect(screen.getByText(/Saving.../i)).toBeInTheDocument();

    rerender(
      <Navbar
        onOpenWizard={vi.fn()}
        onOpenApiKey={vi.fn()}
        hasApiKey={true}
        saveStatus="saved"
      />
    );

    expect(screen.getByText(/All changes saved/i)).toBeInTheDocument();
  });

  it('EventWizardModal validates input bounds and displays form-level error summary', () => {
    const onPlanCreated = vi.fn();
    const onClose = vi.fn();

    render(
      <EventWizardModal
        isOpen={true}
        onClose={onClose}
        onPlanCreated={onPlanCreated}
      />
    );

    // Set invalid guest count (< 5)
    const guestInput = screen.getByLabelText(/Target Guests/i);
    fireEvent.change(guestInput, { target: { value: '2' } });

    const submitBtn = screen.getByRole('button', { name: /Generate AI Event Plan/i });
    fireEvent.submit(submitBtn.closest('form')!);

    expect(onPlanCreated).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getAllByText(/between 5 and 5,000/i).length).toBeGreaterThanOrEqual(1);
  });

  it('CommandPalette displays available keyboard shortcuts panel', () => {
    render(
      <CommandPalette
        isOpen={true}
        onClose={vi.fn()}
        onSelectAction={vi.fn()}
      />
    );

    expect(screen.getByText(/Available shortcuts:/i)).toBeInTheDocument();
    expect(screen.getByText(/Ctrl\+K → Command Palette/i)).toBeInTheDocument();
    expect(screen.getByText(/Tab → Next module/i)).toBeInTheDocument();
    expect(screen.getByText(/Shift\+Tab → Previous module/i)).toBeInTheDocument();
    expect(screen.getByText(/Escape → Close modal/i)).toBeInTheDocument();
  });
});
