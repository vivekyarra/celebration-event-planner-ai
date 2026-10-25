import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMenuManager } from '../hooks/useMenuManager';
import { MenuItem } from '../types';

describe('Task 1: Menu Manager Hook & Domain Logic Tests', () => {
  const sampleMenu: MenuItem[] = [
    {
      id: 'dish-1',
      course: 'starters',
      name: 'Truffle Burrata Bruschetta',
      description: 'Heirloom tomatoes, balsamic glaze, and micro basil.',
      dietaryTags: ['Vegetarian'],
      recommendedQuantity: '1 platter per 4 guests',
      estimatedCost: 35,
    },
    {
      id: 'dish-2',
      course: 'mains',
      name: 'Herb-Crusted Filet Mignon',
      description: 'Red wine reduction with pomme purée.',
      dietaryTags: ['Gluten-Free'],
      recommendedQuantity: '1 plate per guest',
      estimatedCost: 65,
    },
    {
      id: 'dish-3',
      course: 'mains',
      name: 'Zaatar Charred Cauliflower Steak',
      description: 'Garlic-tahini purée, toasted pine nuts.',
      dietaryTags: ['Vegan', 'Gluten-Free', 'Dairy-Free'],
      recommendedQuantity: '1 serving per guest',
      estimatedCost: 40,
    },
    {
      id: 'dish-4',
      course: 'desserts',
      name: 'Flourless Chocolate Torte',
      description: 'Belgian dark chocolate with raspberry coulis.',
      dietaryTags: ['Vegetarian', 'Gluten-Free'],
      recommendedQuantity: '1 slice per guest',
      estimatedCost: 20,
    },
    {
      id: 'dish-5',
      course: 'beverages',
      name: 'Sparkling Elderflower Fizz',
      description: 'Prosecco infused with elderflower cordial.',
      dietaryTags: ['Vegan', 'Gluten-Free'],
      recommendedQuantity: '2 flutes per guest',
      estimatedCost: 15,
    },
  ];

  // 1. Initial calculation
  it('1. correctly computes initial courseBreakdown, courseCounts, and totalEstimatedCost', () => {
    const { result } = renderHook(() => useMenuManager(sampleMenu));

    expect(result.current.courseCounts.starters).toBe(1);
    expect(result.current.courseCounts.mains).toBe(2);
    expect(result.current.courseCounts.desserts).toBe(1);
    expect(result.current.courseCounts.beverages).toBe(1);
    expect(result.current.courseCounts.total).toBe(5);

    expect(result.current.courseBreakdown.starters).toHaveLength(1);
    expect(result.current.courseBreakdown.mains).toHaveLength(2);
    expect(result.current.courseBreakdown.desserts).toHaveLength(1);
    expect(result.current.courseBreakdown.beverages).toHaveLength(1);

    // 35 + 65 + 40 + 20 + 15 = 175
    expect(result.current.totalEstimatedCost).toBe(175);
  });

  // 2. Adding custom dish increments course count and updates uniqueDietaryTags
  it('2. increments course count and updates uniqueDietaryTags when adding custom dish', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useMenuManager(sampleMenu, onUpdate));

    expect(result.current.uniqueDietaryTags).not.toContain('Halal');

    act(() => {
      result.current.addDish({
        course: 'starters',
        name: 'Crispy Falafel Bites',
        description: 'Served with organic tahini dip.',
        dietaryTags: ['Vegan', 'Halal', 'Nut-Free'],
        recommendedQuantity: '3 pieces per guest',
        estimatedCost: 25,
      });
    });

    expect(result.current.courseCounts.starters).toBe(2);
    expect(result.current.courseCounts.total).toBe(6);
    expect(result.current.totalEstimatedCost).toBe(200); // 175 + 25
    expect(result.current.uniqueDietaryTags).toContain('Halal');
    expect(result.current.uniqueDietaryTags).toContain('Nut-Free');
    expect(result.current.hasHalal).toBe(true);
    expect(result.current.hasNutFree).toBe(true);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  // 3. Removing dish decrements course count and updates total cost
  it('3. decrements course count and updates total cost when removing a dish', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useMenuManager(sampleMenu, onUpdate));

    act(() => {
      result.current.removeDish('dish-2'); // Filet Mignon, cost 65
    });

    expect(result.current.courseCounts.mains).toBe(1);
    expect(result.current.courseCounts.total).toBe(4);
    // 175 - 65 = 110
    expect(result.current.totalEstimatedCost).toBe(110);
    expect(result.current.menu.find((d) => d.id === 'dish-2')).toBeUndefined();
    expect(onUpdate).toHaveBeenCalled();
  });

  // 4. Updating dish details (e.g. changing course or estimatedCost)
  it('4. updates dish details including course reassignment and cost adjustments', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useMenuManager(sampleMenu, onUpdate));

    act(() => {
      // Reassign dish-1 from starters to mains, and change cost from 35 to 50
      result.current.updateDish('dish-1', {
        course: 'mains',
        estimatedCost: 50,
        name: 'Deluxe Truffle Burrata Entree',
      });
    });

    expect(result.current.courseCounts.starters).toBe(0);
    expect(result.current.courseCounts.mains).toBe(3);
    // 175 - 35 + 50 = 190
    expect(result.current.totalEstimatedCost).toBe(190);

    const updatedDish = result.current.menu.find((d) => d.id === 'dish-1');
    expect(updatedDish?.name).toBe('Deluxe Truffle Burrata Entree');
    expect(updatedDish?.course).toBe('mains');
    expect(updatedDish?.estimatedCost).toBe(50);
  });

  // 5. Course filtering ('starters', 'mains', 'desserts', 'beverages', 'all')
  it('5. filters dishes correctly by course and handles "all" filter', () => {
    const { result } = renderHook(() => useMenuManager(sampleMenu));

    const starters = result.current.filterByCourse('starters');
    expect(starters).toHaveLength(1);
    expect(starters[0].id).toBe('dish-1');

    const mains = result.current.filterByCourse('mains');
    expect(mains).toHaveLength(2);

    const desserts = result.current.filterByCourse('desserts');
    expect(desserts).toHaveLength(1);
    expect(desserts[0].id).toBe('dish-4');

    const beverages = result.current.filterByCourse('beverages');
    expect(beverages).toHaveLength(1);
    expect(beverages[0].id).toBe('dish-5');

    const all = result.current.filterByCourse('all');
    expect(all).toHaveLength(5);
  });

  // 6. Case-insensitive dietary tag filtering ('Vegan', 'Gluten-Free')
  it('6. filters menu items by dietary tags case-insensitively', () => {
    const { result } = renderHook(() => useMenuManager(sampleMenu));

    const veganLower = result.current.filterByDietaryTag('vegan');
    const veganUpper = result.current.filterByDietaryTag('VEGAN');
    const veganTitle = result.current.filterByDietaryTag('Vegan');

    expect(veganLower.length).toBe(2); // dish-3, dish-5
    expect(veganUpper.length).toBe(2);
    expect(veganTitle.length).toBe(2);

    const gfItems = result.current.filterByDietaryTag('gluten-free');
    expect(gfItems.length).toBe(4); // dish-2, dish-3, dish-4, dish-5

    const allItems = result.current.filterByDietaryTag('all');
    expect(allItems.length).toBe(5);
  });

  // 7. Detecting presence of vegetarian, vegan, and gluten-free options accurately
  it('7. accurately detects boolean presence of dietary options', () => {
    const { result } = renderHook(() => useMenuManager(sampleMenu));

    expect(result.current.hasVegetarian).toBe(true);
    expect(result.current.hasVegan).toBe(true);
    expect(result.current.hasGlutenFree).toBe(true);
    expect(result.current.hasDairyFree).toBe(true);
    expect(result.current.hasHalal).toBe(false);
  });

  // 8. Handling empty menu array safely with zero division or NaN
  it('8. handles empty menu safely with 0 values and no NaN or division errors', () => {
    const { result } = renderHook(() => useMenuManager([]));

    expect(result.current.menu).toEqual([]);
    expect(result.current.totalEstimatedCost).toBe(0);
    expect(result.current.courseCounts.total).toBe(0);
    expect(result.current.courseCounts.starters).toBe(0);
    expect(result.current.courseCounts.mains).toBe(0);
    expect(result.current.courseCounts.desserts).toBe(0);
    expect(result.current.courseCounts.beverages).toBe(0);

    expect(result.current.courseBreakdown.starters).toEqual([]);
    expect(result.current.courseBreakdown.mains).toEqual([]);
    expect(result.current.courseBreakdown.desserts).toEqual([]);
    expect(result.current.courseBreakdown.beverages).toEqual([]);

    expect(result.current.uniqueDietaryTags).toEqual([]);
    expect(result.current.hasVegetarian).toBe(false);
    expect(result.current.hasVegan).toBe(false);
    expect(result.current.hasGlutenFree).toBe(false);

    expect(result.current.filterByCourse('starters')).toEqual([]);
    expect(result.current.filterByDietaryTag('vegan')).toEqual([]);
  });

  // 9. Synchronizes state when initialMenu prop updates externally
  it('9. synchronizes internal state when initialMenu prop updates', () => {
    const { result, rerender } = renderHook(
      ({ menu }) => useMenuManager(menu),
      { initialProps: { menu: sampleMenu } }
    );

    expect(result.current.menu).toHaveLength(5);

    const updatedMenu = sampleMenu.slice(0, 2);
    rerender({ menu: updatedMenu });

    expect(result.current.menu).toHaveLength(2);
    expect(result.current.courseCounts.total).toBe(2);
    expect(result.current.totalEstimatedCost).toBe(100); // 35 + 65
  });

  // 10. Alias deleteDish behaves identically to removeDish
  it('10. deleteDish alias works interchangeably with removeDish', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useMenuManager(sampleMenu, onUpdate));

    act(() => {
      result.current.deleteDish('dish-1');
    });

    expect(result.current.courseCounts.starters).toBe(0);
    expect(result.current.courseCounts.total).toBe(4);
    expect(onUpdate).toHaveBeenCalled();
  });
});
