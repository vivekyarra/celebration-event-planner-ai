import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Navbar } from '../components/Navbar';
import { EventHeader } from '../components/EventHeader';
import { createDefaultEventPlan } from '../services/plannerGenerator';

describe('Component Verification & Accessibility', () => {
  it('renders the Navbar with brand identity and actions', () => {
    const onOpenWizard = vi.fn();
    const onOpenApiKey = vi.fn();

    render(
      <Navbar
        onOpenWizard={onOpenWizard}
        onOpenApiKey={onOpenApiKey}
        hasApiKey={false}
      />
    );

    expect(screen.getByText('CelebriteAI')).toBeInTheDocument();
    expect(screen.getByText('New Celebration')).toBeInTheDocument();
    expect(screen.getByText('Celebrate!')).toBeInTheDocument();

    const newBtn = screen.getByRole('button', { name: /Create or customize new celebration/i });
    fireEvent.click(newBtn);
    expect(onOpenWizard).toHaveBeenCalledTimes(1);
  });

  it('renders the EventHeader with accurate KPI metrics', () => {
    const plan = createDefaultEventPlan();
    render(<EventHeader plan={plan} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(plan.title);
    expect(screen.getByText(/Total Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Guests/i)).toBeInTheDocument();
    expect(screen.getByText(/Unit Economics/i)).toBeInTheDocument();
  });
});
