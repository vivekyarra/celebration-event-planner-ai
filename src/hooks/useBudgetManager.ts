/**
 * CelebriteAI Separation of Concerns Hook: Dynamic Budget Allocator & Cost Manager
 * Encapsulates financial calculations, category allocations, spending records,
 * what-if tier scalings, and budget variance metrics.
 *
 * @module hooks/useBudgetManager
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { BudgetCategory, BudgetTier } from '../types';

export interface UseBudgetManagerReturn {
  /** Current array of budget categories with allocations and actual spend. */
  categories: BudgetCategory[];
  /** Effective total budget ceiling. */
  totalBudget: number;
  /** Active budget scenario tier ('budget' | 'balanced' | 'luxury'). */
  currentTier: BudgetTier;
  /** Total sum of currency allocated across all categories. */
  totalAllocated: number;
  /** Total sum of actual currency spent across all categories. */
  totalSpent: number;
  /** Net remaining unspent budget (totalBudget - totalSpent). */
  remainingBudget: number;
  /** Amount of budget not yet assigned to any category (totalBudget - totalAllocated). */
  unallocatedBudget: number;
  /** Percentage variance between actual spent and total budget. Positive if over budget, negative if under budget. */
  budgetVariancePercentage: number;
  /** Category with the largest allocation or expense line item. Returns null if categories list is empty. */
  highestExpenseCategory: BudgetCategory | null;
  /** Category with the highest actual spent amount. Returns null if categories list is empty. */
  highestSpentCategory: BudgetCategory | null;
  /** Array of categories where actual spending exceeds allocated amount. */
  overAllocatedCategories: BudgetCategory[];
  /** Boolean indicating whether total spend exceeds the total budget ceiling. */
  isOverBudget: boolean;
  /** Aggregate percentage across all categories (target is 100%). */
  totalPercentage: number;
  /** Updates the allocated amount for a category and synchronizes its percentage against totalBudget. */
  updateCategoryAllocation: (id: string, amount: number) => void;
  /** Updates the allocation percentage for a category and recomputes its allocatedAmount. */
  updateCategoryPercentage: (id: string, percentage: number) => void;
  /** Updates the allocation percentage for a category and recomputes its allocatedAmount (alias for updateCategoryPercentage). */
  updateAllocation: (id: string, percentage: number) => void;
  /** Records actual spending incurred for a category with optional 'set' or 'add' mode. */
  recordSpending: (id: string, amount: number, mode?: 'set' | 'add') => void;
  /** Adds a new custom budget category line item. */
  addCustomCategory: (category: Omit<BudgetCategory, 'id'> | Partial<BudgetCategory>) => void;
  /** Adds a new custom budget category line item (alias for addCustomCategory). */
  addCategory: (category: Omit<BudgetCategory, 'id'> | Partial<BudgetCategory>) => void;
  /** Permanently removes a budget category by ID. */
  removeCategory: (id: string) => void;
  /** Proportionally redistributes allocations to match a newly specified total budget, or normalizes existing budget to 100%. */
  rebalanceBudget: (newBudget?: number) => void;
  /** Applies algorithmic scaling factors corresponding to conservative ('budget'), baseline ('balanced'), or luxury tiers. */
  applyBudgetTier: (tier: BudgetTier) => void;
  /** Applies algorithmic scaling factors corresponding to conservative ('budget'), baseline ('balanced'), or luxury tiers (alias). */
  applyTier: (tier: BudgetTier) => void;
}

/**
 * Custom React hook for managing event budgets, category distributions, and spending analytics.
 *
 * @param initialCategories Initial array of budget categories.
 * @param initialTotalBudget Total monetary budget available for the celebration.
 * @param onUpdateBudget Optional callback invoked whenever categories or total budget are updated.
 * @returns Object providing budget operations, mutations, and memoized financial analytics.
 *
 * @example
 * ```tsx
 * const {
 *   categories,
 *   totalAllocated,
 *   totalSpent,
 *   remainingBudget,
 *   isOverBudget,
 *   updateCategoryAllocation,
 *   recordSpending,
 *   rebalanceBudget,
 *   applyBudgetTier
 * } = useBudgetManager(plan.budgetBreakdown, plan.totalBudget, onUpdateBudget);
 * ```
 */
