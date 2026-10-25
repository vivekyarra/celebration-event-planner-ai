/**
 * CelebriteAI Separation of Concerns Hook: Banquet Menu & Culinary Manager
 * Encapsulates catering course allocations, dietary compliance aggregation,
 * estimated catering expenditure, entity sanitization, and tag-based filtering.
 *
 * @module hooks/useMenuManager
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { MenuItem } from '../types';
import { sanitizeHtml } from '../services/security';

export type CourseType = 'starters' | 'mains' | 'desserts' | 'beverages';

export interface UseMenuManagerReturn {
  /** Current array of menu items */
  menu: MenuItem[];
  /** Adds a new dish to the menu with unique ID generation, sanitization, and cost clamping */
  addDish: (dish: Omit<MenuItem, 'id'> | MenuItem) => void;
  /** Removes a dish by unique ID */
  removeDish: (id: string) => void;
  /** Alias for removeDish */
  deleteDish: (id: string) => void;
  /** Updates properties of an existing dish by ID with sanitization and cost clamping */
  updateDish: (id: string, updates: Partial<MenuItem>) => void;
  /** Filters the menu by course type or returns all */
  filterByCourse: (course: CourseType | 'all') => MenuItem[];
  /** Filters the menu by dietary requirement tag (case-insensitive) */
  filterByDietaryTag: (tag: string) => MenuItem[];
  /** Filters dishes by course and optional dietary tag */
  getItemsByCourseAndDietary: (course: CourseType, dietaryTag?: string) => MenuItem[];
  /** Breakdown of dishes organized by culinary course */
  courseBreakdown: Record<CourseType, MenuItem[]>;
  /** Item counts per culinary course plus total */
  courseCounts: Record<CourseType, number> & { total: number };
  /** Total estimated cost across all dishes */
  totalEstimatedCost: number;
  /** Deduplicated array of dietary tags present in the current menu */
  uniqueDietaryTags: string[];
  /** Indicates whether at least one vegetarian dish is present */
  hasVegetarian: boolean;
  /** Indicates whether at least one vegetarian dish is present (alias) */
  hasVegetarianOption: boolean;
  /** Indicates whether at least one vegan dish is present */
  hasVegan: boolean;
  /** Indicates whether at least one vegan dish is present (alias) */
  hasVeganOption: boolean;
  /** Indicates whether at least one gluten-free dish is present */
  hasGlutenFree: boolean;
  /** Indicates whether at least one gluten-free dish is present (alias) */
  hasGlutenFreeOption: boolean;
  /** Indicates whether at least one dairy-free dish is present */
  hasDairyFree: boolean;
  /** Indicates whether at least one nut-free dish is present */
  hasNutFree: boolean;
  /** Indicates whether at least one halal dish is present */
  hasHalal: boolean;
}

/**
 * Custom React hook for managing banquet menus, culinary courses, and dietary safety audits.
 *
 * @param initialMenu Initial array of menu items.
 * @param onUpdateMenu Optional callback invoked whenever the menu is modified.
 * @returns Object providing menu mutations and memoized culinary analytics.
 *
 * @example
 * ```tsx
 * const {
 *   menu,
 *   addDish,
 *   removeDish,
 *   courseCounts,
 *   totalEstimatedCost,
 *   hasVegan,
 *   hasGlutenFree
 * } = useMenuManager(plan.menu, onUpdateMenu);
 * ```
 */
