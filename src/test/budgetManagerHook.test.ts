import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBudgetManager } from '../hooks/useBudgetManager';
import { BudgetCategory } from '../types';

describe('Task 1: Budget Manager Hook & Domain Logic Tests', () => {
  const sampleCategories: BudgetCategory[] = [
    {
      id: 'cat-1',
      name: 'Venue & Rental',
      percentage: 40,
      allocatedAmount: 4000,
      spentAmount: 1500,
      icon: 'Castle',
      recommendations: ['Banquet hall deposit'],
    },
    {
      id: 'cat-2',
      name: 'Catering & Dining',
      percentage: 30,
      allocatedAmount: 3000,
      spentAmount: 1000,
      icon: 'Utensils',
      recommendations: ['Tasting session'],
    },
    {
      id: 'cat-3',
      name: 'Photography & Media',
      percentage: 20,
      allocatedAmount: 2000,
      spentAmount: 500,
      icon: 'Camera',
      recommendations: ['Drone booking'],
    },
    {
      id: 'cat-4',
      name: 'Decor & Flowers',
      percentage: 10,
      allocatedAmount: 1000,
      spentAmount: 0,
      icon: 'Sparkles',
      recommendations: ['Fairylights'],
    },
  ];

  const initialTotalBudget = 10000;

  // Test 1: Initial calculation
  it('1. correctly computes initial totalAllocated, totalSpent, and remainingBudget', () => {
    const { result } = renderHook(() => useBudgetManager(sampleCategories, initialTotalBudget));

    // 4000 + 3000 + 2000 + 1000 = 10,000
    expect(result.current.totalAllocated).toBe(10000);
    // 1500 + 1000 + 500 + 0 = 3,000
    expect(result.current.totalSpent).toBe(3000);
    // 10,000 - 3,000 = 7,000
    expect(result.current.remainingBudget).toBe(7000);
    // 10,000 - 10,000 = 0
    expect(result.current.unallocatedBudget).toBe(0);
    // 40 + 30 + 20 + 10 = 100%
    expect(result.current.totalPercentage).toBe(100);
    expect(result.current.isOverBudget).toBe(false);
  });

  // Test 2: Allocation changes
  it('2. allocation changes properly update percentage and remaining budget', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useBudgetManager(sampleCategories, initialTotalBudget, onUpdate));

    act(() => {
      // Increase Venue from 40% to 50%
      result.current.updateAllocation('cat-1', 50);
    });

    const venueCat = result.current.categories.find((c) => c.id === 'cat-1');
    expect(venueCat?.percentage).toBe(50);
    expect(venueCat?.allocatedAmount).toBe(5000);
    expect(result.current.totalAllocated).toBe(11000);
    expect(result.current.unallocatedBudget).toBe(-1000);
    // Remaining budget is based on actual spent (10,000 - 3,000 = 7,000)
    expect(result.current.remainingBudget).toBe(7000);
    expect(result.current.totalPercentage).toBe(110);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  // Test 3: Recording spending & isOverBudget
  it('3. recording spending increases totalSpent and adjusts isOverBudget flag', () => {
    const { result } = renderHook(() => useBudgetManager(sampleCategories, initialTotalBudget));

    expect(result.current.isOverBudget).toBe(false);

    act(() => {
      // Set cat-1 spent to 8,000 (total spent becomes 8,000 + 1,000 + 500 + 0 = 9,500)
      result.current.recordSpending('cat-1', 8000, 'set');
    });

    expect(result.current.totalSpent).toBe(9500);
    expect(result.current.remainingBudget).toBe(500);
    expect(result.current.isOverBudget).toBe(false);

    act(() => {
      // Add 1,000 more to cat-2 (total spent becomes 9,500 + 1,000 = 10,500)
      result.current.recordSpending('cat-2', 1000, 'add');
    });

    expect(result.current.totalSpent).toBe(10500);
    expect(result.current.remainingBudget).toBe(-500);
    expect(result.current.isOverBudget).toBe(true);
  });

  // Test 4: Adding custom budget category
  it('4. adding custom budget category correctly calculates percentage', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useBudgetManager(sampleCategories, initialTotalBudget, onUpdate));

    act(() => {
      result.current.addCategory({
        name: 'Live Band & Entertainment',
        allocatedAmount: 2500,
        icon: 'Music',
      });
    });

    expect(result.current.categories).toHaveLength(5);
    const addedCat = result.current.categories[4];
    expect(addedCat.name).toBe('Live Band & Entertainment');
    expect(addedCat.allocatedAmount).toBe(2500);
    // Math.round((2,500 / 10,000) * 100) = 25%
    expect(addedCat.percentage).toBe(25);
    expect(result.current.totalPercentage).toBe(125);
    expect(result.current.totalAllocated).toBe(12500);
    expect(onUpdate).toHaveBeenCalled();
  });

  // Test 5: Removing a budget category
  it('5. removing a budget category updates remaining budget correctly', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useBudgetManager(sampleCategories, initialTotalBudget, onUpdate));

    act(() => {
      // Remove cat-1 (allocated: 4000, spent: 1500)
      result.current.removeCategory('cat-1');
    });

    expect(result.current.categories).toHaveLength(3);
    expect(result.current.categories.find((c) => c.id === 'cat-1')).toBeUndefined();
    // Total spent drops from 3000 to 1500 (1000 + 500 + 0)
    expect(result.current.totalSpent).toBe(1500);
    // Remaining budget increases to 10000 - 1500 = 8500
    expect(result.current.remainingBudget).toBe(8500);
    // Total allocated drops to 6000
    expect(result.current.totalAllocated).toBe(6000);
    expect(onUpdate).toHaveBeenCalled();
  });

  // Test 6: Rebalance budget
  it('6. rebalance budget redistributes allocations across categories proportionally', () => {
    // Uneven categories with total 80%
    const unalignedCategories: BudgetCategory[] = [
      { id: 'u1', name: 'Cat 1', percentage: 40, allocatedAmount: 4000, spentAmount: 0, icon: '', recommendations: [] },
      { id: 'u2', name: 'Cat 2', percentage: 20, allocatedAmount: 2000, spentAmount: 0, icon: '', recommendations: [] },
      { id: 'u3', name: 'Cat 3', percentage: 20, allocatedAmount: 2000, spentAmount: 0, icon: '', recommendations: [] },
    ];

    const { result } = renderHook(() => useBudgetManager(unalignedCategories, 10000));
    expect(result.current.totalPercentage).toBe(80);

    act(() => {
      result.current.rebalanceBudget();
    });

    // 40/80 = 50%, 20/80 = 25%, 20/80 = 25% -> 50 + 25 + 25 = 100%
    expect(result.current.totalPercentage).toBe(100);
    expect(result.current.categories[0].percentage).toBe(50);
    expect(result.current.categories[0].allocatedAmount).toBe(5000);
    expect(result.current.categories[1].percentage).toBe(25);
    expect(result.current.categories[1].allocatedAmount).toBe(2500);
    expect(result.current.categories[2].percentage).toBe(25);
    expect(result.current.categories[2].allocatedAmount).toBe(2500);
    expect(result.current.totalAllocated).toBe(10000);
  });

  // Test 7: Budget tiers ('budget', 'balanced', 'luxury')
  it('7. applying budget, balanced, and luxury tiers scales allocations correctly', () => {
    const { result } = renderHook(() => useBudgetManager(sampleCategories, initialTotalBudget));

    // Apply 'budget' tier (0.8x scaler)
    act(() => {
      result.current.applyTier('budget');
    });

    expect(result.current.currentTier).toBe('budget');
    expect(result.current.totalBudget).toBe(8000);
    // Cat 1 (40% of 8,000 = 3,200)
    expect(result.current.categories[0].allocatedAmount).toBe(3200);
    // Cat 2 (30% of 8,000 = 2,400)
    expect(result.current.categories[1].allocatedAmount).toBe(2400);
    expect(result.current.totalAllocated).toBe(8000);

    // Apply 'luxury' tier (1.5x scaler)
    act(() => {
      result.current.applyTier('luxury');
    });

    expect(result.current.currentTier).toBe('luxury');
    expect(result.current.totalBudget).toBe(15000);
    // Cat 1 (40% of 15,000 = 6,000)
    expect(result.current.categories[0].allocatedAmount).toBe(6000);
    // Cat 2 (30% of 15,000 = 4,500)
    expect(result.current.categories[1].allocatedAmount).toBe(4500);
    expect(result.current.totalAllocated).toBe(15000);

    // Return to 'balanced' tier (1.0x scaler)
    act(() => {
      result.current.applyTier('balanced');
    });

    expect(result.current.currentTier).toBe('balanced');
    expect(result.current.totalBudget).toBe(10000);
    expect(result.current.categories[0].allocatedAmount).toBe(4000);
    expect(result.current.totalAllocated).toBe(10000);
  });

  // Test 8: Zero total budget boundary check
  it('8. boundary check: handling zero total budget without division-by-zero or NaN', () => {
    const { result } = renderHook(() => useBudgetManager(sampleCategories, 0));

    expect(result.current.totalBudget).toBe(0);
    expect(Number.isNaN(result.current.remainingBudget)).toBe(false);
    expect(result.current.remainingBudget).toBe(-3000);

    // Adding category with zero total budget calculates percentage as 0, never NaN
    act(() => {
      result.current.addCategory({
        name: 'Emergency Buffer',
        allocatedAmount: 500,
      });
    });

    const newCat = result.current.categories[result.current.categories.length - 1];
    expect(Number.isNaN(newCat.percentage)).toBe(false);
    expect(newCat.percentage).toBe(0);

    // Rebalancing with zero total budget shouldn't crash or produce NaN
    act(() => {
      result.current.rebalanceBudget();
    });

    result.current.categories.forEach((cat) => {
      expect(Number.isNaN(cat.allocatedAmount)).toBe(false);
      expect(Number.isNaN(cat.percentage)).toBe(false);
      expect(cat.allocatedAmount).toBe(0);
    });
  });

  // Test 9: Negative spending & spending exceeding allocation
  it('9. boundary check: recording negative spending or spending exceeding allocation', () => {
    const { result } = renderHook(() => useBudgetManager(sampleCategories, initialTotalBudget));

    // Record negative spend (-500) -> should be clamped to 0
    act(() => {
      result.current.recordSpending('cat-4', -500, 'set');
    });

    const cat4 = result.current.categories.find((c) => c.id === 'cat-4');
    expect(cat4?.spentAmount).toBe(0);

    // Record spending exceeding allocation on cat-4 (allocated: 1000, spend: 2500)
    act(() => {
      result.current.recordSpending('cat-4', 2500, 'set');
    });

    const updatedCat4 = result.current.categories.find((c) => c.id === 'cat-4');
    expect(updatedCat4?.spentAmount).toBe(2500);
    expect(result.current.overAllocatedCategories).toContainEqual(
      expect.objectContaining({ id: 'cat-4' })
    );
    expect(result.current.totalSpent).toBe(5500); // 1500 + 1000 + 500 + 2500
  });

  // Test 10: Finding highest expense category
  it('10. finding highest expense category works accurately', () => {
    const { result } = renderHook(() => useBudgetManager(sampleCategories, initialTotalBudget));

    // Initially cat-1 has 4000 (highest allocated)
    expect(result.current.highestExpenseCategory?.id).toBe('cat-1');
    expect(result.current.highestExpenseCategory?.name).toBe('Venue & Rental');

    // Update cat-3 to 60% (6000 allocated)
    act(() => {
      result.current.updateAllocation('cat-3', 60);
    });

    expect(result.current.highestExpenseCategory?.id).toBe('cat-3');
    expect(result.current.highestExpenseCategory?.name).toBe('Photography & Media');

    // Empty category list returns null safely
    const { result: emptyResult } = renderHook(() => useBudgetManager([], initialTotalBudget));
    expect(emptyResult.current.highestExpenseCategory).toBeNull();
    expect(emptyResult.current.highestSpentCategory).toBeNull();
  });
});
