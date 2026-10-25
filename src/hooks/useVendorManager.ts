/**
 * CelebriteAI Separation of Concerns Hook: Vendor Directory & RFP Manager
 * Encapsulates supplier contracts, quote tracking, status transitions,
 * category distributions, and committed financial metrics.
 *
 * @module hooks/useVendorManager
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { VendorItem, VendorStatus } from '../types';

export interface UseVendorManagerReturn {
  /** Current array of managed vendors and service suppliers. */
  vendors: VendorItem[];
  /** Adds a new vendor partner record with unique ID generation. */
  addVendor: (vendor: Omit<VendorItem, 'id'> | VendorItem) => void;
  /** Updates properties of an existing vendor (e.g. status transition, notes, cost). */
  updateVendor: (id: string, updates: Partial<VendorItem>) => void;
  /** Updates the contractual status of an existing vendor. */
  updateVendorStatus: (id: string, status: VendorStatus) => void;
  /** Permanently removes a vendor from the directory. */
  deleteVendor: (id: string) => void;
  /** Alias for deleteVendor. */
  removeVendor: (id: string) => void;
  /** Filters the vendor list by contractual status and/or category query. */
  filterVendors: (status?: VendorStatus | 'all', category?: string) => VendorItem[];
  /** Filters by status only. */
  filterByStatus: (status: VendorStatus | 'all') => VendorItem[];
  /** Filters by category name (case-insensitive substring/match). */
  filterByCategory: (category: string) => VendorItem[];
  /** Alias for filterByCategory. */
  getVendorsByCategory: (category: string) => VendorItem[];
  /** Total monetary cost committed to confirmed and completed vendor contracts. */
  totalCommittedCost: number;
  /** Total estimated cost across all registered vendor proposals in the directory. */
  totalEstimatedCost: number;
  /** Number of vendors with 'confirmed' or 'completed' contractual agreements. */
  confirmedVendorCount: number;
  /** Number of vendors in negotiation, planning, or initial contact stages. */
  pendingVendorCount: number;
  /** Total count of vendors in 'planning' status. */
  planningVendorCount: number;
  /** Total count of vendors in 'completed' status. */
  completedVendorCount: number;
  /** Map of counts broken down by individual vendor status. */
  statusCounts: Record<VendorStatus, number>;
  /** Count of vendor partners categorized by domain service type. */
  vendorCategoryBreakdown: Record<string, number>;
  /** Aggregated committed cost mapped by vendor category. */
  categoryBreakdown: Record<string, number>;
  /** Total count of vendors mapped by vendor category. */
  categoryCount: Record<string, number>;
}

/**
 * Custom React hook for managing vendor partner contracts, RFPs, and supplier cost metrics.
 *
 * @param initialVendors Initial array of vendor items.
 * @param onUpdateVendors Optional callback fired whenever the vendor registry changes.
 * @returns Object providing vendor mutations and memoized supplier statistics.
 */