export function useMenuManager(
  initialMenu: MenuItem[] = [],
  onUpdateMenu?: (newMenu: MenuItem[]) => void
): UseMenuManagerReturn {
  const [menu, setMenu] = useState<MenuItem[]>(initialMenu || []);

  // Synchronize internal state when prop changes externally
  useEffect(() => {
    setMenu(initialMenu || []);
  }, [initialMenu]);

  const commitUpdate = useCallback(
    (newMenu: MenuItem[]) => {
      setMenu(newMenu);
      if (onUpdateMenu) {
        onUpdateMenu(newMenu);
      }
    },
    [onUpdateMenu]
  );

  const addDish = useCallback(
    (dish: Omit<MenuItem, 'id'> | MenuItem) => {
      const id =
        'id' in dish && dish.id
          ? dish.id
          : `dish-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const cleanCost =
        typeof dish.estimatedCost === 'number' && !isNaN(dish.estimatedCost)
          ? Math.max(0, Math.min(5000, dish.estimatedCost))
          : 0;

      const newDish: MenuItem = {
        ...dish,
        id,
        name: sanitizeHtml((dish.name || '').trim()),
        description: sanitizeHtml((dish.description || '').trim()),
        recommendedQuantity: sanitizeHtml(
          (dish.recommendedQuantity || '1 serving per guest').trim()
        ),
        dietaryTags: Array.isArray(dish.dietaryTags)
          ? dish.dietaryTags.map((t) => sanitizeHtml(t.trim())).filter(Boolean)
          : [],
        estimatedCost: cleanCost,
      };

      const updated = [...menu, newDish];
      commitUpdate(updated);
    },
    [menu, commitUpdate]
  );

  const removeDish = useCallback(
    (id: string) => {
      const updated = menu.filter((d) => d.id !== id);
      commitUpdate(updated);
    },
    [menu, commitUpdate]
  );

  const updateDish = useCallback(
    (id: string, updates: Partial<MenuItem>) => {
      const updated = menu.map((dish) => {
        if (dish.id === id) {
          const nextCost =
            updates.estimatedCost !== undefined
              ? typeof updates.estimatedCost === 'number' && !isNaN(updates.estimatedCost)
                ? Math.max(0, Math.min(5000, updates.estimatedCost))
                : 0
              : dish.estimatedCost;

          return {
            ...dish,
            ...updates,
            name:
              updates.name !== undefined ? sanitizeHtml(updates.name.trim()) : dish.name,
            description:
              updates.description !== undefined
                ? sanitizeHtml(updates.description.trim())
                : dish.description,
            recommendedQuantity:
              updates.recommendedQuantity !== undefined
                ? sanitizeHtml(updates.recommendedQuantity.trim())
                : dish.recommendedQuantity,
            dietaryTags:
              updates.dietaryTags !== undefined
                ? updates.dietaryTags.map((t) => sanitizeHtml(t.trim())).filter(Boolean)
                : dish.dietaryTags,
            estimatedCost: nextCost,
          };
        }
        return dish;
      });
      commitUpdate(updated);
    },
    [menu, commitUpdate]
  );

  const filterByCourse = useCallback(
    (course: CourseType | 'all'): MenuItem[] => {
      if (course === 'all') return menu;
      return menu.filter((d) => d.course === course);
    },
    [menu]
  );

  const filterByDietaryTag = useCallback(
    (tag: string): MenuItem[] => {
      if (!tag || tag.toLowerCase() === 'all') return menu;
      const lower = tag.trim().toLowerCase();
      return menu.filter((d) =>
        d.dietaryTags?.some((t) => t.trim().toLowerCase() === lower)
      );
    },
    [menu]
  );

  const courseBreakdown = useMemo<Record<CourseType, MenuItem[]>>(() => {
    return {
      starters: (menu || []).filter((d) => d.course === 'starters'),
      mains: (menu || []).filter((d) => d.course === 'mains'),
      desserts: (menu || []).filter((d) => d.course === 'desserts'),
      beverages: (menu || []).filter((d) => d.course === 'beverages'),
    };
  }, [menu]);

  const getItemsByCourseAndDietary = useCallback(
    (course: CourseType, dietaryTag?: string): MenuItem[] => {
      const courseItems = courseBreakdown[course] || [];
      if (!dietaryTag || dietaryTag.toLowerCase() === 'all') {
        return courseItems;
      }
      const lower = dietaryTag.trim().toLowerCase();
      return courseItems.filter((item) =>
        item.dietaryTags?.some((t) => t.trim().toLowerCase() === lower)
      );
    },
    [courseBreakdown]
  );

  const courseCounts = useMemo<Record<CourseType, number> & { total: number }>(() => {
    const starters = courseBreakdown.starters.length;
    const mains = courseBreakdown.mains.length;
    const desserts = courseBreakdown.desserts.length;
    const beverages = courseBreakdown.beverages.length;
    return {
      starters,
      mains,
      desserts,
      beverages,
      total: starters + mains + desserts + beverages,
    };
  }, [courseBreakdown]);

  const totalEstimatedCost = useMemo<number>(() => {
    if (!menu || menu.length === 0) return 0;
    return menu.reduce((sum, d) => {
      const cost =
        typeof d.estimatedCost === 'number' && !isNaN(d.estimatedCost) ? d.estimatedCost : 0;
      return sum + cost;
    }, 0);
  }, [menu]);

  const uniqueDietaryTags = useMemo<string[]>(() => {
    if (!menu || menu.length === 0) return [];
    const set = new Set<string>();
    menu.forEach((d) => {
      if (Array.isArray(d.dietaryTags)) {
        d.dietaryTags.forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set);
  }, [menu]);

  const hasTag = useCallback(
    (pattern: string): boolean => {
      if (!menu || menu.length === 0) return false;
      const lowerPat = pattern.toLowerCase();
      return menu.some((d) =>
        d.dietaryTags?.some((t) => t.toLowerCase().includes(lowerPat))
      );
    },
    [menu]
  );

  const hasVegetarian = useMemo(() => hasTag('vegetarian'), [hasTag]);
  const hasVegan = useMemo(() => hasTag('vegan'), [hasTag]);
  const hasGlutenFree = useMemo(() => hasTag('gluten'), [hasTag]);
  const hasDairyFree = useMemo(() => hasTag('dairy'), [hasTag]);
  const hasNutFree = useMemo(() => hasTag('nut'), [hasTag]);
  const hasHalal = useMemo(() => hasTag('halal'), [hasTag]);

  return {
    menu,
    addDish,
    removeDish,
    deleteDish: removeDish,
    updateDish,
    filterByCourse,
    filterByDietaryTag,
    getItemsByCourseAndDietary,
    courseBreakdown,
    courseCounts,
    totalEstimatedCost,
    uniqueDietaryTags,
    hasVegetarian,
    hasVegetarianOption: hasVegetarian,
    hasVegan,
    hasVeganOption: hasVegan,
    hasGlutenFree,
    hasGlutenFreeOption: hasGlutenFree,
    hasDairyFree,
    hasNutFree,
    hasHalal,
  };
}
