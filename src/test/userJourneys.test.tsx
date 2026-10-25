import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { CommandPalette } from '../components/CommandPalette';
import { ScenarioSimulator } from '../components/ScenarioSimulator';
import { DietaryAuditBanner } from '../components/DietaryAuditBanner';
import { CountdownTimer } from '../components/CountdownTimer';
import { createDefaultEventPlan } from '../services/plannerGenerator';
import { EventPlan, MenuItem } from '../types';

describe('Task 3: Component Interaction & User Journey Tests', () => {
  describe('1. CommandPalette User Journey & Interactions', () => {
    it('renders accessible dialog with aria-label and lists initial modules', () => {
      const mockClose = vi.fn();
      const mockSelect = vi.fn();

      render(
        <CommandPalette isOpen={true} onClose={mockClose} onSelectAction={mockSelect} />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-label', 'Navigation Command Palette');
      expect(dialog).toHaveAttribute('aria-modal', 'true');

      // Command input is present
      const input = screen.getByPlaceholderText(/Type a command/i);
      expect(input).toBeInTheDocument();

      // Module options listed
      expect(screen.getByText(/Go to Budget Allocator & Costs/i)).toBeInTheDocument();
      expect(screen.getByText(/Go to Run of Show & Timeline/i)).toBeInTheDocument();
      expect(screen.getByText(/Trigger Festive Celebration Confetti/i)).toBeInTheDocument();
    });

    it('filters commands when query is typed and handles keyboard Enter selection', () => {
      const mockClose = vi.fn();
      const mockSelect = vi.fn();

      render(
        <CommandPalette isOpen={true} onClose={mockClose} onSelectAction={mockSelect} />
      );

      const input = screen.getByPlaceholderText(/Type a command/i);

      // Filter by "speech"
      fireEvent.change(input, { target: { value: 'speech' } });

      expect(screen.getByText(/AI Speech & Toast Studio/i)).toBeInTheDocument();
      expect(screen.queryByText(/Go to Budget Allocator & Costs/i)).not.toBeInTheDocument();

      // Press Enter to trigger selected action
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockSelect).toHaveBeenCalledWith('tab-speech');
      expect(mockClose).toHaveBeenCalled();
    });

    it('navigates with ArrowDown and ArrowUp keyboard navigation', () => {
      const mockClose = vi.fn();
      const mockSelect = vi.fn();

      render(
        <CommandPalette isOpen={true} onClose={mockClose} onSelectAction={mockSelect} />
      );

      const input = screen.getByPlaceholderText(/Type a command/i);

      // Press ArrowDown
      fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      // Press Enter on the 2nd item ('tab-timeline')
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockSelect).toHaveBeenCalledWith('tab-timeline');
      expect(mockClose).toHaveBeenCalled();
    });

    it('closes on Escape key and Ctrl+K shortcut', () => {
      const mockClose = vi.fn();
      const mockSelect = vi.fn();

      render(
        <CommandPalette isOpen={true} onClose={mockClose} onSelectAction={mockSelect} />
      );

      // Escape key
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(mockClose).toHaveBeenCalledTimes(1);

      // Ctrl + K
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
      expect(mockClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('2. ScenarioSimulator Interactive User Journey', () => {
    it('renders conservative, balanced, luxury tabs and triggers scenario application callback', () => {
      const mockPlan = createDefaultEventPlan();
      mockPlan.totalBudget = 10000;
      mockPlan.guestCount = 50;

      const mockApply = vi.fn();

      render(<ScenarioSimulator plan={mockPlan} onApplyScenario={mockApply} />);

      // Verify 3 scenarios are rendered
      expect(screen.getByText(/Essential \/ Conservative/i)).toBeInTheDocument();
      expect(screen.getByText(/Current Balanced Target/i)).toBeInTheDocument();
      expect(screen.getByText(/Premium Royale \/ VIP/i)).toBeInTheDocument();

      // Active baseline scenario shows "Currently Applied" and is disabled
      const activeBtn = screen.getByRole('button', { name: /Currently Applied/i });
      expect(activeBtn).toBeDisabled();

      // Conservative scenario button: 80% of 10,000 = 8,000
      const applyConservativeBtn = screen.getByRole('button', {
        name: /Apply Essential Scenario/i,
      });
      expect(applyConservativeBtn).not.toBeDisabled();
      fireEvent.click(applyConservativeBtn);
      expect(mockApply).toHaveBeenCalledWith(8000);

      // Luxury scenario button: 135% of 10,000 = 13,500
      const applyLuxuryBtn = screen.getByRole('button', {
        name: /Apply Premium Scenario/i,
      });
      expect(applyLuxuryBtn).not.toBeDisabled();
      fireEvent.click(applyLuxuryBtn);
      expect(mockApply).toHaveBeenCalledWith(13500);
    });
  });

  describe('3. DietaryAuditBanner Detection & Auto-Resolution Journey', () => {
    it('detects dietary shortfalls and triggers 1-click auto-resolve callback', () => {
      const mockPlan = createDefaultEventPlan();
      // Guest requiring Vegan food
      mockPlan.guests = [
        {
          id: 'g-test-1',
          name: 'Sarah Connor',
          email: 'sarah@test.com',
          dietary: 'Strict Vegan',
          tableNumber: 1,
          rsvpStatus: 'confirmed',
          plusOnes: 0,
        },
      ];
      // Menu with NO vegan mains
      mockPlan.menu = [
        {
          id: 'dish-1',
          course: 'mains',
          name: 'Grilled Ribeye Steak',
          description: 'Grass-fed ribeye with butter sauce',
          dietaryTags: ['High-Protein', 'Contains Dairy'],
          recommendedQuantity: '1 per guest',
        },
      ];

      const mockAddDish = vi.fn();

      render(<DietaryAuditBanner plan={mockPlan} onAddMenuItem={mockAddDish} />);

      // Detects shortfall
      expect(screen.getByText(/Vegan Main Course Deficiency/i)).toBeInTheDocument();

      // Clicks auto-resolve button
      const resolveBtn = screen.getByRole('button', { name: /1-Click Auto-Resolve/i });
      expect(resolveBtn).toBeInTheDocument();

      fireEvent.click(resolveBtn);

      expect(mockAddDish).toHaveBeenCalled();
      const addedItem: MenuItem = mockAddDish.mock.calls[0][0];
      expect(addedItem.course).toBe('mains');
      expect(addedItem.dietaryTags).toContain('Vegan');
    });

    it('displays passing confirmation banner when all dietary preferences are satisfied', () => {
      const mockPlan = createDefaultEventPlan();
      // No dietary restrictions among guests
      mockPlan.guests = [
        {
          id: 'g-test-2',
          name: 'John Doe',
          email: 'john@test.com',
          dietary: 'Standard',
          tableNumber: 1,
          rsvpStatus: 'confirmed',
          plusOnes: 0,
        },
      ];

      const mockAddDish = vi.fn();
      render(<DietaryAuditBanner plan={mockPlan} onAddMenuItem={mockAddDish} />);

      expect(screen.getByText(/Dietary Audit Passed/i)).toBeInTheDocument();
    });
  });

  describe('4. CountdownTimer Accessibility & Past vs Future Journeys', () => {
    it('renders days, hours, and minutes with role="timer" for upcoming events', () => {
      // Future event in 2030
      render(
        <CountdownTimer
          eventDate="2030-10-15"
          startTime="18:30"
          eventTitle="Future Tech Summit"
        />
      );

      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
      expect(timer).toHaveAttribute('aria-label', expect.stringContaining('Future Tech Summit'));

      // Check time breakdown labels
      expect(screen.getByText('Days')).toBeInTheDocument();
      expect(screen.getByText('Hrs')).toBeInTheDocument();
      expect(screen.getByText('Min')).toBeInTheDocument();
      expect(screen.getByText('Sec')).toBeInTheDocument();
    });

    it('gracefully handles past event dates and displays conclusion status badge', () => {
      // Past event in 2020
      render(
        <CountdownTimer
          eventDate="2020-01-01"
          startTime="12:00"
          eventTitle="Historic Gala"
        />
      );

      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
      expect(screen.getByText(/Celebration Concluded & Archived/i)).toBeInTheDocument();
    });
  });
});
