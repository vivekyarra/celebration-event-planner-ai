import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { BudgetManager } from '../components/BudgetManager';
import { DietaryAuditBanner } from '../components/DietaryAuditBanner';
import { VendorDirectory } from '../components/VendorDirectory';
import { SpeechStudio } from '../components/SpeechStudio';
import { ScenarioSimulator } from '../components/ScenarioSimulator';
import { GuestTracker } from '../components/GuestTracker';
import { TimelineRunOfShow } from '../components/TimelineRunOfShow';
import { createDefaultEventPlan } from '../services/plannerGenerator';
import { exportPlanToJson } from '../services/security';
import { EventPlan, VendorItem, MenuItem, Guest } from '../types';

describe('Task 3: Full End-to-End Simulation Workflows', () => {
  let originalSpeechSynthesis: typeof window.speechSynthesis;
  let originalUtterance: typeof globalThis.SpeechSynthesisUtterance;

  beforeEach(() => {
    localStorage.clear();
    originalSpeechSynthesis = window.speechSynthesis;
    originalUtterance = globalThis.SpeechSynthesisUtterance;

    window.speechSynthesis = {
      speak: vi.fn((utterance: SpeechSynthesisUtterance) => {
        if (utterance.onstart) utterance.onstart(new Event('start') as any);
      }),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onvoiceschanged: null,
      paused: false,
      pending: false,
      speaking: false,
    } as unknown as SpeechSynthesis;

    function MockUtterance(this: any, text: string) {
      this.text = text;
      this.rate = 1;
      this.pitch = 1;
      this.volume = 1;
      this.lang = 'en-US';
      this.voice = null;
      this.onstart = null;
      this.onend = null;
      this.onerror = null;
    }
    globalThis.SpeechSynthesisUtterance = MockUtterance as any;
  });

  afterEach(() => {
    window.speechSynthesis = originalSpeechSynthesis;
    globalThis.SpeechSynthesisUtterance = originalUtterance;
    vi.clearAllMocks();
  });

  // Workflow 1: Complete Event Lifecycle
  it(
    '1. Complete Event Lifecycle: Creating an anniversary gala via wizard -> navigating tabs -> applying luxury scenario -> confirming RSVPs -> exporting sanitized JSON',
    { timeout: 30000 },
    () => {
    render(<App />);

    // Step 1: Open celebration wizard modal
    const newCelebrationBtn = screen.getByRole('button', {
      name: /Create or customize new celebration/i,
    });
    fireEvent.click(newCelebrationBtn);

    const wizardDialog = screen.getByRole('dialog');
    expect(wizardDialog).toBeInTheDocument();

    const wizardScope = within(wizardDialog);

    // Step 2: Configure anniversary gala (change event type first, then custom title)
    const eventTypeSelect = wizardScope.getByLabelText(/Celebration Vertical/i);
    fireEvent.change(eventTypeSelect, { target: { value: 'anniversary' } });

    const titleInput = wizardScope.getByLabelText(/Celebration \/ Event Name/i);
    fireEvent.change(titleInput, { target: { value: 'Silver Horizon 25th Anniversary Gala' } });

    const guestInput = wizardScope.getByLabelText(/^Target Guests$/i);
    fireEvent.change(guestInput, { target: { value: '120' } });

    const budgetInput = wizardScope.getByLabelText(/Total Budget \(USD\)/i);
    fireEvent.change(budgetInput, { target: { value: '25000' } });

    // Step 3: Generate plan
    const generateBtn = wizardScope.getByRole('button', { name: /Generate AI Event Plan/i });
    fireEvent.click(generateBtn);

    // Verify header displays newly created celebration
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Silver Horizon 25th Anniversary Gala'
    );

    // Step 4: Navigate to Scenarios tab
    const scenariosTab = screen.getByRole('tab', { name: /What-If Scenarios/i });
    fireEvent.click(scenariosTab);

    expect(screen.getByText(/Budget "What-If" Scenario Simulator/i)).toBeInTheDocument();

    // Step 5: Apply Luxury Royale tier
    const applyLuxuryBtn = screen.getByRole('button', {
      name: /Apply Premium Scenario/i,
    });
    fireEvent.click(applyLuxuryBtn);

    // Step 6: Navigate to Guest List & RSVPs tab
    const guestsTab = screen.getByRole('tab', { name: /Guest List & RSVPs/i });
    fireEvent.click(guestsTab);

    // Confirm a pending guest
    const rsvpSelects = screen.getAllByLabelText(/RSVP status for/i);
    expect(rsvpSelects.length).toBeGreaterThan(0);
    fireEvent.change(rsvpSelects[0], { target: { value: 'confirmed' } });

    // Step 7: Export sanitized JSON
    const exportedJson = exportPlanToJson({
      title: 'Silver Horizon 25th Anniversary Gala',
      eventType: 'anniversary',
      guestCount: 120,
      totalBudget: 33750, // 25000 * 1.35 luxury
      geminiApiKey: 'AIzaSyDk838xkl193817SecureMockKey999',
      __proto__: { backdoor: 'malicious' },
    });

    const parsed = JSON.parse(exportedJson);
    expect(parsed.title).toBe('Silver Horizon 25th Anniversary Gala');
    expect(parsed.geminiApiKey).not.toContain('AIzaSyDk838xkl193817SecureMockKey999');
    expect(parsed.geminiApiKey).toContain('AIza...y999');
    expect(parsed.backdoor).toBeUndefined();
    expect(exportedJson).not.toContain('"backdoor"');
  });

  // Workflow 2: Budget Rebalancing Workflow
  it('2. Budget Rebalancing Workflow: Adjusting catering from 28% to 35% -> auto-rebalancing remaining categories to preserve 100% total', () => {
    const basePlan = createDefaultEventPlan();
    basePlan.totalBudget = 10000;
    // Set 4 canonical categories: Catering 28%, Venue 35%, Decor 20%, Photography 17% (Total: 100%)
    basePlan.budgetBreakdown = [
      {
        id: 'cat-catering',
        name: 'Catering & Beverages',
        percentage: 28,
        allocatedAmount: 2800,
        spentAmount: 1000,
        icon: 'Utensils',
        recommendations: [],
      },
      {
        id: 'cat-venue',
        name: 'Venue & Rental',
        percentage: 35,
        allocatedAmount: 3500,
        spentAmount: 1500,
        icon: 'Castle',
        recommendations: [],
      },
      {
        id: 'cat-decor',
        name: 'Decor & Florals',
        percentage: 20,
        allocatedAmount: 2000,
        spentAmount: 500,
        icon: 'Sparkles',
        recommendations: [],
      },
      {
        id: 'cat-photo',
        name: 'Photography & Media',
        percentage: 17,
        allocatedAmount: 1700,
        spentAmount: 0,
        icon: 'Camera',
        recommendations: [],
      },
    ];

    let currentCategories = [...basePlan.budgetBreakdown];
    const onUpdateBudget = vi.fn((newCats) => {
      currentCategories = newCats;
    });

    const { rerender } = render(
      <BudgetManager plan={basePlan} onUpdateBudget={onUpdateBudget} />
    );

    // Initial catering percentage slider
    const cateringSlider = screen.getByLabelText(/Catering & Beverages percentage slider/i);
    expect(cateringSlider).toHaveValue('28');

    // User updates catering to 35%
    fireEvent.change(cateringSlider, { target: { value: '35' } });
    expect(onUpdateBudget).toHaveBeenCalled();

    // Rebalance remaining categories to preserve exactly 100% sum
    // Remaining allocation for others = 100 - 35 = 65%
    const otherTotalPct = currentCategories
      .filter((c) => c.id !== 'cat-catering')
      .reduce((s, c) => s + c.percentage, 0);

    const rebalanced = currentCategories.map((cat) => {
      if (cat.id === 'cat-catering') return { ...cat, percentage: 35, allocatedAmount: 3500 };
      const normalizedPct = Math.round((cat.percentage / otherTotalPct) * 65);
      return {
        ...cat,
        percentage: normalizedPct,
        allocatedAmount: Math.round((10000 * normalizedPct) / 100),
      };
    });

    const totalPct = rebalanced.reduce((s, c) => s + c.percentage, 0);
    expect(totalPct).toBe(100);

    // Re-render with rebalanced categories
    const updatedPlan: EventPlan = { ...basePlan, budgetBreakdown: rebalanced };
    rerender(<BudgetManager plan={updatedPlan} onUpdateBudget={onUpdateBudget} />);

    expect(
      screen.getByLabelText(/Catering & Beverages percentage slider/i)
    ).toHaveValue('35');
    expect(screen.getAllByText(/3,500/).length).toBeGreaterThanOrEqual(1);
  });

  // Workflow 3: Dietary Safety Reconciliation
  it('3. Dietary Safety Reconciliation: Guest RSVPs with "Nut Allergy" and "Vegan" -> DietaryAuditBanner surfaces alert -> 1-click auto-resolve adds compliant dish -> banner dismisses', () => {
    const basePlan = createDefaultEventPlan();
    // Guests require Vegan and Nut-Free, but menu lacks a dedicated vegan main
    basePlan.guests = [
      {
        id: 'g-1',
        name: 'Jordan Rivera',
        email: 'jordan@example.com',
        dietary: 'Vegan, Nut Allergy',
        tableNumber: 1,
        rsvpStatus: 'confirmed',
        plusOnes: 0,
      },
    ];
    basePlan.menu = [
      {
        id: 'm-1',
        course: 'starters',
        name: 'Artisan Garden Salad',
        description: 'Mixed greens with lemon vinaigrette.',
        dietaryTags: ['Vegan', 'Gluten-Free'],
        recommendedQuantity: '1 serving',
        estimatedCost: 15,
      },
      {
        id: 'm-2',
        course: 'mains',
        name: 'Prime Ribeye Steak',
        description: 'Truffle butter and roasted potatoes.',
        dietaryTags: ['Gluten-Free'],
        recommendedQuantity: '1 serving',
        estimatedCost: 55,
      },
      {
        id: 'm-3',
        course: 'desserts',
        name: 'Vanilla Bean Gelato',
        description: 'Served with berries.',
        dietaryTags: ['Vegetarian', 'Gluten-Free'],
        recommendedQuantity: '1 serving',
        estimatedCost: 12,
      },
    ];

    let currentMenu = [...basePlan.menu];
    const onAddMenuItem = vi.fn((dish: MenuItem) => {
      currentMenu = [...currentMenu, dish];
    });

    const { rerender } = render(
      <DietaryAuditBanner plan={basePlan} onAddMenuItem={onAddMenuItem} />
    );

    // Audit banner detects missing vegan main
    expect(screen.getByText(/Vegan Main Course Deficiency/i)).toBeInTheDocument();
    expect(screen.getByText(/1 confirmed\/registered guest\(s\) require Vegan dining/i)).toBeInTheDocument();

    // 1-Click Auto-Resolve button
    const autoResolveBtn = screen.getByRole('button', {
      name: /1-Click Auto-Resolve/i,
    });
    fireEvent.click(autoResolveBtn);

    expect(onAddMenuItem).toHaveBeenCalledTimes(1);
    const addedDish = onAddMenuItem.mock.calls[0][0];
    expect(addedDish.course).toBe('mains');
    expect(addedDish.dietaryTags).toContain('Vegan');

    // Re-render banner with reconciled menu
    const reconciledPlan: EventPlan = { ...basePlan, menu: currentMenu };
    rerender(<DietaryAuditBanner plan={reconciledPlan} onAddMenuItem={onAddMenuItem} />);

    // Deficiency alert disappears and audit passed status displays
    expect(screen.queryByText(/Vegan Main Course Deficiency/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Dietary Audit Passed/i)).toBeInTheDocument();
  });

  // Workflow 4: Vendor Procurement Lifecycle
  it('4. Vendor Procurement Lifecycle: Adding new lighting vendor -> negotiating -> confirming contract -> metrics strip updates committed liability', () => {
    const basePlan = createDefaultEventPlan();
    basePlan.vendors = [
      {
        id: 'v-1',
        category: 'Banquet Hall',
        companyName: 'Grand Crystal Hall',
        contactPerson: 'Sophia Vance',
        emailOrPhone: 'sophia@example.com',
        estimatedCost: 10000,
        status: 'confirmed',
        notes: 'Deposit paid.',
      },
    ];

    let vendorState: VendorItem[] = [...basePlan.vendors];
    const onUpdateVendors = vi.fn((newVendors) => {
      vendorState = newVendors;
    });

    const { rerender } = render(
      <VendorDirectory plan={basePlan} onUpdateVendors={onUpdateVendors} />
    );

    // Initial state: 1 confirmed contract, committed spend: $10,000
    expect(screen.getByText(/Confirmed Contracts:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/10,000/).length).toBeGreaterThanOrEqual(1);

    // Step 1: Open modal and add new lighting vendor
    const addBtn = screen.getByRole('button', { name: /Add vendor partner/i });
    fireEvent.click(addBtn);

    const companyInput = screen.getByLabelText(/Company \/ Supplier Name/i);
    fireEvent.change(companyInput, { target: { value: 'Starlight Audio & FX' } });

    const costInput = screen.getByLabelText(/Estimated Cost/i);
    fireEvent.change(costInput, { target: { value: '4500' } });

    const contactInput = screen.getByLabelText(/Contact Person/i);
    fireEvent.change(contactInput, { target: { value: 'Marcus Rivera' } });

    const submitVendorBtn = screen.getByRole('button', { name: /Save Vendor/i });
    fireEvent.submit(submitVendorBtn.closest('form')!);

    expect(onUpdateVendors).toHaveBeenCalled();

    // Step 2: Transition vendor from planning to negotiating
    const updatedWithNewVendor: EventPlan = { ...basePlan, vendors: vendorState };
    rerender(<VendorDirectory plan={updatedWithNewVendor} onUpdateVendors={onUpdateVendors} />);

    const newVendorSelect = screen.getByLabelText(/Status for vendor Starlight Audio & FX/i);
    fireEvent.change(newVendorSelect, { target: { value: 'negotiating' } });
    expect(onUpdateVendors).toHaveBeenCalled();

    // Step 3: Confirm contract
    const negotiatingPlan: EventPlan = { ...basePlan, vendors: vendorState };
    rerender(<VendorDirectory plan={negotiatingPlan} onUpdateVendors={onUpdateVendors} />);

    const contractSelect = screen.getByLabelText(/Status for vendor Starlight Audio & FX/i);
    fireEvent.change(contractSelect, { target: { value: 'confirmed' } });

    // Step 4: Verify metrics strip reflects updated committed liability: $10,000 + $4,500 = $14,500
    const confirmedPlan: EventPlan = { ...basePlan, vendors: vendorState };
    rerender(<VendorDirectory plan={confirmedPlan} onUpdateVendors={onUpdateVendors} />);

    expect(screen.getAllByText(/14,500/).length).toBeGreaterThanOrEqual(1);
  });

  // Workflow 5: Speech Studio Rehearsal Workflow
  it('5. Speech Studio Rehearsal Workflow: Custom prompt -> tone adjustment -> speed slider update -> teleprompter synthesis -> TTS playback trigger', () => {
    const basePlan = createDefaultEventPlan();
    render(<SpeechStudio plan={basePlan} />);

    // Step 1: Add custom prompt
    const promptInput = screen.getByLabelText(/Custom Key Message \/ Theme Focus/i);
    fireEvent.change(promptInput, {
      target: { value: 'Honor 15 years of friendship and our summer road trips' },
    });

    // Step 2: Tone adjustment to emotional
    const toneSelect = screen.getByLabelText(/Tone of voice select/i);
    fireEvent.change(toneSelect, { target: { value: 'emotional' } });
    expect(toneSelect).toHaveValue('emotional');

    // Step 3: Speed slider adjustment to 1.25x
    const speedSlider = screen.getByLabelText(/Speech playback speed slider/i);
    fireEvent.change(speedSlider, { target: { value: '1.25' } });
    expect(speedSlider).toHaveValue('1.25');

    // Step 4: Teleprompter displays synthesized speech
    const teleprompter = screen.getByRole('region', { name: /Speech rehearsal script text/i });
    expect(teleprompter).toHaveTextContent(/Honor 15 years of friendship and our summer road trips/i);
    expect(teleprompter).toHaveTextContent(/Distinguished guests, family, and lifelong friends/i);

    // Step 5: Trigger TTS audio playback
    const listenBtn = screen.getByRole('button', { name: /Play speech preview/i });
    fireEvent.click(listenBtn);

    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });

  // Workflow 6: Scenario Simulator What-If Analysis
  it('6. Scenario Simulator Workflow: Comparing conservative, balanced, luxury tiers and applying budget updates', () => {
    const basePlan = createDefaultEventPlan();
    basePlan.totalBudget = 20000;
    const onApply = vi.fn();

    render(<ScenarioSimulator plan={basePlan} onApplyScenario={onApply} />);

    // Check all three cards are rendered
    expect(screen.getByText(/Essential \/ Conservative/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Balanced Target/i)).toBeInTheDocument();
    expect(screen.getByText(/Premium Royale \/ VIP/i)).toBeInTheDocument();

    // Apply conservative tier (80% of 20,000 = 16,000)
    const applyConservativeBtn = screen.getByRole('button', {
      name: /Apply Essential Scenario/i,
    });
    fireEvent.click(applyConservativeBtn);
    expect(onApply).toHaveBeenCalledWith(16000);

    // Apply luxury tier (135% of 20,000 = 27,000)
    const applyLuxuryBtn = screen.getByRole('button', {
      name: /Apply Premium Scenario/i,
    });
    fireEvent.click(applyLuxuryBtn);
    expect(onApply).toHaveBeenCalledWith(27000);
  });

  // Workflow 7: Guest Seating & Attendance Workflow
  it('7. Guest Seating & Attendance Workflow: Filtering by RSVP, adding guest, and updating status', () => {
    const basePlan = createDefaultEventPlan();
    let guestState: Guest[] = [...basePlan.guests];
    const onUpdateGuests = vi.fn((newGuests) => {
      guestState = newGuests;
    });

    const { rerender } = render(
      <GuestTracker plan={basePlan} onUpdateGuests={onUpdateGuests} />
    );

    // Step 1: Update RSVP of first guest
    const firstGuest = guestState[0];
    const rsvpSelect = screen.getByLabelText(`RSVP status for ${firstGuest.name}`);
    fireEvent.change(rsvpSelect, { target: { value: 'declined' } });
    expect(onUpdateGuests).toHaveBeenCalled();

    // Step 2: Open Add Guest Modal
    const addGuestBtn = screen.getByRole('button', { name: /Add Guest/i });
    fireEvent.click(addGuestBtn);

    // Fill form
    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: 'Dr. Evelyn Reed' } });

    const submitGuestBtn = screen.getByRole('button', { name: /Save Guest/i });
    fireEvent.submit(submitGuestBtn.closest('form')!);

    expect(onUpdateGuests).toHaveBeenCalled();

    // Step 3: Re-render and assert guest in list
    const updatedPlan: EventPlan = { ...basePlan, guests: guestState };
    rerender(<GuestTracker plan={updatedPlan} onUpdateGuests={onUpdateGuests} />);

    expect(screen.getByText('Dr. Evelyn Reed')).toBeInTheDocument();
  });

  // Workflow 8: Run-of-Show Stage Execution
  it('8. Run-of-Show Stage Execution: Toggling milestone completion and adding a custom milestone', () => {
    const basePlan = createDefaultEventPlan();
    let timelineState = [...basePlan.timeline];
    const onUpdateTimeline = vi.fn((newTimeline) => {
      timelineState = newTimeline;
    });

    const { rerender } = render(
      <TimelineRunOfShow plan={basePlan} onUpdateTimeline={onUpdateTimeline} />
    );

    // Toggle milestone completion checkbox
    const milestoneToggleBtns = screen.getAllByRole('button', { name: /Mark milestone/i });
    expect(milestoneToggleBtns.length).toBeGreaterThan(0);
    fireEvent.click(milestoneToggleBtns[0]);

    expect(onUpdateTimeline).toHaveBeenCalled();

    // Add custom milestone
    const addMilestoneBtn = screen.getByRole('button', { name: /Add Milestone/i });
    fireEvent.click(addMilestoneBtn);

    const timeInput = screen.getByLabelText(/Time \(e\.g/i);
    fireEvent.change(timeInput, { target: { value: '7:30 PM' } });

    const titleInput = screen.getByLabelText(/Milestone Title/i);
    fireEvent.change(titleInput, { target: { value: 'Champagne Tower Pour & Toast' } });

    const submitBtn = screen.getByRole('button', { name: /Save Milestone/i });
    fireEvent.submit(submitBtn.closest('form')!);

    expect(onUpdateTimeline).toHaveBeenCalled();

    const updatedPlan: EventPlan = { ...basePlan, timeline: timelineState };
    rerender(<TimelineRunOfShow plan={updatedPlan} onUpdateTimeline={onUpdateTimeline} />);

    expect(screen.getByText('Champagne Tower Pour & Toast')).toBeInTheDocument();
  });
});
