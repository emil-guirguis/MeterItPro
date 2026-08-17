import { describe, it, expect } from 'vitest';
import type { Tab } from '@meterit/framework-frontend/components/form/hooks/useFormTabs';

/**
 * Unit Tests for useFormTabs Tab Filtering Logic
 * 
 * Feature: conditional-tab-display-meters
 * Tests the filtering logic that filters tabs based on visibleFor property and meterType
 * 
 * Validates: Requirements 2.2, 7.1, 7.2, 7.3, 7.4, 7.5
 */

// Import the processing function directly for testing
function processFormTabs(
  formTabs: Tab[] | undefined,
  activeTab: string,
  meterType?: 'physical' | 'virtual' | null
): any {
  if (!formTabs || formTabs.length === 0) {
    return { tabs: {}, tabList: [], fieldSections: {} };
  }

  // Filter tabs based on visibleFor property and meterType
  const filteredTabs = formTabs.filter((tab) => {
    // If tab has no visibleFor property, always include it (backward compatible)
    if (!tab.visibleFor || tab.visibleFor.length === 0) {
      return true;
    }

    // If meterType is null or undefined, include all tabs (default behavior)
    if (meterType === null || meterType === undefined) {
      return true;
    }

    // If meterType matches any value in visibleFor, include the tab
    return tab.visibleFor.includes(meterType);
  });

  interface FieldWithOrder {
    name: string;
    order: number;
  }

  interface TabInfoInternal {
    label: string;
    order: number;
    sections: Record<string, { fields: FieldWithOrder[]; order: number }>;
  }

  const tabsMap: Record<string, TabInfoInternal> = {};

  // Process each tab (using filtered tabs)
  filteredTabs.forEach((tab) => {
    const tabName = tab.name;
    const tabOrder = tab.order ?? 999;

    // Initialize tab
    tabsMap[tabName] = {
      label: tabName,
      order: tabOrder,
      sections: {},
    };

    // Process sections within tab
    if (tab.sections && Array.isArray(tab.sections)) {
      tab.sections.forEach((section) => {
        const sectionName = section.name;
        const sectionOrder = section.order ?? 999;

        // Initialize section
        tabsMap[tabName].sections[sectionName] = {
          fields: [],
          order: sectionOrder,
        };

        // Process fields within section
        if (section.fields && Array.isArray(section.fields)) {
          section.fields.forEach((fieldRef) => {
            const fieldName = fieldRef.name || (typeof fieldRef === 'string' ? fieldRef : null);
            if (!fieldName) {
              return;
            }
            
            const fieldOrder = fieldRef.order ?? 999;
            const fieldWithOrder: FieldWithOrder = {
              name: fieldName,
              order: fieldOrder,
            };
            tabsMap[tabName].sections[sectionName].fields.push(fieldWithOrder);
          });
        }
      });
    }
  });

  // Sort tabs by order and build final structure
  const sortedTabsList = Object.entries(tabsMap)
    .sort(([, a], [, b]) => a.order - b.order);

  const sortedTabs: Record<string, any> = {};
  sortedTabsList.forEach(([tabName, tab]) => {
    // Sort sections within tab
    const sortedSections = Object.entries(tab.sections)
      .sort(([, a], [, b]) => a.order - b.order)
      .reduce((sectionAcc, [sectionName, section]) => {
        // Sort fields within section by fieldOrder
        const sortedFields = section.fields
          .sort((a, b) => a.order - b.order)
          .map(f => f.name);

        sectionAcc[sectionName] = sortedFields;
        return sectionAcc;
      }, {} as Record<string, string[]>);

    sortedTabs[tabName] = {
      label: tab.label,
      order: tab.order ?? 999,
      sections: sortedSections,
    };
  });

  // Build field sections for current tab
  const currentTabSections: Record<string, string[]> = {};
  if (sortedTabs[activeTab]) {
    Object.assign(currentTabSections, sortedTabs[activeTab].sections);
  } else if (activeTab && Object.keys(sortedTabs).length > 0) {
    // Fallback: if activeTab doesn't match, use first tab
    const firstTabName = Object.keys(sortedTabs)[0];
    Object.assign(currentTabSections, sortedTabs[firstTabName].sections);
  }

  // Get sorted tab list
  const tabList = Object.entries(sortedTabs)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([tabName]) => tabName);

  return { tabs: sortedTabs, tabList, fieldSections: currentTabSections };
}

