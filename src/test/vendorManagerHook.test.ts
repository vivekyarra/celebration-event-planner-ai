import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVendorManager } from '../hooks/useVendorManager';
import { VendorItem } from '../types';

describe('Task 2: Vendor Manager Hook & Domain Logic Tests', () => {
  const sampleVendors: VendorItem[] = [
    {
      id: 'v-1',
      category: 'Venue & Banquet',
      companyName: 'Grand Horizons Sanctuary',
      contactPerson: 'Sophia Vance',
      emailOrPhone: 'events@grandhorizons.example.com',
      estimatedCost: 10000,
      status: 'confirmed',
      notes: 'Deposit paid; hall secured.',
    },
    {
      id: 'v-2',
      category: 'Catering & Dining',
      companyName: 'Artisan Palate',
      contactPerson: 'Marcus Ray',
      emailOrPhone: 'marcus@artisanpalate.example.com',
      estimatedCost: 7000,
      status: 'contacted',
      notes: 'Menu tasting scheduled.',
    },
    {
      id: 'v-3',
      category: 'Photography',
      companyName: 'Candid Moments',
      contactPerson: 'David Chen',
      emailOrPhone: 'studio@candidmoments.example.com',
      estimatedCost: 3000,
      status: 'confirmed',
      notes: 'Drone operator included.',
    },
    {
      id: 'v-4',
      category: 'Decor & Florals',
      companyName: 'Bloom & Prism',
      contactPerson: 'Elena Rostova',
      emailOrPhone: 'hello@bloomandprism.example.com',
      estimatedCost: 2500,
      status: 'planning',
      notes: 'Reviewing color palette.',
    },
  ];

  // Test 1: Initial vendor list metrics
  it('1. calculates initial vendor list metrics accurately (totalCommittedCost, confirmedVendorCount)', () => {
    const { result } = renderHook(() => useVendorManager(sampleVendors));

    // 10000 + 7000 + 3000 + 2500 = 22,500
    expect(result.current.totalCommittedCost).toBe(22500);
    // v-1 and v-3 are confirmed
    expect(result.current.confirmedVendorCount).toBe(2);
    // v-4 is planning
    expect(result.current.planningVendorCount).toBe(1);
    expect(result.current.completedVendorCount).toBe(0);
    expect(result.current.vendors).toHaveLength(4);
  });

  // Test 2: Adding a new vendor
  it('2. adding a new vendor increases vendor count and commits cost', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useVendorManager(sampleVendors, onUpdate));

    act(() => {
      result.current.addVendor({
        category: 'Sound & Lighting',
        companyName: 'Pulse Audio Dynamics',
        contactPerson: 'Alex Ryder',
        emailOrPhone: 'alex@pulseaudio.example.com',
        estimatedCost: 1800,
        status: 'planning',
        notes: 'Wireless microphones & stage lights',
      });
    });

    expect(result.current.vendors).toHaveLength(5);
    // 22500 + 1800 = 24,300
    expect(result.current.totalCommittedCost).toBe(24300);
    expect(result.current.planningVendorCount).toBe(2);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0]).toHaveLength(5);
  });

  // Test 3: Updating vendor status
  it('3. updating vendor status from contacted to confirmed updates confirmedVendorCount', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useVendorManager(sampleVendors, onUpdate));

    expect(result.current.confirmedVendorCount).toBe(2);

    act(() => {
      // Transition v-2 from 'contacted' to 'confirmed'
      result.current.updateVendorStatus('v-2', 'confirmed');
    });

    expect(result.current.confirmedVendorCount).toBe(3);
    expect(result.current.statusCounts.confirmed).toBe(3);
    expect(result.current.statusCounts.contacted).toBe(0);
    expect(onUpdate).toHaveBeenCalled();
  });

  // Test 4: Deleting vendor
  it('4. deleting vendor recalculates committed cost and category breakdown', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useVendorManager(sampleVendors, onUpdate));

    act(() => {
      // Delete v-1 (10,000 cost, Venue & Banquet)
      result.current.deleteVendor('v-1');
    });

    expect(result.current.vendors).toHaveLength(3);
    expect(result.current.vendors.find((v) => v.id === 'v-1')).toBeUndefined();
    // 22500 - 10000 = 12,500
    expect(result.current.totalCommittedCost).toBe(12500);
    expect(result.current.categoryBreakdown['Venue & Banquet']).toBeUndefined();
    expect(result.current.categoryBreakdown['Catering & Dining']).toBe(7000);
    expect(onUpdate).toHaveBeenCalled();
  });

  // Test 5: Filtering by status
  it('5. filtering by status returns correct subset', () => {
    const { result } = renderHook(() => useVendorManager(sampleVendors));

    const confirmed = result.current.filterByStatus('confirmed');
    expect(confirmed).toHaveLength(2);
    expect(confirmed.map((v) => v.id)).toEqual(['v-1', 'v-3']);

    const planning = result.current.filterByStatus('planning');
    expect(planning).toHaveLength(1);
    expect(planning[0].id).toBe('v-4');

    const completed = result.current.filterByStatus('completed');
    expect(completed).toHaveLength(0);

    const all = result.current.filterByStatus('all');
    expect(all).toHaveLength(4);
  });

  // Test 6: Filtering by category
  it('6. filtering by category works accurately and case-insensitively', () => {
    const { result } = renderHook(() => useVendorManager(sampleVendors));

    const photoVendors = result.current.filterByCategory('Photography');
    expect(photoVendors).toHaveLength(1);
    expect(photoVendors[0].companyName).toBe('Candid Moments');

    const cateringLower = result.current.filterByCategory('catering & dining');
    expect(cateringLower).toHaveLength(1);
    expect(cateringLower[0].companyName).toBe('Artisan Palate');

    const missing = result.current.filterByCategory('Transportation');
    expect(missing).toHaveLength(0);
  });

  // Test 7: Handling duplicate vendor categories
  it('7. handling duplicate vendor categories aggregates correctly', () => {
    const vendorsWithDuplicates: VendorItem[] = [
      {
        id: 'dup-1',
        category: 'Catering',
        companyName: 'Main Courses Inc',
        contactPerson: 'Chef A',
        emailOrPhone: 'a@food.com',
        estimatedCost: 5000,
        status: 'confirmed',
        notes: '',
      },
      {
        id: 'dup-2',
        category: 'Catering',
        companyName: 'Dessert Bar Co',
        contactPerson: 'Chef B',
        emailOrPhone: 'b@food.com',
        estimatedCost: 3000,
        status: 'confirmed',
        notes: '',
      },
      {
        id: 'dup-3',
        category: 'Catering',
        companyName: 'Coffee & Drinks Pod',
        contactPerson: 'Barista C',
        emailOrPhone: 'c@coffee.com',
        estimatedCost: 1500,
        status: 'planning',
        notes: '',
      },
      {
        id: 'dup-4',
        category: 'Security',
        companyName: 'SafeGuard Guards',
        contactPerson: 'Guard D',
        emailOrPhone: 'd@guard.com',
        estimatedCost: 1200,
        status: 'confirmed',
        notes: '',
      },
    ];

    const { result } = renderHook(() => useVendorManager(vendorsWithDuplicates));

    // 5000 + 3000 + 1500 = 9500 for Catering
    expect(result.current.categoryBreakdown['Catering']).toBe(9500);
    expect(result.current.categoryCount['Catering']).toBe(3);
    expect(result.current.categoryBreakdown['Security']).toBe(1200);
    expect(result.current.categoryCount['Security']).toBe(1);
    expect(result.current.totalCommittedCost).toBe(10700);
  });

  // Test 8: Zero-cost or complimentary vendors
  it('8. handling zero-cost or complimentary vendors', () => {
    const { result } = renderHook(() => useVendorManager(sampleVendors));

    act(() => {
      // Complimentary family DJ / volunteer
      result.current.addVendor({
        category: 'Volunteer Entertainment',
        companyName: 'Cousin DJ Service (Complimentary)',
        contactPerson: 'Leo',
        emailOrPhone: 'leo@family.example.com',
        estimatedCost: 0,
        status: 'confirmed',
        notes: 'Complimentary favor, no invoice needed.',
      });
    });

    expect(result.current.vendors).toHaveLength(5);
    // Cost does not change
    expect(result.current.totalCommittedCost).toBe(22500);
    expect(result.current.categoryBreakdown['Volunteer Entertainment']).toBe(0);
    expect(result.current.categoryCount['Volunteer Entertainment']).toBe(1);
    // Confirmed count increases
    expect(result.current.confirmedVendorCount).toBe(3);

    // Negative cost boundary check: clamps to 0
    act(() => {
      result.current.addVendor({
        category: 'Sponsor Rebate',
        companyName: 'Sponsored Gift Bag',
        contactPerson: 'Partner Lead',
        emailOrPhone: 'sponsor@example.com',
        estimatedCost: -500,
        status: 'confirmed',
        notes: 'Sponsor provided free gifts',
      });
    });

    const sponsorVendor = result.current.vendors[result.current.vendors.length - 1];
    expect(sponsorVendor.estimatedCost).toBe(0);
    expect(Number.isNaN(result.current.totalCommittedCost)).toBe(false);
  });
});