export function useVendorManager(
  initialVendors: VendorItem[] = [],
  onUpdateVendors?: (vendors: VendorItem[]) => void
): UseVendorManagerReturn {
  const [vendors, setVendors] = useState<VendorItem[]>(initialVendors);

  // Synchronize internal state when props update externally
  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  const commitUpdate = useCallback(
    (newVendors: VendorItem[]) => {
      setVendors(newVendors);
      if (onUpdateVendors) {
        onUpdateVendors(newVendors);
      }
    },
    [onUpdateVendors]
  );

  const addVendor = useCallback(
    (vendorInput: Omit<VendorItem, 'id'> | VendorItem) => {
      const newVendor: VendorItem = {
        ...vendorInput,
        id:
          'id' in vendorInput && vendorInput.id
            ? vendorInput.id
            : `vendor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        category: vendorInput.category?.trim() || 'General Services',
        companyName: (vendorInput.companyName || 'Unnamed Partner').trim(),
        contactPerson: vendorInput.contactPerson?.trim() || 'Operations Lead',
        emailOrPhone: vendorInput.emailOrPhone?.trim() || '',
        estimatedCost: Math.max(0, vendorInput.estimatedCost || 0),
        status: vendorInput.status || 'planning',
        notes: vendorInput.notes?.trim() || '',
      };

      const updated = [...vendors, newVendor];
      commitUpdate(updated);
    },
    [vendors, commitUpdate]
  );

  const updateVendor = useCallback(
    (id: string, updates: Partial<VendorItem>) => {
      const updated = vendors.map((v) => {
        if (v.id === id) {
          const merged = { ...v, ...updates };
          if (typeof merged.estimatedCost === 'number') {
            merged.estimatedCost = Math.max(0, merged.estimatedCost);
          }
          return merged;
        }
        return v;
      });
      commitUpdate(updated);
    },
    [vendors, commitUpdate]
  );

  const updateVendorStatus = useCallback(
    (id: string, status: VendorStatus) => {
      updateVendor(id, { status });
    },
    [updateVendor]
  );

  const deleteVendor = useCallback(
    (id: string) => {
      const updated = vendors.filter((v) => v.id !== id);
      commitUpdate(updated);
    },
    [vendors, commitUpdate]
  );

  const filterVendors = useCallback(
    (status?: VendorStatus | 'all', category?: string): VendorItem[] => {
      return vendors.filter((v) => {
        const matchesStatus = !status || status === 'all' || v.status === status;
        const matchesCategory =
          !category ||
          category.trim() === '' ||
          category.toLowerCase() === 'all' ||
          v.category.toLowerCase().includes(category.toLowerCase().trim());
        return matchesStatus && matchesCategory;
      });
    },
    [vendors]
  );

  const filterByStatus = useCallback(
    (status: VendorStatus | 'all') => {
      return filterVendors(status);
    },
    [filterVendors]
  );

  const filterByCategory = useCallback(
    (category: string) => {
      const target = category.trim().toLowerCase();
      return vendors.filter((v) => v.category.trim().toLowerCase() === target);
    },
    [vendors]
  );

  // Memoized Derived Metrics
  const totalCommittedCost = useMemo(() => {
    return vendors.reduce((sum, v) => sum + (v.estimatedCost || 0), 0);
  }, [vendors]);

  const totalEstimatedCost = totalCommittedCost;

  const confirmedVendorCount = useMemo(() => {
    return vendors.filter((v) => v.status === 'confirmed').length;
  }, [vendors]);

  const pendingVendorCount = useMemo(() => {
    return vendors.filter(
      (v) => v.status === 'planning' || v.status === 'contacted' || v.status === 'negotiating'
    ).length;
  }, [vendors]);

  const planningVendorCount = useMemo(() => {
    return vendors.filter((v) => v.status === 'planning').length;
  }, [vendors]);

  const completedVendorCount = useMemo(() => {
    return vendors.filter((v) => v.status === 'completed').length;
  }, [vendors]);

  const statusCounts = useMemo(() => {
    const counts: Record<VendorStatus, number> = {
      planning: 0,
      contacted: 0,
      negotiating: 0,
      confirmed: 0,
      completed: 0,
    };
    vendors.forEach((v) => {
      if (counts[v.status] !== undefined) {
        counts[v.status]++;
      }
    });
    return counts;
  }, [vendors]);

  const vendorCategoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    for (const v of vendors) {
      const cat = v.category?.trim() || 'General';
      breakdown[cat] = (breakdown[cat] || 0) + 1;
    }
    return breakdown;
  }, [vendors]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    for (const v of vendors) {
      const cat = v.category?.trim() || 'General';
      breakdown[cat] = (breakdown[cat] || 0) + (v.estimatedCost || 0);
    }
    return breakdown;
  }, [vendors]);

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of vendors) {
      const cat = v.category?.trim() || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [vendors]);

  return {
    vendors,
    addVendor,
    updateVendor,
    updateVendorStatus,
    deleteVendor,
    removeVendor: deleteVendor,
    filterVendors,
    filterByStatus,
    filterByCategory,
    getVendorsByCategory: filterByCategory,
    totalCommittedCost,
    totalEstimatedCost,
    confirmedVendorCount,
    pendingVendorCount,
    planningVendorCount,
    completedVendorCount,
    statusCounts,
    vendorCategoryBreakdown,
    categoryBreakdown,
    categoryCount,
  };
}