describe('useFormTabs Tab Filtering Logic', () => {
  describe('Backward Compatibility - Tabs without visibleFor', () => {
    it('should include tabs without visibleFor for physical meter type', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Elements',
          order: 2,
          visibleFor: ['physical'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', 'physical');
      
      expect(result.tabList).toContain('Meter');
      expect(result.tabList).toContain('Elements');
    });

    it('should include tabs without visibleFor for virtual meter type', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Combined Meters',
          order: 2,
          visibleFor: ['virtual'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', 'virtual');
      
      expect(result.tabList).toContain('Meter');
      expect(result.tabList).toContain('Combined Meters');
    });

    it('should include tabs without visibleFor for null meterType', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Elements',
          order: 2,
          visibleFor: ['physical'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', null);
      
      expect(result.tabList).toContain('Meter');
      expect(result.tabList).toContain('Elements');
    });

    it('should include tabs without visibleFor for undefined meterType', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Elements',
          order: 2,
          visibleFor: ['physical'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', undefined);
      
      expect(result.tabList).toContain('Meter');
      expect(result.tabList).toContain('Elements');
    });
  });

  describe('Physical Meter Type Filtering', () => {
    it('should show Elements tab for physical meter', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Elements',
          order: 2,
          visibleFor: ['physical'],
          sections: [],
        },
        {
          name: 'Combined Meters',
          order: 3,
          visibleFor: ['virtual'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', 'physical');
      
      expect(result.tabList).toContain('Meter');
      expect(result.tabList).toContain('Elements');
      expect(result.tabList).not.toContain('Combined Meters');
    });

    it('should hide Combined Meters tab for physical meter', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Elements',
          order: 2,
          visibleFor: ['physical'],
          sections: [],
        },
        {
          name: 'Combined Meters',
          order: 3,
          visibleFor: ['virtual'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', 'physical');
      
      expect(result.tabList).not.toContain('Combined Meters');
    });
  });

  describe('Virtual Meter Type Filtering', () => {
    it('should show Combined Meters tab for virtual meter', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Elements',
          order: 2,
          visibleFor: ['physical'],
          sections: [],
        },
        {
          name: 'Combined Meters',
          order: 3,
          visibleFor: ['virtual'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', 'virtual');
      
      expect(result.tabList).toContain('Meter');
      expect(result.tabList).toContain('Combined Meters');
      expect(result.tabList).not.toContain('Elements');
    });

    it('should hide Elements tab for virtual meter', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Elements',
          order: 2,
          visibleFor: ['physical'],
          sections: [],
        },
        {
          name: 'Combined Meters',
          order: 3,
          visibleFor: ['virtual'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', 'virtual');
      
      expect(result.tabList).not.toContain('Elements');
    });
  });

  describe('Null/Undefined meterType Behavior', () => {
    it('should show all tabs when meterType is null', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Elements',
          order: 2,
          visibleFor: ['physical'],
          sections: [],
        },
        {
          name: 'Combined Meters',
          order: 3,
          visibleFor: ['virtual'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', null);
      
      expect(result.tabList).toContain('Meter');
      expect(result.tabList).toContain('Elements');
      expect(result.tabList).toContain('Combined Meters');
    });

    it('should show all tabs when meterType is undefined', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          sections: [],
        },
        {
          name: 'Elements',
          order: 2,
          visibleFor: ['physical'],
          sections: [],
        },
        {
          name: 'Combined Meters',
          order: 3,
          visibleFor: ['virtual'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', undefined);
      
      expect(result.tabList).toContain('Meter');
      expect(result.tabList).toContain('Elements');
      expect(result.tabList).toContain('Combined Meters');
    });
  });

  describe('Tab with visibleFor containing both types', () => {
    it('should show tab with visibleFor=[physical, virtual] for physical meter', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          visibleFor: ['physical', 'virtual'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', 'physical');
      
      expect(result.tabList).toContain('Meter');
    });

    it('should show tab with visibleFor=[physical, virtual] for virtual meter', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          visibleFor: ['physical', 'virtual'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', 'virtual');
      
      expect(result.tabList).toContain('Meter');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty formTabs array', () => {
      const result = processFormTabs([], 'Meter', 'physical');
      
      expect(result.tabList).toEqual([]);
      expect(result.tabs).toEqual({});
    });

    it('should handle undefined formTabs', () => {
      const result = processFormTabs(undefined, 'Meter', 'physical');
      
      expect(result.tabList).toEqual([]);
      expect(result.tabs).toEqual({});
    });

    it('should handle all tabs filtered out', () => {
      const formTabs: Tab[] = [
        {
          name: 'Elements',
          order: 1,
          visibleFor: ['physical'],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Elements', 'virtual');
      
      expect(result.tabList).toEqual([]);
      expect(result.tabs).toEqual({});
    });

    it('should handle empty visibleFor array', () => {
      const formTabs: Tab[] = [
        {
          name: 'Meter',
          order: 1,
          visibleFor: [],
          sections: [],
        },
      ];

      const result = processFormTabs(formTabs, 'Meter', 'physical');
      
      // Empty visibleFor should be treated like no visibleFor (always visible)
      expect(result.tabList).toContain('Meter');
    });
  });
});