export function useBudgetManager(
  initialCategories: BudgetCategory[] = [],
  initialTotalBudget: number = 0,
  onUpdateBudget?: (newCategories: BudgetCategory[], newTotalBudget?: number) => void
): UseBudgetManagerReturn {
  const [categories, setCategories] = useState<BudgetCategory[]>(initialCategories);
  const [totalBudget, setTotalBudget] = useState<number>(initialTotalBudget);
  const [currentTier, setCurrentTier] = useState<BudgetTier>('balanced');
  const baselineBudgetRef = useRef<number>(initialTotalBudget);

  // Synchronize internal state when props update externally
  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setTotalBudget(initialTotalBudget);
    baselineBudgetRef.current = initialTotalBudget;
  }, [initialTotalBudget]);

  const commitUpdate = useCallback(
    (newCategories: BudgetCategory[], newBudget?: number) => {
      setCategories(newCategories);
      if (typeof newBudget === 'number') {
        setTotalBudget(newBudget);
      }
      if (onUpdateBudget) {
        onUpdateBudget(newCategories, newBudget);
      }
    },
    [onUpdateBudget]
  );

  const updateCategoryAllocation = useCallback(
    (id: string, amount: number) => {
      const clampedAmount = Math.max(0, amount);
      const updated = categories.map((cat) => {
        if (cat.id === id) {
          const pct = totalBudget > 0 ? Math.round((clampedAmount / totalBudget) * 100) : 0;
          return {
            ...cat,
            allocatedAmount: clampedAmount,
            percentage: pct,
          };
        }
        return cat;
      });
      commitUpdate(updated);
    },
    [categories, totalBudget, commitUpdate]
  );

  const updateCategoryPercentage = useCallback(
    (id: string, percentage: number) => {
      const clampedPct = Math.max(0, percentage);
      const updated = categories.map((cat) => {
        if (cat.id === id) {
          const amount = Math.round((totalBudget * clampedPct) / 100);
          return {
            ...cat,
            percentage: clampedPct,
            allocatedAmount: amount,
          };
        }
        return cat;
      });
      commitUpdate(updated);
    },
    [categories, totalBudget, commitUpdate]
  );

  const recordSpending = useCallback(
    (id: string, amount: number, mode: 'set' | 'add' = 'set') => {
      const updated = categories.map((cat) => {
        if (cat.id === id) {
          const baseSpent = mode === 'add' ? cat.spentAmount : 0;
          const nextSpent = Math.max(0, baseSpent + amount);
          return { ...cat, spentAmount: nextSpent };
        }
        return cat;
      });
      commitUpdate(updated);
    },
    [categories, commitUpdate]
  );

  const addCustomCategory = useCallback(
    (categoryInput: Omit<BudgetCategory, 'id'> | Partial<BudgetCategory>) => {
      const allocated = Math.max(0, categoryInput.allocatedAmount || 0);
      let percentage = categoryInput.percentage;
      if (typeof percentage !== 'number') {
        percentage = totalBudget > 0 ? Math.round((allocated / totalBudget) * 100) : 0;
      }

      const rawId = 'id' in categoryInput ? (categoryInput as { id?: string }).id : undefined;
      const newCategory: BudgetCategory = {
        id:
          rawId ||
          `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: (categoryInput.name || 'New Category').trim(),
        percentage,
        allocatedAmount: allocated,
        spentAmount: Math.max(0, categoryInput.spentAmount || 0),
        icon: categoryInput.icon || 'Tag',
        recommendations:
          categoryInput.recommendations && categoryInput.recommendations.length > 0
            ? categoryInput.recommendations
            : ['Track receipts and invoices directly with vendor.'],
      };

      const updated = [...categories, newCategory];
      commitUpdate(updated);
    },
    [categories, totalBudget, commitUpdate]
  );

  const removeCategory = useCallback(
    (id: string) => {
      const updated = categories.filter((cat) => cat.id !== id);
      commitUpdate(updated);
    },
    [categories, commitUpdate]
  );

  const rebalanceBudget = useCallback(
    (newBudget?: number) => {
      const targetBudget = typeof newBudget === 'number' ? Math.max(0, newBudget) : totalBudget;
      baselineBudgetRef.current = targetBudget;

      const currentTotalPct = categories.reduce((sum, c) => sum + (c.percentage || 0), 0);
      const updated = categories.map((cat) => {
        if (targetBudget === 0) {
          return {
            ...cat,
            percentage: 0,
            allocatedAmount: 0,
          };
        }
        const normalizedPct =
          currentTotalPct > 0 ? Math.round((cat.percentage / currentTotalPct) * 100) : 0;
        const allocated = Math.round((targetBudget * normalizedPct) / 100);
        return {
          ...cat,
          percentage: normalizedPct,
          allocatedAmount: allocated,
        };
      });
      commitUpdate(updated, targetBudget);
    },
    [categories, totalBudget, commitUpdate]
  );

  const applyBudgetTier = useCallback(
    (tier: BudgetTier) => {
      setCurrentTier(tier);
      const tierMultipliers: Record<BudgetTier, number> = {
        budget: 0.8,
        balanced: 1.0,
        luxury: 1.5,
      };

      const multiplier = tierMultipliers[tier] ?? 1.0;
      const base = baselineBudgetRef.current > 0 ? baselineBudgetRef.current : totalBudget;
      const targetBudget = Math.round(base * multiplier);

      const totalPct = categories.reduce((sum, c) => sum + (c.percentage || 0), 0);
      const updated = categories.map((cat) => {
        const ratio =
          totalPct > 0 ? cat.percentage / 100 : (base > 0 ? cat.allocatedAmount / base : 0);
        const newAllocated = Math.round(targetBudget * ratio);
        return {
          ...cat,
          allocatedAmount: newAllocated,
        };
      });

      commitUpdate(updated, targetBudget);
    },
    [categories, totalBudget, commitUpdate]
  );

  // Memoized Derived Metrics
  const totalAllocated = useMemo(
    () => categories.reduce((sum, c) => sum + (c.allocatedAmount || 0), 0),
    [categories]
  );

  const totalSpent = useMemo(
    () => categories.reduce((sum, c) => sum + (c.spentAmount || 0), 0),
    [categories]
  );

  const remainingBudget = useMemo(
    () => totalBudget - totalSpent,
    [totalBudget, totalSpent]
  );

  const unallocatedBudget = useMemo(
    () => totalBudget - totalAllocated,
    [totalBudget, totalAllocated]
  );

  const budgetVariancePercentage = useMemo(() => {
    if (totalBudget <= 0) return 0;
    return Number((((totalSpent - totalBudget) / totalBudget) * 100).toFixed(2));
  }, [totalSpent, totalBudget]);

  const highestExpenseCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return categories.reduce<BudgetCategory>((max, cat) => {
      return cat.allocatedAmount > max.allocatedAmount ? cat : max;
    }, categories[0]);
  }, [categories]);

  const highestSpentCategory = useMemo(() => {
    if (categories.length === 0) return null;
    return categories.reduce<BudgetCategory>((max, cat) => {
      return cat.spentAmount > max.spentAmount ? cat : max;
    }, categories[0]);
  }, [categories]);

  const overAllocatedCategories = useMemo(
    () => categories.filter((cat) => cat.spentAmount > cat.allocatedAmount),
    [categories]
  );

  const isOverBudget = useMemo(
    () => totalSpent > totalBudget,
    [totalSpent, totalBudget]
  );

  const totalPercentage = useMemo(
    () => categories.reduce((sum, c) => sum + (c.percentage || 0), 0),
    [categories]
  );

  return {
    categories,
    totalBudget,
    currentTier,
    totalAllocated,
    totalSpent,
    remainingBudget,
    unallocatedBudget,
    budgetVariancePercentage,
    highestExpenseCategory,
    highestSpentCategory,
    overAllocatedCategories,
    isOverBudget,
    totalPercentage,
    updateCategoryAllocation,
    updateCategoryPercentage,
    updateAllocation: updateCategoryPercentage,
    recordSpending,
    addCustomCategory,
    addCategory: addCustomCategory,
    removeCategory,
    rebalanceBudget,
    applyBudgetTier,
    applyTier: applyBudgetTier,
  };
}
