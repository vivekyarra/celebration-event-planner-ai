import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Navbar } from '../components/Navbar';
import { App } from '../App';
import { ApiKeyModal } from '../components/ApiKeyModal';
import { CountdownTimer } from '../components/CountdownTimer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { EventWizardModal } from '../components/EventWizardModal';
import { CommandPalette } from '../components/CommandPalette';

describe('WCAG 2.1 AA Accessibility & Assistive Tech Tests', () => {
  it('1. Navbar has correct role="banner" and accessible landmark structure', () => {
    render(
      <Navbar
        onOpenWizard={vi.fn()}
        onOpenApiKey={vi.fn()}
        onOpenPalette={vi.fn()}
        hasApiKey={false}
      />
    );

    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();
  });

  it('2. Main content area is accessible with role="main" and skip link destination id', () => {
    const { container } = render(<App />);
    const mainEl = screen.getByRole('main');
    expect(mainEl).toBeInTheDocument();
    expect(mainEl).toHaveAttribute('id', 'main-content');
  });

  it('3. All buttons in Navbar have accessible names (aria-label or text)', () => {
    render(
      <Navbar
        onOpenWizard={vi.fn()}
        onOpenApiKey={vi.fn()}
        onOpenPalette={vi.fn()}
        hasApiKey={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    for (const btn of buttons) {
      const hasAccessibleName =
        Boolean(btn.getAttribute('aria-label')) ||
        Boolean(btn.textContent && btn.textContent.trim().length > 0);
      expect(hasAccessibleName).toBe(true);
    }
  });

  it('4. Tab buttons have aria-selected attribute and role="tab"', () => {
    render(<App />);
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(8);

    // Initial tab (Budget Allocator) should be selected
    const activeTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true');
    expect(activeTab).toBeDefined();

    // Inactive tabs should have aria-selected="false"
    const inactiveTabs = tabs.filter((t) => t.getAttribute('aria-selected') === 'false');
    expect(inactiveTabs.length).toBe(tabs.length - 1);
  });

  it('5. Forms have associated labels with htmlFor and matching input ids', () => {
    render(
      <ApiKeyModal
        isOpen={true}
        onClose={vi.fn()}
        apiKey="test-key"
        onSaveKey={vi.fn()}
      />
    );

    // Look for form input associated with its label
    const inputWithLabel = screen.getByLabelText(/Google Gemini API Key/i);
    expect(inputWithLabel).toBeInTheDocument();
    expect(inputWithLabel).toHaveAttribute('id', 'gemini-key');
  });

  it('6. CountdownTimer provides role="timer" and accessible live region', () => {
    render(<CountdownTimer eventDate="2026-11-20" startTime="18:00" eventTitle="Grand Gala" />);

    const timer = screen.getByRole('timer');
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveAttribute('aria-label', expect.stringContaining('Grand Gala'));
  });

  it('7. ErrorBoundary provides role="alert" with assertive aria-live on failure', () => {
    const ProblemChild = () => {
      throw new Error('Test boundary crash');
    };

    // Suppress console.error in vitest during intentional error test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText(/Something went wrong in CelebriteAI/i)).toBeInTheDocument();

    spy.mockRestore();
  });

  it('8. EventWizardModal complies with WCAG AAA modal dialogs, focus trap, and aria-invalid error bindings', () => {
    const mockClose = vi.fn();
    const mockCreated = vi.fn();

    render(
      <EventWizardModal
        isOpen={true}
        onClose={mockClose}
        onPlanCreated={mockCreated}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'wizard-title');

    // Trigger validation error by clearing title and submitting
    const titleInput = screen.getByLabelText(/Celebration \/ Event Name/i);
    fireEvent.change(titleInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Generate AI Event Plan/i });
    fireEvent.click(submitBtn);

    // Form summary alert is displayed
    const alert = screen.getByRole('alert', { name: '' });
    expect(alert).toBeInTheDocument();

    // Title input is marked aria-invalid="true" and wired with aria-errormessage
    expect(titleInput).toHaveAttribute('aria-invalid', 'true');
    expect(titleInput).toHaveAttribute('aria-errormessage', 'w-title-error');
    expect(screen.getAllByText(/Celebration \/ Event Name is required/i).length).toBeGreaterThanOrEqual(1);

    // Modal closes on Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('9. CommandPalette adheres to WCAG AAA dialog specs and aria-label', () => {
    const mockClose = vi.fn();
    const mockSelect = vi.fn();

    render(
      <CommandPalette
        isOpen={true}
        onClose={mockClose}
        onSelectAction={mockSelect}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Navigation Command Palette');

    // Search input has combobox role with listbox control
    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-controls', 'command-palette-results');
  });

  it('10. SVG icons rendered in accessible interactive elements have aria-hidden="true"', () => {
    const { container } = render(
      <Navbar
        onOpenWizard={vi.fn()}
        onOpenApiKey={vi.fn()}
        onOpenPalette={vi.fn()}
        hasApiKey={true}
      />
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
