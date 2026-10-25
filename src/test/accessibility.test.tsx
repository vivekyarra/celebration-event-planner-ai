import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Navbar } from '../components/Navbar';
import { App } from '../App';
import { ApiKeyModal } from '../components/ApiKeyModal';
import { CountdownTimer } from '../components/CountdownTimer';
import { ErrorBoundary } from '../components/ErrorBoundary';

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
});
